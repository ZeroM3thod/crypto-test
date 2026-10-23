// AI Trading management (admin)
"use client";

import {
  Badge, Card, Field, Modal, SectionHeader, Stat,
  btnDanger, btnGhost, btnPrimary, btnSmall, fmt, inputCls, workingTime,
} from "@/app/(admin)/_components/admin-ui";
import { Table } from "@/components/motion/table";
import { Bot, Calendar, Clock, History, Lock, LockOpen, Pencil, Percent, Plus, Search, TrendingUp, Users, Wallet, X } from "lucide-react";
import { useMemo, useState, useEffect } from "react";

// ── Types ────────────────────────────────────────────────────────────────
type Strategy = {
  id: string;
  name: string;
  exchange: string;
  minStake: number;
  lockDays: number;     // default lock for NEW investors
  daysRunning: number;
  createdAt?: string;
  totalRoi: number;     // % since inception (moves with every posted daily ROI, can go down)
  investors?: number;
  totalStaked?: number;
  todayRoi?: number | null;
  todayTime?: string | null;
};

/** One admin-entered ROI for one strategy on one date. Can be negative (loss). */
type DailyEntry = {
  id: string;
  strategyId: string;
  date: string;         // YYYY-MM-DD
  time?: string;        // HH:mm it was added to users (if provided)
  roi: number;          // % entered by admin for that day (negative = loss)
  credited: number;     // total $ credited (or deducted if negative) for that day
};

type Investment = {
  id: string;
  strategyId: string;
  name: string;
  email: string;
  invested: number;
  profit: number;
  startedAt: string;       // ISO
  lockDays: number;        // THIS user's lock (can be extended)
  forceUnlocked: boolean;  // admin override
};

// ── Helpers ──────────────────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().slice(0, 10);
const dateOffset = (d: number) => new Date(Date.now() - d * 86400000).toISOString().slice(0, 10);
const shiftDate = (date: string, days: number) =>
  new Date(new Date(`${date}T00:00:00Z`).getTime() + days * 86400000).toISOString().slice(0, 10);
const round2 = (n: number) => Math.round(n * 100) / 100;
const signed = (n: number) => `${n < 0 ? "-" : "+"}$${fmt(Math.abs(n))}`;
const pctText = (n: number) => `${n > 0 ? "+" : ""}${n}%`;
const tone = (n: number) => (n < 0 ? "text-destructive" : "text-success");

// ── Mock data (replace with API) ─────────────────────────────────────────

// ── Lock helpers ─────────────────────────────────────────────────────────
function lockInfo(inv: Investment) {
  const elapsed = (Date.now() - new Date(inv.startedAt).getTime()) / 86400000;
  const daysLeft = Math.max(0, Math.ceil(inv.lockDays - elapsed));
  const unlocked = inv.forceUnlocked || daysLeft === 0;
  const pct = unlocked ? 100 : Math.min(100, (elapsed / inv.lockDays) * 100);
  return { unlocked, daysLeft, pct };
}

// ── Strategy form ────────────────────────────────────────────────────────
type StrategyForm = {
  id: string | null;
  name: string;
  exchange: string;
  minStake: string;
  lockDays: string;
  cycleTotalRoi: string; // Total ROI for 30-day cycle
  daysRunning: string;   // total days the strategy has been running (edit only)
  totalRoi: string;      // total ROI % since inception (edit only)
};

const EMPTY_FORM: StrategyForm = {
  id: null, name: "", exchange: "Binance", minStake: "", lockDays: "15",
  cycleTotalRoi: "0", daysRunning: "0", totalRoi: "0",
};

const toForm = (s: Strategy): StrategyForm => ({
  id: s.id, name: s.name, exchange: s.exchange, minStake: String(s.minStake),
  lockDays: String(s.lockDays), cycleTotalRoi: String(s.totalRoi),
  daysRunning: String(s.daysRunning), totalRoi: String(s.totalRoi),
});

