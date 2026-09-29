export const LOGIN_URL = "/handler/sign-in";
export const SIGNUP_URL = "/handler/sign-up";

export function safeNextPath(raw: string | null | undefined): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/resumes";
}

export function loginUrl(next?: string | null): string {
  const path = safeNextPath(next);
  if (path === "/resumes") return LOGIN_URL;
  return `${LOGIN_URL}?after_auth_return_to=${encodeURIComponent(path)}`;
}
