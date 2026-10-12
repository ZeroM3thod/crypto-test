// app/(admin)/_components/community-chat-view.tsx
"use client";

import {
  ArrowDown,
  ArrowUp,
  Ban as BanIcon,
  ChevronDown,
  ChevronUp,
  Globe,
  Lock,
  Pencil,
  Pin,
  PinOff,
  Play,
  Plus,
  ScrollText,
  Search,
  SendHorizonal,
  Smile,
  Square,
  Trash2,
  Unlock,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/motion/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/motion/tabs";
import {
  EMOJIS,
  LANGS,
  type Ban,
  type ChatMessage,
  type ChatUser,
  type SavedScript,
  type ScriptLine,
} from "@/lib/admin-community-data";
import { Dialog } from "./detail-ui";
import { PageHeader } from "./finance-ui";
import { Toast, useToast } from "./review-ui";

/* ---------- constants & helpers ---------- */

const ADMIN_PERSONA: ChatUser = {
  id: "admin",
  username: "Admin",
  avatar: "A",
  lang: "EN",
};

const DURATIONS = [
  { id: "1h", label: "1 hour", ms: 3_600_000 },
  { id: "6h", label: "6 hours", ms: 6 * 3_600_000 },
  { id: "24h", label: "24 hours", ms: 24 * 3_600_000 },
  { id: "3d", label: "3 days", ms: 3 * 86_400_000 },
  { id: "7d", label: "7 days", ms: 7 * 86_400_000 },
  { id: "30d", label: "30 days", ms: 30 * 86_400_000 },
  { id: "forever", label: "Forever", ms: null },
] as const;

type DurationId = (typeof DURATIONS)[number]["id"];

const FIELD_CLS =
  "w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring";

const LABEL_CLS =
  "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground";

const uid = () => Math.random().toString(36).slice(2, 9);

const isCustom = (id: string) => id.startsWith("p-");

const nowHM = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
};

/** "9:5" is invalid, "9:05" -> "09:05". Returns "" when invalid. */
const normTime = (t: string) => {
  const m = t.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return "";
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return "";
  return `${String(h).padStart(2, "0")}:${m[2]}`;
};

const fmtUTC = (iso: string) =>
  `${new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  })} UTC`;

const banLabel = (b: Ban) =>
  b.expiresAt === null ? "Banned forever" : `Until ${fmtUTC(b.expiresAt)}`;

/* ---------- small building blocks ---------- */

function AvatarGlyph({ letter }: { letter: string }) {
  return (
    <span className="grid size-full place-items-center rounded-full border border-border bg-background text-[11px] font-semibold text-foreground">
      {letter.toUpperCase()}
    </span>
  );
}

function IconBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
    </button>
  );
}

