import type {
  ApplicationProfile,
  Block,
  ChatMessage,
  ChatReply,
  ProfileResponse,
  Resume,
  ResumeSummary,
} from "./types";
import type { Job, JobFilters } from "./jobs";
import type { ApplicationInput, TrackedApplication } from "./applications";
import { loginUrl } from "@/lib/auth";

const API = "/api";

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function errorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;
  const detail = (payload as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail[0] && typeof detail[0] === "object") {
    const first = detail[0] as { msg?: string };
    if (first.msg) return first.msg;
  }
  return fallback;
}

async function stackAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const { stackClientApp } = await import("@/stack-client");
  try {
    return await stackClientApp.getAccessToken();
  } catch {
    return null;
  }
}

export async function apiFetch(
  path: string,
  init: RequestInit & { authRedirect?: boolean } = {},
): Promise<Response> {
  const { authRedirect = false, headers, ...rest } = init;
  const token = await stackAccessToken();
  const merged = new Headers(headers);
  if (token) merged.set("x-stack-access-token", token);
  const res = await fetch(`${API}${path}`, {
    ...rest,
    headers: merged,
    credentials: "include",
  });
  if (res.status === 401 && authRedirect && typeof window !== "undefined") {
    const next = `${window.location.pathname}${window.location.search}`;
    window.location.assign(loginUrl(next));
  }
  return res;
}

async function readError(res: Response, fallback: string): Promise<string> {
  const payload = await res.json().catch(() => ({}));
  return errorMessage(payload, fallback);
}

export async function sendContact(input: {
  name: string;
  email: string;
  message: string;
}): Promise<void> {
  const res = await apiFetch("/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new ApiError(
      await readError(res, "Could not send this note."),
      res.status,
    );
  }
}

export async function uploadPdf(file: File): Promise<Resume> {
  const form = new FormData();
  form.append("file", file);

  const res = await apiFetch("/resumes", {
    method: "POST",
    body: form,
    authRedirect: true,
  });

  if (!res.ok) {
    throw new ApiError(await readError(res, "Upload failed."), res.status);
  }

  return res.json();
}

export async function getResume(id: string): Promise<Resume> {
  const res = await apiFetch(`/resumes/${id}`, { authRedirect: true });
  if (res.status === 404) {
    throw new ApiError("Resume not found.", 404);
  }
  if (!res.ok) {
    throw new ApiError(
      await readError(res, "Could not load resume."),
      res.status,
    );
  }
  return res.json();
}

export async function searchResumes(query: string): Promise<ResumeSummary[]> {
  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());
  const res = await apiFetch(`/resumes?${params.toString()}`, {
    authRedirect: true,
  });
  if (!res.ok) {
    throw new ApiError(
      await readError(res, "Could not search saved resumes."),
      res.status,
    );
  }
  return res.json();
}

export async function deleteResume(id: string): Promise<void> {
  const res = await apiFetch(`/resumes/${id}`, {
    method: "DELETE",
    authRedirect: true,
  });
  if (!res.ok) {
    throw new ApiError(await readError(res, "Delete failed."), res.status);
  }
}

export async function saveResume(
  id: string,
  blocks: Block[],
  note?: string,
): Promise<Resume> {
  const res = await apiFetch(`/resumes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(note === undefined ? { blocks } : { blocks, note }),
    authRedirect: true,
  });
  if (!res.ok) {
    throw new ApiError(await readError(res, "Save failed."), res.status);
  }
  return res.json();
}

/** Copy the current editor content into a new resume, so a download never
 *  overwrites the one being edited. The note is how it is found later. */
export async function snapshotResume(
  id: string,
  blocks: Block[],
  note: string,
): Promise<Resume> {
  const res = await apiFetch(`/resumes/${id}/snapshot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ blocks, note }),
    authRedirect: true,
  });
  if (!res.ok) {
    throw new ApiError(
      await readError(res, "Could not save this download."),
      res.status,
    );
  }
  return res.json();
}

/** Blocks are sent from the editor, not read from disk, so the assistant
 *  sees unsaved edits too. */
