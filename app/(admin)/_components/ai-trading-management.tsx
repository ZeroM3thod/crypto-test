// AI Trading management (admin)
"use client";

import {
  Badge, Card, Field, Modal, SectionHeader, Stat,
  btnDanger, btnGhost, btnPrimary, btnSmall, fmt, inputCls, workingTime,
} from "@/app/(admin)/_components/admin-ui";
import { Table } from "@/components/motion/table";
import { Bot, Calendar, Lock, LockOpen, Pencil, Percent, Plus, Search, TrendingUp, Users, Wallet, X } from "lucide-react";
import { useMemo, useState, useEffect } from "react";

// ── Types ────────────────────────────────────────────────────────────────
type Strategy = {
  id: string;
  name: string;
  exchange: string;
  minStake: number;
  lockDays: number;     // default lock for NEW investors
  daysRunning: number;
  totalRoi: number;     // % since inception (moves with every posted daily ROI, can go down)
};

/** One admin-entered ROI for one strategy on one date. Can be negative (loss). */
type DailyEntry = {
  id: string;
  strategyId: string;
  date: string;         // YYYY-MM-DD
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
  daysRunning: string;
  totalRoi: string;
};

const EMPTY_FORM: StrategyForm = {
  id: null, name: "", exchange: "Binance", minStake: "", lockDays: "15",
  daysRunning: "0", totalRoi: "0",
};

const toForm = (s: Strategy): StrategyForm => ({
  id: s.id, name: s.name, exchange: s.exchange, minStake: String(s.minStake),
  lockDays: String(s.lockDays), daysRunning: String(s.daysRunning),
  totalRoi: String(s.totalRoi),
});

// ── Daily ROI form (multi-day) ───────────────────────────────────────────
type RoiRow = { date: string; roi: string };
type RoiForm = {
  strategyId: string;
  rows: RoiRow[];
  rangeFrom: string;
  rangeTo: string;
};

