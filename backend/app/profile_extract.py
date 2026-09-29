"""Pull application-profile fields out of resume blocks with regex.

Eligibility questions are never inferred. Name, contact, links, and a
best-effort title come from the first blocks of the document.
"""

from __future__ import annotations

import re
from typing import Any

HEADER_LIMIT = 20

_INVISIBLE = re.compile(r"[\u200b-\u200f\u202a-\u202e\u2066-\u2069]")
_EMAIL_RE = re.compile(r"\b[\w.+-]+@[\w.-]+\.\w+\b")
_PHONE_RE = re.compile(
    r"(?:\+\d{1,3}[\s.-]*)?(?:\(?\d{3}\)?[\s.-]*\d{3}[\s.-]*\d{4}|\d{10,15})"
)
_LINKEDIN_RE = re.compile(
    r"(?:https?://)?(?:www\.)?linkedin\.com/in/[A-Za-z0-9_-]+/?",
    re.IGNORECASE,
)
_GITHUB_RE = re.compile(
    r"(?:https?://)?(?:www\.)?github\.com/([A-Za-z0-9-]+)/?",
    re.IGNORECASE,
)
_URL_RE = re.compile(r"https?://[^\s|,;]+", re.IGNORECASE)
_GITHUB_IO_RE = re.compile(
    r"(?:https?://)?(?:www\.)?([A-Za-z0-9-]+\.github\.io\S*)",
    re.IGNORECASE,
)
_SECTION_RE = re.compile(
    r"^(education|experience|work experience|professional experience|"
    r"skills|technical skills|projects|summary|objective|certifications|"
    r"relevant coursework|awards|publications)\s*$",
    re.IGNORECASE,
)
_TITLE_RE = re.compile(
    r"\b(?:(?:Senior|Staff|Principal|Junior|Lead|Software|Frontend|"
    r"Backend|Full[ -]?Stack|Machine Learning|Data|Product|DevOps|"
    r"Site Reliability)\s+)+(?:[A-Z][a-z]+\s+){0,2}"
    r"(?:Engineer|Developer|Intern|Extern|Analyst|Designer|Scientist|"
    r"Manager|Architect)\b"
)
_COUNTRY_ALIASES = {
    "usa": "United States",
    "us": "United States",
    "u.s.": "United States",
    "u.s.a.": "United States",
    "united states": "United States",
    "united states of america": "United States",
    "uk": "United Kingdom",
    "u.k.": "United Kingdom",
    "united kingdom": "United Kingdom",
    "india": "India",
    "canada": "Canada",
    "germany": "Germany",
    "australia": "Australia",
    "france": "France",
    "singapore": "Singapore",
}
_SPLIT = re.compile(r"[|•·⋄∙]+")


def extract_from_blocks(blocks: list[Any] | None) -> dict[str, str]:
    """Return only keys that were found. Values are non-empty strings."""
    lines = _header_lines(blocks or [])
    blob = "\n".join(lines)
    if not blob.strip():
        return {}

    found: dict[str, str] = {}
    email = _first(_EMAIL_RE, blob)
    if email:
        found["email"] = email.lower()

    phone = _best_phone(blob)
    if phone:
        found["phone"] = phone

    linkedin = _first(_LINKEDIN_RE, blob)
    if linkedin:
        found["linkedin_url"] = _abs_url(linkedin.rstrip("/"))

    github = _GITHUB_RE.search(blob)
    if github:
        found["github_url"] = f"https://github.com/{github.group(1)}"

    pages = _GITHUB_IO_RE.search(blob)
    if pages:
        found["portfolio_url"] = _abs_url(pages.group(1).rstrip("/.)"))
    else:
        for match in _URL_RE.findall(blob):
            lower = match.lower()
            if "linkedin.com" in lower or "github.com" in lower:
                continue
            found["portfolio_url"] = match.rstrip("/.)")
            break

    first, last = _split_name(_name_from_lines(lines))
    if first:
        found["first_name"] = first
    if last:
        found["last_name"] = last

    city, region, country = _location_from_lines(lines)
    if city:
        found["city"] = city
    if region:
        found["region"] = region
    if country:
        found["country"] = country

    title = _title_from_lines(lines)
    if title:
        found["current_title"] = title
    return found


