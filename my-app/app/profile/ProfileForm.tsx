"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { fillProfileFromResume, getProfile, saveProfile } from "@/lib/api";
import type {
  ApplicationProfile,
  ProfileFieldSource,
  ProfileResponse,
  ResumeSummary,
} from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const REQUIRED_FIELDS = [
  "first_name",
  "last_name",
  "email",
  "phone",
  "city",
  "country",
  "work_authorized",
  "requires_sponsorship",
] as const;

function isEmpty(value: ApplicationProfile[keyof ApplicationProfile]): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string" && !value.trim()) return true;
  return false;
}

function missingFrom(profile: ApplicationProfile): string[] {
  return REQUIRED_FIELDS.filter((key) => isEmpty(profile[key]));
}

const EMPTY_PROFILE: ApplicationProfile = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  city: "",
  region: "",
  country: "",
  linkedin_url: "",
  github_url: "",
  portfolio_url: "",
  current_title: "",
  years_experience: null,
  work_authorized: null,
  requires_sponsorship: null,
  willing_to_relocate: null,
  default_resume_id: null,
  source_resume_id: null,
  updated_at: "",
};

function triValue(value: boolean | null): string {
  if (value === true) return "yes";
  if (value === false) return "no";
  return "unset";
}

function parseTri(value: string | null | undefined): boolean | null {
  if (value === "yes") return true;
  if (value === "no") return false;
  return null;
}

function FieldLabel({
  htmlFor,
  field,
  sources,
  missing,
  children,
}: {
  htmlFor: string;
  field: string;
  sources: Partial<Record<string, ProfileFieldSource>>;
  missing: string[];
  children: ReactNode;
}) {
  const source = sources[field];
  const needed = missing.includes(field);
  return (
    <div className="flex items-center justify-between gap-2">
      <Label htmlFor={htmlFor}>{children}</Label>
      {needed ? (
        <Badge variant="outline">needed</Badge>
      ) : source === "resume" ? (
        <Badge variant="secondary">from resume</Badge>
      ) : source === "account" ? (
        <Badge variant="secondary">from account</Badge>
      ) : null}
    </div>
  );
}