export async function chatWithResume(
  id: string,
  blocks: Block[],
  messages: ChatMessage[],
): Promise<ChatReply> {
  const res = await apiFetch(`/resumes/${id}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ blocks, messages }),
    authRedirect: true,
  });
  if (!res.ok) {
    throw new ApiError(
      await readError(res, "The assistant is unavailable."),
      res.status,
    );
  }
  return res.json();
}

export type AssistantInstructions = {
  instructions: string;
};

export async function getAssistantInstructions(): Promise<AssistantInstructions> {
  const res = await apiFetch("/assistant/instructions", { authRedirect: true });
  if (!res.ok) {
    throw new ApiError(
      await readError(res, "Could not load assistant rules."),
      res.status,
    );
  }
  return res.json();
}

export async function saveAssistantInstructions(
  instructions: string,
): Promise<AssistantInstructions> {
  const res = await apiFetch("/assistant/instructions", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ instructions }),
    authRedirect: true,
  });
  if (!res.ok) {
    throw new ApiError(
      await readError(res, "Could not save assistant rules."),
      res.status,
    );
  }
  return res.json();
}

export type SweepStatus = {
  status: "idle" | "running" | "failed" | string;
  started_at: string | null;
  finished_at: string | null;
  duration_s: number | null;
  job_count: number;
  next_run_at: string | null;
  counts?: Record<string, number>;
  errors?: string[];
};

export type JobsResponse = {
  jobs: Job[];
  total: number;
  source: "live" | "partial" | "empty" | "snapshot";
  errors: string[];
  updated_at: string | null;
  sweep: SweepStatus;
};

export async function fetchJobs(
  filters: JobFilters,
  options: { limit?: number; offset?: number } = {},
): Promise<JobsResponse> {
  const params = new URLSearchParams();
  if (filters.title.trim()) params.set("title", filters.title.trim());
  if (filters.location.trim()) params.set("location", filters.location.trim());
  if (filters.company.trim()) params.set("company", filters.company.trim());
  if (filters.workplaces.length) {
    params.set("workplace", filters.workplaces.join(","));
  }
  if (filters.types.length) params.set("type", filters.types.join(","));
  if (filters.experience.length) {
    params.set("experience", filters.experience.join(","));
  }
  if (filters.posted) params.set("posted", filters.posted);
  if (filters.exclude.trim()) params.set("exclude", filters.exclude.trim());
  if (filters.sort && filters.sort !== "posted_desc") {
    params.set("sort", filters.sort);
  }
  params.set("limit", String(options.limit ?? 50));
  params.set("offset", String(options.offset ?? 0));
  const res = await apiFetch(`/jobs?${params.toString()}`);
  if (!res.ok) {
    throw new ApiError(
      await readError(res, "Could not load jobs."),
      res.status,
    );
  }
  return res.json();
}

export async function getProfile(): Promise<ProfileResponse> {
  const res = await apiFetch("/profile", { authRedirect: true });
  if (!res.ok) {
    throw new ApiError(
      await readError(res, "Could not load profile."),
      res.status,
    );
  }
  return res.json();
}

export async function saveProfile(
  profile: ApplicationProfile,
): Promise<ProfileResponse> {
  const res = await apiFetch("/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      first_name: profile.first_name,
      last_name: profile.last_name,
      email: profile.email,
      phone: profile.phone,
      city: profile.city,
      region: profile.region,
      country: profile.country,
      linkedin_url: profile.linkedin_url,
      github_url: profile.github_url,
      portfolio_url: profile.portfolio_url,
      current_title: profile.current_title,
      years_experience: profile.years_experience,
      work_authorized: profile.work_authorized,
      requires_sponsorship: profile.requires_sponsorship,
      willing_to_relocate: profile.willing_to_relocate,
      default_resume_id: profile.default_resume_id,
    }),
    authRedirect: true,
  });
  if (!res.ok) {
    throw new ApiError(
      await readError(res, "Could not save profile."),
      res.status,
    );
  }
  return res.json();
}

export async function fillProfileFromResume(
  resumeId?: string | null,
): Promise<ProfileResponse> {
  const res = await apiFetch("/profile/from-resume", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resume_id: resumeId || null }),
    authRedirect: true,
  });
  if (!res.ok) {
    throw new ApiError(
      await readError(res, "Could not fill profile from resume."),
      res.status,
    );
  }
  return res.json();
}

export async function fetchApplications(
  options: { authRedirect?: boolean } = {},
): Promise<TrackedApplication[]> {
  const res = await apiFetch("/applications", {
    authRedirect: options.authRedirect ?? true,
  });
  if (!res.ok) {
    throw new ApiError(
      await readError(res, "Could not load applications."),
      res.status,
    );
  }
  return res.json();
}

export async function createApplication(
  input: ApplicationInput,
): Promise<TrackedApplication> {
  const res = await apiFetch("/applications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    authRedirect: true,
  });
  if (!res.ok) {
    throw new ApiError(
      await readError(res, "Could not save this application."),
      res.status,
    );
  }
  return res.json();
}

export async function patchApplication(
  id: string,
  input: Partial<ApplicationInput>,
): Promise<TrackedApplication> {
  const res = await apiFetch(`/applications/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    authRedirect: true,
  });
  if (!res.ok) {
    throw new ApiError(
      await readError(res, "Could not update this application."),
      res.status,
    );
  }
  return res.json();
}

export async function deleteApplication(id: string): Promise<void> {
  const res = await apiFetch(`/applications/${id}`, {
    method: "DELETE",
    authRedirect: true,
  });
  if (!res.ok) {
    throw new ApiError(
      await readError(res, "Could not delete this application."),
      res.status,
    );
  }
}

export async function downloadPdf(id: string, filename: string): Promise<void> {
  const res = await apiFetch(`/resumes/${id}/download`, { authRedirect: true });
  if (!res.ok) {
    throw new ApiError(await readError(res, "Download failed."), res.status);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
