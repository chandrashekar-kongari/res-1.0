"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { SearchIcon } from "lucide-react";
import { toast } from "sonner";
import {
  createApplication,
  deleteApplication,
  fetchApplications,
  patchApplication,
} from "@/lib/api";
import {
  fromDateKey,
  STATUS_ACCENT,
  STATUS_COLUMNS,
  STATUS_LABELS,
  STATUS_STYLES,
  toDateKey,
  type ApplicationStatus,
  type TrackedApplication,
} from "@/lib/applications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const MAX_RESULTS = 8;

export default function ApplicationsBoard() {
  const [rows, setRows] = useState<TrackedApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selected, setSelected] = useState<TrackedApplication | null>(null);
  const dragging = useRef(false);

  useEffect(() => {
    let cancelled = false;
    fetchApplications()
      .then((payload) => {
        if (!cancelled) setRows(payload);
      })
      .catch((error) => {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "Could not load applications.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(() => {
    if (!selectedDate) return rows;
    return rows.filter((row) => toDateKey(new Date(row.applied_at)) === selectedDate);
  }, [rows, selectedDate]);

  function upsert(row: TrackedApplication) {
    setRows((current) => {
      const next = current.filter((item) => item.id !== row.id);
      next.push(row);
      next.sort(
        (a, b) =>
          Date.parse(b.applied_at || "") - Date.parse(a.applied_at || ""),
      );
      return next;
    });
    setSelected((current) => (current?.id === row.id ? row : current));
  }

  async function handleDrop(status: ApplicationStatus, jobId: string) {
    const current = rows.find((row) => row.id === jobId);
    if (!current || current.status === status) return;
    setPending(true);
    try {
      const updated = await patchApplication(jobId, { status });
      upsert(updated);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not move this role.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-2xl tracking-tight">Applications</h1>
        <AddApplicationDialog
          onSaved={(row) => {
            upsert(row);
            toast.success("Saved to your board.");
          }}
        />
        <SearchApplications
          rows={rows}
          onSelect={(row) => setSelected(row)}
        />
      </div>

      {loading ? (
        <div className="flex gap-3">
          {STATUS_COLUMNS.map((status) => (
            <Skeleton key={status} className="h-64 min-w-40 flex-1" />
          ))}
        </div>
      ) : (
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "flex min-w-0 flex-1 gap-2 overflow-x-auto pb-2",
              pending && "opacity-60",
            )}
          >
            {STATUS_COLUMNS.map((status) => {
              const column = visible.filter((row) => row.status === status);
              return (
                <div
                  key={status}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const jobId = event.dataTransfer.getData("text/plain");
                    if (jobId) void handleDrop(status, jobId);
                  }}
                  className="flex min-h-64 w-44 shrink-0 flex-col rounded-xl border border-dashed border-border p-3"
                >
                  <h2
                    className={cn(
                      "mb-3 inline-flex w-fit items-center gap-1.5 self-start rounded-full px-2.5 py-1 text-xs font-medium",
                      STATUS_STYLES[status],
                    )}
                  >
                    {STATUS_LABELS[status]}
                    <span className="opacity-70">({column.length})</span>
                  </h2>
                  <div className="flex flex-col gap-2">
                    {column.map((row) => (
                      <div
                        key={row.id}
                        draggable
                        onDragStart={(event: DragEvent<HTMLDivElement>) => {
                          dragging.current = true;
                          event.dataTransfer.setData("text/plain", row.id);
                        }}
                        onDragEnd={() => {
                          window.setTimeout(() => {
                            dragging.current = false;
                          }, 0);
                        }}
                        onClick={() => {
                          if (!dragging.current) setSelected(row);
                        }}
                        className="cursor-grab active:cursor-grabbing"
                      >
                        <ApplicationCard row={row} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <aside className="w-56 shrink-0 space-y-3">
            <Label htmlFor="applied-filter">Applied on</Label>
            <Input
              id="applied-filter"
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setSelectedDate("")}
            >
              All dates
            </Button>
            <p className="text-xs text-muted-foreground">
              {visible.length} of {rows.length} on the board
            </p>
          </aside>
        </div>
      )}

      <ApplicationDetailsDialog
        row={selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        onSaved={(row) => {
          upsert(row);
          toast.success("Application updated.");
        }}
        onDeleted={(id) => {
          setRows((current) => current.filter((item) => item.id !== id));
          setSelected(null);
          toast.success("Removed from your board.");
        }}
      />
    </div>
  );
}

function ApplicationCard({ row }: { row: TrackedApplication }) {
  return (
    <Card
      size="sm"
      className={cn(
        "border-l-4 py-2 shadow-sm transition-all hover:-translate-y-px hover:shadow-md",
        STATUS_ACCENT[row.status],
      )}
    >
      <CardContent className="space-y-0.5">
        <p className="truncate text-sm font-medium">{row.company}</p>
        <p className="truncate text-xs text-muted-foreground">{row.role}</p>
      </CardContent>
    </Card>
  );
}

function SearchApplications({
  rows,
  onSelect,
}: {
  rows: TrackedApplication[];
  onSelect: (row: TrackedApplication) => void;
}) {
  const [query, setQuery] = useState("");
  const trimmed = query.trim();
  const matches = useMemo(() => {
    const q = trimmed.toLowerCase();
    if (!q) return [];
    return rows
      .filter(
        (row) =>
          row.company.toLowerCase().includes(q) ||
          row.role.toLowerCase().includes(q),
      )
      .slice(0, MAX_RESULTS);
  }, [rows, trimmed]);

  return (
    <div className="relative ml-auto w-full max-w-sm">
      <div className="relative z-50">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by company or role..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setQuery("");
          }}
          className="pl-8"
        />
      </div>
      {trimmed ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setQuery("")}
          />
          <div className="absolute inset-x-0 top-full z-50 mt-2 max-h-80 space-y-1 overflow-y-auto rounded-xl border bg-popover p-2 text-sm shadow-lg ring-1 ring-foreground/10">
            {matches.length === 0 ? (
              <p className="py-6 text-center text-muted-foreground">
                No applications match “{trimmed}”.
              </p>
            ) : (
              matches.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => {
                    onSelect(row);
                    setQuery("");
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {row.company}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {row.role}
                    </span>
                  </span>
                  <Badge className={STATUS_STYLES[row.status]}>
                    {STATUS_LABELS[row.status]}
                  </Badge>
                </button>
              ))
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

function AddApplicationDialog({
  onSaved,
}: {
  onSaved: (row: TrackedApplication) => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = fieldsFromForm(event.currentTarget);
    setSaving(true);
    try {
      const row = await createApplication(payload);
      onSaved(row);
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save this application.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>Add</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add application</DialogTitle>
            <DialogDescription>
              Track a posting that is not in the job list.
            </DialogDescription>
          </DialogHeader>
          <ApplicationFields />
          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ApplicationDetailsDialog({
  row,
  onOpenChange,
  onSaved,
  onDeleted,
}: {
  row: TrackedApplication | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (row: TrackedApplication) => void;
  onDeleted: (id: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!row) return;
    const payload = fieldsFromForm(event.currentTarget);
    setSaving(true);
    try {
      const updated = await patchApplication(row.id, payload);
      onSaved(updated);
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update this application.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!row) return;
    setDeleting(true);
    try {
      await deleteApplication(row.id);
      onDeleted(row.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete this application.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={row !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {row ? (
          <form key={row.id} className="grid gap-4" onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{row.role}</DialogTitle>
              <DialogDescription>{row.company}</DialogDescription>
            </DialogHeader>
            <ApplicationFields defaults={row} />
            <DialogFooter className="sm:justify-between">
              <Button
                type="button"
                variant="destructive"
                disabled={deleting || saving}
                onClick={() => void handleDelete()}
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
              <Button type="submit" disabled={saving || deleting}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ApplicationFields({
  defaults,
}: {
  defaults?: TrackedApplication;
}) {
  return (
    <div className="space-y-3">
      <Field label="Company" htmlFor="company">
        <Input
          id="company"
          name="company"
          required
          defaultValue={defaults?.company}
        />
      </Field>
      <Field label="Role" htmlFor="role">
        <Input id="role" name="role" required defaultValue={defaults?.role} />
      </Field>
      <Field label="Job posting URL" htmlFor="url">
        <Input
          id="url"
          name="url"
          type="url"
          required
          defaultValue={defaults?.url}
        />
      </Field>
      <Field label="Status" htmlFor="status">
        <select
          id="status"
          name="status"
          defaultValue={defaults?.status ?? "NEEDTOAPPLY"}
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        >
          {STATUS_COLUMNS.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Applied on" htmlFor="appliedAt">
        <Input
          id="appliedAt"
          name="appliedAt"
          type="date"
          required
          defaultValue={toDateKey(
            defaults?.applied_at ? new Date(defaults.applied_at) : new Date(),
          )}
        />
      </Field>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function fieldsFromForm(form: HTMLFormElement) {
  const data = new FormData(form);
  return {
    company: String(data.get("company") || ""),
    role: String(data.get("role") || ""),
    url: String(data.get("url") || ""),
    status: String(data.get("status") || "NEEDTOAPPLY") as ApplicationStatus,
    applied_at: fromDateKey(String(data.get("appliedAt") || toDateKey(new Date()))).toISOString(),
  };
}
