"""Runtime settings from the environment."""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

_WEAK_SECRETS = {
    "",
    "dev-secret-change-me",
    "change-me-in-production",
    "compose-dev-secret-not-for-prod",
}

APP_ENV = os.environ.get("APP_ENV", "development").strip().lower() or "development"
IS_PRODUCTION = APP_ENV == "production"


def _sqlalchemy_url(raw: str) -> str:
    url = raw.strip()
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://") :]
    if url.startswith("postgresql://") and "+psycopg" not in url:
        url = "postgresql+psycopg://" + url[len("postgresql://") :]
    return url


def _require(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise RuntimeError(f"{name} is required when APP_ENV=production")
    return value


_raw_db = os.environ.get("DATABASE_URL", "").strip()
if not _raw_db:
    raise RuntimeError(
        "DATABASE_URL is required. Paste the pooled Neon connection string into backend/.env."
    )
DATABASE_URL = _sqlalchemy_url(_raw_db)

if IS_PRODUCTION:
    SECRET_KEY = _require("SECRET_KEY")
    if SECRET_KEY in _WEAK_SECRETS:
        raise RuntimeError("SECRET_KEY must be a strong value in production")
    STACK_PROJECT_ID = _require("STACK_PROJECT_ID")
    STACK_SECRET_SERVER_KEY = _require("STACK_SECRET_SERVER_KEY")
else:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me")
    STACK_PROJECT_ID = os.environ.get("STACK_PROJECT_ID", "").strip()
    STACK_SECRET_SERVER_KEY = os.environ.get("STACK_SECRET_SERVER_KEY", "").strip()

CORS_ORIGINS = [
    origin.strip()
    for origin in os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]
APP_PUBLIC_URL = os.environ.get("APP_PUBLIC_URL", "http://localhost:3000").rstrip("/")
if APP_PUBLIC_URL and APP_PUBLIC_URL not in CORS_ORIGINS:
    CORS_ORIGINS.append(APP_PUBLIC_URL)

MAX_UPLOAD_BYTES = 8 * 1024 * 1024
STACK_API_URL = (
    os.environ.get("STACK_API_URL", "https://api.stack-auth.com").strip().rstrip("/")
    or "https://api.stack-auth.com"
)
