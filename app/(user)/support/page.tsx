// app/(user)/support/page.tsx
"use client";

import { UserShell } from "@/app/(user)/_components/user-shell";
import {
  BadgeCheck,
  ChevronDown,
  History,
  LifeBuoy,
  Mail,
  MessageCircle,
  Search,
  Send,
  Ticket as TicketIcon,
  X,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";

// ── Types ────────────────────────────────────────────────────────────────

interface TicketMessage {
  id: string;
  message: string;
  created_at: string;
  sender: { first_name: string; last_name: string; role: "user" | "admin" };
}

interface Ticket {
  id: string;
  ticket_id: string;
  subject: string;
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  created_at: string;
  status: "open" | "pending" | "closed" | "resolved";
  messages: TicketMessage[];
}

// ── Mock data ────────────────────────────────────────────────────────────

const FAQS = [
  { cat: "account", q: "How do I update my profile information?", a: "Go to Settings → Account and edit your name, email, or contact details. Changes to your email require a confirmation link." },
  { cat: "account", q: "How do I reset my password?", a: "Click Forgot Password on the login screen, or go to Settings → Security while logged in to set a new password directly." },
  { cat: "billing", q: "Where can I see my invoices?", a: "All invoices are available under Billing → History. You can download each as a PDF or resend it to your billing email." },
  { cat: "billing", q: "How do I update my payment method?", a: "Navigate to Billing → Payment Methods to add a new card or change your default payment option. Changes apply to your next billing cycle." },
  { cat: "investment", q: "How do I track my investment returns?", a: "Open Investment → Overview to see your active plans, daily profit, and total returns in real time." },
  { cat: "investment", q: "Can I withdraw before an investment matures?", a: "Investments are locked for their full duration. You can withdraw your available balance (past returns) at any time from Wallet → Main Wallet." },
  { cat: "referral", q: "How does the referral program work?", a: "Earn commission on every investment made by users you refer. Track earnings under Referral → Dashboard." },
  { cat: "security", q: "How do I enable two-factor authentication (2FA)?", a: "Go to Settings → Security and click Enable 2FA. Scan the QR code with an authenticator app and confirm with the 6-digit code." },
  { cat: "security", q: "What if I suspect unauthorised access?", a: "Immediately change your password, review Login History under your profile, and contact support so we can review your account activity." },
];

const CAT_LABELS: Record<string, string> = {
  account: "Account",
  billing: "Billing",
  investment: "Investment",
  referral: "Referral",
  security: "Security",
};

const MOCK_TICKETS: Ticket[] = [
  {
    id: "t1",
    ticket_id: "TCK-10231",
    subject: "Unable to update billing address",
    category: "Billing",
    priority: "medium",
    created_at: "2026-09-20T10:12:00Z",
    status: "open",
    messages: [
      { id: "m1", message: "Hi, I tried updating my billing address but it keeps failing.", created_at: "2026-09-20T10:12:00Z", sender: { first_name: "You", last_name: "", role: "user" } },
      { id: "m2", message: "Thanks for reaching out — could you tell us which browser you're using?", created_at: "2026-09-20T11:03:00Z", sender: { first_name: "Maya", last_name: "R.", role: "admin" } },
    ],
  },
  {
    id: "t2",
    ticket_id: "TCK-10184",
    subject: "Investment overview not loading",
    category: "Investment",
    priority: "high",
    created_at: "2026-09-15T08:40:00Z",
    status: "pending",
    messages: [
      { id: "m3", message: "The Investment → Overview page has been blank for me since yesterday.", created_at: "2026-09-15T08:40:00Z", sender: { first_name: "You", last_name: "", role: "user" } },
    ],
  },
  {
    id: "t3",
    ticket_id: "TCK-10022",
    subject: "Question about referral commission payout",
    category: "Referral",
    priority: "low",
    created_at: "2026-09-02T14:20:00Z",
    status: "resolved",
    messages: [
      { id: "m4", message: "When does referral commission move from pending to available?", created_at: "2026-09-02T14:20:00Z", sender: { first_name: "You", last_name: "", role: "user" } },
      { id: "m5", message: "Commissions move to your available balance within 2–3 business days of the referred deposit confirming.", created_at: "2026-09-02T16:05:00Z", sender: { first_name: "Jordan", last_name: "K.", role: "admin" } },
    ],
  },
];

// ── Small building blocks ────────────────────────────────────────────────

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-card ${className}`}>
      {children}
    </div>
  );
}

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-primary">{eyebrow}</p>
      <h2 className="mt-0.5 text-sm font-semibold text-foreground">{title}</h2>
    </div>
  );
}

function StatusBadge({ status }: { status: Ticket["status"] }) {
  const map: Record<Ticket["status"], { label: string; cls: string; dot: string }> = {
    open: { label: "Open", cls: "bg-success/10 text-success border-success/20", dot: "bg-success" },
    pending: { label: "Pending", cls: "bg-primary/10 text-primary border-primary/20", dot: "bg-primary" },
    resolved: { label: "Resolved", cls: "bg-success/10 text-success border-success/20", dot: "bg-success" },
    closed: { label: "Closed", cls: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground" },
  };
  const s = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${s.cls}`}>
      <span className={`size-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: Ticket["priority"] }) {
  const map: Record<Ticket["priority"], string> = {
    low: "bg-success/10 text-success border-success/20",
    medium: "bg-primary/10 text-primary border-primary/20",
    high: "bg-destructive/10 text-destructive border-destructive/20",
    urgent: "bg-destructive/15 text-destructive border-destructive/25",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${map[priority]}`}>
      {priority}
    </span>
  );
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function formatTime(s: string) {
  return new Date(s).toLocaleString("en-GB", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).replace(",", "");
}

