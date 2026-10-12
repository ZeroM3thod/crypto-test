// Daily Profit management (admin)
"use client";

import {
  Badge, Card, Field, Modal, SectionHeader, Stat, Toggle,
  btnGhost, btnPrimary, fmt, inputCls, workingTime,
} from "@/app/(admin)/_components/admin-ui";
import { Table } from "@/components/motion/table";
import { Clock, Pencil, Plus, Search, TrendingUp, Users, Wallet } from "lucide-react";
import { useMemo, useState, useEffect } from "react";

// ── Time helpers (everything is stored in seconds) ───────────────────────
const DAY_SEC = 86400;

/** 86400 → "1d", 90 → "1m 30s", 0 → "0s" */
function humanSec(total: number): string {
  if (!(total > 0)) return "0s";
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [d && `${d}d`, h && `${h}h`, m && `${m}m`, s && `${s}s`].filter(Boolean).join(" ");
}

/** 86400 → "86,400 sec (1d)" */
const secLabel = (n: number) => `${n.toLocaleString("en-US")} sec (${humanSec(n)})`;

// ── Types ────────────────────────────────────────────────────────────────
type Plan = {
  id: string;
  name: string;
  badge: string;
  rate: number;            // daily %
  minimum: number;         // minimum join fee
  profitIntervalSec: number; // how often profit is credited (default 86400)
  lockPeriodSec: number;     // lock / cancel hold time in seconds (default 86400)
  payout: string;
  returnType: string;
  active: boolean;
};

type Investor = {
  id: string;
  planId: string;
  name: string;
  email: string;
  walletBalance: number;
  invested: number;
  earned: number;
  startedAt: string; // ISO
  status: "active" | "cancelled";
};

// ── Mock data (replace with API) ─────────────────────────────────────────

// ── Form state (strings so number inputs can be edited freely) ───────────
type PlanForm = {
  id: string | null; // null = creating
  name: string;
  badge: string;
  rate: string;
  minimum: string;
  profitIntervalSec: string;
  lockPeriodSec: string;
  payout: string;
  returnType: string;
  active: boolean;
};

const EMPTY_FORM: PlanForm = {
  id: null, name: "", badge: "", rate: "", minimum: "",
  profitIntervalSec: String(DAY_SEC), lockPeriodSec: String(DAY_SEC), payout: "Principal + profits", returnType: "Simple interest", active: true,
};

const planToForm = (p: Plan): PlanForm => ({
  id: p.id, name: p.name, badge: p.badge, rate: String(p.rate), minimum: String(p.minimum),
  profitIntervalSec: String(p.profitIntervalSec), lockPeriodSec: String(p.lockPeriodSec), payout: p.payout, returnType: p.returnType, active: p.active,
});

// ── Investor table columns ───────────────────────────────────────────────
type Row = Investor & { planName: string };

const COLUMNS = [
  { key: "name", header: "Name", width: "150px" },
  { key: "email", header: "Email", width: "190px" },
  { key: "planName", header: "Plan", width: "120px" },
  {
    key: "walletBalance", header: "Balance", width: "110px", align: "right" as const,
    cell: (r: Row) => <span className="text-xs font-medium text-foreground">${fmt(r.walletBalance)}</span>,
  },
  {
    key: "invested", header: "Invested", width: "100px", align: "right" as const,
    cell: (r: Row) => <span className="text-xs font-medium text-foreground">${fmt(r.invested)}</span>,
  },
  {
    key: "earned", header: "Earned", width: "100px", align: "right" as const,
    cell: (r: Row) => <span className="text-xs font-semibold text-success">+${fmt(r.earned)}</span>,
  },
  {
    key: "startedAt", header: "Running", width: "90px",
    cell: (r: Row) => <span className="text-xs text-muted-foreground">{workingTime(r.startedAt)}</span>,
  },
  {
    key: "status", header: "Status", width: "100px",
    cell: (r: Row) => (
      <Badge label={r.status} tone={r.status === "active" ? "success" : "muted"} />
    ),
  },
];

