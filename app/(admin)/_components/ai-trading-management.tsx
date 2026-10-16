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
  cycleTotalRoi: string; // Total ROI for 30-day cycle
};

const EMPTY_FORM: StrategyForm = {
  id: null, name: "", exchange: "Binance", minStake: "", lockDays: "15",
  cycleTotalRoi: "0",
};

const toForm = (s: Strategy): StrategyForm => ({
  id: s.id, name: s.name, exchange: s.exchange, minStake: String(s.minStake),
  lockDays: String(s.lockDays), cycleTotalRoi: String(s.totalRoi),
});

// ── Strategy card ────────────────────────────────────────────────────────
function AdminStrategyCard({
  strategy, investorCount, totalStaked, onEdit, onViewUsers, onPostRoi,
}: {
  strategy: Strategy;
  investorCount: number;
  totalStaked: number;
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
        <Badge label="Auto" tone="success" />
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
        <TrendingUp className="size-3.5" /> Manual override today
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
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState<StrategyForm | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [manualRoi, setManualRoi] = useState<{ strategyId: string; date: string; roi: string } | null>(null);
  const [manualError, setManualError] = useState<string | null>(null);

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
    const cycleTotalRoi = parseFloat(form.cycleTotalRoi);

    if (!form.name.trim()) return setFormError("Package name is required");
    if (!(minStake > 0)) return setFormError("Minimum stake must be greater than 0");
    if (!(lockDays >= 0)) return setFormError("Lock period must be 0 or more days");
    if (Number.isNaN(cycleTotalRoi)) return setFormError("30-day cycle ROI is required");

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
          }),
        });

        if (!res.ok) throw new Error("Update failed");

        // Trigger schedule regeneration with new cycle ROI
        await fetch(`/api/admin/ai-trading/strategies/${form.id}/regenerate-schedule`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cycle_total_roi_pct: cycleTotalRoi }),
        });

        setStrategies((prev) =>
          prev.map((s) =>
            s.id === form.id
              ? { ...s, name: form.name.trim(), exchange: form.exchange.trim(), minStake, lockDays }
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
          }),
        });

        // Refresh strategies
        const data = await fetch("/api/admin/ai-trading/strategies").then(r => r.json());
        const newStrats: Strategy[] = data.strategies.map((s: any) => ({
          id: s.strategy_id,
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

  // ── Manual ROI override (single day) ──
  function openManualRoi(strategyId: string) {
    setManualError(null);
    setManualRoi({ strategyId, date: today, roi: "" });
  }

  async function handleSaveManualRoi() {
    if (!manualRoi) return;
    const roi = parseFloat(manualRoi.roi);
    if (Number.isNaN(roi)) return setManualError("Enter ROI %");
    if (roi < -100) return setManualError("ROI can't be below -100%");

    try {
      await fetch(`/api/admin/ai-trading/strategies/${manualRoi.strategyId}/daily-roi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: [{ date: manualRoi.date, roi }] }),
      });

      setManualError(null);
      setManualRoi(null);
      
      // Refresh page
      window.location.reload();
    } catch (err) {
      console.error(err);
      setManualError("Save failed");
    }
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
    
    fetch(`/api/admin/ai-trading/investments/${action.inv.id}/extend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days }),
    })
      .then(() => {
        setInvestments((prev) =>
          prev.map((i) =>
            i.id === action.inv.id
              ? { ...i, lockDays: i.lockDays + days, forceUnlocked: false }
              : i
          )
        );
        setAction(null);
      })
      .catch((err) => {
        console.error(err);
        alert("Extend failed");
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
                  investorCount={inv.length}
                  totalStaked={inv.reduce((a, i) => a + i.invested, 0)}
                  todayRoi={null}
                  onPostRoi={() => openManualRoi(s.id)}
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
              <Field label="30-Day Cycle Total ROI (%)">
                <input className={inputCls} type="number" step="0.1" value={form.cycleTotalRoi} onChange={(e) => set("cycleTotalRoi", e.target.value)} />
              </Field>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Enter the total ROI % for a 30-day cycle. System auto-distributes it daily with random variance. Use "Manual override" button to adjust specific days.
            </p>
            {formError && <p className="text-xs font-medium text-destructive">{formError}</p>}
          </div>
        )}
      </Modal>

      {/* Manual ROI override (single day) */}
      <Modal
        open={!!manualRoi}
        onClose={() => setManualRoi(null)}
        title="Manual ROI override"
        subtitle="Override auto-generated ROI for a specific date"
        footer={
          <>
            <button type="button" onClick={() => setManualRoi(null)} className={`${btnGhost} flex-1`}>Cancel</button>
            <button type="button" onClick={handleSaveManualRoi} className={`${btnPrimary} flex-1`}>Save</button>
          </>
        }
      >
        {manualRoi && (
          <div className="space-y-4 pb-2">
            <Field label="Date">
              <input
                className={inputCls}
                type="date"
                max={today}
                value={manualRoi.date}
                onChange={(e) => setManualRoi({ ...manualRoi, date: e.target.value })}
              />
            </Field>
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
              This will override the auto-generated ROI for {manualRoi.date}. Negative values = loss.
            </p>
            {manualError && <p className="text-xs font-medium text-destructive">{manualError}</p>}
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