"""
FastAPI app: the HTTP layer around our PDF pipeline.

  GET    /health
  GET    /auth/me
  GET    /profile
  PUT    /profile
  POST   /profile/from-resume
  GET    /assistant/instructions
  PUT    /assistant/instructions
  GET    /resumes
  POST   /resumes
  GET    /resumes/{id}
  PUT    /resumes/{id}
  DELETE /resumes/{id}
  POST   /resumes/{id}/snapshot
  POST   /resumes/{id}/chat
  GET    /resumes/{id}/download
  GET    /jobs
  GET    /jobs/status
  GET    /applications
  POST   /applications
  PATCH  /applications/{id}
  DELETE /applications/{id}
  POST   /contact
"""

from __future__ import annotations

import logging
import re
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Literal

from fastapi import Depends, FastAPI, File, HTTPException, Request, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from . import ai, application_store, auth, contact_store, posting, profile_store, resume_store
from .config import (
    APP_ENV,
    CORS_ORIGINS,
    MAX_UPLOAD_BYTES,
)
from .db import get_db, ping_db
from .jobs import scheduler
from .jobs.scan import DEFAULT_LIMIT, MAX_LIMIT, list_jobs, sweep_status
from .jobs.store import init as init_jobs
from .migrate import upgrade_head
from .models import User
from .pipeline import ConvertError, convert_pdf, fit_to_one_page

log = logging.getLogger(__name__)


def _setup_logging() -> None:
    if logging.getLogger().handlers:
        return
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )


@asynccontextmanager
async def lifespan(_app: FastAPI):
    _setup_logging()
    log.info("starting app env=%s", APP_ENV)
    upgrade_head()
    init_jobs()
    scheduler.start()
    yield
    scheduler.stop()


app = FastAPI(title="Resume Editor API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ResumeUpdate(BaseModel):
    blocks: list[dict]
    note: str | None = None


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    blocks: list[dict]
    messages: list[ChatMessage]


class AssistantInstructionsUpdate(BaseModel):
    instructions: str = Field(default="", max_length=2000)


class ProfileUpdate(BaseModel):
    first_name: str = ""
    last_name: str = ""
    email: str = ""
    phone: str = ""
    city: str = ""
    region: str = ""
    country: str = ""
    linkedin_url: str = ""
    github_url: str = ""
    portfolio_url: str = ""
    current_title: str = ""
    years_experience: int | None = Field(default=None, ge=0, le=80)
    work_authorized: bool | None = None
    requires_sponsorship: bool | None = None
    willing_to_relocate: bool | None = None
    default_resume_id: str | None = None


class ProfileFromResume(BaseModel):
    resume_id: str | None = None


class ContactBody(BaseModel):
    name: str = Field(max_length=120)
    email: str = Field(max_length=320)
    message: str = Field(max_length=4000)


class ApplicationCreate(BaseModel):
    company: str
    role: str
    url: str
    status: str | None = None
    job_id: str | None = None
    applied_at: datetime | None = None


class ApplicationUpdate(BaseModel):
    company: str | None = None
    role: str | None = None
    url: str | None = None
    status: str | None = None
    applied_at: datetime | None = None


_EMAIL_RE = re.compile(r"^[\w.+-]+@[\w.-]+\.\w+$")
_URL_RE = re.compile(r"^(https?://)?[\w.-]+\.[a-z]{2,}(/\S*)?$", re.IGNORECASE)


def _validate_profile(body: ProfileUpdate, user: User, db: Session) -> dict:
    data = body.model_dump()
    email = (data.get("email") or "").strip()
    if email and not _EMAIL_RE.match(email):
        raise HTTPException(status_code=400, detail="Enter a valid email.")
    phone = re.sub(r"\D", "", data.get("phone") or "")
    if (data.get("phone") or "").strip() and len(phone) < 10:
        raise HTTPException(status_code=400, detail="Enter a valid phone number.")
    for key in ("linkedin_url", "github_url", "portfolio_url"):
        raw = (data.get(key) or "").strip()
        if not raw:
            data[key] = ""
            continue
        if not _URL_RE.match(raw):
            raise HTTPException(status_code=400, detail=f"Enter a valid {key.replace('_', ' ')}.")
        if not raw.lower().startswith("http://") and not raw.lower().startswith("https://"):
            data[key] = f"https://{raw}"
        else:
            data[key] = raw
    default_id = data.get("default_resume_id") or None
    if default_id:
        if resume_store.load(db, user.id, default_id) is None:
            raise HTTPException(status_code=400, detail="That resume is not on your account.")
        data["default_resume_id"] = default_id
    else:
        data["default_resume_id"] = None
    return data


def _normalize_job_url(raw: str) -> str:
    value = raw.strip()
    if not value:
        return ""
    if not _URL_RE.match(value):
        raise HTTPException(status_code=400, detail="Enter a valid job posting URL.")
    if not value.lower().startswith("http://") and not value.lower().startswith(
        "https://"
    ):
        return f"https://{value}"
    return value


def _application_status(raw: str | None, *, required: bool) -> str | None:
    if raw is None or not str(raw).strip():
        if required:
            raise HTTPException(status_code=400, detail="Choose a status.")
        return None
    status = str(raw).strip().upper()
    if status not in application_store.STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"status must be one of: {', '.join(application_store.STATUSES)}",
        )
    return status


