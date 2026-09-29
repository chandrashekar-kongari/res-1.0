import { redirect } from "next/navigation";
import { SIGNUP_URL, safeNextPath } from "@/lib/auth";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const path = safeNextPath(next);
  if (path === "/resumes") {
    redirect(SIGNUP_URL);
  }
  redirect(`${SIGNUP_URL}?after_auth_return_to=${encodeURIComponent(path)}`);
}
