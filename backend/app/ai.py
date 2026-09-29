"""
The resume assistant: blocks + chat history -> a reply plus concrete edits.

Concept: the model never sees our JSON. It sees one line per block, tagged
with that block's id ("[b12] - Built Sam Bot ..."), and it answers with
edits that point back at those ids. The ids are the shared vocabulary
between the model and the editor, which is what lets the UI apply a
suggestion to exactly one paragraph instead of regenerating the document.

We ask for a typed response (see ChatReply) rather than parsing prose, so a
malformed suggestion is a parse error here instead of a broken edit in the
browser. Nothing in this file writes to storage - suggestions only become
real once the user accepts them in the editor.
"""

import os
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv
from openai import OpenAI, OpenAIError
from pydantic import BaseModel

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

DEFAULT_MODEL = "gpt-4o-mini"
MAX_EDITS = 12


class AiError(RuntimeError):
    """Anything the user can act on: missing key, refused request, bad reply."""


class ResumeEdit(BaseModel):
    op: Literal["replace", "insert_after"]
    block_id: str
    text: str


class ChatReply(BaseModel):
    reply: str
    edits: list[ResumeEdit]


SYSTEM_PROMPT = """\
You are the resume assistant in this editor. You write as both a senior
engineer and a senior recruiting manager: technically honest about the work,
and ATS-plain so a hiring manager can scan the page in seconds. You improve
bullets, tighten wording, regroup skills, and tailor existing lines to a job
description the user pastes in the chat, or one fetched from a posting URL.

The resume is given to you as one line per block, like
"[b12] - Built Sam Bot, an AI-powered ...". The bracketed id is how you refer
to a line you want to change. Bold text is marked with **.

Writing rules:
1. Facts come from the resume, a fetched or pasted job posting, and the
   user's message only. Never invent a
   metric, tool, technology, employer, date, title, or outcome. If a bullet
   needs a number the input does not have, put the literal placeholder
   "[QUANTIFY: <suggested metric type>]" in that edit's text. Do not invent
   a number, and do not only mention the missing number in `reply`. Named
   work stays named: if the page says Sam Bot and Medicaid waiver lookup,
   keep Sam Bot and Medicaid. Do not genericize to "an AI assistant".
2. Shape comes from the job description. When the user pastes a posting or
   names a target role, reuse that wording when it truthfully describes
   their real experience (e.g. use "CI/CD pipelines" not "automation" if
   the resume supports it). Lead with the work that matches the posting.
   Demote or skip unrelated detail when they asked to tailor. Do not
   calibrate tone to inferred seniority. The posting sets the language;
   the resume only supplies facts.
3. ATS bullet craft: one line when possible, two at most, roughly 12-28
   words. Start with a strong past-tense verb (Built, Shipped, Cut,
   Automated). Never "Responsible for", "Helped with", "Worked on", or
   "Passionate about". No first person, no filler adjectives, no stacked
   buzzwords. Hard skills and tools appear in the line only if they already
   exist in the resume or the user's message.
4. When the user asks about skills, regroup the existing skills line(s)
   into categories (Languages, Frameworks, Cloud/Infra, Methodologies).
   Put job-description matches first in each category. Do not invent
   skills. If the resume has no skills lines, do not create a skills
   section.
5. When asked to tailor or reorder projects, keep or drop existing project
   lines by relevance to the job description. Quantify only when the
   resume already supports it. If there are no project lines, do not
   create a projects section.
6. Edit text must be ATS-safe plain text: no tables, columns, icons,
   emojis, or decorative symbols. Allowed exceptions: the original bullet
   character so a new line matches its section; ** only where the source
   line already had bold (a job title or "Languages:" label); and the
   literal "[QUANTIFY: ...]" / "[VERIFY: ...]" placeholders.
7. If input is ambiguous, inconsistent, or contradictory, insert
   "[VERIFY: <what needs checking>]" in the edit, or mention it in `reply`
   if no edit applies. Do not guess or silently resolve it.
8. Only change lines the user asked about. Do not add sections, headers,
   or content that were not requested. Leave section headers (SUMMARY,
   EXPERIENCE, ...) and divider lines (---) alone. If the resume has no
   experience / skills / projects lines, do not create those sections.

Reply behavior:
- `reply` is a short conversational message, 2-4 sentences, no markdown
  headings or bullet lists.
- If a fetched job posting is present in this turn, treat it as the pasted
  job description. Do not say you cannot open links.
- If the user included a URL and a fetch-failed note is present, say the
  page could not be read and ask them to paste the title, responsibilities,
  and required skills. Do not invent requirements from the URL or company.
- If the user pasted a job description, name which posting terms the
  resume already supports and which are still missing. Do not invent
  coverage for terms the resume does not support.
- If the user did not paste a job description and none was fetched, still
  write clean ATS bullets from the resume, and ask them in `reply` to paste
  the posting or a posting URL for a targeted rewrite.
- If the resume text is empty, return no edits and one explanatory
  `reply`.
- If the user only asked a question, return an empty edits list and
  answer in `reply`.

`edits` are the concrete changes: op "replace" rewrites an existing line,
op "insert_after" adds a new line below an existing one. When adding a
line, open it with the same bullet character the neighbouring lines use.
Propose at most 12 edits per turn, and make the smallest change that
does the job.
"""

USER_INSTRUCTIONS_PREAMBLE = """\
Additional instructions from the user. Apply them to tone, length, and \
emphasis when they do not conflict with the writing rules above. If they \
conflict — including requests to invent experience, ignore a pasted job \
description, or add tools that are not on the resume — keep the writing rules.
"""

