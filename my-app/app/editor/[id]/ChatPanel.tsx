"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { SettingsIcon } from "lucide-react";
import { toast } from "sonner";
import {
  chatWithResume,
  getAssistantInstructions,
  saveAssistantInstructions,
} from "../../../lib/api";
import type { Block, ChatMessage, ResumeEdit } from "../../../lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

function BoldMarked({ text }: { text: string }) {
  return (
    <>
      {text
        .split("**")
        .map((segment, index) =>
          index % 2 === 1 ? <strong key={index}>{segment}</strong> : segment,
        )}
    </>
  );
}

const STARTERS = [
  "Paste a job description or posting URL and tailor my bullets",
  "Tighten my experience bullets",
  "Which posting skills does this resume already support?",
];

const MAX_INSTRUCTIONS = 2000;

export default function ChatPanel({
  resumeId,
  getBlocks,
  getBlockText,
  onApplyEdit,
}: {
  resumeId: string;
  getBlocks: () => Block[];
  getBlockText: (blockId: string) => string;
  onApplyEdit: (edit: ResumeEdit) => boolean;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState<{ key: number; edit: ResumeEdit }[]>(
    [],
  );
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [savedInstructions, setSavedInstructions] = useState("");
  const [draftInstructions, setDraftInstructions] = useState("");
  const [savingRules, setSavingRules] = useState(false);
  const nextKey = useRef(0);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages, pending, busy]);

  useEffect(() => {
    let cancelled = false;
    getAssistantInstructions()
      .then((payload) => {
        if (cancelled) return;
        setSavedInstructions(payload.instructions);
        setDraftInstructions(payload.instructions);
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(
            err instanceof Error
              ? err.message
              : "Could not load assistant rules.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;

    const history: ChatMessage[] = [
      ...messages,
      { role: "user", content: question },
    ];
    setMessages(history);
    setDraft("");
    setError("");
    setBusy(true);
    try {
      const reply = await chatWithResume(resumeId, getBlocks(), history);
      setMessages([...history, { role: "assistant", content: reply.reply }]);
      setPending((items) => [
        ...items,
        ...reply.edits.map((edit) => ({ key: nextKey.current++, edit })),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The assistant failed.");
    } finally {
      setBusy(false);
    }
  }

  function accept(key: number, edit: ResumeEdit) {
    if (!onApplyEdit(edit)) {
      setError("That line has changed too much to patch. Ask again.");
    }
    setPending((items) => items.filter((item) => item.key !== key));
  }

  async function persistInstructions(next: string) {
    setSavingRules(true);
    try {
      const payload = await saveAssistantInstructions(next);
      setSavedInstructions(payload.instructions);
      setDraftInstructions(payload.instructions);
      toast.success(
        payload.instructions
          ? "Rules saved for every resume."
          : "Rules cleared.",
      );
      setSettingsOpen(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not save assistant rules.",
      );
    } finally {
      setSavingRules(false);
    }
  }

  const rulesOn = Boolean(savedInstructions.trim());

  return (
    <aside className="no-print sticky top-0 flex h-screen w-[340px] shrink-0 flex-col border-l border-border bg-card">
      <div className="border-b px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <p className="font-serif text-base tracking-tight">
            Resume assistant
          </p>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Assistant settings"
            aria-pressed={settingsOpen}
            onClick={() => {
              setDraftInstructions(savedInstructions);
              setSettingsOpen(true);
            }}
          >
            <SettingsIcon />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Suggestions apply only when you accept them.
        </p>
        {rulesOn ? (
          <p className="mt-1 text-xs text-muted-foreground">Custom rules on.</p>
        ) : null}
      </div>

      <div ref={logRef} className="min-h-0 flex-1 overflow-y-auto p-3">
        <div className="flex flex-col gap-2.5">
          {messages.length === 0 && pending.length === 0 ? (
            <div className="flex flex-col gap-1.5">
              {STARTERS.map((starter, index) => (
                <Button
                  key={starter}
                  type="button"
                  variant="outline"
                  className="h-auto shrink-0 animate-in fade-in slide-in-from-bottom-1 justify-start whitespace-normal py-2 text-left text-xs fill-mode-both"
                  style={{ animationDelay: `${index * 60}ms` }}
                  onClick={() => send(starter)}
                >
                  {starter}
                </Button>
              ))}
            </div>
          ) : null}

          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={cn(
                "max-w-[85%] shrink-0 animate-in fade-in slide-in-from-bottom-1 rounded-lg px-2.5 py-2 text-sm leading-relaxed whitespace-pre-wrap",
                message.role === "user"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "bg-muted",
              )}
            >
              {message.content}
            </div>
          ))}

          {pending.map(({ key, edit }) => (
            <Card
              key={key}
              size="sm"
              className="shrink-0 overflow-visible animate-in fade-in zoom-in-95"
            >
              <CardContent className="flex flex-col gap-2">
                <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  {edit.op === "insert_after" ? "Add a new line" : "Rewrite"}
                </p>
                {edit.op === "replace" ? (
                  <p className="text-xs text-muted-foreground line-through">
                    {getBlockText(edit.block_id)}
                  </p>
                ) : null}
                <p className="text-sm leading-relaxed">
                  <BoldMarked text={edit.text} />
                </p>
                <div className="flex justify-end gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPending((items) =>
                        items.filter((item) => item.key !== key),
                      )
                    }
                  >
                    Reject
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => accept(key, edit)}
                  >
                    Accept
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {busy ? (
            <p className="shrink-0 text-xs text-muted-foreground">Thinking…</p>
          ) : null}
          {error ? (
            <p className="shrink-0 text-xs text-destructive">{error}</p>
          ) : null}
        </div>
      </div>

      <form
        className="flex items-end gap-2 border-t p-3"
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          send(draft);
        }}
      >
        <Textarea
          value={draft}
          rows={2}
          placeholder="Paste a job description, a posting URL, or ask for a rewrite…"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              send(draft);
            }
          }}
        />
        <Button type="submit" disabled={busy || !draft.trim()}>
          Send
        </Button>
      </form>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <form
            className="grid gap-4"
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              void persistInstructions(draftInstructions);
            }}
          >
            <DialogHeader>
              <DialogTitle>Assistant rules</DialogTitle>
              <DialogDescription>
                These rules apply to every resume. Paste a job description or a
                posting URL in the chat when you want a posting-specific
                rewrite.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2">
              <Label htmlFor="assistant-instructions">
                Standing preferences
              </Label>
              <Textarea
                id="assistant-instructions"
                value={draftInstructions}
                maxLength={MAX_INSTRUCTIONS}
                rows={8}
                placeholder="Keep bullets under 20 words. Never mention GPA."
                onChange={(event) => setDraftInstructions(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {draftInstructions.length} / {MAX_INSTRUCTIONS}
              </p>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={savingRules}
                onClick={() => void persistInstructions("")}
              >
                Clear
              </Button>
              <Button type="submit" disabled={savingRules}>
                {savingRules ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