def _csv_values(raw: str, allowed: set[str], label: str) -> list[str]:
    values: list[str] = []
    for part in raw.split(","):
        item = part.strip()
        if not item:
            continue
        if item not in allowed:
            raise HTTPException(status_code=400, detail=f"Invalid {label} filter.")
        if item not in values:
            values.append(item)
    return values


def _user_payload(user: User) -> dict:
    return {"id": str(user.id), "email": user.email}


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        first = forwarded.split(",")[0].strip()
        if first:
            return first
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


@app.get("/health")
def health():
    db_ok = False
    try:
        ping_db()
        db_ok = True
    except Exception:
        log.exception("health db failed")
    payload = {
        "ok": db_ok,
        "db": "ok" if db_ok else "error",
    }
    return JSONResponse(payload, status_code=200 if payload["ok"] else 503)


@app.post("/contact")
def post_contact(
    body: ContactBody,
    request: Request,
    db: Session = Depends(get_db),
):
    name = body.name.strip()
    email = body.email.strip()
    message = body.message.strip()
    if not name or not message:
        raise HTTPException(status_code=400, detail="Enter your name and a note.")
    if not _EMAIL_RE.match(email):
        raise HTTPException(status_code=400, detail="Enter a valid email.")
    ip = _client_ip(request)
    if contact_store.too_soon(ip):
        raise HTTPException(
            status_code=429,
            detail="Wait a minute before sending another note.",
        )
    contact_store.save(db, name=name, email=email, message=message)
    contact_store.mark_sent(ip)
    return {"ok": True}


@app.get("/auth/me")
def me(user: User = Depends(auth.get_current_user)):
    return _user_payload(user)


