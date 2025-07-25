import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function Page() {
  const resumes = await prisma.resume.findMany({
    orderBy: { createdAt: "desc" },
  });
  if (resumes.length > 0) {
    redirect(`/app/${resumes[0].id}`);
  }
  // Optionally, render a fallback UI if no resumes exist
  return null;
}
