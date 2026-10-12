// app/(user)/profile/login-history/page.tsx
"use client";

import { UserShell } from "@/app/(user)/_components/user-shell";
import {
  Check,
  ChevronDown,
  Globe,
  Monitor,
  Search,
  ShieldAlert,
  Smartphone,
  Tablet,
  X,
  Download,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";

// ── Shared primitives ────────────────────────────────────────────────────────

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border border-border bg-card p-4 sm:rounded-4xl sm:p-6 ${className}`}>
      {children}
    </div>
  );
}

function Badge({
  label,
  tone = "default",
}: {
  label: string;
  tone?: "default" | "success" | "destructive" | "muted";
}) {
  const colors: Record<string, string> = {
    default:     "bg-foreground/10 text-foreground",
    success:     "bg-success/10 text-success",
    destructive: "bg-destructive/10 text-destructive",
    muted:       "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap ${colors[tone]}`}
    >
      {label}
    </span>
  );
}

// ── Types & data ─────────────────────────────────────────────────────────────

type LoginStatus = "success" | "failed" | "blocked";
type DeviceType = "desktop" | "mobile" | "tablet";

type LoginEvent = {
  id: string;
  date: string;       // ISO datetime
  ip: string;
  location: string;
  country: string;
  device: string;
  deviceType: DeviceType;
  browser: string;
  status: LoginStatus;
  flagged?: boolean;
  failureReason?: string;
};

interface LoginHistoryData {
  events: LoginEvent[];
  stats: {
    total: number;
    successful: number;
    failed: number;
    blocked: number;
    suspicious: number;
  };
}

const LOGIN_HISTORY: LoginEvent[] = [
  {
    id: "l01",
    date: "2025-07-18T09:14:00",
    ip: "103.48.192.11",
    location: "Dhaka, Bangladesh",
    country: "BD",
    device: "Windows 11",
    deviceType: "desktop",
    browser: "Chrome 126",
    status: "success",
  },
  {
    id: "l02",
    date: "2025-07-18T07:02:00",
    ip: "103.48.192.11",
    location: "Dhaka, Bangladesh",
    country: "BD",
    device: "iPhone 15",
    deviceType: "mobile",
    browser: "Safari 17",
    status: "success",
  },
  {
    id: "l03",
    date: "2025-07-17T21:44:00",
    ip: "185.220.101.45",
    location: "Frankfurt, Germany",
    country: "DE",
    device: "Unknown",
    deviceType: "desktop",
    browser: "Firefox 127",
    status: "failed",
    flagged: true,
  },
  {
    id: "l04",
    date: "2025-07-17T18:30:00",
    ip: "103.48.192.11",
    location: "Dhaka, Bangladesh",
    country: "BD",
    device: "Windows 11",
    deviceType: "desktop",
    browser: "Chrome 126",
    status: "success",
  },
  {
    id: "l05",
    date: "2025-07-17T10:05:00",
    ip: "103.48.192.11",
    location: "Dhaka, Bangladesh",
    country: "BD",
    device: "iPad Pro",
    deviceType: "tablet",
    browser: "Safari 17",
    status: "success",
  },
  {
    id: "l06",
    date: "2025-07-16T14:22:00",
    ip: "195.88.54.16",
    location: "Moscow, Russia",
    country: "RU",
    device: "Unknown",
    deviceType: "desktop",
    browser: "Chrome 125",
    status: "blocked",
    flagged: true,
  },
  {
    id: "l07",
    date: "2025-07-16T11:08:00",
    ip: "103.48.192.11",
    location: "Dhaka, Bangladesh",
    country: "BD",
    device: "Windows 11",
    deviceType: "desktop",
    browser: "Edge 126",
    status: "success",
  },
  {
    id: "l08",
    date: "2025-07-15T22:55:00",
    ip: "103.48.192.11",
    location: "Dhaka, Bangladesh",
    country: "BD",
    device: "iPhone 15",
    deviceType: "mobile",
    browser: "Safari 17",
    status: "success",
  },
  {
    id: "l09",
    date: "2025-07-15T09:30:00",
    ip: "103.48.192.14",
    location: "Dhaka, Bangladesh",
    country: "BD",
    device: "macOS Sonoma",
    deviceType: "desktop",
    browser: "Firefox 127",
    status: "success",
  },
  {
    id: "l10",
    date: "2025-07-14T19:17:00",
    ip: "45.33.32.156",
    location: "Dallas, USA",
    country: "US",
    device: "Unknown",
    deviceType: "desktop",
    browser: "Chrome 126",
    status: "failed",
    flagged: true,
  },
  {
    id: "l11",
    date: "2025-07-14T08:44:00",
    ip: "103.48.192.11",
    location: "Dhaka, Bangladesh",
    country: "BD",
    device: "Windows 11",
    deviceType: "desktop",
    browser: "Chrome 126",
    status: "success",
  },
  {
    id: "l12",
    date: "2025-07-13T17:09:00",
    ip: "103.48.192.11",
    location: "Dhaka, Bangladesh",
    country: "BD",
    device: "iPhone 15",
    deviceType: "mobile",
    browser: "Safari 17",
    status: "success",
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    time: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
  };
}