// ── Page ─────────────────────────────────────────────────────────────────

export default function SupportPage() {
  const [faqCat, setFaqCat] = useState("all");
  const [faqSearch, setFaqSearch] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");

  const [fCategory, setFCategory] = useState("");
  const [catErr, setCatErr] = useState(false);
  const [fSubject, setFSubject] = useState("");
  const [subErr, setSubErr] = useState(false);
  const [fPriority, setFPriority] = useState<Ticket["priority"]>("low");
  const [fMessage, setFMessage] = useState("");
  const [msgErr, setMsgErr] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [newTicketId, setNewTicketId] = useState("");

  const ticketRef = useRef<HTMLDivElement>(null);
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  const activeTicket = tickets.find((t) => t.id === activeTicketId) || null;

  const visibleFaqs = useMemo(() => {
    return FAQS.filter((f) => {
      const catMatch = faqCat === "all" || f.cat === faqCat;
      const q = faqSearch.toLowerCase();
      return catMatch && (!q || f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q));
    });
  }, [faqCat, faqSearch]);

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
    await new Promise((r) => setTimeout(r, 500));

    const newId = `TCK-${Math.floor(10000 + Math.random() * 89999)}`;
    const newTicket: Ticket = {
      id: "local-" + Date.now(),
      ticket_id: newId,
      subject: fSubject,
      category: fCategory,
      priority: fPriority,
      created_at: new Date().toISOString(),
      status: "open",
      messages: [
        { id: "m-" + Date.now(), message: fMessage, created_at: new Date().toISOString(), sender: { first_name: "You", last_name: "", role: "user" } },
      ],
    };

    setTickets((prev) => [newTicket, ...prev]);
    setNewTicketId(newId);
    setFormSuccess(true);
    setSubmitting(false);
  };

  const sendChat = () => {
    if (!chatInput.trim() || !activeTicketId || !activeTicket) return;
    if (activeTicket.status === "closed") return;

    const msgText = chatInput;
    setChatInput("");

    setTickets((prev) =>
      prev.map((t) =>
        t.id === activeTicketId
          ? {
              ...t,
              messages: [
                ...t.messages,
                { id: "m-" + Date.now(), message: msgText, created_at: new Date().toISOString(), sender: { first_name: "You", last_name: "", role: "user" as const } },
              ],
            }
          : t,
      ),
    );

    requestAnimationFrame(() => {
      if (chatMessagesRef.current) chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    });
  };

  return (
    <UserShell active="Support">
      <div className="overflow-y-auto px-5 py-6 sm:px-7 sm:py-8 space-y-8">

        {/* ── Page Header ─────────────────────────────── */}
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-primary">Help Center</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">Support</h1>
          <p className="mt-1 text-sm text-muted-foreground">Find answers instantly or get in touch with our team.</p>
        </div>

        {/* ── Search ───────────────────────────────────── */}
        <div className="relative max-w-lg">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={faqSearch}
            onChange={(e) => setFaqSearch(e.target.value)}
            placeholder="Search FAQs — deposits, referral, security…"
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {/* ── Contact Options ──────────────────────────── */}
        <section aria-label="Contact Options">
          <SectionHeader eyebrow="Quick Access" title="Contact Options" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <button
              type="button"
              onClick={() => ticketRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                <MessageCircle className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Live Chat</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Chat with our support team in real time.</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-success">
                <span className="size-1.5 animate-pulse rounded-full bg-success" />
                Available
              </span>
            </button>

            <a
              href="mailto:support@example.com?subject=Support%20Request"
              className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                <Mail className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Email Support</p>
                <p className="mt-0.5 text-xs text-muted-foreground">support@example.com</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-success">
                <span className="size-1.5 animate-pulse rounded-full bg-success" />
                Available
              </span>
            </a>

            <a
              href="https://t.me/example_support"
              target="_blank"
              rel="noreferrer"
              className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                <Send className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Telegram Support</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Reach us on our official channel.</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-success">
                <span className="size-1.5 animate-pulse rounded-full bg-success" />
                Active
              </span>
            </a>

            <button
              type="button"
              onClick={() => ticketRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="grid size-9 place-items-center rounded-xl bg-muted text-muted-foreground">
                <TicketIcon className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Ticket History</p>
                <p className="mt-0.5 text-xs text-muted-foreground">View all your past support tickets.</p>
              </div>
              <span className="inline-flex items-center rounded-full border border-border bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                {tickets.length} Tickets
              </span>
            </button>
          </div>
        </section>

        <div className="h-px bg-border" />

        {/* ── FAQ + Form ───────────────────────────────── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.35fr_1fr]">

          {/* FAQ */}
          <section aria-label="FAQ">
            <SectionHeader eyebrow="Self-Service" title="Frequently Asked Questions" />
            <div className="mb-3 flex flex-wrap gap-1.5">
              {[["all", "All"], ["account", "Account"], ["billing", "Billing"], ["investment", "Investment"], ["referral", "Referral"], ["security", "Security"]].map(([c, l]) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { setFaqCat(c); setOpenFaq(null); }}
                  className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    faqCat === c
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-primary"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            <Card>
              {visibleFaqs.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                  <Search className="size-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No results found. Try a different search or category.</p>
                </div>
              ) : (
                <div>
                  {visibleFaqs.map((f, i) => (
                    <div key={i} className={i !== 0 ? "border-t border-border" : ""}>
                      <button
                        type="button"
                        onClick={() => setOpenFaq(openFaq === i ? null : i)}
                        className={`flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          openFaq === i ? "text-primary" : "text-foreground hover:text-primary"
                        }`}
                      >
                        <span className="flex-1 font-medium">{f.q}</span>
                        <span className="hidden shrink-0 rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:inline-block">
                          {CAT_LABELS[f.cat] || f.cat}
                        </span>
                        <ChevronDown className={`size-4 shrink-0 text-muted-foreground transition-transform ${openFaq === i ? "rotate-180 text-primary" : ""}`} />
                      </button>
                      {openFaq === i && (
                        <div className="px-4 pb-4">
                          <p className="border-l-2 border-primary pl-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </section>

          {/* Ticket Form */}
          <section aria-label="Submit a Support Ticket">
            <SectionHeader eyebrow="Get Help" title="Submit a Support Ticket" />
            <Card className="p-5">
              {!formSuccess ? (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Category <span className="text-primary">*</span>
                    </label>
                    <select
                      value={fCategory}
                      onChange={(e) => { setFCategory(e.target.value); setCatErr(false); }}
                      className={`w-full rounded-xl border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring ${catErr ? "border-destructive" : "border-border"}`}
                    >
                      <option value="" disabled>Select a category…</option>
                      <option value="Billing">Billing Issue</option>
                      <option value="Investment">Investment / Plan</option>
                      <option value="Referral">Referral &amp; Commission</option>
                      <option value="Account">Account &amp; Security</option>
                      <option value="Technical">Technical Problem</option>
                      <option value="Other">Other</option>
                    </select>
                    {catErr && <p className="text-xs text-destructive">Please select a category.</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Subject <span className="text-primary">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={120}
                      value={fSubject}
                      onChange={(e) => { setFSubject(e.target.value); setSubErr(false); }}
                      placeholder="Brief description…"
                      className={`w-full rounded-xl border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring ${subErr ? "border-destructive" : "border-border"}`}
                    />
                    {subErr && <p className="text-xs text-destructive">Subject is required.</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Priority</label>
                    <div className="flex flex-wrap gap-3">
                      {(["low", "medium", "high", "urgent"] as const).map((v) => (
                        <label key={v} className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
                          <input
                            type="radio"
                            name="priority"
                            value={v}
                            checked={fPriority === v}
                            onChange={() => setFPriority(v)}
                            className="accent-current"
                          />
                          <span className={`size-1.5 rounded-full ${v === "low" ? "bg-success" : v === "medium" ? "bg-primary" : "bg-destructive"}`} />
                          {v.charAt(0).toUpperCase() + v.slice(1)}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Message <span className="text-primary">*</span>
                    </label>
                    <textarea
                      maxLength={2000}
                      value={fMessage}
                      onChange={(e) => { setFMessage(e.target.value); setMsgErr(false); }}
                      placeholder="Describe your issue in detail…"
                      className={`min-h-28 w-full resize-y rounded-xl border bg-background px-3 py-2.5 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring ${msgErr ? "border-destructive" : "border-border"}`}
                    />
                    <div className="flex justify-between">
                      {msgErr ? <p className="text-xs text-destructive">Min 20 characters required.</p> : <span />}
                      <p className="text-[11px] text-muted-foreground">{fMessage.length} / 2000</p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={submitForm}
                      disabled={submitting}
                      className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-background transition-opacity hover:opacity-90 disabled:opacity-60 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Send className="size-3.5" />
                      {submitting ? "Sending…" : "Submit Ticket"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center">
                  <div className="mx-auto grid size-12 place-items-center rounded-full border border-success/20 bg-success/10">
                    <BadgeCheck className="size-6 text-success" />
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-foreground">Ticket Submitted</h3>
                  <p className="mx-auto mt-2 inline-block rounded-lg border border-border bg-muted px-3 py-1 font-mono text-sm tracking-wide text-primary">
                    {newTicketId}
                  </p>
                  <p className="mt-3 text-xs text-muted-foreground">Our team will get back to you shortly.</p>
                  <button
                    type="button"
                    onClick={() => { setActiveTicketId(tickets[0]?.id || null); resetForm(); }}
                    className="mt-4 rounded-xl border border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide text-foreground transition-colors hover:border-primary/40 hover:text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    View Ticket
                  </button>
                </div>
              )}
            </Card>
          </section>
        </div>

        <div className="h-px bg-border" />

        {/* ── Ticket History ───────────────────────────── */}
        <section ref={ticketRef} aria-label="Ticket History">
          <SectionHeader eyebrow="My Requests" title="Ticket History" />

          {tickets.length === 0 ? (
            <Card className="flex flex-col items-center gap-3 py-10 text-center">
              <History className="size-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No tickets yet. Submit a request above.</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {tickets.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTicketId(t.id)}
                  className="flex w-full flex-col items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40 sm:flex-row sm:items-center sm:justify-between outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <LifeBuoy className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{t.subject}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="font-mono">{t.ticket_id}</span>
                        <span>·</span>
                        <span>{t.category}</span>
                        <span>·</span>
                        <span>{formatDate(t.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 self-stretch sm:self-auto">
                    <PriorityBadge priority={t.priority} />
                    <StatusBadge status={t.status} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <div className="h-10" />
      </div>

      {/* ── Ticket Detail Modal ─────────────────────────── */}
      {activeTicket && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setActiveTicketId(null)}
        >
          <div className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">

            <div className="flex items-start justify-between gap-3 border-b border-border bg-muted/50 p-5">
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-base font-semibold text-foreground">{activeTicket.subject}</h3>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{activeTicket.ticket_id}</span>
                  <StatusBadge status={activeTicket.status} />
                  <PriorityBadge priority={activeTicket.priority} />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTicketId(null)}
                className="grid size-8 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex flex-col gap-5 p-5">
              <div>
                <p className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                  Ticket Details
                  <span className="h-px flex-1 bg-border" />
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-border bg-background p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Ticket ID</p>
                    <p className="mt-0.5 font-mono text-sm text-foreground">{activeTicket.ticket_id}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Category</p>
                    <p className="mt-0.5 text-sm font-medium text-foreground">{activeTicket.category}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Priority</p>
                    <p className="mt-0.5 text-sm font-medium capitalize text-foreground">{activeTicket.priority}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Submitted</p>
                    <p className="mt-0.5 text-sm font-medium text-foreground">{formatDate(activeTicket.created_at)}</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                  Your Messages
                  <span className="h-px flex-1 bg-border" />
                </p>
                <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-background">
                  <div ref={chatMessagesRef} className="flex h-64 flex-col gap-3 overflow-y-auto p-4">
                    {activeTicket.messages.length === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">No messages yet.</p>
                    ) : (
                      activeTicket.messages.map((m) => {
                        const isAdmin = m.sender.role === "admin";
                        const initials = ((m.sender.first_name[0] || "") + (m.sender.last_name[0] || "")).toUpperCase() || "?";
                        return (
                          <div key={m.id} className={`flex max-w-[85%] items-end gap-2 ${isAdmin ? "ml-auto flex-row-reverse self-end" : "self-start"}`}>
                            <div className={`grid size-6 shrink-0 place-items-center rounded-full text-[10px] font-semibold ${isAdmin ? "bg-primary text-primary-foreground" : "border border-border bg-card text-primary"}`}>
                              {initials}
                            </div>
                            <div>
                              <div className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${isAdmin ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md border border-border bg-card text-foreground"}`}>
                                {m.message}
                              </div>
                              <p className={`mt-1 text-[10px] text-muted-foreground ${isAdmin ? "text-right" : ""}`}>
                                {formatTime(m.created_at)}{isAdmin ? ` · ${m.sender.first_name} ${m.sender.last_name}` : ""}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div className="flex gap-2 border-t border-border bg-card p-3">
                    <input
                      type="text"
                      value={chatInput}
                      disabled={activeTicket.status === "closed"}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendChat()}
                      placeholder={activeTicket.status === "closed" ? "Ticket is closed — contact us via email or Telegram." : "Type a message…"}
                      className="min-w-0 flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={sendChat}
                      disabled={activeTicket.status === "closed"}
                      className="grid size-9 shrink-0 place-items-center rounded-full bg-foreground text-background transition-opacity hover:opacity-90 disabled:opacity-40 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Send className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </UserShell>
  );
}