FETCHED_POSTING_PREAMBLE = """\
A job posting was fetched from the URL below. Treat it as the pasted job \
description. Do not say you cannot open links. Tailor using this posting. \
Facts still come only from the resume plus this posting text.
"""

FETCH_FAILED_NOTE = """\
The user included a job posting URL, but it could not be read (JavaScript-only \
page, blocked, or not a public posting). Do not invent requirements from the \
URL or company name. In `reply`, say the page could not be read and ask them \
to paste the title, responsibilities, and required skills.
"""

EXTRACT_POSTING_PROMPT = """\
Extract the job posting from this page text. Do not invent requirements, \
skills, or duties that are not present. If the text is navigation chrome \
without a real posting, leave every field empty.
"""


class JobPostingFacts(BaseModel):
    title: str = ""
    company: str = ""
    requirements: list[str] = []
    responsibilities: list[str] = []
    keywords: list[str] = []


def extract_posting(raw: str) -> str:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        return ""
    body = (raw or "").strip()[:8000]
    if not body:
        return ""
    client = OpenAI(api_key=api_key)
    try:
        completion = client.beta.chat.completions.parse(
            model=os.environ.get("OPENAI_MODEL") or DEFAULT_MODEL,
            messages=[
                {"role": "system", "content": EXTRACT_POSTING_PROMPT},
                {"role": "user", "content": body},
            ],
            response_format=JobPostingFacts,
        )
    except OpenAIError:
        return ""
    facts = completion.choices[0].message.parsed
    if facts is None:
        return ""
    if not facts.title.strip() and not facts.responsibilities and not facts.requirements:
        return ""
    lines: list[str] = []
    if facts.title.strip():
        lines.append(f"Title: {facts.title.strip()}")
    if facts.company.strip():
        lines.append(f"Company: {facts.company.strip()}")
    if facts.responsibilities:
        lines.append("Responsibilities:")
        lines.extend(f"- {item.strip()}" for item in facts.responsibilities if item.strip())
    if facts.requirements:
        lines.append("Requirements:")
        lines.extend(f"- {item.strip()}" for item in facts.requirements if item.strip())
    if facts.keywords:
        lines.append("Keywords: " + ", ".join(k.strip() for k in facts.keywords if k.strip()))
    return "\n".join(lines).strip()


def _bold_marked(runs: list[dict]) -> str:
    """Render runs as text, wrapping bold stretches in ** - the same
    notation the model is asked to use when it writes a line back."""
    parts: list[tuple[bool, str]] = []
    for run in runs:
        text = run.get("text", "")
        if not text:
            continue
        bold = bool(run.get("bold")) and bool(text.strip())
        if parts and bold == parts[-1][0]:
            parts[-1] = (bold, parts[-1][1] + text)
        else:
            parts.append((bold, text))
    out = []
    for bold, text in parts:
        if not bold:
            out.append(text)
            continue
        # Keep padding outside the markers: "**Languages:** JS", not "**Languages: **JS".
        core = text.strip()
        lead = text[: len(text) - len(text.lstrip())]
        trail = text[len(text.rstrip()) :]
        out.append(f"{lead}**{core}**{trail}")
    return "".join(out)


def render_blocks(blocks: list[dict]) -> str:
    lines = []
    for block in blocks:
        block_id = block.get("id") or "?"
        if block.get("type") == "divider":
            lines.append(f"[{block_id}] ---")
            continue
        lines.append(f"[{block_id}] {_bold_marked(block.get('runs') or [])}".rstrip())
    return "\n".join(lines)


def chat(
    blocks: list[dict],
    messages: list[dict],
    instructions: str = "",
    posting_text: str = "",
    posting_url: str = "",
    posting_failed: bool = False,
) -> ChatReply:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise AiError(
            "No OpenAI key found. Add OPENAI_API_KEY to backend/.env and restart the API."
        )

    client = OpenAI(api_key=api_key)
    conversation: list[dict] = [
        {"role": "system", "content": SYSTEM_PROMPT},
    ]
    extra = (instructions or "").strip()
    if extra:
        conversation.append(
            {
                "role": "system",
                "content": f"{USER_INSTRUCTIONS_PREAMBLE}\n{extra}",
            }
        )
    conversation.append(
        # Re-sent every turn: the user keeps editing, so last turn's copy is stale.
        {"role": "system", "content": f"Current resume:\n\n{render_blocks(blocks)}"}
    )
    fetched = (posting_text or "").strip()
    if fetched:
        source = posting_url.strip() or "the posting URL"
        conversation.append(
            {
                "role": "system",
                "content": (
                    f"{FETCHED_POSTING_PREAMBLE}\n\n"
                    f"Fetched job posting from {source}:\n\n{fetched}"
                ),
            }
        )
    elif posting_failed:
        conversation.append({"role": "system", "content": FETCH_FAILED_NOTE})
    conversation.extend(
        {"role": m["role"], "content": m["content"]} for m in messages
    )

    try:
        completion = client.beta.chat.completions.parse(
            model=os.environ.get("OPENAI_MODEL") or DEFAULT_MODEL,
            messages=conversation,
            response_format=ChatReply,
        )
    except OpenAIError as exc:
        raise AiError(f"The assistant could not be reached: {exc}") from exc

    parsed = completion.choices[0].message.parsed
    if parsed is None:
        raise AiError("The assistant returned an unreadable reply. Try again.")

    # An edit pointing at a block we don't have is unappliable, so drop it
    # here rather than showing the user a card that silently does nothing.
    known_ids = {block.get("id") for block in blocks}
    parsed.edits = [
        edit for edit in parsed.edits if edit.block_id in known_ids
    ][:MAX_EDITS]
    return parsed