function DialogHeader({
  title,
  subtitle,
  onClose,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border p-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {subtitle ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="grid size-8 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

function PinnedMessage({
  msg,
  onUnpin,
}: {
  msg: ChatMessage;
  onUnpin: () => void;
}) {
  return (
    <div className="mx-4 mb-2 flex items-start gap-2 rounded-xl border border-border bg-muted/40 px-4 py-3">
      <Pin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Pinned — {msg.username}
        </p>
        <p className="text-xs leading-relaxed text-foreground">{msg.text}</p>
      </div>
      <IconBtn label="Unpin message" onClick={onUnpin}>
        <PinOff className="size-3.5" />
      </IconBtn>
    </div>
  );
}

function RulesBanner({ rules }: { rules: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mx-4 mb-2 overflow-hidden rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center justify-between px-4 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="text-[11px] font-semibold text-foreground">
          Community Rules
        </span>
        {open ? (
          <ChevronUp className="size-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-3.5 text-muted-foreground" />
        )}
      </button>
      {open ? (
        <div className="space-y-1.5 border-t border-border px-4 pb-3 pt-2">
          {rules.map((rule, i) => (
            <p key={`${i}-${rule}`} className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{i + 1}.</span>{" "}
              {rule}
            </p>
          ))}
        </div>
      ) : null}
    </div>
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
    <div className="absolute bottom-full left-0 z-30 mb-2 rounded-xl border border-border bg-card p-3 shadow-lg">
      <div className="grid grid-cols-6 gap-1.5">
        {EMOJIS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => {
              onSelect(e);
              onClose();
            }}
            className="grid size-8 place-items-center rounded-md text-base outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({
  msg,
  banned,
  onPin,
  onBan,
  onDelete,
}: {
  msg: ChatMessage;
  banned: boolean;
  onPin: () => void;
  onBan: () => void;
  onDelete: () => void;
}) {
  const admin = !!msg.admin;
  return (
    <div
      className={`group flex max-w-[85%] items-end gap-2 ${
        admin ? "flex-row-reverse self-end" : "self-start"
      }`}
    >
      <div className="size-7 shrink-0">
        <AvatarGlyph letter={msg.avatar} />
      </div>
      <div className={admin ? "text-right" : ""}>
        <div
          className={`mb-1 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground ${
            admin ? "justify-end" : ""
          }`}
        >
          <span className="font-medium text-foreground">{msg.username}</span>
          {admin ? (
            <span className="rounded-full bg-foreground px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide text-background">
              Admin
            </span>
          ) : null}
          {msg.fake ? (
            <span
              title="Sent by Admin on behalf of this persona (visible to admin only)"
              className="rounded-full border border-dashed border-border px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide"
            >
              Simulated
            </span>
          ) : null}
          {banned ? (
            <span className="rounded-full border border-border bg-muted px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide">
              Banned
            </span>
          ) : null}
          {msg.lang ? (
            <span className="inline-flex items-center gap-0.5">
              <Globe className="size-2.5" />
              {msg.lang}
            </span>
          ) : null}
          <span>{msg.timestamp}</span>
          {msg.pinned ? <Pin className="size-2.5 text-foreground" /> : null}
        </div>
        <div
          className={`inline-block rounded-lg px-3 py-2 text-left text-sm leading-relaxed ${
            admin
              ? "rounded-br-sm bg-foreground text-background"
              : "rounded-bl-sm border border-border bg-background text-foreground"
          }`}
        >
          {msg.text}
        </div>
        <div
          className={`mt-1 flex gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100 ${
            admin ? "justify-end" : ""
          }`}
        >
          <IconBtn
            label={msg.pinned ? "Unpin message" : "Pin message"}
            onClick={onPin}
          >
            {msg.pinned ? (
              <PinOff className="size-3.5" />
            ) : (
              <Pin className="size-3.5" />
            )}
          </IconBtn>
          {!admin && !banned ? (
            <IconBtn label={`Ban ${msg.username}`} onClick={onBan}>
              <BanIcon className="size-3.5" />
            </IconBtn>
          ) : null}
          <IconBtn label="Delete message" onClick={onDelete}>
            <Trash2 className="size-3.5" />
          </IconBtn>
        </div>
      </div>
    </div>
  );
}

/* ---------- side panel (online + banned) ---------- */

function SidePanel({
  tab,
  onTab,
  online,
  onlineCount,
  onEditCount,
  bans,
  onBan,
  onUnban,
}: {
  tab: "online" | "banned";
  onTab: (t: "online" | "banned") => void;
  online: ChatUser[];
  onlineCount: number;
  onEditCount: () => void;
  bans: Ban[];
  onBan: (u: { userId: string; username: string }) => void;
  onUnban: (b: Ban) => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-border p-3">
        <Tabs
          value={tab}
          onValueChange={(v) => onTab(v as "online" | "banned")}
          variant="segment"
        >
          <TabsList>
            <TabsTrigger value="online">Online ({onlineCount})</TabsTrigger>
            <TabsTrigger value="banned">Banned ({bans.length})</TabsTrigger>
          </TabsList>
        </Tabs>
        {tab === "online" ? (
          <p className="mt-2 flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
            <span>Listing {online.length} real members</span>
            <button
              type="button"
              onClick={onEditCount}
              className="inline-flex items-center gap-1 font-semibold text-foreground outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Pencil className="size-3" />
              Edit count
            </button>
          </p>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {tab === "online" ? (
          online.length ? (
            online.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-2 px-4 py-2 transition-colors hover:bg-muted/50"
              >
                <div className="relative size-7 shrink-0">
                  <AvatarGlyph letter={u.avatar} />
                  <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full border border-background bg-(--color-success)" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-medium text-foreground">
                    {u.username}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {u.lang}
                    {isCustom(u.id) ? " · Persona" : ""}
                  </p>
                </div>
                <IconBtn
                  label={`Ban ${u.username}`}
                  onClick={() => onBan({ userId: u.id, username: u.username })}
                >
                  <BanIcon className="size-3.5" />
                </IconBtn>
              </div>
            ))
          ) : (
            <p className="p-4 text-center text-xs text-muted-foreground">
              Nobody online.
            </p>
          )
        ) : bans.length ? (
          bans.map((b) => (
            <div
              key={b.userId}
              className="flex items-start gap-2 border-b border-border px-4 py-3 last:border-b-0"
            >
              <div className="size-7 shrink-0">
                <AvatarGlyph letter={b.avatar} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-medium text-foreground">
                  {b.username}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {banLabel(b)}
                </p>
                <p
                  className="truncate text-[10px] italic text-muted-foreground"
                  title={b.reason}
                >
                  “{b.reason}”
                </p>
                <div className="mt-1.5">
                  <Button size="sm" variant="outline" onClick={() => onUnban(b)}>
                    Unban
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="p-4 text-center text-xs text-muted-foreground">
            No banned users.
          </p>
        )}
      </div>
    </div>
  );
}

/* ---------- personas dialog ---------- */

function PersonasDialog({
  open,
  onClose,
  custom,
  onAdd,
  onRemove,
}: {
  open: boolean;
  onClose: () => void;
  custom: ChatUser[];
  onAdd: (username: string, lang: string) => boolean;
  onRemove: (id: string) => void;
}) {
  const [username, setUsername] = useState("");
  const [lang, setLang] = useState("EN");

  const add = () => {
    if (onAdd(username, lang)) setUsername("");
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="max-w-lg">
      <DialogHeader
        title="Manage personas"
        subtitle="Personas are extra usernames you can post as or use in scripts."
        onClose={onClose}
      />
      <div className="flex flex-col gap-5 overflow-y-auto p-5">
        <div className="flex flex-col gap-2">
          <span className={LABEL_CLS}>New persona</span>
          <div className="flex flex-wrap gap-2">
            <input
              autoFocus
              value={username}
              maxLength={24}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder="Username, e.g. Maya_R"
              className={`${FIELD_CLS} h-10 flex-1`}
            />
            <select
              aria-label="Language"
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className={`${FIELD_CLS} h-10 w-24`}
            >
              {LANGS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            <Button size="md" variant="primary" onClick={add}>
              <Plus className="size-4" />
              Add
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className={LABEL_CLS}>Your personas ({custom.length})</span>
          {custom.length ? (
            <div className="flex flex-col rounded-xl border border-border">
              {custom.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 border-b border-border p-3 last:border-b-0"
                >
                  <div className="size-7 shrink-0">
                    <AvatarGlyph letter={p.avatar} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {p.username}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{p.lang}</p>
                  </div>
                  <IconBtn label={`Remove ${p.username}`} onClick={() => onRemove(p.id)}>
                    <Trash2 className="size-3.5" />
                  </IconBtn>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
              No custom personas yet. Pasting a script also creates them
              automatically.
            </p>
          )}
        </div>
      </div>
      <div className="flex justify-end border-t border-border p-4">
        <Button size="md" variant="ghost" onClick={onClose}>
          Done
        </Button>
      </div>
    </Dialog>
  );
}

/* ---------- script dialog ---------- */

type RunMode = "now" | "live";

function ScriptDialog({
  open,
  onClose,
  personas,
  saved,
  onSave,
  onDelete,
  onRun,
  ensurePersona,
  onNotice,
}: {
  open: boolean;
  onClose: () => void;
  personas: ChatUser[];
  saved: SavedScript[];
  onSave: (name: string, lines: ScriptLine[]) => void;
  onDelete: (id: string) => void;
  onRun: (lines: ScriptLine[], mode: RunMode) => boolean;
  ensurePersona: (username: string) => string;
  onNotice: (msg: string) => void;
}) {
  const blank = (personaId: string): ScriptLine => ({
    id: uid(),
    personaId,
    text: "",
    time: "",
    delay: 2,
  });

  const [name, setName] = useState("");
  const [lines, setLines] = useState<ScriptLine[]>(() => [
    blank(personas[1]?.id ?? "admin"),
    blank(personas[2]?.id ?? "admin"),
  ]);
  const [view, setView] = useState<"builder" | "paste">("builder");
  const [paste, setPaste] = useState("");
  const [runMode, setRunMode] = useState<RunMode>("live");

  const update = (id: string, patch: Partial<ScriptLine>) =>
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const move = (i: number, dir: -1 | 1) =>
    setLines((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const addLine = () =>
    setLines((prev) => {
      // alternate speakers so it reads like a conversation
      const lastIdx = personas.findIndex(
        (p) => p.id === prev[prev.length - 1]?.personaId,
      );
      const next = personas[(lastIdx + 1) % personas.length] ?? personas[0];
      return [...prev, blank(next?.id ?? "admin")];
    });

  const parsePaste = () => {
    const out: ScriptLine[] = [];
    paste.split("\n").forEach((raw) => {
      const m = raw.match(
        /^\s*(?:\[(\d{1,2}:\d{2})\]\s*)?([^:[\]]{1,30}?)\s*:\s*(.+?)\s*$/,
      );
      if (!m) return;
      out.push({
        id: uid(),
        personaId: ensurePersona(m[2].trim()),
        text: m[3],
        time: m[1] ? normTime(m[1]) : "",
        delay: 2,
      });
    });
    if (!out.length) {
      onNotice("No lines found. Use the format: [09:14] username: message");
      return;
    }
    setLines(out);
    setView("builder");
    onNotice(`✓ Parsed ${out.length} lines into the builder.`);
  };

  const save = () => {
    const clean = lines.filter((l) => l.text.trim());
    if (!name.trim()) {
      onNotice("Give the script a name before saving.");
      return;
    }
    if (!clean.length) {
      onNotice("Add at least one line before saving.");
      return;
    }
    onSave(name.trim(), clean);
  };

  const load = (s: SavedScript) => {
    setName(s.name);
    setLines(s.lines.map((l) => ({ ...l, id: uid() })));
    setView("builder");
  };

  const run = () => {
    if (onRun(lines, runMode)) onClose();
  };

  const PASTE_EXAMPLE =
    "[09:14] Carlos_M: Good morning everyone!\n[09:15] Yuki_T: Morning! Did you see BTC?\n[09:15] Fatima_A: Up 4% since midnight 🚀";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="max-w-3xl">
      <DialogHeader
        title="Script chat"
        subtitle="Write a conversation between members and play it into the chat."
        onClose={onClose}
      />

      <div className="flex flex-col gap-5 overflow-y-auto p-5">
        {/* saved scripts */}
        <section className="flex flex-col gap-2">
          <span className={LABEL_CLS}>Saved scripts ({saved.length})</span>
          {saved.length ? (
            <div className="flex flex-wrap gap-2">
              {saved.map((s) => (
                <span
                  key={s.id}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-muted py-1 pl-3 pr-1.5 text-xs text-foreground"
                >
                  <button
                    type="button"
                    onClick={() => load(s)}
                    className="font-medium outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {s.name}
                  </button>
                  <span className="text-muted-foreground">
                    · {s.lines.length} lines
                  </span>
                  <button
                    type="button"
                    aria-label={`Delete ${s.name}`}
                    onClick={() => onDelete(s.id)}
                    className="grid size-4 place-items-center rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Nothing saved yet. Build a script below and press “Save script”.
            </p>
          )}
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs
            value={view}
            onValueChange={(v) => setView(v as "builder" | "paste")}
            variant="segment"
          >
            <TabsList>
              <TabsTrigger value="builder">Builder</TabsTrigger>
              <TabsTrigger value="paste">Paste text</TabsTrigger>
            </TabsList>
          </Tabs>
          {view === "builder" ? (
            <div className="flex items-center gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Script name…"
                className={`${FIELD_CLS} h-9 w-44`}
              />
              <Button size="sm" variant="outline" onClick={save}>
                Save script
              </Button>
            </div>
          ) : null}
        </div>

        {view === "paste" ? (
          <section className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">
              One message per line as{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-foreground">
                [HH:MM] username: message
              </code>
              . The time is optional. Unknown usernames become personas
              automatically.
            </p>
            <textarea
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              placeholder={PASTE_EXAMPLE}
              className={`${FIELD_CLS} min-h-48 resize-y py-2.5 font-mono text-xs`}
            />
            <div>
              <Button size="md" variant="primary" onClick={parsePaste}>
                Parse into builder
              </Button>
            </div>
          </section>
        ) : (
          <section className="flex flex-col gap-3">
            {lines.map((l, i) => (
              <div
                key={l.id}
                className="flex flex-col gap-2 rounded-xl border border-border bg-muted/30 p-3"
              >
                <div className="grid grid-cols-[1fr_6.5rem_5rem] gap-2">
                  <label className="flex flex-col gap-1">
                    <span className={LABEL_CLS}>User</span>
                    <select
                      value={l.personaId}
                      onChange={(e) => update(l.id, { personaId: e.target.value })}
                      className={`${FIELD_CLS} h-9`}
                    >
                      {!personas.some((p) => p.id === l.personaId) ? (
                        <option value={l.personaId} disabled>
                          (unavailable)
                        </option>
                      ) : null}
                      {personas.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.username}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className={LABEL_CLS}>Time</span>
                    <input
                      type="time"
                      value={l.time}
                      onChange={(e) => update(l.id, { time: e.target.value })}
                      className={`${FIELD_CLS} h-9`}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className={LABEL_CLS}>Delay (s)</span>
                    <input
                      type="number"
                      min={0}
                      max={600}
                      value={l.delay}
                      onChange={(e) =>
                        update(l.id, {
                          delay: Math.max(0, Math.min(600, Number(e.target.value) || 0)),
                        })
                      }
                      className={`${FIELD_CLS} h-9`}
                    />
                  </label>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-5 shrink-0 text-center text-xs font-semibold text-muted-foreground">
                    {i + 1}
                  </span>
                  <input
                    value={l.text}
                    onChange={(e) => update(l.id, { text: e.target.value })}
                    placeholder="Message text…"
                    className={`${FIELD_CLS} h-10`}
                  />
                  <IconBtn label="Move up" onClick={() => move(i, -1)}>
                    <ArrowUp className="size-3.5" />
                  </IconBtn>
                  <IconBtn label="Move down" onClick={() => move(i, 1)}>
                    <ArrowDown className="size-3.5" />
                  </IconBtn>
                  <IconBtn
                    label="Delete line"
                    onClick={() =>
                      setLines((prev) => prev.filter((x) => x.id !== l.id))
                    }
                  >
                    <Trash2 className="size-3.5" />
                  </IconBtn>
                </div>
              </div>
            ))}
            <div>
              <Button size="md" variant="outline" onClick={addLine}>
                <Plus className="size-4" />
                Add line
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              <strong className="text-foreground">Time</strong> is the timestamp
              shown on the message (blank = the moment it is posted).{" "}
              <strong className="text-foreground">Delay</strong> is the wait
              before a line appears in “Play live” mode.
            </p>
          </section>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4">
        <Tabs
          value={runMode}
          onValueChange={(v) => setRunMode(v as RunMode)}
          variant="segment"
        >
          <TabsList>
            <TabsTrigger value="live">Play live</TabsTrigger>
            <TabsTrigger value="now">Insert now</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-2">
          <Button size="md" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button size="md" variant="primary" onClick={run}>
            <Play className="size-4" />
            Run script
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

/* ---------- main view ---------- */

export function CommunityChatView({
  initialMessages,
  users,
  initialBans,
  initialRules,
  initialBlockedWords,
  initialScripts,
}: {
  initialMessages: ChatMessage[];
  users: ChatUser[];
  initialBans: Ban[];
  initialRules: string[];
  initialBlockedWords: string[];
  initialScripts: SavedScript[];
}) {
  const { toast, showToast } = useToast();

  const [messages, setMessages] = useState(initialMessages);
  const [bans, setBans] = useState(initialBans);
  const [rules, setRules] = useState(initialRules);
  const [blocked, setBlocked] = useState(initialBlockedWords);
  const [locked, setLocked] = useState(false);

  // online count override (null = automatic)
  const [onlineOverride, setOnlineOverride] = useState<number | null>(null);
  const [onlineOpen, setOnlineOpen] = useState(false);
  const [onlineMode, setOnlineMode] = useState<"auto" | "custom">("auto");
  const [onlineDraft, setOnlineDraft] = useState("");

  // personas + scripts
  const [custom, setCustom] = useState<ChatUser[]>([]);
  const customRef = useRef<ChatUser[]>([]);
  const [personaId, setPersonaId] = useState("admin");
  const [personasOpen, setPersonasOpen] = useState(false);
  const [scriptOpen, setScriptOpen] = useState(false);
  const [scripts, setScripts] = useState(initialScripts);
  const [playing, setPlaying] = useState(false);
  const timers = useRef<number[]>([]);

  const [input, setInput] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sideTab, setSideTab] = useState<"online" | "banned">("online");

  // ban dialog
  const [banTarget, setBanTarget] = useState<{
    userId: string;
    username: string;
  } | null>(null);
  const [banDuration, setBanDuration] = useState<DurationId>("24h");
  const [banReason, setBanReason] = useState("");
  const [banDeleteMsgs, setBanDeleteMsgs] = useState(false);

  // rules dialog
  const [rulesOpen, setRulesOpen] = useState(false);
  const [ruleDraft, setRuleDraft] = useState<string[]>([]);
  const [wordDraft, setWordDraft] = useState<string[]>([]);
  const [newRule, setNewRule] = useState("");
  const [newWord, setNewWord] = useState("");

  const scrollerRef = useRef<HTMLDivElement>(null);

  /* ---------- clock (expires timed bans automatically) ---------- */

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  /* stop any running script when leaving the page */
  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t));
    },
    [],
  );

  /* ---------- members / personas ---------- */

  const members = useMemo<ChatUser[]>(() => [...users, ...custom], [users, custom]);

  const lookup = useCallback(
    (id: string): ChatUser | undefined =>
      id === "admin" ? ADMIN_PERSONA : members.find((m) => m.id === id),
    [members],
  );

  const activeBans = useMemo(
    () =>
      bans.filter(
        (b) => b.expiresAt === null || now === 0 || Date.parse(b.expiresAt) > now,
      ),
    [bans, now],
  );
  const bannedIds = useMemo(
    () => new Set(activeBans.map((b) => b.userId)),
    [activeBans],
  );
  const online = useMemo(
    () => members.filter((u) => !bannedIds.has(u.id)),
    [members, bannedIds],
  );
  const postable = useMemo(() => [ADMIN_PERSONA, ...online], [online]);
  const activePersona = postable.find((p) => p.id === personaId) ?? ADMIN_PERSONA;

  const onlineCount = onlineOverride ?? online.length;

  const openOnline = () => {
    setOnlineMode(onlineOverride === null ? "auto" : "custom");
    setOnlineDraft(String(onlineOverride ?? online.length));
    setOnlineOpen(true);
  };
  const closeOnline = useCallback(() => setOnlineOpen(false), []);

  const bumpOnline = (delta: number) =>
    setOnlineDraft((v) => String(Math.max(0, (Number(v) || 0) + delta)));

  const saveOnline = () => {
    if (onlineMode === "auto") {
      // TODO: call your API here (clear the online count override)
      setOnlineOverride(null);
      showToast("✓ Online count is automatic again.");
      closeOnline();
      return;
    }
    const n = Number(onlineDraft);
    if (onlineDraft.trim() === "" || !Number.isInteger(n) || n < 0 || n > 100000) {
      showToast("Enter a whole number between 0 and 100,000.");
      return;
    }
    // TODO: call your API here (save the online count override)
    setOnlineOverride(n);
    showToast(`✓ Online count set to ${n.toLocaleString()}.`);
    closeOnline();
  };

  /* ---------- derived ---------- */

  const pinned = messages.find((m) => m.pinned);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? messages.filter(
          (m) =>
            m.text.toLowerCase().includes(q) ||
            m.username.toLowerCase().includes(q),
        )
      : messages;
  }, [messages, query]);

  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [messages.length]);

  /* ---------- posting (local state only — no DB) ---------- */

  const pushMessage = useCallback((p: ChatUser, text: string, ts?: string) => {
    // TODO: call your API here (post message as Admin or on behalf of a persona)
    setMessages((prev) => [
      ...prev,
      {
        id: `m${Date.now()}-${uid()}`,
        userId: p.id,
        username: p.username,
        avatar: p.avatar,
        lang: p.id === "admin" ? undefined : p.lang,
        admin: p.id === "admin",
        fake: p.id !== "admin",
        text,
        timestamp: ts || nowHM(),
      },
    ]);
  }, []);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    pushMessage(activePersona, text);
    setInput("");
  }, [input, activePersona, pushMessage]);

  /* ---------- persona management ---------- */

  const updateCustom = (next: ChatUser[]) => {
    customRef.current = next;
    setCustom(next);
  };

  const addPersona = (usernameRaw: string, lang: string) => {
    const username = usernameRaw.trim();
    if (username.length < 2) {
      showToast("Username must be at least 2 characters.");
      return false;
    }
    const taken = [ADMIN_PERSONA, ...users, ...customRef.current].some(
      (p) => p.username.toLowerCase() === username.toLowerCase(),
    );
    if (taken) {
      showToast("That username already exists.");
      return false;
    }
    updateCustom([
      ...customRef.current,
      {
        id: `p-${Date.now()}`,
        username,
        avatar: username[0].toUpperCase(),
        lang,
      },
    ]);
    showToast(`✓ Persona “${username}” added.`);
    return true;
  };

  const removePersona = (id: string) => {
    updateCustom(customRef.current.filter((p) => p.id !== id));
    if (personaId === id) setPersonaId("admin");
    showToast("Persona removed.");
  };

  /** used by "Paste text": find a username or create it as a persona */
  const ensurePersona = (usernameRaw: string): string => {
    const username = usernameRaw.trim();
    const all = [ADMIN_PERSONA, ...users, ...customRef.current];
    const found = all.find(
      (p) => p.username.toLowerCase() === username.toLowerCase(),
    );
    if (found) return found.id;
    const p: ChatUser = {
      id: `p-${Date.now()}-${customRef.current.length}`,
      username,
      avatar: username[0].toUpperCase(),
      lang: "EN",
    };
    updateCustom([...customRef.current, p]);
    return p.id;
  };

  /* ---------- scripts ---------- */

  const stopScript = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    setPlaying(false);
  }, []);

  const runScript = (lines: ScriptLine[], mode: "now" | "live"): boolean => {
    const valid = lines.filter((l) => l.text.trim());
    const resolved = valid
      .map((l) => ({ line: l, persona: lookup(l.personaId) }))
      .filter(
        (x): x is { line: ScriptLine; persona: ChatUser } =>
          !!x.persona && !bannedIds.has(x.persona.id),
      );
    const skipped = valid.length - resolved.length;

    if (!resolved.length) {
      showToast("Add at least one line from an available (not banned) user.");
      return false;
    }

    stopScript();

    if (mode === "now") {
      resolved.forEach(({ line, persona }) =>
        pushMessage(persona, line.text.trim(), normTime(line.time)),
      );
      showToast(
        `✓ ${resolved.length} messages inserted${
          skipped ? ` (${skipped} skipped — banned/removed user)` : ""
        }.`,
      );
      return true;
    }

    setPlaying(true);
    let acc = 0;
    resolved.forEach(({ line, persona }, i) => {
      acc += Math.max(0, line.delay) * 1000;
      const t = window.setTimeout(() => {
        pushMessage(persona, line.text.trim(), normTime(line.time));
        if (i === resolved.length - 1) {
          timers.current = [];
          setPlaying(false);
          showToast("✓ Script finished.");
        }
      }, acc);
      timers.current.push(t);
    });
    showToast(
      `▶ Playing ${resolved.length} messages${
        skipped ? ` (${skipped} skipped)` : ""
      }…`,
    );
    return true;
  };

  const saveScript = (name: string, lines: ScriptLine[]) => {
    // TODO: call your API here (save script)
    setScripts((prev) => [
      { id: `s${Date.now()}`, name, lines },
      ...prev.filter((s) => s.name.toLowerCase() !== name.toLowerCase()),
    ]);
    showToast(`✓ Script “${name}” saved.`);
  };

  const deleteScript = (id: string) => {
    // TODO: call your API here (delete script)
    setScripts((prev) => prev.filter((s) => s.id !== id));
    showToast("Script deleted.");
  };

  /* ---------- message actions ---------- */

  const togglePin = (m: ChatMessage) => {
    // TODO: call your API here (pin / unpin) — one pinned message at a time
    setMessages((prev) =>
      prev.map((x) => ({ ...x, pinned: x.id === m.id ? !m.pinned : false })),
    );
    showToast(m.pinned ? "Message unpinned." : "📌 Message pinned.");
  };

  const deleteMessage = (m: ChatMessage) => {
    if (!window.confirm(`Delete this message from ${m.username}?`)) return;
    // TODO: call your API here (delete message)
    setMessages((prev) => prev.filter((x) => x.id !== m.id));
    showToast("✕ Message deleted.");
  };

  /* ---------- ban / unban ---------- */

  const openBan = (u: { userId: string; username: string }) => {
    setBanTarget(u);
    setBanDuration("24h");
    setBanReason("");
    setBanDeleteMsgs(false);
  };
  const closeBan = useCallback(() => setBanTarget(null), []);

  const confirmBan = () => {
    if (!banTarget) return;
    if (banReason.trim().length < 5) {
      showToast("Please enter a ban reason (at least 5 characters).");
      return;
    }
    // TODO: call your API here (ban user)
    const d = DURATIONS.find((x) => x.id === banDuration)!;
    const nowMs = Date.now();
    const source = lookup(banTarget.userId);
    const ban: Ban = {
      userId: banTarget.userId,
      username: banTarget.username,
      avatar: source?.avatar ?? banTarget.username[0] ?? "?",
      reason: banReason.trim(),
      bannedAt: new Date(nowMs).toISOString(),
      expiresAt: d.ms === null ? null : new Date(nowMs + d.ms).toISOString(),
      by: "Admin",
    };
    setBans((prev) => [ban, ...prev.filter((b) => b.userId !== ban.userId)]);
    if (banDeleteMsgs) {
      setMessages((prev) => prev.filter((m) => m.userId !== ban.userId));
    }
    showToast(
      `✕ ${ban.username} banned ${
        d.ms === null ? "forever" : `for ${d.label}`
      }.`,
    );
    setSideTab("banned");
    closeBan();
  };

  const unban = (b: Ban) => {
    // TODO: call your API here (unban user)
    setBans((prev) => prev.filter((x) => x.userId !== b.userId));
    showToast(`✓ ${b.username} has been unbanned.`);
  };

  /* ---------- rules dialog ---------- */

  const openRules = () => {
    setRuleDraft([...rules]);
    setWordDraft([...blocked]);
    setNewRule("");
    setNewWord("");
    setRulesOpen(true);
  };
  const closeRules = useCallback(() => setRulesOpen(false), []);

  const moveRule = (i: number, dir: -1 | 1) =>
    setRuleDraft((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const addRule = () => {
    const t = newRule.trim();
    if (!t) return;
    setRuleDraft((prev) => [...prev, t]);
    setNewRule("");
  };

  const addWord = () => {
    const t = newWord.trim().toLowerCase();
    if (!t || wordDraft.includes(t)) return;
    setWordDraft((prev) => [...prev, t]);
    setNewWord("");
  };

  const saveRules = () => {
    const cleaned = ruleDraft.map((r) => r.trim()).filter(Boolean);
    if (cleaned.length === 0) {
      showToast("Add at least one community rule.");
      return;
    }
    // TODO: call your API here (save rules + blocked words)
    setRules(cleaned);
    setBlocked(wordDraft);
    showToast("✓ Rules updated.");
    closeRules();
  };

  /* ---------- lock chat ---------- */

  const toggleLock = () => {
    // TODO: call your API here (lock / unlock chat for users)
    setLocked((v) => !v);
    showToast(
      locked
        ? "✓ Chat unlocked for all members."
        : "🔒 Chat locked — only Admin can send.",
    );
  };

  const side = (
    <SidePanel
      tab={sideTab}
      onTab={setSideTab}
      online={online}
      onlineCount={onlineCount}
      onEditCount={openOnline}
      bans={activeBans}
      onBan={openBan}
      onUnban={unban}
    />
  );

  return (
    <>
      <Toast toast={toast} />

      {/* ---------- personas + script dialogs ---------- */}
      <PersonasDialog
        open={personasOpen}
        onClose={() => setPersonasOpen(false)}
        custom={custom}
        onAdd={addPersona}
        onRemove={removePersona}
      />
      <ScriptDialog
        open={scriptOpen}
        onClose={() => setScriptOpen(false)}
        personas={postable}
        saved={scripts}
        onSave={saveScript}
        onDelete={deleteScript}
        onRun={runScript}
        ensurePersona={ensurePersona}
        onNotice={showToast}
      />

      {/* ---------- online count dialog ---------- */}
      <Dialog open={onlineOpen} onClose={closeOnline} maxWidth="max-w-md">
        <DialogHeader
          title="Edit online count"
          subtitle="This is the number members see as “members online”."
          onClose={closeOnline}
        />
        <div className="flex flex-col gap-5 overflow-y-auto p-5">
          <Tabs
            value={onlineMode}
            onValueChange={(v) => setOnlineMode(v as "auto" | "custom")}
            variant="segment"
          >
            <TabsList>
              <TabsTrigger value="auto">Automatic</TabsTrigger>
              <TabsTrigger value="custom">Custom number</TabsTrigger>
            </TabsList>
          </Tabs>

          {onlineMode === "auto" ? (
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Real members online
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                {online.length.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                The count follows the real member list, excluding banned users.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5">
                <span className={LABEL_CLS}>Number shown to members</span>
                <input
                  autoFocus
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={100000}
                  value={onlineDraft}
                  onChange={(e) => setOnlineDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveOnline()}
                  className={`${FIELD_CLS} h-12 text-lg font-semibold tabular-nums`}
                />
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[-10, -1, 1, 10].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => bumpOnline(d)}
                    className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {d > 0 ? `+${d}` : d}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setOnlineDraft(String(online.length))}
                  className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Use real ({online.length})
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                The member list on the right still shows the {online.length}{" "}
                real members. Only the displayed number changes.
              </p>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-border p-4">
          <Button size="md" variant="ghost" onClick={closeOnline}>
            Cancel
          </Button>
          <Button size="md" variant="primary" onClick={saveOnline}>
            Save
          </Button>
        </div>
      </Dialog>

      {/* ---------- ban dialog ---------- */}
      <Dialog open={!!banTarget} onClose={closeBan} maxWidth="max-w-lg">
        {banTarget ? (
          <>
            <DialogHeader
              title={`Ban ${banTarget.username}`}
              subtitle="Banned users can still read the chat but cannot send messages."
              onClose={closeBan}
            />
            <div className="flex flex-col gap-5 overflow-y-auto p-5">
              <div className="flex flex-col gap-2">
                <span className={LABEL_CLS}>Ban duration</span>
                <div className="flex flex-wrap gap-1.5">
                  {DURATIONS.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setBanDuration(d.id)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
                        banDuration === d.id
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-background text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className={LABEL_CLS}>Reason *</span>
                <textarea
                  autoFocus
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Why is this user being banned?"
                  className={`${FIELD_CLS} min-h-24 resize-y py-2.5`}
                />
              </label>

              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={banDeleteMsgs}
                  onChange={(e) => setBanDeleteMsgs(e.target.checked)}
                  className="size-4 accent-foreground"
                />
                Also delete all of their messages
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-border p-4">
              <Button size="md" variant="ghost" onClick={closeBan}>
                Cancel
              </Button>
              <Button size="md" variant="primary" onClick={confirmBan}>
                ✕ Ban user
              </Button>
            </div>
          </>
        ) : null}
      </Dialog>

      {/* ---------- rules dialog ---------- */}
      <Dialog open={rulesOpen} onClose={closeRules} maxWidth="max-w-2xl">
        <DialogHeader
          title="Edit community rules"
          subtitle="Rules appear in the Community Rules banner on the user chat page."
          onClose={closeRules}
        />
        <div className="flex flex-col gap-6 overflow-y-auto p-5">
          <section className="flex flex-col gap-2.5">
            <h3 className={LABEL_CLS}>Rules</h3>
            {ruleDraft.map((r, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-5 shrink-0 text-center text-xs font-semibold text-muted-foreground">
                  {i + 1}.
                </span>
                <input
                  value={r}
                  onChange={(e) =>
                    setRuleDraft((prev) =>
                      prev.map((x, j) => (j === i ? e.target.value : x)),
                    )
                  }
                  className={`${FIELD_CLS} h-10`}
                />
                <IconBtn label="Move up" onClick={() => moveRule(i, -1)}>
                  <ArrowUp className="size-3.5" />
                </IconBtn>
                <IconBtn label="Move down" onClick={() => moveRule(i, 1)}>
                  <ArrowDown className="size-3.5" />
                </IconBtn>
                <IconBtn
                  label="Delete rule"
                  onClick={() =>
                    setRuleDraft((prev) => prev.filter((_, j) => j !== i))
                  }
                >
                  <Trash2 className="size-3.5" />
                </IconBtn>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addRule()}
                placeholder="Add a new rule…"
                className={`${FIELD_CLS} h-10`}
              />
              <Button size="md" variant="outline" onClick={addRule}>
                <Plus className="size-4" />
                Add
              </Button>
            </div>
          </section>

          <section className="flex flex-col gap-2.5">
            <h3 className={LABEL_CLS}>Blocked words (auto-moderation)</h3>
            <p className="text-xs text-muted-foreground">
              Messages containing these words are blocked before they are sent.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {wordDraft.length ? (
                wordDraft.map((w) => (
                  <span
                    key={w}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-muted py-1 pl-3 pr-1.5 text-xs text-foreground"
                  >
                    {w}
                    <button
                      type="button"
                      aria-label={`Remove ${w}`}
                      onClick={() =>
                        setWordDraft((prev) => prev.filter((x) => x !== w))
                      }
                      className="grid size-4 place-items-center rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">
                  No blocked words.
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <input
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addWord()}
                placeholder="Add a blocked word…"
                className={`${FIELD_CLS} h-10`}
              />
              <Button size="md" variant="outline" onClick={addWord}>
                <Plus className="size-4" />
                Add
              </Button>
            </div>
          </section>
        </div>
        <div className="flex justify-end gap-2 border-t border-border p-4">
          <Button size="md" variant="ghost" onClick={closeRules}>
            Cancel
          </Button>
          <Button size="md" variant="primary" onClick={saveRules}>
            Save changes
          </Button>
        </div>
      </Dialog>

      {/* ---------- page ---------- */}
      <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
        <div>
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Community · Moderation
          </span>
          <PageHeader
            title="Community Chat"
            description="Read all messages, post as Admin or any member, run scripted conversations, pin, ban and manage the rules."
          />
        </div>

        <div className="flex h-[calc(100dvh-15rem)] min-h-[560px] overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            {/* header */}
            <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  International Chat
                </p>
                <p className="flex flex-wrap items-center gap-x-1.5 text-[11px] text-muted-foreground">
                  <button
                    type="button"
                    onClick={openOnline}
                    title="Edit online count"
                    className="group inline-flex items-center gap-1 rounded font-medium text-foreground outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {onlineCount.toLocaleString()} members online
                    {onlineOverride !== null ? (
                      <span className="rounded-full border border-dashed border-border px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Custom
                      </span>
                    ) : null}
                    <Pencil className="size-3 opacity-60 group-hover:opacity-100" />
                  </button>
                  <span>
                    · {activeBans.length} banned · {messages.length} messages
                  </span>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="relative hidden xl:block">
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search messages…"
                    className="h-9 w-40 rounded-full border border-border bg-background pl-8 pr-3 text-xs text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </label>
                {playing ? (
                  <Button size="sm" variant="primary" onClick={() => {
                    stopScript();
                    showToast("■ Script stopped.");
                  }}>
                    <Square className="size-3.5" />
                    Stop script
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setScriptOpen(true)}>
                    <Play className="size-3.5" />
                    Script chat
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={toggleLock}>
                  {locked ? (
                    <Unlock className="size-3.5" />
                  ) : (
                    <Lock className="size-3.5" />
                  )}
                  {locked ? "Unlock" : "Lock"}
                </Button>
                <Button size="sm" variant="outline" onClick={openRules}>
                  <ScrollText className="size-3.5" />
                  Rules
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Users className="size-3.5" />
                  Members
                </Button>
              </div>
            </header>

            {/* rules + pinned */}
            <div className="shrink-0 border-b border-border pb-1 pt-3">
              <RulesBanner rules={rules} />
              {pinned ? (
                <PinnedMessage msg={pinned} onUnpin={() => togglePin(pinned)} />
              ) : (
                <p className="mx-4 mb-2 rounded-xl border border-dashed border-border px-4 py-2.5 text-xs text-muted-foreground">
                  No pinned message. Hover a message and use the pin icon.
                </p>
              )}
            </div>

            {locked ? (
              <div className="mx-4 mt-2 flex shrink-0 items-center gap-2 rounded-lg border border-border bg-muted px-4 py-2">
                <Lock className="size-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground">
                  Chat is locked — members can read but only Admin can send.
                </span>
              </div>
            ) : null}

            {playing ? (
              <div className="mx-4 mt-2 flex shrink-0 items-center gap-2 rounded-lg border border-border bg-muted px-4 py-2">
                <span className="size-1.5 animate-pulse rounded-full bg-(--color-success)" />
                <span className="text-xs font-semibold text-foreground">
                  Script is playing…
                </span>
              </div>
            ) : null}

            {/* messages */}
            <div
              ref={scrollerRef}
              className="min-h-0 flex-1 overflow-y-auto px-3 py-5 sm:px-5"
            >
              <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-3">
                {shown.length ? (
                  shown.map((m) => (
                    <MessageBubble
                      key={m.id}
                      msg={m}
                      banned={bannedIds.has(m.userId)}
                      onPin={() => togglePin(m)}
                      onBan={() =>
                        openBan({ userId: m.userId, username: m.username })
                      }
                      onDelete={() => deleteMessage(m)}
                    />
                  ))
                ) : (
                  <p className="m-auto text-sm text-muted-foreground">
                    No messages found.
                  </p>
                )}
              </div>
            </div>

            {/* input (post as Admin or any member) */}
            <div className="shrink-0 border-t border-border p-3">
              <div className="relative mx-auto flex max-w-3xl flex-wrap items-center gap-2 sm:flex-nowrap">
                {emojiOpen ? (
                  <EmojiPicker
                    onSelect={(e) => setInput((p) => p + e)}
                    onClose={() => setEmojiOpen(false)}
                  />
                ) : null}
                <button
                  type="button"
                  onClick={() => setEmojiOpen((p) => !p)}
                  aria-label="Add emoji"
                  className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Smile className="size-4" />
                </button>
                <select
                  aria-label="Post as"
                  value={activePersona.id}
                  onChange={(e) => setPersonaId(e.target.value)}
                  className="h-10 max-w-[9.5rem] shrink-0 rounded-full border border-border bg-background px-3 text-xs font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="admin">Admin</option>
                  <optgroup label="Members">
                    {online
                      .filter((p) => !isCustom(p.id))
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.username}
                        </option>
                      ))}
                  </optgroup>
                  {online.some((p) => isCustom(p.id)) ? (
                    <optgroup label="Personas">
                      {online
                        .filter((p) => isCustom(p.id))
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.username}
                          </option>
                        ))}
                    </optgroup>
                  ) : null}
                </select>
                <button
                  type="button"
                  onClick={() => setPersonasOpen(true)}
                  aria-label="Manage personas"
                  title="Manage personas"
                  className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <UserPlus className="size-4" />
                </button>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder={`Message as ${activePersona.username}…`}
                  className="h-10 min-w-0 flex-1 basis-40 rounded-full border border-border bg-background px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                />
                <Button
                  size="md"
                  variant="primary"
                  className="shrink-0 rounded-full"
                  disabled={!input.trim()}
                  onClick={handleSend}
                >
                  <SendHorizonal className="size-4" />
                </Button>
              </div>
              <p className="mx-auto mt-1.5 max-w-3xl px-1 text-[10px] text-muted-foreground">
                Posting as{" "}
                <strong className="text-foreground">
                  {activePersona.username}
                </strong>
                {activePersona.id !== "admin" ? " (simulated member)" : ""} —
                the blocked-word filter does not apply to messages sent from
                this panel.
              </p>
            </div>
          </div>

          {/* desktop side panel */}
          <aside className="hidden h-full w-64 shrink-0 border-l border-border bg-card lg:block">
            {side}
          </aside>
        </div>
      </div>

      {/* mobile side panel */}
      {sidebarOpen ? (
        <div className="fixed inset-0 z-[8000] lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/30"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute right-0 top-0 h-full w-72 border-l border-border bg-card">
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close members"
              className="absolute right-3 top-3 z-10 text-muted-foreground outline-none hover:text-foreground"
            >
              <X className="size-4" />
            </button>
            {side}
          </aside>
        </div>
      ) : null}
    </>
  );
}