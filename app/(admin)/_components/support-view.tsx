// app/(admin)/_components/support-view.tsx
"use client";

import {
  Ban,
  CheckCircle2,
  Clock,
  MessageCircle,
  MessageSquare,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatedBadge } from "@/components/motion/animated-badge";
import { Button } from "@/components/motion/button";
import { Table, type TableColumn } from "@/components/motion/table";
import type {
  Ticket,
  TicketLog,
  TicketPriority,
  TicketStatus,
} from "@/lib/admin-support-data";
import { Avatar, Dialog, Field, Section } from "./detail-ui";
import { PageHeader, SearchInput, StatCard } from "./finance-ui";
import { initials, Toast, useToast } from "./review-ui";

/* ---------- constants & helpers ---------- */

// TODO: replace with the signed-in admin from your auth
const MODERATOR = { name: "Admin User" };

const formatDate = (s: string) =>
  s
    ? new Date(s).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : "—";

const formatTime = (s: string) =>
  new Date(s)
    .toLocaleString("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    })
    .replace(",", "");

const fullName = (t: Ticket) =>
  `${t.profile.first_name} ${t.profile.last_name}`.trim();

const SELECT_CLS =
  "h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring";

/* ---------- badges ---------- */

function Pill({
  tone,
  children,
}: {
  tone: "success" | "warning" | "danger" | "active" | "neutral";
  children: React.ReactNode;
}) {
  if (tone === "success" || tone === "warning" || tone === "danger") {
    return (
      <AnimatedBadge status={tone} size="sm">
        <span className="capitalize">{children}</span>
      </AnimatedBadge>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-[10px] font-medium capitalize ${
        tone === "active"
          ? "bg-foreground text-background"
          : "bg-muted text-muted-foreground"
      }`}
    >
      {children}
    </span>
  );
}

const statusTone = (s: TicketStatus) =>
  s === "resolved"
    ? "success"
    : s === "pending"
      ? "warning"
      : s === "open"
        ? "active"
        : "neutral";

const prioTone = (p: TicketPriority) =>
  p === "high" ? "danger" : p === "medium" ? "warning" : "neutral";

/* ---------- log dots ---------- */

const LOG_DOT: Record<TicketLog["action"], string> = {
  ticket_created: "bg-muted-foreground",
  status_changed: "bg-foreground",
  reply_sent: "bg-(--color-success)",
};

/* ---------- main view ---------- */

type DbTicket = {
  id: string;
  ticket_id: string;
  user_id: string;
  subject: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  created_at: string;
  user: {
    id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
};

type DbMessage = {
  id: string;
  message: string;
  created_at: string;
  sender: {
    id: string;
    first_name: string;
    last_name: string;
    role: string;
  };
};

type DbLog = {
  id: string;
  action: TicketLog["action"];
  description: string;
  created_at: string;
  performer: {
    first_name: string;
    last_name: string;
  } | null;
};

export function SupportView() {
  const { toast, showToast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const active = tickets.find((t) => t.id === activeId) ?? null;
  const closeModal = useCallback(() => {
    setActiveId(null);
    setReplyText("");
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/admin/support/tickets');
      if (!res.ok) return;
      const data = await res.json();
      
      const mapped: Ticket[] = (data.tickets || []).map((t: DbTicket) => ({
        id: t.id,
        ticket_id: t.ticket_id,
        user_id: t.user_id,
        subject: t.subject,
        category: t.category,
        priority: t.priority,
        status: t.status,
        created_at: t.created_at,
        profile: {
          first_name: t.user.first_name,
          last_name: t.user.last_name,
          username: t.user.user_id,
          email: t.user.email,
          phone_number: t.user.phone || ''
        },
        messages: [],
        logs: []
      }));
      
      setTickets(mapped);
    } catch (error) {
      console.error('Fetch tickets error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketDetails = async (ticketId: string) => {
    try {
      const res = await fetch(`/api/admin/support/ticket?ticketId=${ticketId}`);
      if (!res.ok) return;
      const data = await res.json();
      
      const messages = (data.messages || []).map((m: DbMessage) => ({
        id: m.id,
        from: m.sender.role === 'user' ? 'user' : 'staff',
        staffName: m.sender.role !== 'user' ? `${m.sender.first_name} ${m.sender.last_name}` : undefined,
        message: m.message,
        created_at: m.created_at
      }));

      const logs = (data.logs || []).map((l: DbLog) => ({
        id: l.id,
        action: l.action,
        text: l.description,
        performer: l.performer ? `${l.performer.first_name} ${l.performer.last_name}` : undefined,
        created_at: l.created_at
      }));
      
      setTickets(prev => prev.map(t => 
        t.id === ticketId ? { ...t, messages, logs } : t
      ));
    } catch (error) {
      console.error('Fetch ticket details error:', error);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (activeId) {
      fetchTicketDetails(activeId);
      
      pollingRef.current = setInterval(() => {
        fetchTicketDetails(activeId);
      }, 3000);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [activeId]);

  /* ---------- stats ---------- */

  const stats = useMemo(
    () => ({
      total: tickets.length,
      pending: tickets.filter((t) => t.status === "pending").length,
      open: tickets.filter((t) => t.status === "open").length,
      resolved: tickets.filter((t) => t.status === "resolved").length,
      closed: tickets.filter((t) => t.status === "closed").length,
    }),
    [tickets],
  );

  /* ---------- filtering ---------- */

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tickets.filter((t) => {
      const matchSearch =
        !q ||
        t.ticket_id.toLowerCase().includes(q) ||
        fullName(t).toLowerCase().includes(q) ||
        t.profile.username.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || t.status === statusFilter;
      const matchPriority =
        priorityFilter === "all" || t.priority === priorityFilter;
      return matchSearch && matchStatus && matchPriority;
    });
  }, [tickets, query, statusFilter, priorityFilter]);

  /* ---------- actions (local state only — no DB) ---------- */

  const setStatus = async (id: string, newStatus: TicketStatus) => {
    try {
      const res = await fetch('/api/admin/support/ticket', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: id, status: newStatus })
      });

      if (!res.ok) {
        showToast('Failed to update status');
        return;
      }

      setTickets(prev => prev.map(t => 
        t.id === id ? { ...t, status: newStatus } : t
      ));
      
      showToast(`Status updated to ${newStatus}.`);
      await fetchTicketDetails(id);
    } catch (error) {
      console.error('Status update error:', error);
      showToast('Failed to update status');
    }
  };

  const sendChat = async (t: Ticket) => {
    if (!replyText.trim()) return;
    if (t.status === "closed") {
      showToast("Re-open the ticket before replying.");
      return;
    }

    const text = replyText.trim();
    setReplyText("");

    try {
      const res = await fetch('/api/admin/support/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: t.id, message: text })
      });

      if (!res.ok) {
        showToast('Failed to send reply');
        return;
      }

      showToast("Reply sent successfully.");
      await fetchTicketDetails(t.id);
    } catch (error) {
      console.error('Send reply error:', error);
      showToast('Failed to send reply');
    }
  };

  /* ---------- auto-scroll chat ---------- */

  const messageCount = active?.messages.length ?? 0;
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messageCount, activeId]);

  /* ---------- table ---------- */

  const columns = useMemo<TableColumn<Ticket>[]>(
    () => [
      {
        key: "ticket_id",
        header: "Ticket ID",
        width: "110px",
        cell: (t) => (
          <span className="font-mono text-xs text-muted-foreground">
            {t.ticket_id}
          </span>
        ),
      },
      {
        key: "user" as never,
        header: "User",
        width: "1.2fr",
        cell: (t) => (
          <div className="flex items-center gap-2.5">
            <Avatar text={initials(fullName(t))} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{fullName(t)}</p>
              <p className="truncate text-xs text-muted-foreground">
                @{t.profile.username}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: "subject",
        header: "Subject",
        sortable: true,
        width: "1.6fr",
        cell: (t) => (
          <span className="block truncate text-sm font-medium" title={t.subject}>
            {t.subject}
          </span>
        ),
      },
      { key: "category", header: "Category", sortable: true, width: "110px" },
      {
        key: "priority",
        header: "Priority",
        width: "110px",
        cell: (t) => <Pill tone={prioTone(t.priority)}>{t.priority}</Pill>,
      },
      {
        key: "created_at",
        header: "Submitted",
        sortable: true,
        width: "120px",
        cell: (t) => (
          <span className="text-xs text-muted-foreground">
            {formatDate(t.created_at)}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        width: "110px",
        cell: (t) => <Pill tone={statusTone(t.status)}>{t.status}</Pill>,
      },
      {
        key: "actions" as never,
        header: "Action",
        align: "right",
        width: "100px",
        cell: (t) => (
          <Button size="sm" variant="ghost" onClick={() => setActiveId(t.id)}>
            View →
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <Toast toast={toast} />

      {/* ---------- ticket detail modal ---------- */}
      <Dialog open={!!active} onClose={closeModal}>
        {active ? (
          <>
            {/* header */}
            <div className="flex items-start justify-between gap-3 border-b border-border p-5">
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-semibold text-foreground">
                  {active.subject}
                </h2>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    {active.ticket_id}
                  </span>
                  <Pill tone={statusTone(active.status)}>{active.status}</Pill>
                  <Pill tone={prioTone(active.priority)}>
                    {active.priority} priority
                  </Pill>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close"
                className="grid size-8 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* body */}
            <div className="flex flex-col gap-6 overflow-y-auto p-5">
              <Section title="User details">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Field label="Full name" value={fullName(active)} />
                  <Field label="Username" value={`@${active.profile.username}`} />
                  <Field label="Email" value={active.profile.email} />
                  <Field label="Phone" value={active.profile.phone_number} />
                </div>
              </Section>

              <Section title="Ticket information">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <Field label="Ticket ID" value={active.ticket_id} mono />
                  <Field label="Category" value={active.category} />
                  <Field label="Priority" value={active.priority} />
                  <Field label="Submitted date" value={formatDate(active.created_at)} />
                  <Field label="Status" value={active.status} />
                  <Field label="User ID" value={active.user_id} mono />
                </div>
              </Section>

              <Section title="Live chat">
                <div className="overflow-hidden rounded-xl border border-border">
                  <div
                    ref={chatRef}
                    className="flex h-72 flex-col gap-3 overflow-y-auto bg-muted/30 p-4"
                  >
                    {active.messages.map((m) => {
                      const staff = m.from === "staff";
                      const name = staff ? (m.staffName ?? "Staff") : fullName(active);
                      return (
                        <div
                          key={m.id}
                          className={`flex items-end gap-2 ${
                            staff ? "flex-row-reverse" : ""
                          }`}
                        >
                          <Avatar text={initials(name)} dark={staff} />
                          <div
                            className={`flex max-w-[78%] flex-col ${
                              staff ? "items-end" : "items-start"
                            }`}
                          >
                            <div
                              className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                                staff
                                  ? "rounded-br-sm bg-foreground text-background"
                                  : "rounded-bl-sm border border-border bg-background text-foreground"
                              }`}
                            >
                              {m.message}
                            </div>
                            <span className="mt-1 text-[10px] text-muted-foreground">
                              {formatTime(m.created_at)}
                              {staff ? ` · ${name}` : ""}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-2 border-t border-border bg-background p-3">
                    <input
                      type="text"
                      value={replyText}
                      disabled={active.status === "closed"}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendChat(active)}
                      placeholder={
                        active.status === "closed"
                          ? "Ticket is closed — re-open to reply…"
                          : "Type a reply…"
                      }
                      className="h-10 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <Button
                      size="md"
                      variant="primary"
                      disabled={active.status === "closed"}
                      onClick={() => sendChat(active)}
                    >
                      Send
                    </Button>
                  </div>
                </div>
              </Section>

              <Section title="Actions">
                <div className="flex flex-wrap gap-2">
                  {active.status === "pending" && (
                    <Button size="md" variant="outline" onClick={() => setStatus(active.id, "open")}>
                      → Mark as Open
                    </Button>
                  )}
                  {(active.status === "pending" || active.status === "open") && (
                    <Button size="md" variant="primary" onClick={() => setStatus(active.id, "resolved")}>
                      ✓ Mark as Resolved
                    </Button>
                  )}
                  {active.status !== "closed" && (
                    <Button size="md" variant="outline" onClick={() => setStatus(active.id, "closed")}>
                      ✕ Close Ticket
                    </Button>
                  )}
                  {(active.status === "closed" || active.status === "resolved") && (
                    <Button size="md" variant="outline" onClick={() => setStatus(active.id, "open")}>
                      ↺ Re-open Ticket
                    </Button>
                  )}
                </div>
              </Section>

              <Section title="Activity log">
                <div className="flex flex-col rounded-xl border border-border">
                  {active.logs.length > 0 ? (
                    active.logs.map((l) => (
                      <div
                        key={l.id}
                        className="flex gap-3 border-b border-border p-3 last:border-b-0"
                      >
                        <span
                          className={`mt-1.5 size-2 shrink-0 rounded-full ${LOG_DOT[l.action]}`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-foreground">
                            <strong className="font-semibold">{l.text}</strong>
                            {l.performer ? (
                              <span className="text-muted-foreground">
                                {" "}
                                — {l.performer}
                              </span>
                            ) : null}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {formatTime(l.created_at)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="p-4 text-center text-xs text-muted-foreground">
                      No activity logs yet.
                    </p>
                  )}
                </div>
              </Section>
            </div>
          </>
        ) : null}
      </Dialog>

      {/* ---------- page ---------- */}
      <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
        <div>
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Help Desk · Tickets
          </span>
          <PageHeader
            title="Support Management"
            description="View, respond to, and manage all user support tickets."
          />
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
          <StatCard label="Total tickets" value={stats.total} icon={MessageSquare} />
          <StatCard label="Pending" value={stats.pending} icon={Clock} />
          <StatCard label="Open" value={stats.open} icon={MessageCircle} />
          <StatCard label="Resolved" value={stats.resolved} icon={CheckCircle2} positive />
          <StatCard label="Closed" value={stats.closed} icon={Ban} />
        </div>

        <section className="rounded-2xl border border-border bg-background p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Support tickets
              </h2>
              <p className="text-xs text-muted-foreground">
                Showing {filtered.length} of {tickets.length} tickets
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Search ticket, user, subject…"
              />
              <select
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={SELECT_CLS}
              >
                <option value="all">All tickets</option>
                <option value="pending">Pending</option>
                <option value="open">Open</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <select
                aria-label="Filter by priority"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className={SELECT_CLS}
              >
                <option value="all">All priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <Table
              data={filtered}
              columns={columns}
              getRowId={(t) => t.id}
              height={520}
              rowHeight={60}
              className="rounded-xl"
              emptyState={
                <div className="flex flex-col items-center gap-2 text-center">
                  <MessageSquare className="size-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No tickets match your search or filter.
                  </p>
                </div>
              }
            />
          </div>
        </section>
      </div>
    </>
  );
}
