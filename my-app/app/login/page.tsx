import { redirect } from "next/navigation";
import { loginUrl } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  redirect(loginUrl(next));
}
