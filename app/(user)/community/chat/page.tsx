// app/(user)/community/page.tsx
"use client";

import { UserShell } from "@/app/(user)/_components/user-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ChevronDown,
  ChevronUp,
  Globe,
  MoreVertical,
  Reply,
  Copy,
  Flag,
  Pin,
  SendHorizonal,
  Smile,
  Users,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

// ── Types ────────────────────────────────────────────────────────────────

type ChatMessageData = {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  text: string;
  timestamp: string;
  createdAt?: string;
  lang?: string;
  own?: boolean;
  pinned?: boolean;
  admin?: boolean;
  avatarUrl?: string;
  replyText?: string;
  replyUsername?: string;
};

type OnlineUser = {
  id: string;
  username: string;
  avatar: string;
  lang: string;
  avatarUrl?: string;
};

const EMOJIS = ["😀", "😂", "🔥", "🚀", "📈", "💰", "👍", "🎉", "💎", "⚡", "🌙", "💯"];

const PROFANITY = ["badword1", "badword2"];

// ── Small building blocks ────────────────────────────────────────────────

function AvatarGlyph({ letter, src }: { letter: string; src?: string }) {
  return (
    src ? <img src={src} alt="" className="size-full rounded-full border border-border object-cover" /> : <span className="grid size-full place-items-center rounded-full border border-border text-[11px] font-semibold">{letter.toUpperCase()}</span>
  );
}

function PinnedMessage({ msg }: { msg: ChatMessageData }) {
  return (
    <div className="mx-4 mb-2 flex items-start gap-2 rounded-xl border border-border bg-muted/40 px-4 py-3">
      <Pin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Pinned — Admin
        </p>
        <p className="text-xs leading-relaxed text-foreground">{msg.text}</p>
      </div>
    </div>
  );
}

function RulesBanner({ rules }: { rules: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="mx-4 mb-2 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center justify-between px-4 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="text-[11px] font-semibold text-foreground">Community Rules</span>
        {open ? (
          <ChevronUp className="size-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-3.5 text-muted-foreground" />
        )}
      </button>
      {open && (
        <div className="space-y-1.5 border-t border-border px-4 pb-3 pt-2">
          {rules.map((rule, i) => (
            <p key={rule} className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{i + 1}.</span> {rule}
            </p>
          ))}
        </div>
      )}
    </Card>
  );
}

function OnlineSidebar({
  users,
  onlineCount,
  open,
  onClose,
}: {
  users: OnlineUser[];
  onlineCount: number;
  open: boolean;
  onClose: () => void;
}) {
  const list = (
    <div className="flex-1 overflow-y-auto py-2">
      {users.map((u) => (
        <div key={u.id} className="flex items-center gap-2 px-4 py-2 transition-colors hover:bg-muted/50">
          <div className="relative size-7 shrink-0">
            <AvatarGlyph letter={u.avatar} src={u.avatarUrl} />
            <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full border border-background bg-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-medium">{u.username}</p>
            <p className="text-[10px] text-muted-foreground">{u.lang}</p>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <aside className="hidden h-full w-56 shrink-0 flex-col border-l border-border bg-card lg:flex">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold">
            <Users className="size-3.5" /> Online
          </p>
          <Badge variant="outline">{onlineCount}</Badge>
        </div>
        {list}
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-foreground/30" onClick={onClose} />
          <aside className="absolute right-0 top-0 flex h-full w-56 flex-col border-l border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold">
                <Users className="size-3.5" /> Online
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{onlineCount}</Badge>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-muted-foreground outline-none hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
            {list}
          </aside>
        </div>
      )}
    </>
  );
}

function EmojiPicker({
  onSelect,
  onClose,
}: {
  onSelect: (e: string) => void;
  onClose: () => void;
}) {
  return (
    <Card className="absolute bottom-full left-0 z-30 mb-2 p-3 shadow-lg">
      <div className="grid grid-cols-6 gap-1.5">
        {EMOJIS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => {
              onSelect(e);
              onClose();
            }}
            className="grid size-8 place-items-center rounded-md text-base transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          >
            {e}
          </button>
        ))}
      </div>
    </Card>
  );
}

