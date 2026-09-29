"""Load, merge, and save the per-user application profile."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from . import resume_store
from .models import User, UserProfile
from .profile_extract import extract_from_blocks

STRING_FIELDS = (
    "first_name",
    "last_name",
    "email",
    "phone",
    "city",
    "region",
    "country",
    "linkedin_url",
    "github_url",
    "portfolio_url",
    "current_title",
)
BOOL_FIELDS = (
    "work_authorized",
    "requires_sponsorship",
    "willing_to_relocate",
)
REQUIRED_FIELDS = (
    "first_name",
    "last_name",
    "email",
    "phone",
    "city",
    "country",
    "work_authorized",
    "requires_sponsorship",
)
MAX_CHAT_INSTRUCTIONS = 2000


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _is_empty(value: Any) -> bool:
    if value is None:
        return True
    if isinstance(value, str) and not value.strip():
        return True
    return False


def _as_profile(row: UserProfile) -> dict[str, Any]:
    return {
        "first_name": row.first_name or "",
        "last_name": row.last_name or "",
        "email": row.email or "",
        "phone": row.phone or "",
        "city": row.city or "",
        "region": row.region or "",
        "country": row.country or "",
        "linkedin_url": row.linkedin_url or "",
        "github_url": row.github_url or "",
        "portfolio_url": row.portfolio_url or "",
        "current_title": row.current_title or "",
        "years_experience": row.years_experience,
        "work_authorized": row.work_authorized,
        "requires_sponsorship": row.requires_sponsorship,
        "willing_to_relocate": row.willing_to_relocate,
        "default_resume_id": (
            str(row.default_resume_id) if row.default_resume_id else None
        ),
        "source_resume_id": (
            str(row.source_resume_id) if row.source_resume_id else None
        ),
        "updated_at": row.updated_at.isoformat() if row.updated_at else "",
    }


def _get_or_create(db: Session, user_id: UUID) -> UserProfile:
    row = db.get(UserProfile, user_id)
    if row is not None:
        return row
    row = UserProfile(user_id=user_id, updated_at=_now())
    db.add(row)
    db.flush()
    return row


def _resume_for_extract(
    db: Session, user_id: UUID, resume_id: str | None
) -> tuple[str | None, list[Any]]:
    if resume_id:
        loaded = resume_store.load(db, user_id, resume_id)
        if loaded is None:
            return None, []
        return loaded["id"], loaded.get("blocks") or []
    row = db.scalar(
        select(UserProfile).where(UserProfile.user_id == user_id)
    )
    default_id = str(row.default_resume_id) if row and row.default_resume_id else None
    if default_id:
        loaded = resume_store.load(db, user_id, default_id)
        if loaded is not None:
            return loaded["id"], loaded.get("blocks") or []
    latest = resume_store.search(db, user_id, "")
    if not latest:
        return None, []
    loaded = resume_store.load(db, user_id, latest[0]["id"])
    if loaded is None:
        return None, []
    return loaded["id"], loaded.get("blocks") or []


def _missing(profile: dict[str, Any]) -> list[str]:
    return [key for key in REQUIRED_FIELDS if _is_empty(profile.get(key))]


def _overlay(
    saved: dict[str, Any],
    account_email: str,
    extracted: dict[str, str],
    resume_keys: set[str] | None = None,
) -> tuple[dict[str, Any], dict[str, str]]:
    merged = dict(saved)
    sources: dict[str, str] = {}
    tagged = resume_keys or set()
    for key in STRING_FIELDS:
        if not _is_empty(saved.get(key)):
            sources[key] = "resume" if key in tagged else "saved"
    if saved.get("years_experience") is not None:
        sources["years_experience"] = "saved"
    for key in BOOL_FIELDS:
        if saved.get(key) is not None:
            sources[key] = "saved"
    if saved.get("default_resume_id"):
        sources["default_resume_id"] = "saved"

    for key, value in extracted.items():
        if key not in STRING_FIELDS:
            continue
        if _is_empty(merged.get(key)) and not _is_empty(value):
            merged[key] = value
            sources[key] = "resume"

    if _is_empty(merged.get("email")) and account_email:
        merged["email"] = account_email
        sources["email"] = "account"
    return merged, sources


def load_payload(
    db: Session, user: User, *, resume_id: str | None = None
) -> dict[str, Any]:
    row = _get_or_create(db, user.id)
    saved = _as_profile(row)
    used_id, blocks = _resume_for_extract(db, user.id, resume_id)
    extracted = extract_from_blocks(blocks)
    profile, sources = _overlay(saved, user.email, extracted)
    if used_id and not profile.get("default_resume_id"):
        profile["default_resume_id"] = used_id
        if "default_resume_id" not in sources:
            sources["default_resume_id"] = "resume"
    return {
        "profile": profile,
        "missing": _missing(profile),
        "sources": sources,
        "resumes": resume_store.search(db, user.id, ""),
    }


def get_chat_instructions(db: Session, user_id: UUID) -> str:
    row = _get_or_create(db, user_id)
    return (row.chat_instructions or "").strip()


def save_chat_instructions(db: Session, user_id: UUID, text: str) -> str:
    cleaned = (text or "").strip()
    if len(cleaned) > MAX_CHAT_INSTRUCTIONS:
        raise ValueError("Keep instructions under 2000 characters.")
    row = _get_or_create(db, user_id)
    row.chat_instructions = cleaned
    row.updated_at = _now()
    db.flush()
    return cleaned


def save_payload(db: Session, user: User, data: dict[str, Any]) -> dict[str, Any]:
    row = _get_or_create(db, user.id)
    for key in STRING_FIELDS:
        setattr(row, key, (data.get(key) or "").strip())
    row.years_experience = data.get("years_experience")
    for key in BOOL_FIELDS:
        setattr(row, key, data.get(key))
    default_id = data.get("default_resume_id")
    row.default_resume_id = UUID(default_id) if default_id else None
    row.updated_at = _now()
    db.flush()
    profile = _as_profile(row)
    _, sources = _overlay(profile, user.email, {})
    return {
        "profile": profile,
        "missing": _missing(profile),
        "sources": sources,
        "resumes": resume_store.search(db, user.id, ""),
    }


def fill_from_resume(
    db: Session, user: User, resume_id: str | None
) -> dict[str, Any] | None:
    row = _get_or_create(db, user.id)
    if resume_id and resume_store.load(db, user.id, resume_id) is None:
        return None
    used_id, blocks = _resume_for_extract(db, user.id, resume_id)
    if used_id is None:
        return load_payload(db, user)
    extracted = extract_from_blocks(blocks)
    filled: set[str] = set()
    for key, value in extracted.items():
        if key not in STRING_FIELDS:
            continue
        current = getattr(row, key)
        if _is_empty(current) and not _is_empty(value):
            setattr(row, key, value)
            filled.add(key)
    if _is_empty(row.email) and user.email:
        row.email = user.email
    if row.default_resume_id is None:
        row.default_resume_id = UUID(used_id)
    row.source_resume_id = UUID(used_id)
    row.updated_at = _now()
    db.flush()
    saved = _as_profile(row)
    profile, sources = _overlay(saved, user.email, {}, resume_keys=filled)
    return {
        "profile": profile,
        "missing": _missing(profile),
        "sources": sources,
        "resumes": resume_store.search(db, user.id, ""),
    }
