"""Postgres tables for users, sessions, resumes, profiles, listings, applications, and contact notes."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    Uuid,
    Computed,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB, TSVECTOR
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    password_hash: Mapped[str | None] = mapped_column(Text, nullable=True)
    email_verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    google_sub: Mapped[str | None] = mapped_column(Text, unique=True, nullable=True)
    stack_user_id: Mapped[str | None] = mapped_column(Text, unique=True, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow
    )

    sessions: Mapped[list[AuthSession]] = relationship(back_populates="user")
    resumes: Mapped[list[Resume]] = relationship(back_populates="user")
    profile: Mapped[UserProfile | None] = relationship(
        back_populates="user", uselist=False
    )
    applications: Mapped[list[Application]] = relationship(
        back_populates="user"
    )


class AuthSession(Base):
    __tablename__ = "sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    user: Mapped[User] = relationship(back_populates="sessions")


class Resume(Base):
    __tablename__ = "resumes"
    __table_args__ = (
        Index("resumes_user_updated_idx", "user_id", "updated_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    note: Mapped[str] = mapped_column(Text, default="")
    document: Mapped[dict[str, Any]] = mapped_column(JSONB)
    blocks: Mapped[list[Any]] = mapped_column(JSONB)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow
    )

    user: Mapped[User] = relationship(back_populates="resumes")


class UserProfile(Base):
    __tablename__ = "user_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    first_name: Mapped[str] = mapped_column(Text, default="")
    last_name: Mapped[str] = mapped_column(Text, default="")
    email: Mapped[str] = mapped_column(Text, default="")
    phone: Mapped[str] = mapped_column(Text, default="")
    city: Mapped[str] = mapped_column(Text, default="")
    region: Mapped[str] = mapped_column(Text, default="")
    country: Mapped[str] = mapped_column(Text, default="")
    linkedin_url: Mapped[str] = mapped_column(Text, default="")
    github_url: Mapped[str] = mapped_column(Text, default="")
    portfolio_url: Mapped[str] = mapped_column(Text, default="")
    current_title: Mapped[str] = mapped_column(Text, default="")
    years_experience: Mapped[int | None] = mapped_column(Integer, nullable=True)
    work_authorized: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    requires_sponsorship: Mapped[bool | None] = mapped_column(
        Boolean, nullable=True
    )
    willing_to_relocate: Mapped[bool | None] = mapped_column(
        Boolean, nullable=True
    )
    default_resume_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True
    )
    source_resume_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True
    )
    chat_instructions: Mapped[str] = mapped_column(Text, default="")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow
    )

    user: Mapped[User] = relationship(back_populates="profile")


class Application(Base):
    __tablename__ = "applications"
    __table_args__ = (
        UniqueConstraint("user_id", "url", name="applications_user_url_key"),
        Index(
            "applications_user_job_id_key",
            "user_id",
            "job_id",
            unique=True,
            postgresql_where=text("job_id IS NOT NULL"),
        ),
        Index("applications_user_applied_idx", "user_id", "applied_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    job_id: Mapped[str | None] = mapped_column(Text, nullable=True)
    company: Mapped[str] = mapped_column(Text)
    role: Mapped[str] = mapped_column(Text)
    url: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(Text, default="NEEDTOAPPLY")
    applied_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow
    )

    user: Mapped[User] = relationship(back_populates="applications")


class ContactMessage(Base):
    __tablename__ = "contact_messages"
    __table_args__ = (Index("contact_messages_created_idx", "created_at"),)

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(Text)
    email: Mapped[str] = mapped_column(Text)
    message: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow
    )


class Job(Base):
    __tablename__ = "jobs"
    __table_args__ = (
        Index("jobs_posted_idx", "posted_at"),
        Index("jobs_workplace_idx", "workplace"),
        Index("jobs_type_idx", "type"),
        Index("jobs_experience_idx", "experience"),
        Index("jobs_experience_posted_idx", "experience", "posted_at"),
    )

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    url: Mapped[str] = mapped_column(Text, unique=True)
    title: Mapped[str] = mapped_column(Text)
    company: Mapped[str] = mapped_column(Text)
    location: Mapped[str] = mapped_column(Text)
    workplace: Mapped[str] = mapped_column(Text)
    type: Mapped[str] = mapped_column(Text)
    posted_at: Mapped[str] = mapped_column(Text)
    tags: Mapped[str] = mapped_column(Text)
    provider: Mapped[str] = mapped_column(Text)
    experience: Mapped[str] = mapped_column(Text, default="mid")
    first_seen: Mapped[str] = mapped_column(Text)
    scraped_at: Mapped[str] = mapped_column(Text)
    title_tsv: Mapped[str] = mapped_column(
        TSVECTOR,
        Computed("to_tsvector('simple', coalesce(title, ''))", persisted=True),
    )


class JobStaging(Base):
    __tablename__ = "jobs_staging"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    url: Mapped[str] = mapped_column(Text, unique=True)
    title: Mapped[str] = mapped_column(Text)
    company: Mapped[str] = mapped_column(Text)
    location: Mapped[str] = mapped_column(Text)
    workplace: Mapped[str] = mapped_column(Text)
    type: Mapped[str] = mapped_column(Text)
    posted_at: Mapped[str] = mapped_column(Text)
    tags: Mapped[str] = mapped_column(Text)
    provider: Mapped[str] = mapped_column(Text)
    experience: Mapped[str] = mapped_column(Text, default="mid")
    first_seen: Mapped[str] = mapped_column(Text)
    scraped_at: Mapped[str] = mapped_column(Text)


class DeadSlug(Base):
    __tablename__ = "dead_slugs"

    provider: Mapped[str] = mapped_column(Text, primary_key=True)
    slug: Mapped[str] = mapped_column(Text, primary_key=True)
    status: Mapped[int | None] = mapped_column(Integer, nullable=True)
    seen_at: Mapped[str] = mapped_column(Text)


class SweepMeta(Base):
    __tablename__ = "sweep_meta"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    status: Mapped[str] = mapped_column(Text)
    started_at: Mapped[str | None] = mapped_column(Text, nullable=True)
    finished_at: Mapped[str | None] = mapped_column(Text, nullable=True)
    duration_s: Mapped[float | None] = mapped_column(nullable=True)
    job_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    error_sample: Mapped[str | None] = mapped_column(Text, nullable=True)
    next_run_at: Mapped[str | None] = mapped_column(Text, nullable=True)
    counts_json: Mapped[str | None] = mapped_column(Text, nullable=True)