function MessageBubble({ msg, onReply, onReport }: { msg: ChatMessageData; onReply: (msg: ChatMessageData) => void; onReport: (msg: ChatMessageData) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className={`flex items-end gap-2 ${msg.own ? "flex-row-reverse self-end" : "self-start"} max-w-[85%]`}>
      <div className="size-7 shrink-0">
        <AvatarGlyph letter={msg.avatar} src={msg.avatarUrl} />
      </div>
      <div className={`relative ${msg.own ? "text-right" : ""}`}>
        <div className={`mb-1 flex items-center gap-1.5 text-[10px] text-muted-foreground ${msg.own ? "justify-end" : ""}`}>
          <span className="font-medium text-muted-foreground">{msg.own ? "You" : msg.username}</span>
          {msg.admin && <span className="rounded-full bg-white px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide text-black">Admin</span>}
          {msg.lang && (
            <span className="inline-flex items-center gap-0.5">
              <Globe className="size-2.5" />
              {msg.lang}
            </span>
          )}
          <span>{msg.timestamp}</span>
        </div>
        {msg.replyText && <div className="mb-1 rounded border-l-2 border-primary bg-muted/60 px-2 py-1 text-left text-[11px]"><b>{msg.replyUsername}</b><p className="truncate">{msg.replyText}</p></div>}
        <div className="flex items-start gap-1">
        <div
          className={`inline-block rounded-lg px-3 py-2 text-sm leading-relaxed ${
            msg.own
              ? "rounded-br-sm bg-foreground text-background"
              : "rounded-bl-sm border border-border"
          }`}
        >
          {msg.text}
        </div>
        <button type="button" aria-label="Message options" onClick={() => setMenuOpen((v) => !v)} className="rounded p-1 text-muted-foreground hover:bg-muted"><MoreVertical className="size-4" /></button>
        {menuOpen && <div className="absolute right-0 top-full z-20 min-w-32 rounded-lg border border-border bg-card p-1 text-left shadow-lg">
          <button className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-muted" onClick={() => { void navigator.clipboard.writeText(msg.text); setMenuOpen(false); }}><Copy className="size-3.5" />Copy</button>
          {!msg.own && <button className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-destructive hover:bg-muted" onClick={() => { onReport(msg); setMenuOpen(false); }}><Flag className="size-3.5" />Report</button>}
        </div>}
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────

export default function CommunityChat() {
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [typingMessage, setTypingMessage] = useState<{ id: string; username: string; avatar: string; avatarUrl?: string } | null>(null);
  const seenMessageIds = useRef(new Set<string>());
  const stagedMessageIds = useRef(new Set<string>());
  const hydratedMessages = useRef(false);
  const [chatLoading, setChatLoading] = useState(true);
  const [chatError, setChatError] = useState<string | null>(null);
  const [chatLocked, setChatLocked] = useState(false);
  const [banNotice, setBanNotice] = useState<{ reason: string; expiresAt: string | null } | null>(null);
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState<ChatMessageData | null>(null);
  const [reportTarget, setReportTarget] = useState<ChatMessageData | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modNotice, setModNotice] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const onlineBase = useRef(0);
  const [rules, setRules] = useState<string[]>([]);
  const [pinnedMsg, setPinnedMsg] = useState<ChatMessageData | null>(null);
  const [hasOlder, setHasOlder] = useState(true);
  const [showLatest, setShowLatest] = useState(false);
  const loadingOlder = useRef(false);

  const modTimer = useRef<number | undefined>(undefined);
  const scrollerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typingMessage]);

  useEffect(() => () => window.clearTimeout(modTimer.current), []);
  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setOnlineCount(Math.max(0, onlineBase.current + Math.floor(Math.random() * 11) - 5));
    }, 2000);
    return () => window.clearInterval(interval);
  }, []);

  // Fetch messages from backend
  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        const [msgRes, rulesRes, onlineRes, lockRes] = await Promise.all([
          fetch("/api/chat/messages?limit=15"),
          fetch("/api/chat/rules"),
          fetch("/api/chat/online"),
          fetch("/api/chat/admin/lock"),
        ]);
        
        if (msgRes.ok) {
          const data = await msgRes.json();
          const formatted = [...new Map(data.map((m: any) => [m.id, m])).values()].map((m: any) => ({
            id: m.id,
            userId: m.user_id || m.username || "system",
            username: m.username || `${m.first_name || "User"}_${m.last_name?.charAt(0) || "U"}`,
            avatar: m.avatar || m.avatar_url || m.username || m.first_name?.charAt(0) || "U",
            avatarUrl: m.avatar_url || undefined,
            text: m.message,
            timestamp: new Date(m.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
            createdAt: m.created_at,
            lang: "EN",
            own: Boolean(m.own),
            pinned: m.pinned,
            admin: m.is_admin,
            replyText: m.reply_to?.message,
            replyUsername: m.reply_to?.username,
          }));
          if (!active) return;
          if (!hydratedMessages.current) {
            formatted.forEach((message: ChatMessageData) => seenMessageIds.current.add(message.id));
            hydratedMessages.current = true;
            setMessages(formatted);
            setHasOlder(data.length === 15);
            setChatError(null);
            const pinned = formatted.find((m: ChatMessageData) => m.pinned);
            setPinnedMsg(pinned || null);
            return;
          }
          setMessages((prev) => {
            const incoming = formatted.filter((m: ChatMessageData) => !seenMessageIds.current.has(m.id) && !m.own);
            formatted.forEach((message: ChatMessageData) => seenMessageIds.current.add(message.id));
            if (incoming.length) {
              const message = incoming[incoming.length - 1];
              stagedMessageIds.current.add(message.id);
              setTypingMessage({ id: message.id, username: message.username, avatar: message.avatar, avatarUrl: message.avatarUrl });
              window.setTimeout(() => {
                setTypingMessage((current) => current?.id === message.id ? null : current);
                stagedMessageIds.current.delete(message.id);
                setMessages((prev) => prev.length ? [...prev.filter((old) => !formatted.some((row: ChatMessageData) => row.id === old.id)), ...formatted] : formatted);
              }, 1000 + Math.floor(Math.random() * 2001));
              requestAnimationFrame(() => scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" }));
              return prev.filter((old) => !stagedMessageIds.current.has(old.id));
            }
            return prev.length ? [...prev.filter((m) => !formatted.some((n: ChatMessageData) => n.id === m.id)), ...formatted.filter((m: ChatMessageData) => !stagedMessageIds.current.has(m.id))] : formatted.filter((m: ChatMessageData) => !stagedMessageIds.current.has(m.id));
          });
          setHasOlder(data.length === 15 && !messages.some((m) => m.createdAt === data[0]?.created_at));
          setChatError(null);
          
          const pinned = formatted.find((m: ChatMessageData) => m.pinned);
          setPinnedMsg(pinned || null);
        } else if (active) setChatError("Unable to load chat messages.");

        if (rulesRes.ok) {
          const rulesData = await rulesRes.json();
          if (active) setRules(rulesData.map((r: any) => r.rule_text));
        }

        if (onlineRes.ok) {
          const onlineData = await onlineRes.json();
          if (active) {
            setOnlineUsers(onlineData.users || []);
            onlineBase.current = onlineData.count || 0;
            setOnlineCount(onlineBase.current);
          }
        }
        if (lockRes.ok) { const lockData = await lockRes.json(); if (active) { setChatLocked(Boolean(lockData.locked)); setBanNotice(lockData.banned ? { reason: lockData.banReason || "Chat policy violation", expiresAt: lockData.expiresAt || null } : null); } }
      } catch (err) {
        console.error("Failed to fetch chat data:", err);
        if (active) setChatError("Unable to connect to chat. Retrying…");
      } finally {
        if (active) setChatLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  const loadOlder = async () => {
    if (loadingOlder.current || !hasOlder || !messages.length) return;
    loadingOlder.current = true;
    const el = scrollerRef.current;
    const height = el?.scrollHeight ?? 0;
    try {
      const before = encodeURIComponent(messages[0].createdAt || "");
      const res = await fetch(`/api/chat/messages?limit=15&before=${before}`);
      if (res.ok) {
        const rows = await res.json();
        setHasOlder(rows.length === 15);
        const older = rows.map((m: any) => ({ id: m.id, userId: m.user_id || "system", username: m.username || "User", avatar: m.avatar || m.avatar_url || m.username || m.first_name?.[0] || "U", avatarUrl: m.avatar_url, text: m.message, timestamp: new Date(m.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }), createdAt: m.created_at, own: Boolean(m.own), pinned: m.pinned, admin: m.is_admin, replyText: m.reply_to?.message, replyUsername: m.reply_to?.username }));
        setMessages((prev) => [...older.filter((m: ChatMessageData) => !prev.some((p) => p.id === m.id)), ...prev]);
        requestAnimationFrame(() => { if (el) el.scrollTop += el.scrollHeight - height; });
      }
    } finally { loadingOlder.current = false; }
  };

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const hasProfanity = PROFANITY.some((w) => trimmed.toLowerCase().includes(w));
    if (hasProfanity) {
      setModNotice("Your message was blocked by the auto-moderation filter.");
      window.clearTimeout(modTimer.current);
      modTimer.current = window.setTimeout(() => setModNotice(null), 3000);
      setInput("");
      return;
    }

    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, replyTo: replyTo?.id }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setModNotice(data?.message || `Failed to send${replyTo ? " reply" : " message"}.`);
        window.clearTimeout(modTimer.current);
        modTimer.current = window.setTimeout(() => setModNotice(null), 3000);
        return;
      }

      setInput("");
      setReplyTo(null);
    } catch (err: any) {
      setModNotice(err.message || `Failed to send${replyTo ? " reply" : " message"}.`);
      window.clearTimeout(modTimer.current);
      modTimer.current = window.setTimeout(() => setModNotice(null), 3000);
    }
  }, [input, replyTo]);

  const submitReport = async () => {
    if (!reportTarget || !reportReason.trim()) return;
    const res = await fetch("/api/chat/report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messageId: reportTarget.id, reason: reportReason.trim() }) });
    setModNotice(res.ok ? "Report sent for admin review." : "Could not submit report.");
    setReportTarget(null); setReportReason("");
  };

  return (
    <UserShell active="Community">
      <div
        className="flex h-[calc(100dvh-var(--shell-offset,0px))] max-h-full min-h-0 w-full overflow-hidden"
        style={{ "--shell-offset": "64px" } as CSSProperties}
      >
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border border-border bg-card">

          {/* ── Header ────────────────────────────────── */}
          <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">International Chat</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {onlineCount} members online
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="inline-block size-1.5 rounded-full bg-foreground" />
              {onlineCount} Online
            </Button>
          </header>

          {/* ── Rules + Pinned ───────────────────────────── */}
          <div className="shrink-0 border-b border-border pb-1 pt-3">
            <RulesBanner rules={rules} />
            {pinnedMsg && <PinnedMessage msg={pinnedMsg} />}
          </div>

          {/* ── Moderation notice ─────────────────────────── */}
          {modNotice && (
            <div className="mx-4 mt-2 flex shrink-0 items-center gap-2 rounded-lg border border-border px-4 py-2">
              <span className="text-xs font-semibold">{modNotice}</span>
            </div>
          )}

          {/* ── Messages ─────────────────────────────────── */}
          <div ref={scrollerRef} onScroll={(e) => { const el = e.currentTarget; if (el.scrollTop < 80) void loadOlder(); setShowLatest(el.scrollHeight - el.scrollTop - el.clientHeight > 120); }} className="relative min-h-0 flex-1 overflow-y-auto px-3 py-5 sm:px-5">
            <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-3">
              {chatLoading ? <p className="m-auto text-sm text-muted-foreground">Loading chat…</p> : chatError && messages.length === 0 ? <p className="m-auto text-sm text-muted-foreground">{chatError}</p> : messages.length === 0 ? <p className="m-auto text-sm text-muted-foreground">No messages yet.</p> : messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} onReply={setReplyTo} onReport={setReportTarget} />
              ))}
              {typingMessage && <div key={typingMessage.id} className="flex items-end gap-2 self-start" aria-label={`${typingMessage.username} is typing`}><AvatarGlyph letter={typingMessage.avatar} src={typingMessage.avatarUrl} /><div className="flex items-center gap-1 rounded-2xl bg-muted px-3 py-2.5">{[0, 1, 2].map((dot) => <span key={dot} className="size-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${dot * 150}ms` }} />)}</div></div>}
            </div>
            {showLatest && <button type="button" aria-label="Jump to latest messages" onClick={() => { scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" }); setShowLatest(false); }} className="sticky bottom-3 float-right mr-3 grid size-10 place-items-center rounded-full border border-border bg-card shadow-lg"><ChevronDown className="size-5" /></button>}
          </div>

          {/* ── Input ─────────────────────────────────────── */}
          <div className="shrink-0 border-t border-border p-3">
            {(chatLocked || banNotice) && <p role="status" className="mx-auto mb-2 max-w-3xl rounded-lg border border-border bg-muted px-3 py-2 text-center text-sm font-medium">{banNotice ? <>Chat access suspended. Reason: {banNotice.reason}. {banNotice.expiresAt ? `Until ${new Date(banNotice.expiresAt).toLocaleString()}.` : "No end time set."}</> : "Chat is locked by an admin."}</p>}
            <div className={`relative mx-auto flex max-w-3xl items-center gap-2 ${chatLocked || banNotice ? "opacity-60" : ""}`}>
              {replyTo && <div className="absolute bottom-full left-0 right-0 mb-2 flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-xs"><span className="truncate">Replying to <b>{replyTo.username}</b>: {replyTo.text.slice(0, 80)}</span><button type="button" aria-label="Cancel reply" onClick={() => setReplyTo(null)}><X className="size-4" /></button></div>}
              {emojiOpen && (
                <EmojiPicker
                  onSelect={(e) => setInput((p) => p + e)}
                  onClose={() => setEmojiOpen(false)}
                />
              )}
              <button
                type="button"
                onClick={() => setEmojiOpen((p) => !p)}
                aria-label="Add emoji"
                className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Smile className="size-4" />
              </button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={banNotice ? "You are banned from chat" : chatLocked ? "Chat is locked" : "Message the community…"}
                className="h-10 flex-1 rounded-full"
                disabled={chatLocked || !!banNotice}
              />
              <Button
                size="icon"
                className="shrink-0 rounded-full"
                onClick={handleSend}
                disabled={chatLocked || !!banNotice || (hydrated && !input.trim())}
              >
                <SendHorizonal />
              </Button>
            </div>
          </div>
        </div>

      </div>
      {reportTarget && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><div role="dialog" aria-modal="true" aria-labelledby="report-title" className="w-full max-w-sm space-y-3 rounded-xl border border-border bg-card p-4"><h2 id="report-title" className="font-semibold">Report message</h2><p className="text-xs text-muted-foreground">{reportTarget.username}: {reportTarget.text}</p><textarea autoFocus value={reportReason} onChange={(e) => setReportReason(e.target.value)} maxLength={1000} placeholder="Why are you reporting this message?" className="min-h-24 w-full rounded border border-border bg-background p-2 text-sm"/><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setReportTarget(null)}>Cancel</Button><Button disabled={!reportReason.trim()} onClick={submitReport}>Submit report</Button></div></div></div>}
    </UserShell>
  );
}
