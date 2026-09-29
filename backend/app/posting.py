"""Resolve a job-posting URL into clean description text for the resume chat."""

from __future__ import annotations

import html
import json
import logging
import re
import time
from dataclasses import dataclass
from typing import Any
from urllib.parse import parse_qs, unquote, urlparse

from .jobs.http import FetchError, fetch_bytes, fetch_json, fetch_json_public
from .jobs.text import html_to_text

log = logging.getLogger(__name__)

MIN_JD_CHARS = 400
MAX_JD_CHARS = 8000
CACHE_TTL_S = 30 * 60
CACHE_FAIL_TTL_S = 5 * 60
MAX_URLS = 2

_URL_RE = re.compile(r"https://[^\s<>\"')\]]+", re.IGNORECASE)
_TRAIL_PUNCT_RE = re.compile(r"[.,;:!?)]+$")
_SPA_RE = re.compile(
    r"enable javascript|you need to enable javascript|noscript",
    re.IGNORECASE,
)
_LD_RE = re.compile(
    r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
    re.IGNORECASE | re.DOTALL,
)
_GH_JOB_RE = re.compile(
    r"(?:job-boards(?:\.eu)?|boards)\.greenhouse\.io/([^/?#]+)/jobs/(\d+)",
    re.IGNORECASE,
)
_LEVER_RE = re.compile(
    r"^jobs\.(eu\.)?lever\.co$",
    re.IGNORECASE,
)
_ASHBY_RE = re.compile(r"^jobs\.ashbyhq\.com$", re.IGNORECASE)
_WD_HOST_RE = re.compile(
    r"^([a-z0-9-]+)\.wd\d+\.myworkdayjobs\.com$",
    re.IGNORECASE,
)
_LOCALE_RE = re.compile(r"^[a-z]{2}([_-][a-z]{2})?$", re.IGNORECASE)

_GH_HOSTS = {
    "boards-api.greenhouse.io",
    "boards.greenhouse.io",
    "job-boards.greenhouse.io",
    "job-boards.eu.greenhouse.io",
}
_LEVER_HOSTS = {"api.lever.co", "api.eu.lever.co"}
_ASHBY_HOSTS = {"api.ashbyhq.com"}

_IBM_HOSTS = {"careers.ibm.com", "www.ibm.com"}
_IBM_CXS = (
    "https://ibm.wd1.myworkdayjobs.com/wday/cxs/ibm/IBM_PS/job/{id}",
    "https://ibm.wd1.myworkdayjobs.com/wday/cxs/ibm/Search/job/{id}",
    "https://ibm.wd5.myworkdayjobs.com/wday/cxs/ibm/IBM_Career/job/{id}",
)

_cache: dict[str, tuple[float, "PostingResult"]] = {}


@dataclass(frozen=True)
class PostingResult:
    url: str
    text: str = ""
    failed: bool = False


def resolve_from_messages(messages: list[dict]) -> PostingResult | None:
    for message in reversed(messages):
        if message.get("role") != "user":
            continue
        urls = extract_urls(str(message.get("content") or ""))
        if not urls:
            return None
        last_error: Exception | None = None
        for url in urls:
            cached = _cache_get(url)
            if cached is not None:
                return cached
            try:
                result = resolve_url(url)
            except FetchError as exc:
                last_error = exc
                log.info("posting fetch failed for %s: %s", url, exc)
                continue
            if result.text:
                _cache_put(url, result)
                return result
            last_error = FetchError("posting text too thin")
        if last_error is not None:
            failed = PostingResult(url=urls[0], failed=True)
            _cache_put(urls[0], failed)
            return failed
        return None
    return None


def extract_urls(text: str) -> list[str]:
    found: list[str] = []
    seen: set[str] = set()
    for match in _URL_RE.findall(text):
        href = _TRAIL_PUNCT_RE.sub("", match.strip())
        key = href.rstrip("/").lower()
        if key in seen:
            continue
        parsed = urlparse(href)
        host = (parsed.hostname or "").lower()
        if parsed.scheme != "https" or not host:
            continue
        if host in {"localhost", "localhost.localdomain"}:
            continue
        if _is_ip(host):
            continue
        seen.add(key)
        found.append(href)
        if len(found) >= MAX_URLS:
            break
    return found


def resolve_url(url: str) -> PostingResult:
    for resolver in (_greenhouse, _lever, _ashby, _workday, _ibm):
        text = resolver(url)
        if text and _usable(text):
            return PostingResult(url=url, text=text[:MAX_JD_CHARS])
    html_text = _html(url)
    if html_text and _usable(html_text):
        cleaned = _clean_html_posting(html_text)
        body = cleaned if cleaned and _usable(cleaned) else html_text
        if _usable(body):
            return PostingResult(url=url, text=body[:MAX_JD_CHARS])
    return PostingResult(url=url, failed=True)