// ── Strategy card ────────────────────────────────────────────────────────
// Daily ROI is set per day with the time it is credited to users (no 30-day cycle ROI).
function AdminStrategyCard({
  strategy, investorCount, totalStaked, todayRoi = null, todayRoiTime = null, onEdit, onViewUsers, onPostRoi, onRoiList,
}: {
  strategy: Strategy;
  investorCount: number;
  totalStaked: number;
  todayRoi?: number | null;      // today's daily ROI % (null = not set yet)
  todayRoiTime?: string | null;  // time it is / was credited to users, e.g. "09:00 AM"
  onEdit: () => void;
  onViewUsers: () => void;
  onPostRoi: () => void;
  onRoiList?: () => void;
}) {
  const [today, setToday] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setToday(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);
  const isSet = todayRoi !== null;
  const estCredit = isSet ? round2((totalStaked * (todayRoi as number)) / 100) : 0;
  const runningDays = strategy.createdAt ? Math.max(1, Math.floor((Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) - Date.UTC(new Date(strategy.createdAt).getUTCFullYear(), new Date(strategy.createdAt).getUTCMonth(), new Date(strategy.createdAt).getUTCDate())) / 86400000) + 1) : strategy.daysRunning;

  return (
    <Card>
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-foreground text-background">
          <Bot className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-card-foreground">{strategy.name}</p>
          <p className="text-[11px] text-muted-foreground">{strategy.exchange} · Running {runningDays}d</p>
        </div>
      </div>

      {/* Today's daily ROI */}
      <div className="mt-4 rounded-2xl bg-background p-3.5">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            <Percent className="size-3" /> Today&apos;s daily ROI
          </p>
          {isSet ? (
            <Badge label={todayRoiTime ? "Scheduled" : "0% default"} tone="success" />
          ) : (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">Not set</span>
          )}
        </div>
        <div className="mt-2 flex items-end justify-between gap-2">
          <p className={`text-2xl font-semibold tracking-tight ${isSet ? tone(todayRoi as number) : "text-muted-foreground"}`}>
            {isSet ? pctText(todayRoi as number) : "0%"}
          </p>
          <p className="flex items-center gap-1 pb-1 text-xs text-muted-foreground">
            <Clock className="size-3" /> {todayRoiTime ?? "No time set"}
          </p>
        </div>
        {isSet && (
          <p className={`mt-1 text-[11px] ${tone(estCredit)}`}>
            ≈ {signed(estCredit)} to {investorCount} investor{investorCount === 1 ? "" : "s"}
          </p>
        )}
      </div>

      {/* Details */}
      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-3 px-1">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Min. Stake</p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">${fmt(strategy.minStake)}</p>
        </div>
        <div>
          <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            <Lock className="size-3" /> Lock Period
          </p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">{strategy.lockDays} days</p>
        </div>
        <div>
          <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            <Users className="size-3" /> Investors
          </p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">{investorCount}</p>
        </div>
        <div>
          <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            <Wallet className="size-3" /> Total staked
          </p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">${fmt(totalStaked)}</p>
        </div>
      </div>

      {/* Actions */}
      <button type="button" onClick={onPostRoi} className={`${btnPrimary} mt-4 h-10 w-full text-xs`}>
        <TrendingUp className="size-3.5" /> Set daily ROI
      </button>

      <div className="mt-2 grid grid-cols-3 gap-2">
        <button type="button" onClick={onRoiList} className={`${btnGhost} h-14 flex-col gap-1 px-1 text-[11px]`}>
          <History className="size-4" /> ROI list
        </button>
        <button type="button" onClick={onViewUsers} className={`${btnGhost} h-14 flex-col gap-1 px-1 text-[11px]`}>
          <Users className="size-4" /> Users
        </button>
        <button type="button" onClick={onEdit} className={`${btnGhost} h-14 flex-col gap-1 px-1 text-[11px]`}>
          <Pencil className="size-4" /> Edit
        </button>
      </div>
    </Card>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────
type Row = Investment & { status: "locked" | "unlocked"; daysLeft: number; pct: number };

export function AiTradingManagement() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState<StrategyForm | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [manualRoi, setManualRoi] = useState<{ strategyId: string; date: string; time: string; roi: string } | null>(null);
  const [manualError, setManualError] = useState<string | null>(null);

  const [roiList, setRoiList] = useState<{
    strategyId: string; entries: DailyEntry[]; loading: boolean; error: string | null;
  } | null>(null);

  const [selectedId, setSelectedId] = useState<string>("");
  const [query, setQuery] = useState("");

  const [action, setAction] = useState<{ type: "unlock" | "extend"; inv: Investment } | null>(null);
  const [extendDays, setExtendDays] = useState("7");

  async function refreshAdminData() {
    const [sr, ir] = await Promise.all([fetch("/api/admin/ai-trading/strategies"), fetch("/api/admin/ai-trading/investments")]);
    const [sd, id] = await Promise.all([sr.json(), ir.json()]);
    if (!sr.ok) throw new Error(sd.message || "Strategies failed");
    if (!ir.ok) throw new Error(id.message || "Investors failed");
    const mappedStrategies: Strategy[] = (sd.strategies || []).map((s: any) => ({ id:s.strategy_id,name:s.name,exchange:s.exchange,minStake:Number(s.min_stake),lockDays:Number(s.lock_days),daysRunning:Number(s.days_running),createdAt:s.created_at,totalRoi:Number(s.total_roi_pct),investors:Number(s.investor_count||0),totalStaked:Number(s.total_staked||0),todayRoi:s.today_roi_pct === null ? null : Number(s.today_roi_pct),todayTime:s.today_credit_at ? new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Dhaka",hour:"2-digit",minute:"2-digit"}).format(new Date(s.today_credit_at)) : null }));
    const mappedInvestments: Investment[] = (id.investments || []).filter((x: any) => ["running","unlocked"].includes(x.status)).map((x: any) => ({ id:x.id,strategyId:x.strategy_id,name:`${x.user.first_name} ${x.user.last_name}`,email:x.user.email,invested:Number(x.amount),profit:Number(x.total_profit),startedAt:x.invested_at,lockDays:Number(x.lock_days),forceUnlocked:x.status === "unlocked" }));
    setStrategies(mappedStrategies);
    setInvestments(mappedInvestments);
    setSelectedId((current) => current || mappedStrategies[0]?.id || "");
  }

  // Fetch strategies and investments
  useEffect(() => {
    setLoading(true);
    refreshAdminData().catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => { if (!document.hidden) refreshAdminData().catch(console.error); }, 15000);
    const onFocus = () => { if (!document.hidden) refreshAdminData().catch(console.error); };
    window.addEventListener("focus", onFocus);
    return () => { clearInterval(timer); window.removeEventListener("focus", onFocus); };
  }, []);

  const selected = strategies.find((s) => s.id === selectedId);
  const today = todayStr();

  // Stats
  const totalStaked = investments.reduce((s, i) => s + i.invested, 0);

  // Rows for investors table
  const rows: Row[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    return investments
      .filter((i) => i.strategyId === selectedId)
      .filter((i) => !q || i.name.toLowerCase().includes(q) || i.email.toLowerCase().includes(q))
      .map((i) => {
        const { unlocked, daysLeft, pct } = lockInfo(i);
        return { ...i, status: unlocked ? "unlocked" : "locked", daysLeft, pct };
      });
  }, [investments, selectedId, query]);

  // ── Strategy save ──
  const set = <K extends keyof StrategyForm>(k: K, v: StrategyForm[K]) =>
    setForm((f) => (f ? { ...f, [k]: v } : f));

  async function handleSaveStrategy() {
    if (!form) return;
    const minStake = parseFloat(form.minStake);
    const lockDays = parseInt(form.lockDays, 10);

      if (!form.name.trim()) return setFormError("Package name is required");
    if (!(minStake > 0)) return setFormError("Minimum stake must be greater than 0");
    if (!(lockDays > 0)) return setFormError("Lock period must be greater than 0 days");

    try {
      if (form.id) {
        // Update - triggers schedule regeneration
        const res = await fetch(`/api/admin/ai-trading/strategies/${form.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            exchange: form.exchange.trim() || "Binance",
            min_stake: minStake,
            lock_days: lockDays,
            days_running: Number(form.daysRunning),
            total_roi_pct: Number(form.totalRoi),
          }),
        });

        if (!res.ok) throw new Error((await res.json()).message || "Update failed");
      } else {
        // Create
        const strategyId = form.name.trim().toLowerCase().replace(/\s+/g, "_");
        const res = await fetch("/api/admin/ai-trading/strategies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            strategy_id: strategyId,
            name: form.name.trim(),
            exchange: form.exchange.trim() || "Binance",
            min_stake: minStake,
            lock_days: lockDays,
          }),
        });
        if (!res.ok) throw new Error((await res.json()).message || "Create failed");

      }

      // Reflect persisted values, not optimistic form state.
      await refreshAdminData();

      setFormError(null);
      setForm(null);
    } catch (err) {
      console.error(err);
      setFormError(err instanceof Error ? err.message : "Save failed");
    }
  }

  // ── Manual ROI override (single day) ──
  function openManualRoi(strategyId: string) {
    setManualError(null);
    setManualRoi({ strategyId, date: today, time: "09:00", roi: "" });
  }

  async function handleSaveManualRoi() {
    if (!manualRoi) return;
    const roi = Number(manualRoi.roi);
    if (manualRoi.roi.trim() === "" || !Number.isFinite(roi)) return setManualError("Enter ROI %");
    if (roi < -100) return setManualError("ROI can't be below -100%");

    try {
      const res = await fetch(`/api/admin/ai-trading/strategies/${manualRoi.strategyId}/daily-roi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: [{ date: manualRoi.date, time: manualRoi.time, roi }] }),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Save failed");

      setManualError(null);
      setManualRoi(null);
      
      await refreshAdminData();
    } catch (err) {
      console.error(err);
      setManualError(err instanceof Error ? err.message : "Save failed");
    }
  }

  // ── ROI list (previous daily ROI with date) ──
  async function openRoiList(strategyId: string) {
    setRoiList({ strategyId, entries: [], loading: true, error: null });
    try {
      const res = await fetch(`/api/admin/ai-trading/strategies/${strategyId}/daily-roi`);
      if (!res.ok) throw new Error("Load failed");
      const data = await res.json();
      const entries: DailyEntry[] = (data.entries || data.daily_roi || [])
        .map((e: any, i: number) => ({
          id: String(e.id ?? `${e.date}-${i}`),
          strategyId,
          date: String(e.date).slice(0, 10),
          time: e.credit_at ? new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dhaka", hour: "2-digit", minute: "2-digit" }).format(new Date(e.credit_at)) : undefined,
          roi: parseFloat(e.roi ?? e.roi_pct),
          credited: parseFloat(e.credited ?? e.total_credited ?? 0) || 0,
        }))
        .sort((a: DailyEntry, b: DailyEntry) =>
          `${b.date} ${b.time ?? ""}`.localeCompare(`${a.date} ${a.time ?? ""}`)
        );
      setRoiList((prev) => (prev && prev.strategyId === strategyId ? { ...prev, entries, loading: false } : prev));
    } catch (err) {
      console.error(err);
      setRoiList((prev) => (prev ? { ...prev, loading: false, error: "Couldn't load ROI list" } : prev));
    }
  }

  // ── Per-user actions ──
  async function confirmUnlock() {
    if (!action) return;
    try {
      const res = await fetch(`/api/admin/ai-trading/investments/${action.inv.id}/unlock`, {
        method: "POST",
      });
      if (!res.ok) throw new Error((await res.json()).message || "Unlock failed");
      setInvestments((prev) =>
        prev.map((i) => (i.id === action.inv.id ? { ...i, forceUnlocked: true } : i))
      );
      await refreshAdminData();
      setAction(null);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Unlock failed");
    }
  }

  function confirmExtend() {
    if (!action) return;
    const days = parseInt(extendDays, 10);
    if (!(days > 0)) return;
    
    fetch(`/api/admin/ai-trading/investments/${action.inv.id}/extend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).message || "Extend failed");
        setInvestments((prev) =>
          prev.map((i) =>
            i.id === action.inv.id
              ? { ...i, lockDays: i.lockDays + days, forceUnlocked: false }
              : i
          )
        );
        await refreshAdminData();
        setAction(null);
      })
      .catch((err) => {
        console.error(err);
        alert(err instanceof Error ? err.message : "Extend failed");
      });
  }

  // ── Table columns ──
  const columns = [
    { key: "name", header: "Name", width: "150px" },
    { key: "email", header: "Email", width: "190px" },
    {
      key: "invested", header: "Invested", width: "100px", align: "right" as const,
      cell: (r: Row) => <span className="text-xs font-medium text-foreground">${fmt(r.invested)}</span>,
    },
    {
      key: "profit", header: "Profit", width: "90px", align: "right" as const,
      cell: (r: Row) => (
        <span className={`text-xs font-semibold ${tone(r.profit)}`}>{signed(r.profit)}</span>
      ),
    },
    {
      key: "startedAt", header: "Working time", width: "110px",
      cell: (r: Row) => <span className="text-xs text-muted-foreground">{workingTime(r.startedAt)}</span>,
    },
    {
      key: "lock", header: "Lock", width: "170px",
      cell: (r: Row) => (
        <div className="w-full">
          <div className="mb-1 flex items-center justify-between text-[10px]">
            <span className={`flex items-center gap-1 font-medium ${r.status === "unlocked" ? "text-success" : "text-destructive"}`}>
              {r.status === "unlocked" ? <LockOpen className="size-3" /> : <Lock className="size-3" />}
              {r.status === "unlocked" ? "Unlocked" : `${r.daysLeft}d left`}
            </span>
            <span className="text-muted-foreground">{r.lockDays}d total</span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full ${r.status === "unlocked" ? "bg-success" : "bg-foreground"}`}
              style={{ width: `${r.pct}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: "actions", header: "Actions", width: "190px", align: "right" as const,
      cell: (r: Row) => (
        <div className="flex justify-end gap-1.5">
          <button
            type="button"
            disabled={r.status === "unlocked"}
            onClick={() => setAction({ type: "unlock", inv: r })}
            className={btnSmall}
          >
            <LockOpen className="size-3" /> Unlock
          </button>
          <button
            type="button"
            onClick={() => { setExtendDays("7"); setAction({ type: "extend", inv: r }); }}
            className={btnSmall}
          >
            <Lock className="size-3" /> Extend
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="space-y-8 overflow-y-auto px-5 py-6 sm:px-7 sm:py-8">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Package Management</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              AI Trading Packages
            </h1>
          </div>
          <button
            type="button"
            onClick={() => { setFormError(null); setForm({ ...EMPTY_FORM }); }}
            className={btnPrimary}
          >
            <Plus className="size-4" /> New strategy
          </button>
        </div>

        {/* Stats */}
        <section aria-label="Summary">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card><Stat label="Strategies" value={String(strategies.length)} icon={<Bot className="size-3.5" />} /></Card>
            <Card><Stat label="Total Investors" value={String(investments.length)} icon={<Users className="size-3.5" />} /></Card>
            <Card><Stat label="Total Staked" value={`$${fmt(totalStaked)}`} icon={<Wallet className="size-3.5" />} /></Card>
          </div>
        </section>

        {/* Strategies */}
        <section aria-label="Strategies">
          <SectionHeader
            title="Strategies"
            description="Set 30-day cycle ROI. System auto-distributes daily with random variance. Use 'Manual override' to adjust specific days."
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {strategies.map((s) => {
              const inv = investments.filter((i) => i.strategyId === s.id);
              return (
                <AdminStrategyCard
                  key={s.id}
                  strategy={s}
                  investorCount={s.investors ?? inv.length}
                  totalStaked={s.totalStaked ?? inv.reduce((a, i) => a + i.invested, 0)}
                  todayRoi={s.todayRoi ?? null}
                  todayRoiTime={s.todayTime ?? null}
                  onPostRoi={() => openManualRoi(s.id)}
                  onRoiList={() => openRoiList(s.id)}
                  onEdit={() => { setFormError(null); setForm(toForm(s)); }}
                  onViewUsers={() => {
                    setSelectedId(s.id);
                    document.getElementById("strategy-investors")?.scrollIntoView({ behavior: "smooth" });
                  }}
                />
              );
            })}
          </div>
        </section>

        {/* Investors */}
        <section aria-label="Strategy investors" id="strategy-investors">
          <SectionHeader
            title={`Investors${selected ? ` · ${selected.name}` : ""}`}
            description="Unlock a user early or extend their personal lock period."
          />

          <div className="mb-3 flex flex-wrap gap-2">
            <div className="flex flex-wrap items-center gap-1 rounded-xl bg-muted p-1">
              {strategies.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedId(s.id)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    selectedId === s.id
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
            <div className="relative min-w-52 flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name or email"
                className={`${inputCls} h-9 pl-9 text-xs`}
              />
            </div>
          </div>

          {rows.length === 0 ? (
            <Card>
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Users className="size-6 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No investors in this strategy yet.</p>
              </div>
            </Card>
          ) : (
            <Table
              data={rows}
              columns={columns}
              getRowId={(r: Row) => r.id}
              height={Math.min(420, 56 + rows.length * 56)}
              rowHeight={56}
            />
          )}
        </section>

        <div className="h-20" />
      </div>

      {/* Create / edit strategy */}
      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? "Edit strategy" : "New strategy"}
        subtitle="Lock period applies to new investors only."
        footer={
          <>
            <button type="button" onClick={() => setForm(null)} className={`${btnGhost} flex-1`}>Cancel</button>
            <button type="button" onClick={handleSaveStrategy} className={`${btnPrimary} flex-1`}>
              {form?.id ? "Save changes" : "Create strategy"}
            </button>
          </>
        }
      >
        {form && (
          <div className="space-y-4 pb-2">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Package name">
                <input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="9 EMA Strategy" />
              </Field>
              <Field label="Exchange">
                <input className={inputCls} value={form.exchange} onChange={(e) => set("exchange", e.target.value)} />
              </Field>
              <Field label="Minimum stake ($)">
                <input className={inputCls} type="number" min="0" value={form.minStake} onChange={(e) => set("minStake", e.target.value)} />
              </Field>
              <Field label="Lock period (days)">
                <input className={inputCls} type="number" min="0" value={form.lockDays} onChange={(e) => set("lockDays", e.target.value)} />
              </Field>
              {form.id && (
                <>
                  <Field label="Total days running">
                    <input className={inputCls} type="number" min="0" step="1" value={form.daysRunning} onChange={(e) => set("daysRunning", e.target.value)} />
                  </Field>
                  <Field label="Total ROI (%)">
                    <input className={inputCls} type="number" step="0.01" placeholder="e.g. 12.5 or -3" value={form.totalRoi} onChange={(e) => set("totalRoi", e.target.value)} />
                  </Field>
                </>
              )}
            </div>
            {formError && <p className="text-xs font-medium text-destructive">{formError}</p>}
          </div>
        )}
      </Modal>

      {/* Manual ROI override (single day) */}
      <Modal
        open={!!manualRoi}
        onClose={() => setManualRoi(null)}
        title="Set daily ROI"
        subtitle="Time uses UTC+06:00; future entries stay pending until scheduled"
        footer={
          <>
            <button type="button" onClick={() => setManualRoi(null)} className={`${btnGhost} flex-1`}>Cancel</button>
            <button type="button" onClick={handleSaveManualRoi} className={`${btnPrimary} flex-1`}>Save</button>
          </>
        }
      >
        {manualRoi && (
          <div className="space-y-4 pb-2">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date">
                <input
                  className={inputCls}
                  type="date"
                  min={today}
                  value={manualRoi.date}
                  onChange={(e) => setManualRoi({ ...manualRoi, date: e.target.value })}
                />
              </Field>
              <Field label="Time">
                <input
                  className={inputCls}
                  type="time"
                  value={manualRoi.time}
                  onChange={(e) => setManualRoi({ ...manualRoi, time: e.target.value })}
                />
              </Field>
            </div>
            <Field label="ROI (%)">
              <input
                className={inputCls}
                type="number"
                step="0.01"
                placeholder="e.g. 2.5 or -1.2"
                value={manualRoi.roi}
                onChange={(e) => setManualRoi({ ...manualRoi, roi: e.target.value })}
                autoFocus
              />
            </Field>
            <p className="text-[11px] text-muted-foreground">
              This ROI will be added to users on {manualRoi.date} at {manualRoi.time || "the selected time"}. Negative values = loss.
            </p>
            {manualError && <p className="text-xs font-medium text-destructive">{manualError}</p>}
          </div>
        )}
      </Modal>

      {/* ROI list (previous daily ROI) */}
      <Modal
        open={!!roiList}
        onClose={() => setRoiList(null)}
        title="ROI list"
        subtitle={roiList ? strategies.find((x) => x.id === roiList.strategyId)?.name : undefined}
        footer={
          <button type="button" onClick={() => setRoiList(null)} className={`${btnGhost} flex-1`}>Close</button>
        }
      >
        {roiList && (
          <div className="space-y-3 pb-2">
            {roiList.loading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
            ) : roiList.error ? (
              <p className="py-8 text-center text-sm font-medium text-destructive">{roiList.error}</p>
            ) : roiList.entries.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <History className="size-6 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No ROI posted yet.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2 rounded-2xl bg-background p-3">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Entries</p>
                    <p className="mt-0.5 text-sm font-semibold text-foreground">{roiList.entries.length}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Total ROI</p>
                    <p className={`mt-0.5 text-sm font-semibold ${tone(roiList.entries.reduce((a, e) => a + e.roi, 0))}`}>
                      {pctText(round2(roiList.entries.reduce((a, e) => a + e.roi, 0)))}
                    </p>
                  </div>
                </div>

                <ul className="max-h-80 divide-y divide-border overflow-y-auto rounded-2xl border border-border">
                  {roiList.entries.map((e) => (
                    <li key={e.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground">
                          {new Date(`${e.date}T00:00:00Z`).toLocaleDateString("en-GB", {
                            day: "2-digit", month: "short", year: "numeric", timeZone: "UTC",
                          })}
                        </p>
                        {e.time && (
                          <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Clock className="size-3" /> {e.time}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${tone(e.roi)}`}>{pctText(e.roi)}</p>
                        {e.credited !== 0 && (
                          <p className={`text-[10px] ${tone(e.credited)}`}>{signed(e.credited)}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Post / update daily ROI (one or many days) - REMOVED */}

      {/* Unlock confirm */}
      <Modal
        open={action?.type === "unlock"}
        onClose={() => setAction(null)}
        title="Unlock this user early?"
        subtitle={action ? `${action.inv.name} · ${action.inv.email}` : undefined}
        footer={
          <>
            <button type="button" onClick={() => setAction(null)} className={`${btnGhost} flex-1`}>Keep locked</button>
            <button type="button" onClick={confirmUnlock} className={`${btnDanger} flex-1`}>Unlock now</button>
          </>
        }
      >
        {action && (
          <div className="space-y-2 rounded-2xl bg-background p-3 pb-3">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Invested</span>
              <span className="font-medium text-foreground">${fmt(action.inv.invested)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Profit</span>
              <span className={`font-medium ${tone(action.inv.profit)}`}>{signed(action.inv.profit)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Remaining lock</span>
              <span className="font-medium text-foreground">{lockInfo(action.inv).daysLeft} days</span>
            </div>
            <p className="pt-1 text-[11px] text-muted-foreground">
              The user will be able to withdraw immediately.
            </p>
          </div>
        )}
      </Modal>

      {/* Extend lock */}
      <Modal
        open={action?.type === "extend"}
        onClose={() => setAction(null)}
        title="Extend lock period"
        subtitle={action ? `${action.inv.name} · currently ${action.inv.lockDays} days` : undefined}
        footer={
          <>
            <button type="button" onClick={() => setAction(null)} className={`${btnGhost} flex-1`}>Cancel</button>
            <button type="button" onClick={confirmExtend} disabled={!(parseInt(extendDays, 10) > 0)} className={`${btnPrimary} flex-1`}>
              Extend lock
            </button>
          </>
        }
      >
        {action && (
          <div className="space-y-3 pb-2">
            <Field label="Add days">
              <input
                className={inputCls}
                type="number"
                min="1"
                value={extendDays}
                onChange={(e) => setExtendDays(e.target.value)}
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              {[3, 7, 15, 30].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setExtendDays(String(d))}
                  className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                >
                  +{d}d
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              New total lock: {action.inv.lockDays + (parseInt(extendDays, 10) || 0)} days.
              If this user was force-unlocked, they will be locked again.
            </p>
          </div>
        )}
      </Modal>
    </>
  );
}
