"use client";

import { type ReactNode, useState } from "react";
import Link from "next/link";
import { ChevronDownIcon, MoreVerticalIcon } from "lucide-react";
import { useUser } from "@stackframe/stack";
import { ResumeMenu } from "@/components/resume-menu";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LOGIN_URL, SIGNUP_URL } from "@/lib/auth";

const NAV_ITEMS = [
  { id: "resumes", href: "/resumes", label: "Resumes" },
  { id: "jobs", href: "/jobs", label: "Jobs" },
  { id: "applications", href: "/applications", label: "Applications" },
  { id: "profile", href: "/profile", label: "Profile" },
] as const;

export function AppShell({
  children,
  active,
  status,
  tools,
  actions,
  aside,
  fileName,
  currentId,
  menuDefaultOpen = false,
}: {
  children: ReactNode;
  active: "home" | "resumes" | "jobs" | "applications" | "profile";
  status?: ReactNode;
  tools?: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
  fileName?: string;
  currentId?: string;
  menuDefaultOpen?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(menuDefaultOpen);
  const user = useUser();
  const activeItem =
    NAV_ITEMS.find((item) => item.id === active) ?? NAV_ITEMS[0];

  return (
    <div className="app-frame">
      <div className="editor-shell flex min-h-full flex-col">
        <header className="no-print sticky top-0 z-20 border-b border-border/80 bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/80">
          <div className="flex flex-wrap items-center gap-2 px-3 py-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-pressed={menuOpen}
              onClick={() => setMenuOpen((value) => !value)}
            >
              <MoreVerticalIcon />
            </Button>
            <Link
              href="/"
              className="font-serif text-xl tracking-tight text-foreground"
            >
              Memic
            </Link>
            <nav aria-label="App">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<Button size="sm" variant="secondary" />}
                >
                  {activeItem.label}
                  <ChevronDownIcon />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {NAV_ITEMS.map((item) => (
                    <DropdownMenuItem
                      key={item.id}
                      render={<Link href={item.href} />}
                    >
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
            {tools}
            {status ? (
              <p className="min-w-16 text-xs text-muted-foreground">{status}</p>
            ) : null}
            <div className="ml-auto flex items-center gap-2">
              {user ? null : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    nativeButton={false}
                    render={<Link href={LOGIN_URL} />}
                  >
                    Log in
                  </Button>
                  <Button
                    size="sm"
                    nativeButton={false}
                    render={<Link href={SIGNUP_URL} />}
                  >
                    Sign up
                  </Button>
                </>
              )}
              {actions}
            </div>
          </div>
        </header>
        {children}
      </div>
      {aside}
      <ResumeMenu
        open={menuOpen}
        onOpenChange={setMenuOpen}
        fileName={fileName}
        currentId={currentId}
      />
    </div>
  );
}
