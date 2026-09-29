"use client";

import { AppShell } from "@/components/app-shell";
import ProfileForm from "./ProfileForm";

export default function ProfilePage() {
  return (
    <AppShell active="profile" status="Details used when you apply">
      <main className="min-h-0 flex-1 overflow-auto">
        <ProfileForm />
      </main>
    </AppShell>
  );
}