export default function ProfileForm() {
  const [profile, setProfile] = useState<ApplicationProfile>(EMPTY_PROFILE);
  const [sources, setSources] = useState<
    Partial<Record<string, ProfileFieldSource>>
  >({});
  const [resumes, setResumes] = useState<ResumeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filling, setFilling] = useState(false);
  const [error, setError] = useState("");
  const missing = missingFrom(profile);

  function applyPayload(payload: ProfileResponse) {
    setProfile(payload.profile);
    setSources(payload.sources);
    setResumes(payload.resumes);
  }

  useEffect(() => {
    let cancelled = false;
    getProfile()
      .then((payload) => {
        if (!cancelled) {
          applyPayload(payload);
          setError("");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Could not load profile.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function setField<K extends keyof ApplicationProfile>(
    key: K,
    value: ApplicationProfile[K],
  ) {
    setProfile((current) => ({ ...current, [key]: value }));
    setSources((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      applyPayload(await saveProfile(profile));
      toast.success("Profile saved");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not save profile.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function onFill() {
    setFilling(true);
    try {
      applyPayload(await fillProfileFromResume(profile.default_resume_id));
      toast.success("Empty fields filled from resume");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not fill from resume.",
      );
    } finally {
      setFilling(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-5 pb-12">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  const filledRequired = REQUIRED_FIELDS.length - missing.length;

  return (
    <form
      onSubmit={onSave}
      className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-5 pb-12"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs tracking-wide text-muted-foreground uppercase">
            Application details
          </p>
          <h1 className="font-serif text-3xl tracking-tight">Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Prefill from a resume, then complete what the posting will ask.
          </p>
        </div>
        <Badge variant="secondary" className="h-7 px-3">
          {filledRequired} of {REQUIRED_FIELDS.length} required
        </Badge>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl tracking-tight">
            Contact
          </CardTitle>
          <CardDescription>
            Name, email, phone, and location used on applications.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <FieldLabel
              htmlFor="first_name"
              field="first_name"
              sources={sources}
              missing={missing}
            >
              First name
            </FieldLabel>
            <Input
              id="first_name"
              value={profile.first_name}
              onChange={(event) => setField("first_name", event.target.value)}
              autoComplete="given-name"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel
              htmlFor="last_name"
              field="last_name"
              sources={sources}
              missing={missing}
            >
              Last name
            </FieldLabel>
            <Input
              id="last_name"
              value={profile.last_name}
              onChange={(event) => setField("last_name", event.target.value)}
              autoComplete="family-name"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel
              htmlFor="email"
              field="email"
              sources={sources}
              missing={missing}
            >
              Email
            </FieldLabel>
            <Input
              id="email"
              type="email"
              value={profile.email}
              onChange={(event) => setField("email", event.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel
              htmlFor="phone"
              field="phone"
              sources={sources}
              missing={missing}
            >
              Phone
            </FieldLabel>
            <Input
              id="phone"
              type="tel"
              value={profile.phone}
              onChange={(event) => setField("phone", event.target.value)}
              autoComplete="tel"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel
              htmlFor="city"
              field="city"
              sources={sources}
              missing={missing}
            >
              City
            </FieldLabel>
            <Input
              id="city"
              value={profile.city}
              onChange={(event) => setField("city", event.target.value)}
              autoComplete="address-level2"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel
              htmlFor="region"
              field="region"
              sources={sources}
              missing={missing}
            >
              State / region
            </FieldLabel>
            <Input
              id="region"
              value={profile.region}
              onChange={(event) => setField("region", event.target.value)}
              autoComplete="address-level1"
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <FieldLabel
              htmlFor="country"
              field="country"
              sources={sources}
              missing={missing}
            >
              Country
            </FieldLabel>
            <Input
              id="country"
              value={profile.country}
              onChange={(event) => setField("country", event.target.value)}
              autoComplete="country-name"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl tracking-tight">
            Links
          </CardTitle>
          <CardDescription>
            Optional, when a posting asks for them.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <FieldLabel
              htmlFor="linkedin_url"
              field="linkedin_url"
              sources={sources}
              missing={missing}
            >
              LinkedIn
            </FieldLabel>
            <Input
              id="linkedin_url"
              value={profile.linkedin_url}
              onChange={(event) => setField("linkedin_url", event.target.value)}
              placeholder="https://linkedin.com/in/…"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel
              htmlFor="github_url"
              field="github_url"
              sources={sources}
              missing={missing}
            >
              GitHub
            </FieldLabel>
            <Input
              id="github_url"
              value={profile.github_url}
              onChange={(event) => setField("github_url", event.target.value)}
              placeholder="https://github.com/…"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel
              htmlFor="portfolio_url"
              field="portfolio_url"
              sources={sources}
              missing={missing}
            >
              Portfolio
            </FieldLabel>
            <Input
              id="portfolio_url"
              value={profile.portfolio_url}
              onChange={(event) =>
                setField("portfolio_url", event.target.value)
              }
              placeholder="https://"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl tracking-tight">
            Work eligibility
          </CardTitle>
          <CardDescription>
            These are not on a resume. Fill them once for later applications.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <FieldLabel
              htmlFor="current_title"
              field="current_title"
              sources={sources}
              missing={missing}
            >
              Current title
            </FieldLabel>
            <Input
              id="current_title"
              value={profile.current_title}
              onChange={(event) =>
                setField("current_title", event.target.value)
              }
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel
              htmlFor="years_experience"
              field="years_experience"
              sources={sources}
              missing={missing}
            >
              Years of experience
            </FieldLabel>
            <Input
              id="years_experience"
              type="number"
              min={0}
              max={80}
              value={profile.years_experience ?? ""}
              onChange={(event) => {
                const raw = event.target.value;
                setField(
                  "years_experience",
                  raw === "" || !Number.isFinite(Number(raw))
                    ? null
                    : Number(raw),
                );
              }}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel
              htmlFor="work_authorized"
              field="work_authorized"
              sources={sources}
              missing={missing}
            >
              Authorized to work
            </FieldLabel>
            <Select
              value={triValue(profile.work_authorized)}
              onValueChange={(value) =>
                setField("work_authorized", parseTri(value))
              }
            >
              <SelectTrigger id="work_authorized" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unset">Not set</SelectItem>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel
              htmlFor="requires_sponsorship"
              field="requires_sponsorship"
              sources={sources}
              missing={missing}
            >
              Needs visa sponsorship
            </FieldLabel>
            <Select
              value={triValue(profile.requires_sponsorship)}
              onValueChange={(value) =>
                setField("requires_sponsorship", parseTri(value))
              }
            >
              <SelectTrigger id="requires_sponsorship" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unset">Not set</SelectItem>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <FieldLabel
              htmlFor="willing_to_relocate"
              field="willing_to_relocate"
              sources={sources}
              missing={missing}
            >
              Willing to relocate
            </FieldLabel>
            <Select
              value={triValue(profile.willing_to_relocate)}
              onValueChange={(value) =>
                setField("willing_to_relocate", parseTri(value))
              }
            >
              <SelectTrigger id="willing_to_relocate" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unset">Not set</SelectItem>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl tracking-tight">
            Default resume
          </CardTitle>
          <CardDescription>
            Empty contact fields can be filled from this file.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="default_resume_id">Resume</Label>
            <Select
              value={profile.default_resume_id ?? "none"}
              onValueChange={(value) =>
                setField(
                  "default_resume_id",
                  !value || value === "none" ? null : value,
                )
              }
            >
              <SelectTrigger id="default_resume_id" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No default</SelectItem>
                {resumes.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.note || item.source_file || "Untitled"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={filling || resumes.length === 0}
            onClick={() => void onFill()}
            className="self-start"
          >
            {filling ? "Filling…" : "Fill empty from resume"}
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save profile"}
        </Button>
      </div>
    </form>
  );
}