def _clean_html_posting(text: str) -> str:
    try:
        from .ai import extract_posting
    except Exception:
        return ""
    try:
        return extract_posting(text)
    except Exception as exc:
        log.info("posting extract failed: %s", exc)
        return ""


def _cache_get(url: str) -> PostingResult | None:
    key = url.rstrip("/").lower()
    hit = _cache.get(key)
    if hit is None:
        return None
    stored_at, result = hit
    ttl = CACHE_FAIL_TTL_S if result.failed else CACHE_TTL_S
    if time.time() - stored_at > ttl:
        _cache.pop(key, None)
        return None
    return result


def _cache_put(url: str, result: PostingResult) -> None:
    _cache[url.rstrip("/").lower()] = (time.time(), result)


def _is_ip(host: str) -> bool:
    import ipaddress

    try:
        ipaddress.ip_address(host)
        return True
    except ValueError:
        return False


def _usable(text: str) -> bool:
    stripped = text.strip()
    if len(stripped) < MIN_JD_CHARS:
        return False
    if _SPA_RE.search(stripped) and len(stripped) < 800:
        return False
    return True


def _format_posting(
    *,
    title: str = "",
    company: str = "",
    location: str = "",
    description: str = "",
) -> str:
    lines: list[str] = []
    if title:
        lines.append(f"Title: {title.strip()}")
    if company:
        lines.append(f"Company: {company.strip()}")
    if location:
        lines.append(f"Location: {location.strip()}")
    body = description.strip()
    if body:
        if lines:
            lines.append("")
        lines.append(body)
    return "\n".join(lines).strip()


def _greenhouse(url: str) -> str:
    match = _GH_JOB_RE.search(url)
    if not match:
        return ""
    board, job_id = match.group(1), match.group(2)
    api = f"https://boards-api.greenhouse.io/v1/boards/{board}/jobs/{job_id}"
    try:
        payload = fetch_json(api, _GH_HOSTS, timeout_s=8.0)
    except FetchError:
        return ""
    if not isinstance(payload, dict):
        return ""
    title = str(payload.get("title") or "").strip()
    location = ""
    loc = payload.get("location")
    if isinstance(loc, dict):
        location = str(loc.get("name") or "").strip()
    description = html_to_text(payload.get("content") or "", max_chars=MAX_JD_CHARS)
    return _format_posting(title=title, location=location, description=description)


def _lever(url: str) -> str:
    parsed = urlparse(url)
    host_match = _LEVER_RE.match(parsed.hostname or "")
    if not host_match:
        return ""
    parts = [part for part in parsed.path.split("/") if part]
    if len(parts) < 2:
        return ""
    company, job_id = parts[0], parts[1]
    api_host = "api.eu.lever.co" if host_match.group(1) else "api.lever.co"
    api = f"https://{api_host}/v0/postings/{company}/{job_id}?mode=json"
    try:
        payload = fetch_json(api, _LEVER_HOSTS, timeout_s=8.0)
    except FetchError:
        return ""
    if not isinstance(payload, dict):
        return ""
    title = str(payload.get("text") or "").strip()
    categories = payload.get("categories") if isinstance(payload.get("categories"), dict) else {}
    location = str(categories.get("location") or "").strip()
    description = str(payload.get("descriptionPlain") or "").strip()
    if not description:
        description = html_to_text(
            payload.get("description") or "", max_chars=MAX_JD_CHARS
        )
    return _format_posting(
        title=title,
        company=company,
        location=location,
        description=description,
    )


def _ashby(url: str) -> str:
    parsed = urlparse(url)
    if not _ASHBY_RE.match(parsed.hostname or ""):
        return ""
    parts = [part for part in parsed.path.split("/") if part]
    if len(parts) < 2:
        return ""
    org, job_id = parts[0], unquote(parts[1])
    api = f"https://api.ashbyhq.com/posting-api/job-board/{org}"
    try:
        payload = fetch_json(api, _ASHBY_HOSTS, timeout_s=8.0)
    except FetchError:
        return ""
    rows = payload.get("jobs") if isinstance(payload, dict) else None
    if not isinstance(rows, list):
        return ""
    target = url.rstrip("/").lower()
    for row in rows:
        if not isinstance(row, dict):
            continue
        job_url = str(row.get("jobUrl") or "").rstrip("/").lower()
        row_id = str(row.get("id") or "").strip()
        if job_url != target and row_id != job_id and job_id not in job_url:
            continue
        title = str(row.get("title") or "").strip()
        location = str(row.get("location") or "").strip()
        description = str(row.get("descriptionPlain") or "").strip()
        if not description:
            description = html_to_text(
                row.get("descriptionHtml") or "", max_chars=MAX_JD_CHARS
            )
        return _format_posting(
            title=title,
            company=org,
            location=location,
            description=description,
        )
    return ""