function DeviceIcon({ type }: { type: DeviceType }) {
  const cls = "size-4 text-muted-foreground";
  if (type === "mobile") return <Smartphone className={cls} />;
  if (type === "tablet") return <Tablet className={cls} />;
  return <Monitor className={cls} />;
}

function statusTone(s: LoginStatus): "success" | "destructive" | "muted" {
  if (s === "success") return "success";
  if (s === "blocked") return "destructive";
  return "muted";
}

function statusLabel(s: LoginStatus) {
  if (s === "success") return "Success";
  if (s === "blocked") return "Blocked";
  return "Failed";
}

// ── Detail Modal ─────────────────────────────────────────────────────────────

function EventModal({ event, onClose }: { event: LoginEvent; onClose: () => void }) {
  const { date, time } = formatDateTime(event.date);
  return (
    <div
      className="fixed inset-0 z-[900] flex items-end justify-center bg-foreground/20 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-4xl border border-border bg-card p-5 sm:max-h-none sm:rounded-4xl sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Login Event
            </p>
            <h3 className="text-lg font-semibold text-foreground">Session Details</h3>
          </div>
          <button
            onClick={onClose}
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/70"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Status banner */}
        <div
          className={`mb-5 flex items-center gap-3 rounded-2xl p-4 ${
            event.status === "success"
              ? "bg-success/10"
              : "bg-destructive/10"
          }`}
        >
          <div
            className={`grid size-9 shrink-0 place-items-center rounded-xl ${
              event.status === "success" ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
            }`}
          >
            {event.status === "success" ? (
              <Check className="size-5" />
            ) : (
              <ShieldAlert className="size-5" />
            )}
          </div>
          <div className="min-w-0">
            <p
              className={`text-sm font-semibold ${
                event.status === "success" ? "text-success" : "text-destructive"
              }`}
            >
              {statusLabel(event.status)} Login
            </p>
            <p className="text-xs text-muted-foreground">
              {date} at {time}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border">
          {[
            ["IP Address", event.ip],
            ["Location", event.location],
            ["Device", event.device],
            ["Browser", event.browser],
            ["Date", date],
            ["Time", time],
          ].map(([k, v]) => (
            <div
              key={k}
              className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 last:border-none"
            >
              <span className="shrink-0 text-xs text-muted-foreground">{k}</span>
              <span className="truncate text-right text-sm font-medium text-foreground">{v}</span>
            </div>
          ))}
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-xs text-muted-foreground">Status</span>
            <Badge label={statusLabel(event.status)} tone={statusTone(event.status)} />
          </div>
        </div>

        {event.flagged && (
          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-border bg-muted/30 p-4">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
            <p className="text-xs text-muted-foreground">
              This login was flagged as suspicious{event.status === "failed" && event.failureReason ? ` (${event.failureReason})` : ""}.
              If this wasn&apos;t you, change your password immediately and enable 2FA.
            </p>
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-2xl border border-border py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted/50"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

type FilterStatus = "all" | LoginStatus;

const STATUS_FILTERS: { id: FilterStatus; label: string }[] = [
  { id: "all",     label: "All" },
  { id: "success", label: "Success" },
  { id: "failed",  label: "Failed" },
  { id: "blocked", label: "Blocked" },
];

export default function LoginHistoryPage() {
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalEvent, setModalEvent] = useState<LoginEvent | null>(null);
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);
  const [sortDesc, setSortDesc] = useState(true);
  const [data, setData] = useState<LoginHistoryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profile/login-history")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const LOGIN_HISTORY = data?.events || [];
  const flaggedCount = data?.stats.suspicious || 0;

  const filtered = useMemo(() => {
    let list = [...LOGIN_HISTORY];
    if (statusFilter !== "all") list = list.filter((e) => e.status === statusFilter);
    if (showFlaggedOnly) list = list.filter((e) => e.flagged);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.ip.includes(q) ||
          e.location.toLowerCase().includes(q) ||
          e.browser.toLowerCase().includes(q) ||
          e.device.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) =>
      sortDesc
        ? new Date(b.date).getTime() - new Date(a.date).getTime()
        : new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    return list;
  }, [LOGIN_HISTORY, statusFilter, searchQuery, showFlaggedOnly, sortDesc]);

  const successCount = data?.stats.successful || 0;
  const failedCount = (data?.stats.failed || 0) + (data?.stats.blocked || 0);

  if (loading) {
    return (
      <UserShell active="Login History">
        <div className="flex h-full items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </UserShell>
    );
  }

  if (!data) {
    return (
      <UserShell active="Login History">
        <div className="flex h-full items-center justify-center">
          <div className="text-muted-foreground">Failed to load login history</div>
        </div>
      </UserShell>
    );
  }

  return (
    <UserShell active="Login History">
      <div className="relative overflow-y-auto px-4 py-5 sm:px-7 sm:py-8">
        <div className="mx-auto max-w-3xl space-y-5 sm:space-y-6">

          {/* Header */}
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Account
            </p>
            <h1 className="mt-2 text-lg font-semibold tracking-tight text-foreground sm:text-xl md:text-2xl">
              Login History
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Review all recent sign-in activity on your account.
            </p>
          </div>

          {/* Summary stat strip */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { label: "Total Logins",    value: data.stats.total, tone: "" },
              { label: "Successful",      value: data.stats.successful,         tone: "text-success" },
              { label: "Suspicious",      value: data.stats.suspicious,         tone: "text-destructive" },
            ].map(({ label, value, tone }) => (
              <Card key={label} className="p-3 sm:p-4">
                <p className="truncate text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground sm:text-[11px] sm:tracking-[0.12em]">
                  {label}
                </p>
                <p className={`mt-1 text-lg font-semibold sm:mt-1.5 sm:text-2xl ${tone || "text-foreground"}`}>
                  {value}
                </p>
              </Card>
            ))}
          </div>

          {/* Flagged warning */}
          {flaggedCount > 0 && (
            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-destructive/5 p-4 sm:flex-row sm:items-start">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {flaggedCount} suspicious login{flaggedCount > 1 ? "s" : ""} detected
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    We detected logins from unfamiliar locations. If you don&apos;t recognise these,
                    change your password and enable 2FA immediately.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFlaggedOnly((v) => !v)}
                className={`shrink-0 rounded-xl px-3 py-1.5 text-[11px] font-semibold transition-colors sm:self-start ${
                  showFlaggedOnly
                    ? "bg-foreground text-background"
                    : "bg-muted text-foreground hover:bg-muted/70"
                }`}
              >
                {showFlaggedOnly ? "Show All" : "View Flagged"}
              </button>
            </div>
          )}

          {/* Controls */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by IP, location, device…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-border bg-background py-2.5 pl-9 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Sort */}
              <button
                onClick={() => setSortDesc((v) => !v)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-border px-3 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground sm:flex-none"
              >
                <ChevronDown
                  className={`size-3.5 shrink-0 transition-transform ${sortDesc ? "" : "rotate-180"}`}
                />
                <span className="whitespace-nowrap">{sortDesc ? "Newest First" : "Oldest First"}</span>
              </button>

              {/* Export */}
              <button className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-border px-3 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground sm:flex-none">
                <Download className="size-3.5 shrink-0" />
                <span className="whitespace-nowrap">Export CSV</span>
              </button>
            </div>
          </div>

          {/* Status filter tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {STATUS_FILTERS.map((f) => {
              const count =
                f.id === "all"
                  ? LOGIN_HISTORY.length
                  : LOGIN_HISTORY.filter((e) => e.status === f.id).length;
              const isActive = statusFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={[
                    "flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-medium transition-colors",
                    isActive
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground",
                  ].join(" ")}
                >
                  {f.label}
                  <span
                    className={[
                      "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                      isActive ? "bg-background/20 text-background" : "bg-muted text-muted-foreground",
                    ].join(" ")}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Login event list */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                {showFlaggedOnly ? "Flagged Events" : "Login Events"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {filtered.length} {filtered.length === 1 ? "record" : "records"}
              </p>
            </div>

            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
                No login records match your filters.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {filtered.map((event) => {
                  const { date, time } = formatDateTime(event.date);
                  return (
                    <div
                      key={event.id}
                      className={`flex flex-col gap-3 rounded-2xl border p-3.5 transition-colors xs:flex-row xs:items-center xs:justify-between ${
                        event.flagged ? "border-destructive/30 bg-destructive/5" : "border-border"
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        {/* Device icon */}
                        <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-muted">
                          <DeviceIcon type={event.deviceType} />
                        </div>

                        {/* Info */}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-foreground">
                              {event.browser}
                            </span>
                            <Badge label={statusLabel(event.status)} tone={statusTone(event.status)} />
                            {event.flagged && (
                              <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-destructive">
                                <ShieldAlert className="size-2.5" />
                                Suspicious
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Globe className="size-3 shrink-0" />
                              {event.location}
                            </span>
                            <span className="hidden sm:inline">·</span>
                            <span className="font-mono">{event.ip}</span>
                            <span className="hidden sm:inline">·</span>
                            <span>{event.device}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right side */}
                      <div className="ml-12 flex shrink-0 items-center justify-between gap-3 xs:ml-3 xs:flex-col xs:items-end xs:gap-1.5">
                        <div className="flex items-center gap-2 xs:flex-col xs:items-end xs:gap-1.5">
                          <span className="text-[11px] text-muted-foreground">{date}</span>
                          <span className="text-[11px] font-medium text-foreground">{time}</span>
                        </div>
                        <button
                          onClick={() => setModalEvent(event)}
                          className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
                        >
                          Details →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="h-20" />
        </div>
      </div>

      {/* Detail modal */}
      {modalEvent && (
        <EventModal event={modalEvent} onClose={() => setModalEvent(null)} />
      )}
    </UserShell>
  );
}