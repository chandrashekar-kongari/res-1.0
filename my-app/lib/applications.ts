export type ApplicationStatus =
  | "NEEDTOAPPLY"
  | "APPLIED"
  | "FOLLOWUP"
  | "INTERVIEWING"
  | "OFFER"
  | "REJECTED";

export type TrackedApplication = {
  id: string;
  job_id: string | null;
  company: string;
  role: string;
  url: string;
  status: ApplicationStatus;
  applied_at: string;
};

export type ApplicationInput = {
  company: string;
  role: string;
  url: string;
  status?: ApplicationStatus;
  job_id?: string | null;
  applied_at?: string;
};

export const STATUS_COLUMNS: ApplicationStatus[] = [
  "NEEDTOAPPLY",
  "APPLIED",
  "FOLLOWUP",
  "INTERVIEWING",
  "OFFER",
  "REJECTED",
];

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  NEEDTOAPPLY: "Need to apply",
  APPLIED: "Applied",
  FOLLOWUP: "Follow up",
  INTERVIEWING: "Interviewing",
  OFFER: "Offer",
  REJECTED: "Rejected",
};

export const STATUS_STYLES: Record<ApplicationStatus, string> = {
  NEEDTOAPPLY: "bg-stone-100 text-stone-700",
  APPLIED: "bg-sky-100 text-sky-800",
  FOLLOWUP: "bg-amber-100 text-amber-800",
  INTERVIEWING: "bg-orange-100 text-orange-800",
  OFFER: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-red-100 text-red-800",
};

export const STATUS_ACCENT: Record<ApplicationStatus, string> = {
  NEEDTOAPPLY: "border-l-stone-400",
  APPLIED: "border-l-sky-500",
  FOLLOWUP: "border-l-amber-500",
  INTERVIEWING: "border-l-orange-500",
  OFFER: "border-l-emerald-500",
  REJECTED: "border-l-red-500",
};

export function isApplicationStatus(
  value: string,
): value is ApplicationStatus {
  return STATUS_COLUMNS.includes(value as ApplicationStatus);
}

export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function fromDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function tracksJob(
  rows: TrackedApplication[],
  job: { id?: string; url?: string },
): boolean {
  return rows.some(
    (row) =>
      (job.id && row.job_id === job.id) ||
      Boolean(job.url && row.url === job.url),
  );
}