def _workday(url: str) -> str:
    parsed = urlparse(url)
    host = (parsed.hostname or "").lower()
    match = _WD_HOST_RE.match(host)
    if not match:
        return ""
    tenant = match.group(1)
    parts = [part for part in parsed.path.split("/") if part]
    if "job" not in [part.lower() for part in parts]:
        return ""
    locale_stripped = [part for part in parts if not _LOCALE_RE.match(part)]
    site = ""
    job_id = locale_stripped[-1] if locale_stripped else ""
    if "job" in [part.lower() for part in locale_stripped]:
        job_index = next(
            i for i, part in enumerate(locale_stripped) if part.lower() == "job"
        )
        if job_index > 0:
            site = locale_stripped[0]
        job_id = locale_stripped[-1]
    if not site or not job_id:
        return ""
    cxs = f"https://{host}/wday/cxs/{tenant}/{site}/job/{job_id}"
    try:
        payload = fetch_json_public(cxs)
    except FetchError:
        return ""
    return _workday_text(payload)


def _workday_text(payload: Any) -> str:
    if not isinstance(payload, dict):
        return ""
    info = payload.get("jobPostingInfo")
    if not isinstance(info, dict):
        info = payload.get("jobPosting") if isinstance(payload.get("jobPosting"), dict) else payload
    title = str(info.get("title") or info.get("jobTitle") or "").strip()
    company = str(info.get("hiringOrganization") or info.get("company") or "").strip()
    if isinstance(info.get("hiringOrganization"), dict):
        company = str(info["hiringOrganization"].get("name") or company).strip()
    location = str(
        info.get("location") or info.get("jobLocation") or info.get("country") or ""
    ).strip()
    html = (
        info.get("jobDescription")
        or info.get("jobPostingDescription")
        or info.get("description")
        or ""
    )
    description = html_to_text(html, max_chars=MAX_JD_CHARS) if html else ""
    if not description and isinstance(html, str):
        description = html.strip()
    return _format_posting(
        title=title,
        company=company,
        location=location,
        description=description,
    )


def _ibm(url: str) -> str:
    parsed = urlparse(url)
    host = (parsed.hostname or "").lower()
    if host not in _IBM_HOSTS:
        return ""
    query = parse_qs(parsed.query)
    job_id = (query.get("jobId") or query.get("jobid") or [""])[0].strip()
    if not job_id:
        parts = [part for part in parsed.path.split("/") if part]
        if parts:
            job_id = parts[-1]
    if not job_id:
        return ""
    for template in _IBM_CXS:
        try:
            payload = fetch_json_public(template.format(id=job_id))
        except FetchError:
            continue
        text = _workday_text(payload)
        if _usable(text):
            return text
    return ""


def _html(url: str) -> str:
    try:
        _final, raw, content_type = fetch_bytes(url)
    except FetchError:
        return ""
    try:
        html = raw.decode("utf-8", errors="replace")
    except Exception:
        return ""
    ld = _json_ld_job(html)
    if ld and _usable(ld):
        return ld
    if "json" in content_type.lower():
        try:
            payload = json.loads(html)
        except json.JSONDecodeError:
            payload = None
        if isinstance(payload, dict):
            text = _workday_text(payload)
            if _usable(text):
                return text
    return html_to_text(html, max_chars=MAX_JD_CHARS)


def _json_ld_job(html: str) -> str:
    for block in _LD_RE.findall(html):
        raw = html.unescape(block.strip())
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            continue
        posting = _find_job_posting(data)
        if posting is None:
            continue
        title = str(posting.get("title") or "").strip()
        org = posting.get("hiringOrganization")
        company = ""
        if isinstance(org, dict):
            company = str(org.get("name") or "").strip()
        elif isinstance(org, str):
            company = org.strip()
        location = ""
        loc = posting.get("jobLocation")
        if isinstance(loc, dict):
            address = loc.get("address")
            if isinstance(address, dict):
                location = " ".join(
                    str(address.get(key) or "")
                    for key in ("addressLocality", "addressRegion", "addressCountry")
                ).strip()
            else:
                location = str(loc.get("name") or "").strip()
        description = html_to_text(
            posting.get("description") or "", max_chars=MAX_JD_CHARS
        )
        formatted = _format_posting(
            title=title,
            company=company,
            location=location,
            description=description,
        )
        if formatted:
            return formatted
    return ""


def _find_job_posting(data: Any) -> dict[str, Any] | None:
    if isinstance(data, dict):
        types = data.get("@type")
        labels = (
            [types]
            if isinstance(types, str)
            else list(types)
            if isinstance(types, list)
            else []
        )
        if any(str(label).lower() == "jobposting" for label in labels):
            return data
        graph = data.get("@graph")
        if isinstance(graph, list):
            found = _find_job_posting(graph)
            if found:
                return found
        for value in data.values():
            found = _find_job_posting(value)
            if found:
                return found
    if isinstance(data, list):
        for item in data:
            found = _find_job_posting(item)
            if found:
                return found
    return None
