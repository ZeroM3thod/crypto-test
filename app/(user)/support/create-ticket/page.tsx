// app/(user)/support/create-ticket/page.tsx
"use client";

import { useState } from "react";
import { UserShell } from "@/app/(user)/_components/user-shell";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, CircleAlert, SendHorizonal } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────

type Priority = "low" | "medium" | "high" | "urgent";

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

// ── Page ─────────────────────────────────────────────────────────────────

export default function CreateTicketPage() {
  const [fCategory, setFCategory] = useState("");
  const [catErr, setCatErr] = useState(false);
  const [fSubject, setFSubject] = useState("");
  const [subErr, setSubErr] = useState(false);
  const [fPriority, setFPriority] = useState<Priority>("low");
  const [fMessage, setFMessage] = useState("");
  const [msgErr, setMsgErr] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [newTicketId, setNewTicketId] = useState("");

  const resetForm = () => {
    setFCategory(""); setCatErr(false);
    setFSubject(""); setSubErr(false);
    setFPriority("low");
    setFMessage(""); setMsgErr(false);
    setFormSuccess(false); setNewTicketId("");
  };

  const submitForm = async () => {
    let hasErr = false;
    if (!fCategory) { setCatErr(true); hasErr = true; }
    if (!fSubject.trim()) { setSubErr(true); hasErr = true; }
    if (fMessage.trim().length < 20) { setMsgErr(true); hasErr = true; }
    if (hasErr) return;

    setSubmitting(true);

    try {
      const res = await fetch('/api/support/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: fCategory,
          priority: fPriority,
          subject: fSubject,
          message: fMessage
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.error || 'Failed to create ticket');
        setSubmitting(false);
        return;
      }

      setNewTicketId(data.ticketId);
      setFormSuccess(true);
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to submit ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <UserShell active="Create Ticket">
      <div className="overflow-y-auto px-5 py-6 sm:px-7 sm:py-8">
        <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[280px_1fr]">

          {/* ── Left rail ─────────────────────────────── */}
          <div className="space-y-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Help Center
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">New Ticket</h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Tell us what&apos;s going on and our team will follow up by message here.
              </p>
            </div>

            <div className="hidden border-t border-border pt-6 lg:block">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Before you submit
              </p>
              <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-foreground" />
                  Pick the category that fits best — it helps route your ticket faster.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-foreground" />
                  Include exact dates, amounts, or error messages where relevant.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-foreground" />
                  You&apos;ll get a ticket ID to track progress under My Tickets.
                </li>
              </ul>
            </div>
          </div>

          {/* ── Form ──────────────────────────────────── */}
          <Card>
            {!formSuccess ? (
              <>
                <CardHeader>
                  <CardTitle>Ticket details</CardTitle>
                  <CardDescription>Fields marked with * are required.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Category *</Label>
                      <Select
                        value={fCategory}
                        onValueChange={(v) => { setFCategory(v); setCatErr(false); }}
                      >
                        <SelectTrigger aria-invalid={catErr}>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Billing">Billing Issue</SelectItem>
                          <SelectItem value="Investment">Investment / Plan</SelectItem>
                          <SelectItem value="Referral">Referral &amp; Commission</SelectItem>
                          <SelectItem value="Account">Account &amp; Security</SelectItem>
                          <SelectItem value="Technical">Technical Problem</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {catErr && (
                        <p className="flex items-center gap-1 text-xs text-destructive">
                          <CircleAlert className="size-3.5" /> Please select a category.
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <RadioGroup
                        value={fPriority}
                        onValueChange={(v) => setFPriority(v as Priority)}
                        className="flex h-10 items-center gap-4"
                      >
                        {PRIORITIES.map((p) => (
                          <label key={p.value} className="flex cursor-pointer items-center gap-1.5 text-sm text-foreground/70">
                            <RadioGroupItem value={p.value} />
                            {p.label}
                          </label>
                        ))}
                      </RadioGroup>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Subject *</Label>
                    <Input
                      value={fSubject}
                      maxLength={120}
                      onChange={(e) => { setFSubject(e.target.value); setSubErr(false); }}
                      placeholder="Brief description of the issue"
                      aria-invalid={subErr}
                    />
                    {subErr && (
                      <p className="flex items-center gap-1 text-xs text-destructive">
                        <CircleAlert className="size-3.5" /> Subject is required.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Message *</Label>
                    <Textarea
                      value={fMessage}
                      maxLength={2000}
                      onChange={(e) => { setFMessage(e.target.value); setMsgErr(false); }}
                      placeholder="Describe your issue in detail — what happened, when, and what you expected instead."
                      aria-invalid={msgErr}
                    />
                    <div className="flex items-center justify-between">
                      {msgErr ? (
                        <p className="flex items-center gap-1 text-xs text-destructive">
                          <CircleAlert className="size-3.5" /> Minimum 20 characters required.
                        </p>
                      ) : <span />}
                      <p className="text-[11px] text-muted-foreground">{fMessage.length} / 2000</p>
                    </div>
                  </div>
                </CardContent>
                <div className="flex items-center justify-end gap-3 border-t border-border p-5">
                  <Button variant="ghost" onClick={resetForm} type="button">
                    Clear
                  </Button>
                  <Button onClick={submitForm} disabled={submitting} type="button">
                    <SendHorizonal />
                    {submitting ? "Sending…" : "Submit Ticket"}
                  </Button>
                </div>
              </>
            ) : (
              <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
                <div className="grid size-14 place-items-center rounded-full border border-foreground">
                  <CheckCircle2 className="size-7" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Ticket submitted</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Our team will get back to you shortly.
                  </p>
                </div>
                <p className="rounded-md border border-border px-4 py-1.5 font-mono text-sm tracking-wide">
                  {newTicketId}
                </p>
                <div className="mt-2 flex gap-2">
                  <Button variant="outline" asChild>
                    <a href="/support/my-tickets">View My Tickets</a>
                  </Button>
                  <Button variant="ghost" onClick={resetForm}>
                    Create Another
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        <div className="h-10" />
      </div>
    </UserShell>
  );
}
