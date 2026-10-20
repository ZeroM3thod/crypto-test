"use client";

import { useEffect, useState } from "react";
import {
  Trophy,
  DollarSign,
  Users,
  Plus,
  Trash2,
  Check,
  Save,
  Bot,
  TrendingUp,
} from "lucide-react";

/* ───────── Types ───────── */

type TabId = "milestones" | "commission" | "top";
type ProfitSource = "daily" | "aiTrading";

interface MilestoneDraft {
  id: number;
  requiredActive: string;
  reward: string;
}

const SOURCE_META: Record<
  ProfitSource,
  { label: string; icon: typeof TrendingUp; basis: string }
> = {
  daily: { label: "Daily Profit", icon: TrendingUp, basis: "% of profit · lifetime" },
  aiTrading: { label: "AI Trading", icon: Bot, basis: "% of profit · lifetime" },
};

const EMPTY_RATES: Record<ProfitSource, string> = { daily: "0", aiTrading: "0" };

const TABS: { id: TabId; label: string }[] = [
  { id: "milestones", label: "Milestones" },
  { id: "commission", label: "Commission" },
  { id: "top", label: "Top Referrers" },
];

const inputCls =
  "h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring";

/* ───────── UI primitives ───────── */

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-4xl border border-border bg-card p-6 ${className}`}>{children}</div>;
}

/* ───────── Page ───────── */

export function ReferralBasicManagement() {
  const [tab, setTab] = useState<TabId>("milestones");
  const [toast, setToast] = useState({ msg: "", show: false });

  // Milestones
  const [nextId, setNextId] = useState(1);
  const [milestones, setMilestones] = useState<MilestoneDraft[]>([]);
  const [milestoneError, setMilestoneError] = useState("");

  // Commission
  const [rates, setRates] = useState<Record<ProfitSource, string>>(EMPTY_RATES);
  const [rateError, setRateError] = useState("");
  const [top, setTop] = useState<{userId:string;name:string;email:string;totalReferred:number;active:number;commission:number}[]>([]);

  useEffect(() => { fetch("/api/admin/referral").then(async r => { if (!r.ok) throw new Error(); return r.json(); }).then(d => {
    setMilestones(d.milestones.map((m: {id:string;required_active:number;reward:number}) => ({id:Number(m.id.slice(0,8).replace(/\\D/g,"")) || Math.random(),requiredActive:String(m.required_active),reward:String(m.reward)})));
    setNextId(d.milestones.length + 1); setRates(Object.fromEntries(Object.entries(d.rates).map(([k,v]) => [k,String(v)])) as Record<ProfitSource,string>); setTop(d.top);
  }).catch(() => showToast("Could not load referral settings")); }, []);

  const showToast = (msg: string) => {
    setToast({ msg, show: true });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3000);
  };

  /* ---- Milestone actions ---- */
  const updateMilestone = (id: number, field: "requiredActive" | "reward", value: string) =>
    setMilestones((list) => list.map((m) => (m.id === id ? { ...m, [field]: value } : m)));

  const addMilestone = () => {
    setMilestones((list) => [...list, { id: nextId, requiredActive: "", reward: "" }]);
    setNextId((n) => n + 1);
  };

  const removeMilestone = (id: number) => setMilestones((list) => list.filter((m) => m.id !== id));

  const saveMilestones = async () => {
    const parsed = milestones.map((m) => ({
      requiredActive: Number(m.requiredActive),
      reward: Number(m.reward),
    }));

    if (parsed.some((m) => !Number.isInteger(m.requiredActive) || m.requiredActive <= 0)) {
      return setMilestoneError("Every milestone needs a whole number of active users greater than 0.");
    }
    if (parsed.some((m) => Number.isNaN(m.reward) || m.reward < 0)) {
      return setMilestoneError("Every milestone needs a valid reward amount.");
    }
    if (new Set(parsed.map((m) => m.requiredActive)).size !== parsed.length) {
      return setMilestoneError("Two milestones can't have the same user number.");
    }

    const sorted = [...parsed].sort((a, b) => a.requiredActive - b.requiredActive);
    setMilestoneError("");
    setMilestones(
      sorted.map((m, i) => ({ id: i + 1, requiredActive: String(m.requiredActive), reward: String(m.reward) }))
    );
    setNextId(sorted.length + 1);

    const res = await fetch("/api/admin/referral", { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({milestones:sorted}) });
    showToast(res.ok ? "Milestones saved" : "Could not save milestones");
  };

  /* ---- Commission actions ---- */
  const saveRates = async () => {
    const invalid = (Object.keys(rates) as ProfitSource[]).some((k) => {
      const n = Number(rates[k]);
      return rates[k].trim() === "" || Number.isNaN(n) || n < 0 || n > 100;
    });
    if (invalid) return setRateError("Each rate must be a number between 0 and 100.");

    setRateError("");
    const res = await fetch("/api/admin/referral", { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({rates:Object.fromEntries(Object.entries(rates).map(([k,v])=>[k,Number(v)]))}) });
    showToast(res.ok ? "Commission rates saved" : "Could not save rates");
  };

  return (
    <div className="relative overflow-y-auto px-5 py-6 sm:px-7 sm:py-8">
      {/* Toast */}
      {toast.show && (
        <div className="fixed right-6 top-6 z-[999] flex items-center gap-2 rounded-2xl border border-border bg-foreground px-4 py-3 text-sm font-medium text-background shadow-lg">
          <Check className="size-4" />
          {toast.msg}
        </div>
      )}

      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div>
          <p className="text-xs font-medium text-muted-foreground">Referral</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Basic Management
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {TABS.map((t) => {
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={[
                  "shrink-0 rounded-full border px-4 py-2 text-xs font-medium transition-colors",
                  isActive
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground",
                ].join(" ")}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ── MILESTONES ── */}
        {tab === "milestones" && (
          <Card>
            <div className="mb-1 flex items-center gap-2">
              <Trophy className="size-4 text-foreground" />
              <h2 className="text-lg font-semibold text-foreground">Referral Milestones</h2>
            </div>
            <p className="mb-5 text-sm text-muted-foreground">
              Edit the required active users and reward for each tier, or add a new milestone.
            </p>

            <div className="mb-2 grid grid-cols-[1fr_1fr_40px] gap-2 px-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              <span>Active Users</span>
              <span>Reward ($)</span>
              <span />
            </div>

            <div className="flex flex-col gap-2">
              {milestones.map((m) => (
                <div key={m.id} className="grid grid-cols-[1fr_1fr_40px] items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    inputMode="numeric"
                    value={m.requiredActive}
                    onChange={(e) => updateMilestone(m.id, "requiredActive", e.target.value)}
                    placeholder="e.g. 200"
                    className={inputCls}
                  />
                  <input
                    type="number"
                    min={0}
                    inputMode="decimal"
                    value={m.reward}
                    onChange={(e) => updateMilestone(m.id, "reward", e.target.value)}
                    placeholder="e.g. 300"
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={() => removeMilestone(m.id)}
                    aria-label="Remove milestone"
                    className="flex size-10 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}

              {milestones.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                  No milestones yet — add one below.
                </div>
              )}
            </div>

            {milestoneError && <p className="mt-3 text-xs font-medium text-destructive">{milestoneError}</p>}

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={addMilestone}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-border py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
              >
                <Plus className="size-4" /> Add Milestone
              </button>
              <button
                type="button"
                onClick={saveMilestones}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-foreground py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
              >
                <Save className="size-4" /> Save Changes
              </button>
            </div>
          </Card>
        )}

        {/* ── COMMISSION ── */}
        {tab === "commission" && (
          <Card>
            <div className="mb-1 flex items-center gap-2">
              <DollarSign className="size-4 text-foreground" />
              <h2 className="text-lg font-semibold text-foreground">Lifetime Commission</h2>
            </div>
            <p className="mb-5 text-sm text-muted-foreground">
              Set lifetime commission percentages for daily profit and AI trading.
            </p>

            <div className="flex flex-col gap-2.5">
              {(Object.keys(SOURCE_META) as ProfitSource[]).map((key) => {
                const meta = SOURCE_META[key];
                const Icon = meta.icon;
                return (
                  <div key={key} className="flex items-center gap-3 rounded-2xl border border-border p-3.5">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                      <Icon className="size-4 text-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-foreground">{meta.label}</div>
                      <div className="text-xs text-muted-foreground">{meta.basis}</div>
                    </div>
                    <div className="relative w-24 shrink-0">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="0.1"
                        value={rates[key]}
                        onChange={(e) => setRates((r) => ({ ...r, [key]: e.target.value }))}
                        className={`${inputCls} pr-7 text-right`}
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        %
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {rateError && <p className="mt-3 text-xs font-medium text-destructive">{rateError}</p>}

            <button
              type="button"
              onClick={saveRates}
              className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-foreground py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
            >
              <Save className="size-4" /> Save Commission Rates
            </button>
          </Card>
        )}

        {/* ── TOP REFERRERS ── */}
        {tab === "top" && (
          <Card>
            <div className="mb-1 flex items-center gap-2">
              <Users className="size-4 text-foreground" />
              <h2 className="text-lg font-semibold text-foreground">Top Referrers</h2>
            </div>
            <p className="mb-5 text-sm text-muted-foreground">Users ranked by active referrals.</p>

            <div className="flex flex-col gap-2">
              {[...top]
                .sort((a, b) => b.active - a.active)
                .map((u, i) => (
                  <div
                    key={u.userId}
                    className="flex items-center justify-between rounded-2xl border border-border p-3.5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={[
                          "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                          i === 0
                            ? "bg-foreground text-background"
                            : "border border-border text-muted-foreground",
                        ].join(" ")}
                      >
                        {i + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-foreground">{u.name}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {u.email} · {u.totalReferred} referred
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-sm font-semibold text-foreground">{u.active} active</div>
                      <div className="text-[11px] text-muted-foreground">
                        ${u.commission.toLocaleString(undefined, { minimumFractionDigits: 2 })} earned
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
