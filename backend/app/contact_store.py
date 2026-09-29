"""Public marketing contact notes."""

from __future__ import annotations

import threading
import time
import uuid
from typing import Any

from sqlalchemy.orm import Session

from .models import ContactMessage

RATE_WINDOW_S = 60

_lock = threading.Lock()
_last_sent: dict[str, float] = {}


def too_soon(ip: str) -> bool:
    now = time.monotonic()
    key = ip or "unknown"
    with _lock:
        last = _last_sent.get(key, 0.0)
        return now - last < RATE_WINDOW_S


def mark_sent(ip: str) -> None:
    now = time.monotonic()
    key = ip or "unknown"
    with _lock:
        _last_sent[key] = now
        if len(_last_sent) > 4000:
            cutoff = now - RATE_WINDOW_S
            stale = [item for item, seen in _last_sent.items() if seen < cutoff]
            for item in stale:
                del _last_sent[item]


def save(db: Session, *, name: str, email: str, message: str) -> dict[str, Any]:
    row = ContactMessage(
        id=uuid.uuid4(),
        name=name,
        email=email,
        message=message,
    )
    db.add(row)
    db.flush()
    return {"ok": True}