@app.get("/profile")
def get_profile(
    user: User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    return profile_store.load_payload(db, user)


@app.put("/profile")
def put_profile(
    body: ProfileUpdate,
    user: User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    data = _validate_profile(body, user, db)
    return profile_store.save_payload(db, user, data)


@app.post("/profile/from-resume")
def fill_profile_from_resume(
    body: ProfileFromResume,
    user: User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    payload = profile_store.fill_from_resume(db, user, body.resume_id)
    if payload is None:
        raise HTTPException(status_code=404, detail="Resume not found.")
    return payload


@app.get("/assistant/instructions")
def get_assistant_instructions(
    user: User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    return {
        "instructions": profile_store.get_chat_instructions(db, user.id),
    }


@app.put("/assistant/instructions")
def put_assistant_instructions(
    body: AssistantInstructionsUpdate,
    user: User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    try:
        saved = profile_store.save_chat_instructions(db, user.id, body.instructions)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"instructions": saved}


@app.get("/jobs")
def get_jobs(
    title: str = "",
    q: str = "",
    location: str = "",
    company: str = "",
    workplace: str = "",
    type: str = "",
    experience: str = "",
    posted: str = "",
    exclude: str = "",
    sort: str = "posted_desc",
    limit: int = DEFAULT_LIMIT,
    offset: int = 0,
):
    role = title.strip() or q.strip()
    workplaces = _csv_values(workplace, {"remote", "hybrid", "onsite"}, "workplace")
    job_types = _csv_values(
        type,
        {"full-time", "part-time", "contract", "internship"},
        "type",
    )
    levels = _csv_values(
        experience,
        {"intern", "entry", "mid", "senior"},
        "experience",
    )
    if posted and posted not in {"1d", "7d", "30d"}:
        raise HTTPException(status_code=400, detail="Invalid posted filter.")
    if sort not in {"posted_desc", "posted_asc", "company", "title"}:
        raise HTTPException(status_code=400, detail="Invalid sort.")
    if limit < 1 or limit > MAX_LIMIT:
        raise HTTPException(status_code=400, detail="Invalid limit.")
    if offset < 0:
        raise HTTPException(status_code=400, detail="Invalid offset.")
    return list_jobs(
        title=role,
        location=location,
        company=company,
        workplaces=workplaces,
        job_types=job_types,
        experience=levels,
        posted=posted,
        exclude=exclude,
        sort=sort,
        limit=limit,
        offset=offset,
    )


@app.get("/jobs/status")
def get_jobs_status():
    return sweep_status()


@app.get("/applications")
def list_applications(
    user: User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    return application_store.list_for_user(db, user.id)


@app.post("/applications")
def create_application(
    body: ApplicationCreate,
    user: User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    company = body.company.strip()
    role = body.role.strip()
    url = _normalize_job_url(body.url)
    if not company or not role:
        raise HTTPException(status_code=400, detail="Company and role are required.")
    if not url:
        raise HTTPException(status_code=400, detail="A job posting URL is required.")
    job_id = (body.job_id or "").strip() or None
    status = _application_status(body.status, required=False) or "NEEDTOAPPLY"
    return application_store.create(
        db,
        user.id,
        {
            "company": company,
            "role": role,
            "url": url,
            "status": status,
            "job_id": job_id,
            "applied_at": body.applied_at,
        },
    )


@app.patch("/applications/{application_id}")
def update_application(
    application_id: str,
    body: ApplicationUpdate,
    user: User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    row = application_store.load(db, user.id, application_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Application not found.")
    data: dict = {}
    if body.company is not None:
        company = body.company.strip()
        if not company:
            raise HTTPException(status_code=400, detail="Company is required.")
        data["company"] = company
    if body.role is not None:
        role = body.role.strip()
        if not role:
            raise HTTPException(status_code=400, detail="Role is required.")
        data["role"] = role
    if body.url is not None:
        url = _normalize_job_url(body.url)
        if not url:
            raise HTTPException(status_code=400, detail="A job posting URL is required.")
        if application_store.url_taken(db, user.id, url, exclude_id=row.id):
            raise HTTPException(
                status_code=409,
                detail="That posting is already on your board.",
            )
        data["url"] = url
    if body.status is not None:
        data["status"] = _application_status(body.status, required=True)
    if body.applied_at is not None:
        data["applied_at"] = body.applied_at
    updated = application_store.update(db, user.id, application_id, data)
    if updated is None:
        raise HTTPException(status_code=404, detail="Application not found.")
    return updated


@app.delete("/applications/{application_id}")
def delete_application(
    application_id: str,
    user: User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    if not application_store.delete(db, user.id, application_id):
        raise HTTPException(status_code=404, detail="Application not found.")
    return {"deleted": application_id}


@app.get("/resumes")
def list_resumes(
    q: str = "",
    user: User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    return resume_store.search(db, user.id, q)


@app.post("/resumes")
async def upload_resume(
    request: Request,
    file: UploadFile = File(...),
    user: User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Please upload a PDF file.")
    content_length = request.headers.get("content-length")
    if content_length:
        try:
            if int(content_length) > MAX_UPLOAD_BYTES + 64_000:
                raise HTTPException(
                    status_code=413, detail="PDF is too large (max 8 MB)."
                )
        except ValueError:
            pass
    pdf_bytes = await file.read()
    if len(pdf_bytes) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="PDF is too large (max 8 MB).")
    try:
        resume = convert_pdf(pdf_bytes, file.filename)
    except ConvertError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return resume_store.save_new(db, user.id, resume)


@app.get("/resumes/{resume_id}")
def get_resume(
    resume_id: str,
    user: User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    resume = resume_store.load(db, user.id, resume_id)
    if resume is None:
        raise HTTPException(status_code=404, detail="Resume not found.")
    return resume


@app.put("/resumes/{resume_id}")
def save_resume(
    resume_id: str,
    body: ResumeUpdate,
    user: User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    payload = {"blocks": body.blocks}
    if body.note is not None:
        payload["note"] = body.note
    updated = resume_store.update(db, user.id, resume_id, payload)
    if updated is None:
        raise HTTPException(status_code=404, detail="Resume not found.")
    return updated


@app.delete("/resumes/{resume_id}")
def remove_resume(
    resume_id: str,
    user: User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    if not resume_store.delete(db, user.id, resume_id):
        raise HTTPException(status_code=404, detail="Resume not found.")
    return {"deleted": resume_id}


@app.post("/resumes/{resume_id}/snapshot")
def snapshot_resume(
    resume_id: str,
    body: ResumeUpdate,
    user: User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    source = resume_store.load(db, user.id, resume_id)
    if source is None:
        raise HTTPException(status_code=404, detail="Resume not found.")
    snapshot = {
        "document": source.get("document"),
        "blocks": body.blocks,
        "note": body.note,
    }
    return resume_store.save_new(db, user.id, snapshot)


@app.post("/resumes/{resume_id}/chat")
def chat_about_resume(
    resume_id: str,
    body: ChatRequest,
    user: User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    if resume_store.load(db, user.id, resume_id) is None:
        raise HTTPException(status_code=404, detail="Resume not found.")
    try:
        instructions = profile_store.get_chat_instructions(db, user.id)
        payload = [m.model_dump() for m in body.messages]
        resolved = posting.resolve_from_messages(payload)
        return ai.chat(
            body.blocks,
            payload,
            instructions=instructions,
            posting_text=(resolved.text if resolved and not resolved.failed else ""),
            posting_url=(resolved.url if resolved else ""),
            posting_failed=bool(resolved and resolved.failed),
        )
    except ai.AiError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@app.get("/resumes/{resume_id}/download")
def download_resume(
    resume_id: str,
    user: User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    resume = resume_store.load(db, user.id, resume_id)
    if resume is None:
        raise HTTPException(status_code=404, detail="Resume not found.")
    if not resume.get("blocks"):
        raise HTTPException(
            status_code=400,
            detail="This resume has no paragraph data. Please upload the PDF again.",
        )
    pdf_bytes = fit_to_one_page(resume)
    filename = resume["document"].get("source_file", "resume.pdf")
    if not filename.lower().endswith(".pdf"):
        filename = f"{filename}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
