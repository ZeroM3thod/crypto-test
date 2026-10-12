// app/(user)/support/my-tickets/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { UserShell } from "@/app/(user)/_components/user-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Inbox, SendHorizonal } from "lucide-react";

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

// ── Helpers ──────────────────────────────────────────────────────────────

function statusVariant(s: Ticket["status"]): "default" | "outline" | "secondary" | "muted" {
  if (s === "closed") return "muted";
  if (s === "pending") return "outline";
  return "default";
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function formatTime(s: string) {
  return new Date(s).toLocaleString("en-GB", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).replace(",", "");
}

// ── Page ─────────────────────────────────────────────────────────────────

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [loading, setLoading] = useState(true);

  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const activeTicket = tickets.find((t) => t.id === activeTicketId) || null;

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/support/my-tickets');
      if (!res.ok) return;
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch (error) {
      console.error('Fetch tickets error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketDetails = async (ticketId: string) => {
    try {
      const res = await fetch(`/api/support/ticket?ticketId=${ticketId}`);
      if (!res.ok) return;
      const data = await res.json();
      
      setTickets(prev => prev.map(t => 
        t.id === ticketId 
          ? { 
              ...t, 
              messages: data.messages.map((m: any) => ({
                id: m.id,
                message: m.message,
                created_at: m.created_at,
                sender: {
                  first_name: m.sender.role === 'user' ? 'You' : m.sender.first_name,
                  last_name: m.sender.role === 'user' ? '' : m.sender.last_name,
                  role: m.sender.role
                }
              }))
            }
          : t
      ));
    } catch (error) {
      console.error('Fetch ticket details error:', error);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (activeTicketId && activeTicket) {
      fetchTicketDetails(activeTicketId);
      
      pollingRef.current = setInterval(() => {
        fetchTicketDetails(activeTicketId);
      }, 3000);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [activeTicketId]);

  const sendChat = async () => {
    if (!chatInput.trim() || !activeTicketId || !activeTicket) return;
    if (activeTicket.status === "closed") return;

    const msgText = chatInput;
    setChatInput("");

    try {
      const res = await fetch('/api/support/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: activeTicketId,
          message: msgText
        })
      });

      if (!res.ok) {
        alert('Failed to send message');
        return;
      }

      await fetchTicketDetails(activeTicketId);

      requestAnimationFrame(() => {
        if (chatMessagesRef.current) chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
      });
    } catch (error) {
      console.error('Send message error:', error);
      alert('Failed to send message');
    }
  };

  return (
    <UserShell active="My Tickets">
      <div className="overflow-y-auto px-5 py-6 sm:px-7 sm:py-8">
        <div className="mx-auto w-full max-w-4xl">

          {/* ── Header ────────────────────────────────── */}
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Help Center
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">My Tickets</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {tickets.length} ticket{tickets.length === 1 ? "" : "s"} on record.
              </p>
            </div>
            <Button asChild>
              <a href="/support/create-ticket">New Ticket</a>
            </Button>
          </div>

          {/* ── Ticket list (table style) ────────────────── */}
          {loading ? (
            <Card className="flex flex-col items-center gap-3 py-16 text-center">
              <p className="text-sm text-muted-foreground">Loading tickets...</p>
            </Card>
          ) : tickets.length === 0 ? (
            <Card className="flex flex-col items-center gap-3 py-16 text-center">
              <Inbox className="size-6 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No tickets yet. Create one to get started.</p>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="hidden grid-cols-[1fr_130px_110px_120px_110px] gap-4 border-b border-border px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:grid">
                <span>Subject</span>
                <span>Ticket ID</span>
                <span>Category</span>
                <span>Priority</span>
                <span>Status</span>
              </div>
              <div>
                {tickets.map((t, i) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTicketId(t.id)}
                    className={`grid w-full grid-cols-1 gap-2 px-5 py-4 text-left text-sm transition-colors hover:bg-muted sm:grid-cols-[1fr_130px_110px_120px_110px] sm:items-center sm:gap-4 ${i !== 0 ? "border-t border-border" : ""}`}
                  >
                    <span className="truncate font-medium">{t.subject}</span>
                    <span className="font-mono text-xs text-muted-foreground">{t.ticket_id}</span>
                    <span className="text-xs text-muted-foreground sm:text-sm">{t.category}</span>
                    <Badge variant="outline" className="w-fit capitalize">{t.priority}</Badge>
                    <Badge variant={statusVariant(t.status)} className="w-fit capitalize">{t.status}</Badge>
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="h-10" />
      </div>

      {/* ── Ticket Detail Dialog ─────────────────────────── */}
      <Dialog open={!!activeTicket} onOpenChange={(open) => !open && setActiveTicketId(null)}>
        <DialogContent>
          {activeTicket && (
            <>
              <DialogHeader>
                <DialogTitle>{activeTicket.subject}</DialogTitle>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="font-mono text-xs text-muted-foreground">{activeTicket.ticket_id}</span>
                  <Badge variant={statusVariant(activeTicket.status)} className="capitalize">{activeTicket.status}</Badge>
                  <Badge variant="outline" className="capitalize">{activeTicket.priority}</Badge>
                </div>
              </DialogHeader>

              <DialogBody>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-md border border-border p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Category</p>
                    <p className="mt-0.5 text-sm font-medium">{activeTicket.category}</p>
                  </div>
                  <div className="rounded-md border border-border p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Submitted</p>
                    <p className="mt-0.5 text-sm font-medium">{formatDate(activeTicket.created_at)}</p>
                  </div>
                </div>

                <div className="flex flex-col overflow-hidden rounded-md border border-border">
                  <div ref={chatMessagesRef} className="flex h-64 flex-col gap-3 overflow-y-auto p-4">
                    {!activeTicket.messages || activeTicket.messages.length === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">No messages yet.</p>
                    ) : (
                      activeTicket.messages.map((m) => {
                        const isAdmin = m.sender.role === "admin";
                        const initials = ((m.sender.first_name[0] || "") + (m.sender.last_name[0] || "")).toUpperCase() || "?";
                        return (
                          <div key={m.id} className={`flex max-w-[85%] items-end gap-2 ${isAdmin ? "ml-auto flex-row-reverse self-end" : "self-start"}`}>
                            <div className={`grid size-6 shrink-0 place-items-center rounded-full border text-[10px] font-semibold ${isAdmin ? "border-foreground bg-foreground text-background" : "border-border"}`}>
                              {initials}
                            </div>
                            <div>
                              <div className={`rounded-lg px-3 py-2 text-sm leading-relaxed ${isAdmin ? "rounded-br-sm bg-foreground text-background" : "rounded-bl-sm border border-border"}`}>
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
                  <div className="flex gap-2 border-t border-border p-3">
                    <Input
                      value={chatInput}
                      disabled={activeTicket.status === "closed"}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendChat()}
                      placeholder={activeTicket.status === "closed" ? "This ticket is closed." : "Type a message…"}
                      className="h-9 rounded-full"
                    />
                    <Button
                      size="icon"
                      className="rounded-full"
                      disabled={activeTicket.status === "closed"}
                      onClick={sendChat}
                    >
                      <SendHorizonal />
                    </Button>
                  </div>
                </div>
              </DialogBody>
            </>
          )}
        </DialogContent>
      </Dialog>
    </UserShell>
  );
}
