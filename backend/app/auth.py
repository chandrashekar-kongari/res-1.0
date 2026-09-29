"""Stack Auth access tokens, mapped onto local users that own resumes."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from functools import lru_cache

import httpx
import jwt
from fastapi import Depends, HTTPException, Request, status
from jwt import PyJWKClient
from jwt.exceptions import InvalidTokenError
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .config import STACK_API_URL, STACK_PROJECT_ID, STACK_SECRET_SERVER_KEY
from .db import get_db
from .models import User

log = logging.getLogger(__name__)
STACK_TOKEN_HEADER = "x-stack-access-token"


def normalize_email(email: str) -> str:
    return email.strip().lower()


@lru_cache(maxsize=1)
def _jwks_client() -> PyJWKClient:
    return PyJWKClient(
        f"{STACK_API_URL}/api/v1/projects/{STACK_PROJECT_ID}/.well-known/jwks.json"
    )


def verify_stack_jwt(access_token: str) -> str | None:
    if not STACK_PROJECT_ID or not access_token:
        return None
    try:
        signing_key = _jwks_client().get_signing_key_from_jwt(access_token)
        payload = jwt.decode(
            access_token,
            signing_key.key,
            algorithms=["ES256"],
            audience=STACK_PROJECT_ID,
        )
    except InvalidTokenError:
        return None
    except Exception:
        log.exception("stack jwt verify failed")
        return None
    sub = payload.get("sub")
    return str(sub) if sub else None


def fetch_stack_user(access_token: str) -> dict | None:
    if not STACK_PROJECT_ID or not STACK_SECRET_SERVER_KEY:
        return None
    try:
        response = httpx.get(
            f"{STACK_API_URL}/api/v1/users/me",
            headers={
                "x-stack-access-type": "server",
                "x-stack-project-id": STACK_PROJECT_ID,
                "x-stack-secret-server-key": STACK_SECRET_SERVER_KEY,
                "x-stack-access-token": access_token,
            },
            timeout=10,
        )
    except httpx.HTTPError:
        log.exception("stack users/me failed")
        return None
    if response.status_code != 200:
        return None
    payload = response.json()
    return payload if isinstance(payload, dict) else None


def _email_from_profile(profile: dict) -> str:
    raw = profile.get("primary_email") or profile.get("primaryEmail") or ""
    return normalize_email(str(raw))


def _link_or_create_user(db: Session, stack_user_id: str, email: str) -> User:
    existing = db.scalar(
        select(User).where(User.email == email, User.stack_user_id.is_(None))
    )
    if existing is not None:
        existing.stack_user_id = stack_user_id
        if existing.email_verified_at is None:
            existing.email_verified_at = datetime.now(timezone.utc)
        db.flush()
        return existing
    user = User(
        email=email,
        stack_user_id=stack_user_id,
        email_verified_at=datetime.now(timezone.utc),
    )
    db.add(user)
    try:
        db.flush()
        return user
    except IntegrityError as exc:
        db.rollback()
        linked = db.scalar(select(User).where(User.stack_user_id == stack_user_id))
        if linked is not None:
            return linked
        conflict = db.scalar(select(User).where(User.email == email))
        if conflict is not None and conflict.stack_user_id is None:
            conflict.stack_user_id = stack_user_id
            db.flush()
            return conflict
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with that email already exists.",
        ) from exc


def get_current_user(
    request: Request, db: Session = Depends(get_db)
) -> User:
    token = request.headers.get(STACK_TOKEN_HEADER)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not signed in.",
        )
    stack_user_id = verify_stack_jwt(token)
    if not stack_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not signed in.",
        )
    user = db.scalar(select(User).where(User.stack_user_id == stack_user_id))
    if user is not None:
        return user
    profile = fetch_stack_user(token)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not signed in.",
        )
    email = _email_from_profile(profile)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not signed in.",
        )
    return _link_or_create_user(db, stack_user_id, email)
