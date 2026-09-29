import type { ReactNode } from "react";
import { requireStackUser } from "@/lib/require-stack-user";

export default async function ResumesLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireStackUser();
  return children;
}
