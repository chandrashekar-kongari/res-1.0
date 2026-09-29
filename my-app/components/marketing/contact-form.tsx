"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { sendContact } from "@/lib/api";
import { HoverLift } from "@/components/marketing/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const EMAIL_RE = /^[\w.+-]+@[\w.-]+\.\w+$/;

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const nextName = name.trim();
    const nextEmail = email.trim();
    const nextMessage = message.trim();
    if (!nextName || !nextMessage) {
      toast.error("Enter your name and a note.");
      return;
    }
    if (!EMAIL_RE.test(nextEmail)) {
      toast.error("Enter a valid email.");
      return;
    }
    setPending(true);
    try {
      await sendContact({
        name: nextName,
        email: nextEmail,
        message: nextMessage,
      });
      setName("");
      setEmail("");
      setMessage("");
      toast.success("Received. We'll write back.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not send this note.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="grid gap-5" onSubmit={onSubmit}>
      <div className="grid gap-2">
        <Label htmlFor="contact-name">Name</Label>
        <Input
          id="contact-name"
          value={name}
          maxLength={120}
          autoComplete="name"
          className="h-10 bg-[#fffaf3] ring-1 ring-[#d9cfc0]"
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="contact-email">Email</Label>
        <Input
          id="contact-email"
          type="email"
          value={email}
          maxLength={320}
          autoComplete="email"
          className="h-10 bg-[#fffaf3] ring-1 ring-[#d9cfc0]"
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="contact-message">Note</Label>
        <Textarea
          id="contact-message"
          value={message}
          maxLength={4000}
          rows={8}
          placeholder="What should we know?"
          className="bg-[#fffaf3] ring-1 ring-[#d9cfc0]"
          onChange={(event) => setMessage(event.target.value)}
        />
      </div>
      <HoverLift>
        <Button
          type="submit"
          disabled={pending}
          className="h-10 rounded-full bg-[#1c1917] px-5 text-[#f6f1e8] hover:bg-[#1c1917]/85"
        >
          {pending ? "Sending..." : "Send the note"}
        </Button>
      </HoverLift>
    </form>
  );
}