// ── Strategy card ────────────────────────────────────────────────────────
function AdminStrategyCard({
  strategy, investorCount, totalStaked, todayRoi, onEdit, onViewUsers, onPostRoi,
}: {
  strategy: Strategy;
  investorCount: number;
  totalStaked: number;
  todayRoi: number | null; // null = not posted yet today
  onEdit: () => void;
  onViewUsers: () => void;
  onPostRoi: () => void;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-foreground/5 text-foreground">
            <Bot className="size-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-card-foreground">{strategy.name}</p>
            <p className="text-[11px] text-muted-foreground">{strategy.exchange}</p>
          </div>
        </div>
        {todayRoi !== null ? (
          <Badge label={`${pctText(todayRoi)} today`} tone={todayRoi < 0 ? "destructive" : "success"} />
        ) : (
          <Badge label="Not posted" tone="muted" />
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Min. Stake</p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">${fmt(strategy.minStake)}</p>
        </div>
        <div>
          <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            <Percent className="size-3" /> Total ROI
          </p>
          <p className={`mt-0.5 text-sm font-semibold ${tone(strategy.totalRoi)}`}>
            {strategy.totalRoi >= 0 ? "+" : ""}{strategy.totalRoi.toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            <Calendar className="size-3" /> Days Running
          </p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">{strategy.daysRunning}</p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Lock Period</p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">{strategy.lockDays} days</p>
        </div>
      </div>

      <div className="mt-4 space-y-2 rounded-2xl bg-background p-3">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Investors</span>
          <span className="font-medium text-foreground">{investorCount}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Total staked</span>
          <span className="font-medium text-foreground">${fmt(totalStaked)}</span>
        </div>
      </div>

      <button type="button" onClick={onPostRoi} className={`${btnPrimary} mt-4 h-10 w-full text-xs`}>
        <TrendingUp className="size-3.5" /> {todayRoi !== null ? "Update daily ROI" : "Post daily ROI"}
      </button>

      <div className="mt-2 flex gap-2">
        <button type="button" onClick={onViewUsers} className={`${btnGhost} h-10 flex-1 text-xs`}>
          <Users className="size-3.5" /> Users
        </button>
        <button type="button" onClick={onEdit} className={`${btnGhost} h-10 flex-1 text-xs`}>
          <Pencil className="size-3.5" /> Edit
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
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState<StrategyForm | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [roiForm, setRoiForm] = useState<RoiForm | null>(null);
  const [roiError, setRoiError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string>("");
  const [query, setQuery] = useState("");

  const [action, setAction] = useState<{ type: "unlock" | "extend"; inv: Investment } | null>(null);
  const [extendDays, setExtendDays] = useState("7");

  // Fetch strategies and investments
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/ai-trading/strategies").then(r => {
        console.log("Strategies API status:", r.status);
        return r.json();
      }),
      fetch("/api/admin/ai-trading/investments").then(r => {
        console.log("Investments API status:", r.status);
        return r.json();
      }),
    ])
      .then(([strategiesData, investmentsData]) => {
        console.log("Strategies data:", strategiesData);
        console.log("Investments data:", investmentsData);
        
        const fetchedStrategies: Strategy[] = (strategiesData.strategies || []).map((s: any) => ({
          id: s.strategy_id,
          name: s.name,
          exchange: s.exchange,
          minStake: parseFloat(s.min_stake),
          lockDays: s.lock_days,
          daysRunning: s.days_running,
          totalRoi: parseFloat(s.total_roi_pct),
        }));
        setStrategies(fetchedStrategies);
        if (fetchedStrategies.length > 0) setSelectedId(fetchedStrategies[0].id);

        const fetchedInvestments: Investment[] = (investmentsData.investments || []).map((inv: any) => ({
          id: inv.id,
          strategyId: inv.strategy_id,
          name: `${inv.user.first_name} ${inv.user.last_name}`,
          email: inv.user.email,
          invested: parseFloat(inv.amount),
          profit: parseFloat(inv.total_profit),
          startedAt: inv.invested_at,
          lockDays: inv.lock_days,
          forceUnlocked: inv.status === "unlocked",
        }));
        setInvestments(fetchedInvestments);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setLoading(false);
      });
  }, []);

  const selected = strategies.find((s) => s.id === selectedId);
  const today = todayStr();

  // Stats
  const totalStaked = investments.reduce((s, i) => s + i.invested, 0);
  const postedToday = strategies.filter((s) =>
    entries.some((e) => e.strategyId === s.id && e.date === today),
  ).length;

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
    const daysRunning = parseInt(form.daysRunning, 10);
    const totalRoi = parseFloat(form.totalRoi);

    if (!form.name.trim()) return setFormError("Package name is required");
    if (!(minStake > 0)) return setFormError("Minimum stake must be greater than 0");
    if (!(lockDays >= 0)) return setFormError("Lock period must be 0 or more days");
    if (!(daysRunning >= 0)) return setFormError("Total running days must be 0 or more");
    if (Number.isNaN(totalRoi)) return setFormError("Total ROI is required");

    try {
      if (form.id) {
        // Update
        await fetch(`/api/admin/ai-trading/strategies/${form.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            exchange: form.exchange.trim() || "Binance",
            min_stake: minStake,
            lock_days: lockDays,
            days_running: daysRunning,
            total_roi_pct: totalRoi,
          }),
        });

        setStrategies((prev) =>
          prev.map((s) =>
            s.id === form.id
              ? { ...s, name: form.name.trim(), exchange: form.exchange.trim(), minStake, lockDays, daysRunning, totalRoi }
              : s
          )
        );
      } else {
        // Create
        const strategyId = form.name.trim().toLowerCase().replace(/\s+/g, "_");
        await fetch("/api/admin/ai-trading/strategies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            strategy_id: strategyId,
            name: form.name.trim(),
            exchange: form.exchange.trim() || "Binance",
            min_stake: minStake,
            lock_days: lockDays,
            days_running: daysRunning,
            total_roi_pct: totalRoi,
          }),
        });

        // Refresh strategies
        const data = await fetch("/api/admin/ai-trading/strategies").then(r => r.json());
        const newStrats: Strategy[] = data.strategies.map((s: any) => ({
          id: s.id,
          name: s.name,
          exchange: s.exchange,
          minStake: parseFloat(s.min_stake),
          lockDays: s.lock_days,
          daysRunning: s.days_running,
          totalRoi: parseFloat(s.total_roi_pct),
        }));
        setStrategies(newStrats);
        if (newStrats.length > 0 && !selectedId) setSelectedId(newStrats[0].id);
      }

      setFormError(null);
      setForm(null);
    } catch (err) {
      console.error(err);
      setFormError("Save failed");
    }
  }

  // ── Daily ROI (entered by admin, one or many days at once) ──
  const existingFor = (strategyId: string, date: string) =>
    entries.find((e) => e.strategyId === strategyId && e.date === date);

  /** Row for a date, pre-filled when that day was already posted. */
  const rowFor = (strategyId: string, date: string): RoiRow => {
    const ex = existingFor(strategyId, date);
    return { date, roi: ex ? String(ex.roi) : "" };
  };

  /** Investors who get credited for a date: started on or before that day. */
  const eligibleFor = (strategyId: string, date: string) =>
    investments.filter((i) => i.strategyId === strategyId && i.startedAt.slice(0, 10) <= date);

  function openRoi(strategyId: string) {
    setRoiError(null);
    setRoiForm({
      strategyId,
      rows: [rowFor(strategyId, today)],
      rangeFrom: dateOffset(6),
      rangeTo: today,
    });
  }

  const patchRoiForm = (patch: Partial<RoiForm>) =>
    setRoiForm((f) => (f ? { ...f, ...patch } : f));

  const sortDesc = (list: RoiRow[]) => [...list].sort((a, b) => (a.date < b.date ? 1 : -1));

  function changeRowDate(idx: number, date: string) {
    setRoiForm((f) => {
      if (!f) return f;
      const ex = existingFor(f.strategyId, date);
      return {
        ...f,
        rows: f.rows.map((r, i) => (i === idx ? { date, roi: ex ? String(ex.roi) : r.roi } : r)),
      };
    });
  }

  function changeRowRoi(idx: number, roi: string) {
    setRoiForm((f) => (f ? { ...f, rows: f.rows.map((r, i) => (i === idx ? { ...r, roi } : r)) } : f));
  }

  function removeRow(idx: number) {
    setRoiForm((f) => (f && f.rows.length > 1 ? { ...f, rows: f.rows.filter((_, i) => i !== idx) } : f));
  }

  /** Add the day before the earliest row (handy for filling missed days). */
  function addDay() {
    if (!roiForm) return;
    const earliest = roiForm.rows.map((r) => r.date).filter(Boolean).sort()[0] ?? today;
    const date = shiftDate(earliest, -1);
    patchRoiForm({ rows: sortDesc([...roiForm.rows, rowFor(roiForm.strategyId, date)]) });
  }

  /** Add one row for every day in the chosen range that isn't already listed. */
  function addRange() {
    if (!roiForm) return;
    const { rangeFrom, rangeTo, strategyId } = roiForm;
    if (!rangeFrom || !rangeTo) return setRoiError("Pick both range dates");
    if (rangeFrom > rangeTo) return setRoiError("Range start must be before the end");
    if (rangeTo > today) return setRoiError("You can't post ROI for a future date");

    const dates: string[] = [];
    for (let d = rangeFrom; d <= rangeTo; d = shiftDate(d, 1)) dates.push(d);
    if (dates.length > 31) return setRoiError("Pick a range of 31 days or less");

    const have = new Set(roiForm.rows.map((r) => r.date));
    const fresh = dates.filter((d) => !have.has(d)).map((d) => rowFor(strategyId, d));
    setRoiError(null);
    patchRoiForm({ rows: sortDesc([...roiForm.rows, ...fresh]) });
  }

  /** Per-row preview: who is credited and how much. */
  const roiPreview = useMemo(() => {
    if (!roiForm) return null;
    const items = roiForm.rows.map((r) => {
      const eligible = investments.filter(
        (i) => i.strategyId === roiForm.strategyId && i.startedAt.slice(0, 10) <= r.date,
      );
      const roi = parseFloat(r.roi);
      const base = eligible.reduce((s, i) => s + i.invested, 0);
      return {
        investors: eligible.length,
        credit: Number.isNaN(roi) ? 0 : round2((base * roi) / 100),
        existing: entries.find((e) => e.strategyId === roiForm.strategyId && e.date === r.date),
      };
    });
    return {
      items,
      totalCredit: round2(items.reduce((s, x) => s + x.credit, 0)),
      updates: items.filter((x) => x.existing).length,
    };
  }, [roiForm, investments, entries]);

  const roiHistory = useMemo(
    () =>
      roiForm
        ? entries
            .filter((e) => e.strategyId === roiForm.strategyId)
            .sort((a, b) => (a.date < b.date ? 1 : -1))
            .slice(0, 7)
        : [],
    [roiForm, entries],
  );

  const roiStrategy = roiForm ? strategies.find((s) => s.id === roiForm.strategyId) : undefined;

  function handleSaveRoi() {
    if (!roiForm) return;
    const { strategyId } = roiForm;

    // 1) validate every row
    const seen = new Set<string>();
    const parsed: { date: string; roi: number }[] = [];
    for (const r of roiForm.rows) {
      if (!r.date) return setRoiError("Every row needs a date");
      if (r.date > today) return setRoiError(`${r.date} is in the future`);
      if (seen.has(r.date)) return setRoiError(`${r.date} is listed twice`);
      seen.add(r.date);
      const roi = parseFloat(r.roi);
      if (Number.isNaN(roi)) return setRoiError(`Enter the ROI for ${r.date}`);
      if (roi < -100) return setRoiError(`ROI for ${r.date} can't be below -100%`);
      parsed.push({ date: r.date, roi });
    }

    // 2) work out what actually changes
    const changes = parsed
      .map(({ date, roi }) => {
        const existing = existingFor(strategyId, date);
        const delta = roi - (existing?.roi ?? 0);
        const eligible = eligibleFor(strategyId, date);
        const credited = round2(eligible.reduce((s, i) => s + (i.invested * roi) / 100, 0));
        return { date, roi, existing, delta, eligible, credited };
      })
      .filter((c) => !c.existing || c.delta !== 0);

    if (changes.length === 0) {
      setRoiForm(null);
      return;
    }

    // 3) apply together
    // TODO: API → POST /api/admin/ai-trading/strategies/:id/daily-roi { entries: [{ date, roi }, ...] }
    // Server must be idempotent per (strategy, date): updating a day applies only the difference.
    const profitDelta = new Map<string, number>();
    for (const c of changes) {
      for (const inv of c.eligible) {
        profitDelta.set(inv.id, (profitDelta.get(inv.id) ?? 0) + (inv.invested * c.delta) / 100);
      }
    }
    const roiDelta = changes.reduce((s, c) => s + c.delta, 0);

    setInvestments((prev) =>
      prev.map((i) =>
        profitDelta.has(i.id) ? { ...i, profit: round2(i.profit + profitDelta.get(i.id)!) } : i,
      ),
    );
    setStrategies((prev) =>
      prev.map((s) => (s.id === strategyId ? { ...s, totalRoi: round2(s.totalRoi + roiDelta) } : s)),
    );
    setEntries((prev) => {
      let next = prev;
      for (const c of changes) {
        next = c.existing
          ? next.map((e) => (e.id === c.existing!.id ? { ...e, roi: c.roi, credited: c.credited } : e))
          : [
              ...next,
              {
                id: `d${Date.now()}-${c.date}`,
                strategyId,
                date: c.date,
                roi: c.roi,
                credited: c.credited,
              },
            ];
      }
      return next;
    });

    setRoiError(null);
    setRoiForm(null);
  }

  // ── Per-user actions ──
  async function confirmUnlock() {
    if (!action) return;
    try {
      await fetch(`/api/admin/ai-trading/investments/${action.inv.id}/unlock`, {
        method: "POST",
      });
      setInvestments((prev) =>
        prev.map((i) => (i.id === action.inv.id ? { ...i, forceUnlocked: true } : i))
      );
      setAction(null);
    } catch (err) {
      console.error(err);
      alert("Unlock failed");
    }
  }

  function confirmExtend() {
    if (!action) return;
    const days = parseInt(extendDays, 10);
    if (!(days > 0)) return;
    // TODO: API → POST /api/admin/ai-trading/investments/:id/extend { days }
    setInvestments((prev) =>
      prev.map((i) =>
        i.id === action.inv.id
          ? { ...i, lockDays: i.lockDays + days, forceUnlocked: false }
          : i
      )
    );
    setAction(null);
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

  const dayCount = roiForm?.rows.length ?? 0;

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
            <Card><Stat label="Posted Today" value={`${postedToday} / ${strategies.length}`} icon={<Percent className="size-3.5" />} /></Card>
          </div>
        </section>

        {/* Strategies */}
        <section aria-label="Strategies">
          <SectionHeader
            title="Strategies"
            description="Create packages and post ROI manually, for one day or many days at once. Negative ROI records a loss. Lock-period changes only affect new investors."
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {strategies.map((s) => {
              const inv = investments.filter((i) => i.strategyId === s.id);
              const todayEntry = entries.find((e) => e.strategyId === s.id && e.date === today);
              return (
                <AdminStrategyCard
                  key={s.id}
                  strategy={s}
                  investorCount={inv.length}
                  totalStaked={inv.reduce((a, i) => a + i.invested, 0)}
                  todayRoi={todayEntry ? todayEntry.roi : null}
                  onPostRoi={() => openRoi(s.id)}
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
              <Field label="Total running days">
                <input className={inputCls} type="number" min="0" value={form.daysRunning} onChange={(e) => set("daysRunning", e.target.value)} />
              </Field>
              <Field label="Total ROI (%)">
                <input className={inputCls} type="number" step="0.1" value={form.totalRoi} onChange={(e) => set("totalRoi", e.target.value)} />
              </Field>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Daily ROI is not fixed. Post it from the strategy card using “Post daily ROI”.
            </p>
            {formError && <p className="text-xs font-medium text-destructive">{formError}</p>}
          </div>
        )}
      </Modal>

      {/* Post / update daily ROI (one or many days) */}
      <Modal
        open={!!roiForm}
        onClose={() => setRoiForm(null)}
        title={dayCount > 1 ? `Post ROI for ${dayCount} days` : roiPreview?.updates ? "Update daily ROI" : "Post daily ROI"}
        subtitle={roiStrategy ? `${roiStrategy.name} · applied to every investor of this package` : undefined}
        footer={
          <>
            <button type="button" onClick={() => setRoiForm(null)} className={`${btnGhost} flex-1`}>Cancel</button>
            <button type="button" onClick={handleSaveRoi} className={`${btnPrimary} flex-1`}>
              {dayCount > 1 ? `Save ${dayCount} days` : roiPreview?.updates ? "Update ROI" : "Post ROI"}
            </button>
          </>
        }
      >
        {roiForm && roiPreview && (
          <div className="space-y-4 pb-2">
            {/* day rows */}
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_1fr_auto] gap-2 px-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                <span>Date</span>
                <span>ROI (%) · negative = loss</span>
                <span className="w-7" />
              </div>
              {roiForm.rows.map((r, idx) => {
                const info = roiPreview.items[idx];
                return (
                  <div key={idx} className="space-y-1">
                    <div className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
                      <input
                        className={inputCls}
                        type="date"
                        max={today}
                        value={r.date}
                        onChange={(e) => changeRowDate(idx, e.target.value)}
                      />
                      <input
                        className={inputCls}
                        type="number"
                        step="0.01"
                        min="-100"
                        placeholder="e.g. 0.45 or -0.8"
                        value={r.roi}
                        onChange={(e) => changeRowRoi(idx, e.target.value)}
                        autoFocus={idx === 0}
                      />
                      <button
                        type="button"
                        onClick={() => removeRow(idx)}
                        disabled={roiForm.rows.length === 1}
                        aria-label="Remove day"
                        className="grid size-7 place-items-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-30"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between px-1 text-[11px]">
                      <span className="text-muted-foreground">
                        {info.investors} investor{info.investors === 1 ? "" : "s"}
                        {info.existing ? ` · update (was ${pctText(info.existing.roi)})` : ""}
                      </span>
                      <span className={`font-semibold ${tone(info.credit)}`}>{signed(info.credit)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* add more days */}
            <div className="space-y-3 rounded-2xl border border-border p-3">
              <button type="button" onClick={addDay} className={`${btnSmall} w-full`}>
                <Plus className="size-3" /> Add previous day
              </button>
              <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
                <Field label="Range from">
                  <input
                    className={inputCls}
                    type="date"
                    max={today}
                    value={roiForm.rangeFrom}
                    onChange={(e) => patchRoiForm({ rangeFrom: e.target.value })}
                  />
                </Field>
                <Field label="Range to">
                  <input
                    className={inputCls}
                    type="date"
                    max={today}
                    value={roiForm.rangeTo}
                    onChange={(e) => patchRoiForm({ rangeTo: e.target.value })}
                  />
                </Field>
                <button type="button" onClick={addRange} className={`${btnSmall} h-10`}>
                  Add range
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                A range adds one row per day (max 31). Fill in each day’s ROI above.
              </p>
            </div>

            {/* summary */}
            <div className="space-y-2 rounded-2xl bg-background p-3">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Days</span>
                <span className="font-medium text-foreground">
                  {dayCount}
                  {roiPreview.updates ? ` (${roiPreview.updates} update${roiPreview.updates === 1 ? "" : "s"})` : ""}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Total across all days</span>
                <span className={`font-semibold ${tone(roiPreview.totalCredit)}`}>{signed(roiPreview.totalCredit)}</span>
              </div>
              {roiPreview.updates > 0 && (
                <p className="pt-1 text-[11px] text-muted-foreground">
                  Days that were already posted only apply the difference, so nobody is credited twice.
                </p>
              )}
            </div>

            {roiHistory.length > 0 && (
              <div>
                <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Recent entries · click to add to the list
                </p>
                <div className="divide-y divide-border rounded-2xl border border-border">
                  {roiHistory.map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => {
                        if (roiForm.rows.some((r) => r.date === e.date)) return;
                        patchRoiForm({ rows: sortDesc([...roiForm.rows, rowFor(roiForm.strategyId, e.date)]) });
                      }}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-xs outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="text-muted-foreground">{e.date}</span>
                      <span className="font-medium text-foreground">{pctText(e.roi)}</span>
                      <span className={`font-semibold ${tone(e.credited)}`}>{signed(e.credited)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {roiError && <p className="text-xs font-medium text-destructive">{roiError}</p>}
          </div>
        )}
      </Modal>

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