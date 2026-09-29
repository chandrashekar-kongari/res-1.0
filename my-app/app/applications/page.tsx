"use client";

import { AppShell } from "@/components/app-shell";
import ApplicationsBoard from "./ApplicationsBoard";

export default function ApplicationsPage() {
  return (
    <AppShell active="applications" status="Roles you are tracking">
      <main className="min-h-0 flex-1 overflow-auto">
        <ApplicationsBoard />
      </main>
    </AppShell>
  );
}