// ── Plan card (admin version) ────────────────────────────────────────────
function AdminPlanCard({
  plan, investors, onEdit, onToggle, onViewUsers,
}: {
  plan: Plan;
  investors: Investor[];
  onEdit: () => void;
  onToggle: (v: boolean) => void;
  onViewUsers: () => void;
}) {
  const running = investors.filter((i) => i.status === "active");
  const totalInvested = running.reduce((s, i) => s + i.invested, 0);

  return (
    <div className={`flex flex-col rounded-4xl border border-border bg-card p-6 ${plan.active ? "" : "opacity-70"}`}>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <span className="mb-1.5 inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
            <TrendingUp className="size-4" />
            {plan.badge}
          </span>
          <h3 className="text-base font-semibold text-foreground">{plan.name}</h3>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-foreground">{plan.rate}%</p>
          <p className="text-[10px] font-medium text-muted-foreground">per {humanSec(plan.profitIntervalSec)}</p>
        </div>
      </div>

      <ul className="mb-4 space-y-2.5">
        {[
          { label: "Minimum", value: `$${fmt(plan.minimum)}` },
          { label: "Profit added every", value: secLabel(plan.profitIntervalSec) },
          { label: "Lock period", value: secLabel(plan.lockPeriodSec) },
          { label: "Payout", value: plan.payout },
          { label: "Return type", value: plan.returnType },
          { label: "Running users", value: String(running.length) },
          { label: "Total invested", value: `$${fmt(totalInvested)}` },
        ].map((item) => (
          <li key={item.label} className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{item.label}</span>
            <span className="font-medium text-foreground">{item.value}</span>
          </li>
        ))}
      </ul>

      <div className="mb-4 flex items-center justify-between rounded-2xl bg-muted/50 px-4 py-3">
        <span className="text-xs text-muted-foreground">
          {plan.active ? "Visible to users" : "Hidden from users"}
        </span>
        <Toggle checked={plan.active} onChange={onToggle} label={`Toggle ${plan.name}`} />
      </div>

      <div className="mt-auto flex gap-2">
        <button type="button" onClick={onViewUsers} className={`${btnGhost} flex-1`}>
          <Users className="size-4" /> Users
        </button>
        <button type="button" onClick={onEdit} className={`${btnPrimary} flex-1`}>
          <Pencil className="size-4" /> Edit
        </button>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────
export function DailyProfitManagement() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [form, setForm] = useState<PlanForm | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [planFilter, setPlanFilter] = useState<"all" | string>("all");
  const [query, setQuery] = useState("");

  // Fetch plans and investments
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/daily-profit/plans").then(r => {
        console.log("Plans API status:", r.status);
        return r.json();
      }),
      fetch("/api/admin/daily-profit/investments").then(r => {
        console.log("Investments API status:", r.status);
        return r.json();
      }),
    ])
      .then(([plansData, investmentsData]) => {
        console.log("Plans data:", plansData);
        console.log("Investments data:", investmentsData);
        
        const fetchedPlans: Plan[] = (plansData.plans || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          badge: p.badge_label,
          rate: parseFloat(p.daily_rate),
          minimum: parseFloat(p.minimum_amount),
          profitIntervalSec: p.profit_interval_seconds,
          lockPeriodSec: p.cancel_policy_hours * 3600,
          payout: "Principal + profits",
          returnType: "Simple interest",
          active: p.active,
        }));
        setPlans(fetchedPlans);

        const fetchedInvestors: Investor[] = (investmentsData.investments || []).map((inv: any) => ({
          id: inv.id,
          planId: inv.plan_id,
          name: `${inv.user.first_name} ${inv.user.last_name}`,
          email: inv.user.email,
          walletBalance: 0,
          invested: parseFloat(inv.amount),
          earned: parseFloat(inv.total_profit),
          startedAt: inv.started_at,
          status: inv.status,
        }));
        setInvestors(fetchedInvestors);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setLoading(false);
      });
  }, []);

  // Stats
  const activeInvestors = investors.filter((i) => i.status === "active");
  const totalInvested = activeInvestors.reduce((s, i) => s + i.invested, 0);
  const dailyPayout = activeInvestors.reduce((s, i) => {
    const p = plans.find((p) => p.id === i.planId);
    // profit per cycle, scaled to a 24h window so plans with different intervals add up
    return s + (p ? ((i.invested * p.rate) / 100) * (DAY_SEC / p.profitIntervalSec) : 0);
  }, 0);

  // Table rows
  const rows: Row[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    return investors
      .filter((i) => planFilter === "all" || i.planId === planFilter)
      .filter((i) => !q || i.name.toLowerCase().includes(q) || i.email.toLowerCase().includes(q))
      .map((i) => ({ ...i, planName: plans.find((p) => p.id === i.planId)?.name ?? "—" }));
  }, [investors, plans, planFilter, query]);

  // Save plan (create or edit)
  async function handleSave() {
    if (!form) return;
    const rate = parseFloat(form.rate);
    const minimum = parseFloat(form.minimum);
    const intervalSec = Number(form.profitIntervalSec);
    const lockSec = Number(form.lockPeriodSec);

    if (!form.name.trim()) return setError("Plan name is required");
    if (!form.badge.trim()) return setError("Badge label is required");
    if (!(rate > 0)) return setError("Profit % per cycle must be greater than 0");
    if (!(minimum > 0)) return setError("Minimum join fee must be greater than 0");
    if (!Number.isInteger(intervalSec) || intervalSec < 1)
      return setError("Profit adding time must be a whole number of seconds (1 or more)");
    if (!Number.isInteger(lockSec) || lockSec < 0)
      return setError("Lock period must be a whole number of seconds (0 or more)");

    try {
      if (form.id) {
        // Update existing
        await fetch(`/api/admin/daily-profit/plans/${form.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            badge_label: form.badge.trim(),
            daily_rate: rate,
            minimum_amount: minimum,
            profit_interval_seconds: intervalSec,
            cancel_policy_hours: Math.floor(lockSec / 3600),
            active: form.active,
          }),
        });

        setPlans((prev) =>
          prev.map((p) =>
            p.id === form.id
              ? {
                  ...p,
                  name: form.name.trim(),
                  badge: form.badge.trim(),
                  rate,
                  minimum,
                  profitIntervalSec: intervalSec,
                  lockPeriodSec: lockSec,
                  active: form.active,
                }
              : p
          )
        );
      } else {
        // Create new
        const planId = form.name.trim().toLowerCase().replace(/\s+/g, "_");
        await fetch("/api/admin/daily-profit/plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan_id: planId,
            name: form.name.trim(),
            badge_label: form.badge.trim(),
            daily_rate: rate,
            minimum_amount: minimum,
            profit_interval_seconds: intervalSec,
            cancel_policy_hours: Math.floor(lockSec / 3600),
          }),
        });

        // Refresh plans
        const data = await fetch("/api/admin/daily-profit/plans").then(r => r.json());
        setPlans(data.plans.map((p: any) => ({
          id: p.id,
          name: p.name,
          badge: p.badge_label,
          rate: parseFloat(p.daily_rate),
          minimum: parseFloat(p.minimum_amount),
          profitIntervalSec: p.profit_interval_seconds,
          lockPeriodSec: p.cancel_policy_hours * 3600,
          payout: "Principal + profits",
          returnType: "Simple interest",
          active: p.active,
        })));
      }

      setError(null);
      setForm(null);
    } catch (err) {
      console.error(err);
      setError("Save failed");
    }
  }

  const set = <K extends keyof PlanForm>(k: K, v: PlanForm[K]) =>
    setForm((f) => (f ? { ...f, [k]: v } : f));

  return (
    <>
      <div className="space-y-8 overflow-y-auto px-5 py-6 sm:px-7 sm:py-8">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Package Management</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Daily Profit Plans
            </h1>
          </div>
          <button
            type="button"
            onClick={() => { setError(null); setForm({ ...EMPTY_FORM }); }}
            className={btnPrimary}
          >
            <Plus className="size-4" /> New plan
          </button>
        </div>

        {/* Stats */}
        <section aria-label="Summary">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card><Stat label="Total Plans" value={String(plans.length)} icon={<TrendingUp className="size-3.5" />} /></Card>
            <Card><Stat label="Running Users" value={String(activeInvestors.length)} icon={<Users className="size-3.5" />} /></Card>
            <Card><Stat label="Total Invested" value={`$${fmt(totalInvested)}`} icon={<Wallet className="size-3.5" />} /></Card>
            <Card>
              <Stat
                label="Est. Daily Payout"
                value={`$${fmt(dailyPayout)}`}
                icon={<Clock className="size-3.5" />}
                delta={{ value: "Scaled to 24h across plans", positive: false }}
              />
            </Card>
          </div>
        </section>

        {/* Plans */}
        <section aria-label="Plans">
          <SectionHeader
            title="Plans"
            description="Edit rate, minimum, profit adding time, lock period and visibility. Changes apply to new investments only."
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan) => (
              <AdminPlanCard
                key={plan.id}
                plan={plan}
                investors={investors.filter((i) => i.planId === plan.id)}
                onEdit={() => { setError(null); setForm(planToForm(plan)); }}
                onToggle={async (v) => {
                  try {
                    await fetch(`/api/admin/daily-profit/plans/${plan.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ active: v }),
                    });
                    setPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, active: v } : p)));
                  } catch (err) {
                    console.error(err);
                  }
                }}
                onViewUsers={() => {
                  setPlanFilter(plan.id);
                  document.getElementById("plan-investors")?.scrollIntoView({ behavior: "smooth" });
                }}
              />
            ))}
          </div>
        </section>

        {/* Investors */}
        <section aria-label="Plan investors" id="plan-investors">
          <SectionHeader
            title="Running Investments"
            description="Every user who has invested in a plan."
          />

          <div className="mb-3 flex flex-wrap gap-2">
            <div className="flex flex-wrap items-center gap-1 rounded-xl bg-muted p-1">
              {[{ id: "all", label: "All plans" }, ...plans.map((p) => ({ id: p.id, label: p.badge }))].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setPlanFilter(f.id)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    planFilter === f.id
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.label}
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
                <Search className="size-6 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No investors match.</p>
              </div>
            </Card>
          ) : (
            <Table
              data={rows}
              columns={COLUMNS}
              getRowId={(r: Row) => r.id}
              height={Math.min(420, 56 + rows.length * 48)}
              rowHeight={48}
            />
          )}
        </section>

        <div className="h-20" />
      </div>

      {/* Create / edit modal */}
      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? "Edit plan" : "New plan"}
        subtitle="Changes apply to new investments. Running investments keep their original rate."
        footer={
          <>
            <button type="button" onClick={() => setForm(null)} className={`${btnGhost} flex-1`}>Cancel</button>
            <button type="button" onClick={handleSave} className={`${btnPrimary} flex-1`}>
              {form?.id ? "Save changes" : "Create plan"}
            </button>
          </>
        }
      >
        {form && (
          <div className="space-y-4 pb-2">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Plan name">
                <input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Growth Plan" />
              </Field>
              <Field label="Badge label">
                <input className={inputCls} value={form.badge} onChange={(e) => set("badge", e.target.value)} placeholder="Growth" />
              </Field>
              <Field label="Profit per cycle (%)">
                <input className={inputCls} type="number" step="0.01" min="0" value={form.rate} onChange={(e) => set("rate", e.target.value)} />
              </Field>
              <Field label="Minimum join fee ($)">
                <input className={inputCls} type="number" min="0" value={form.minimum} onChange={(e) => set("minimum", e.target.value)} />
              </Field>
            </div>
            <Field
              label="Profit adding time (seconds)"
              hint={`Profit is credited every ${humanSec(Number(form.profitIntervalSec))}. Default 86400 sec = 24 hours.`}
            >
              <input className={inputCls} type="number" min="1" step="1" value={form.profitIntervalSec} onChange={(e) => set("profitIntervalSec", e.target.value)} />
            </Field>
            <Field
              label="Lock period (seconds)"
              hint={`User can cancel only after ${humanSec(Number(form.lockPeriodSec))}. Use 0 for instant cancel.`}
            >
              <input className={inputCls} type="number" min="0" step="1" value={form.lockPeriodSec} onChange={(e) => set("lockPeriodSec", e.target.value)} />
            </Field>
            <Field label="Payout text">
              <input className={inputCls} value={form.payout} onChange={(e) => set("payout", e.target.value)} />
            </Field>
            <Field label="Return type">
              <input className={inputCls} value={form.returnType} onChange={(e) => set("returnType", e.target.value)} />
            </Field>
            <div className="flex items-center justify-between rounded-2xl bg-muted/50 px-4 py-3">
              <span className="text-xs text-muted-foreground">Active (visible to users)</span>
              <Toggle checked={form.active} onChange={(v) => set("active", v)} label="Active" />
            </div>
            {error && <p className="text-xs font-medium text-destructive">{error}</p>}
          </div>
        )}
      </Modal>
    </>
  );
}