def _header_lines(blocks: list[Any]) -> list[str]:
    lines: list[str] = []
    for block in blocks[:HEADER_LIMIT]:
        if not isinstance(block, dict) or block.get("type") == "divider":
            continue
        text = _block_text(block)
        if text:
            lines.append(text)
    return lines


def _block_text(block: dict[str, Any]) -> str:
    parts: list[str] = []
    for run in block.get("runs") or []:
        if not isinstance(run, dict):
            continue
        text = str(run.get("text") or "")
        if text:
            parts.append(text)
    return _clean("".join(parts))


def _clean(text: str) -> str:
    text = _INVISIBLE.sub("", text)
    return " ".join(text.split()).strip()


def _first(pattern: re.Pattern[str], text: str) -> str:
    match = pattern.search(text)
    return match.group(0).strip() if match else ""


def _best_phone(text: str) -> str:
    best = ""
    best_digits = 0
    for match in _PHONE_RE.findall(text):
        digits = re.sub(r"\D", "", match)
        if len(digits) < 10:
            continue
        if len(digits) > best_digits:
            best = match.strip()
            best_digits = len(digits)
    return best


def _abs_url(raw: str) -> str:
    value = raw.strip()
    if value.lower().startswith("http://") or value.lower().startswith("https://"):
        return value
    return f"https://{value}"


def _is_contact_line(text: str) -> bool:
    lower = text.lower()
    return bool(
        "@" in text
        or "linkedin.com" in lower
        or "github.com" in lower
        or "github.io" in lower
        or _PHONE_RE.search(text)
    )


def _name_from_lines(lines: list[str]) -> str:
    for text in lines:
        if _is_contact_line(text) or _SECTION_RE.match(text):
            continue
        if len(text) > 80:
            continue
        return text
    return ""


def _split_name(name: str) -> tuple[str, str]:
    parts = name.split()
    if not parts:
        return "", ""
    if len(parts) == 1:
        return parts[0], ""
    return " ".join(parts[:-1]), parts[-1]


def _location_from_lines(lines: list[str]) -> tuple[str, str, str]:
    contact = ""
    for text in lines:
        if _is_contact_line(text):
            contact = text
            break
    if not contact:
        return "", "", ""
    stripped = _EMAIL_RE.sub(" ", contact)
    stripped = _LINKEDIN_RE.sub(" ", stripped)
    stripped = _GITHUB_RE.sub(" ", stripped)
    stripped = _GITHUB_IO_RE.sub(" ", stripped)
    stripped = _URL_RE.sub(" ", stripped)
    stripped = _PHONE_RE.sub(" ", stripped)
    chunks = [_clean(part) for part in _SPLIT.split(stripped)]
    leftovers = [chunk for chunk in chunks if chunk and not re.fullmatch(r"[\W_]+", chunk)]
    city = ""
    region = ""
    country = ""
    for chunk in leftovers:
        city, region, country = _parse_place(chunk)
        if city or country:
            break
    return city, region, country


def _parse_place(chunk: str) -> tuple[str, str, str]:
    parts = [part.strip() for part in chunk.split(",") if part.strip()]
    if not parts:
        return "", "", ""
    country = ""
    region = ""
    city_parts: list[str] = []
    for part in parts:
        alias = _COUNTRY_ALIASES.get(part.lower())
        if alias:
            country = alias
            continue
        if re.fullmatch(r"[A-Z]{2}", part):
            region = part
            continue
        city_parts.append(part)
    city = ", ".join(city_parts)
    if city.lower() in {"remote"}:
        city = ""
    return city, region, country


def _title_from_lines(lines: list[str]) -> str:
    started = False
    for text in lines:
        if _SECTION_RE.match(text) and "experience" in text.lower():
            started = True
            continue
        if not started:
            continue
        if _SECTION_RE.match(text):
            break
        matches = list(_TITLE_RE.finditer(text))
        if matches:
            return _clean(max(matches, key=lambda item: len(item.group(0))).group(0))
    return ""
