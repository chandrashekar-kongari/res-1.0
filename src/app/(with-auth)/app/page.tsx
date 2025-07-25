import { prisma } from "@/lib/db";
import { serverTrpc } from "@/lib/trpc-server";
import { redirect } from "next/navigation";

export default async function Page() {
  const trpc = await serverTrpc();
  const resumes = await trpc.resume.getDefaultOrCreate();
  if (resumes) {
    redirect(`/app/${resumes.id}`);
  }
  // Optionally, render a fallback UI if no resumes exist
  return null;
}
