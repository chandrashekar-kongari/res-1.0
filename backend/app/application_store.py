"""Per-user tracked job applications."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .models import Application

STATUSES = (
    "NEEDTOAPPLY",
    "APPLIED",
    "FOLLOWUP",
    "INTERVIEWING",
    "OFFER",
    "REJECTED",
)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _aware(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


def _as_dict(row: Application) -> dict[str, Any]:
    return {
        "id": str(row.id),
        "job_id": row.job_id,
        "company": row.company,
        "role": row.role,
        "url": row.url,
        "status": row.status,
        "applied_at": row.applied_at.isoformat() if row.applied_at else "",
    }


def _parse_id(application_id: str) -> UUID | None:
    try:
        return UUID(application_id)
    except ValueError:
        return None


def _find_existing(
    db: Session,
    user_id: UUID,
    *,
    job_id: str | None,
    url: str,
) -> Application | None:
    if job_id:
        row = db.scalar(
            select(Application).where(
                Application.user_id == user_id,
                Application.job_id == job_id,
            )
        )
        if row is not None:
            return row
    return db.scalar(
        select(Application).where(
            Application.user_id == user_id,
            Application.url == url,
        )
    )


def list_for_user(db: Session, user_id: UUID) -> list[dict[str, Any]]:
    rows = db.scalars(
        select(Application)
        .where(Application.user_id == user_id)
        .order_by(Application.applied_at.desc())
    ).all()
    return [_as_dict(row) for row in rows]


def create(
    db: Session,
    user_id: UUID,
    data: dict[str, Any],
) -> dict[str, Any]:
    job_id = data.get("job_id") or None
    url = data["url"]
    existing = _find_existing(db, user_id, job_id=job_id, url=url)
    if existing is not None:
        return _as_dict(existing)

    row = Application(
        id=uuid.uuid4(),
        user_id=user_id,
        job_id=job_id,
        company=data["company"],
        role=data["role"],
        url=url,
        status=data["status"],
        applied_at=_aware(data["applied_at"]) if data.get("applied_at") else _now(),
    )
    try:
        with db.begin_nested():
            db.add(row)
            db.flush()
    except IntegrityError:
        existing = _find_existing(db, user_id, job_id=job_id, url=url)
        if existing is not None:
            return _as_dict(existing)
        raise
    return _as_dict(row)


def load(db: Session, user_id: UUID, application_id: str) -> Application | None:
    parsed = _parse_id(application_id)
    if parsed is None:
        return None
    return db.scalar(
        select(Application).where(
            Application.id == parsed,
            Application.user_id == user_id,
        )
    )


def update(
    db: Session,
    user_id: UUID,
    application_id: str,
    data: dict[str, Any],
) -> dict[str, Any] | None:
    row = load(db, user_id, application_id)
    if row is None:
        return None
    if "company" in data:
        row.company = data["company"]
    if "role" in data:
        row.role = data["role"]
    if "url" in data:
        row.url = data["url"]
    if "status" in data:
        row.status = data["status"]
    if "applied_at" in data:
        row.applied_at = _aware(data["applied_at"])
    db.flush()
    return _as_dict(row)


def url_taken(
    db: Session, user_id: UUID, url: str, exclude_id: UUID | None = None
) -> bool:
    query = select(Application).where(
        Application.user_id == user_id,
        Application.url == url,
    )
    if exclude_id is not None:
        query = query.where(Application.id != exclude_id)
    return db.scalar(query) is not None


def delete(db: Session, user_id: UUID, application_id: str) -> bool:
    row = load(db, user_id, application_id)
    if row is None:
        return False
    db.delete(row)
    db.flush()
    return True
