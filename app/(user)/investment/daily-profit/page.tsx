"use client";

import { UserShell } from "@/app/(user)/_components/user-shell";
import {
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Search,
  TrendingUp,
  X,
  Crown,
  Zap,
  Star,
  Clock,
  Wallet,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  CircleDot,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

// ── Shared primitives ────────────────────────────────────────────────────────

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-4xl border border-border bg-card p-6 ${className}`}>
      {children}
    </div>
  );
}

function Stat({
  label,
  value,
  delta,
  loading = false,
}: {
  label: string;
  value: string;
  delta?: { value: string; positive: boolean };
  loading?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      {loading ? (
        <div className="h-6 w-24 animate-pulse rounded-md bg-muted" />
      ) : (
        <p className="text-lg font-semibold text-foreground">{value}</p>
      )}
      {delta && !loading && (
        <p
          className={`flex items-center gap-1 text-xs font-medium ${
            delta.positive ? "text-success" : "text-destructive"
          }`}
        >
          {delta.positive ? (
            <ArrowUpRight className="size-3" />
          ) : (
            <ArrowDownRight className="size-3" />
          )}
          {delta.value}
        </p>
      )}
    </div>
  );
}

// ── Plans data ───────────────────────────────────────────────────────────────

type PlanTier = string;

type Plan = {
  id: PlanTier;
  name: string;
  rate: number;
  minimum: number;
  icon: React.ReactNode;
  badge: string;
  accentClass: string;
  badgeClass: string;
  buttonClass: string;
  ribbon?: string;
};

type ActivePlan = {
  id: string;
  planId: string;
  planName: string;
  rate: number;
  invested: number;
  startedAt: Date;
  creditsEarned: number;
  profitPerCycle: number;
  nextCreditAt: Date;
};

type HistoryRow = {
  id: string;
  date: string;
  planName: string;
  planId: string;
  invested: number;
  rate: number;
  profit: number;
  walletCredited: string;
  cumulative: number;
  status: "active" | "cancelled";
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number, decimals = 2) {
  return "$" + n.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function useCountdown(targetMs: number) {
  const [remaining, setRemaining] = useState(Math.max(0, targetMs - Date.now()));
  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => {
      const r = Math.max(0, targetMs - Date.now());
      setRemaining(r);
      if (r === 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [targetMs, remaining]);
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  return {
    display: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
    done: remaining === 0,
  };
}

function getIcon(planId: string) {
  if (planId === "starter") return <Zap className="size-4" />;
  if (planId === "growth") return <TrendingUp className="size-4" />;
  if (planId === "elite") return <Crown className="size-4" />;
  return <Star className="size-4" />;
}

function planBadge(planId: string, badge?: string) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-muted text-muted-foreground">
      {getIcon(planId)}
      {badge || planId}
    </span>
  );
}

// ── Plan Calculator Card ───────────────────────────────────────────────────────

function PlanCard({
  plan,
  onInvest,
}: {
  plan: Plan;
  onInvest: (plan: Plan, amount: number) => void;
}) {
  const [amount, setAmount] = useState(plan.minimum);
  const safeAmount = Math.max(plan.minimum, amount || plan.minimum);
  const daily = (safeAmount * plan.rate) / 100;
  const week7 = daily * 7;
  const month30 = daily * 30;
  const totalMonth = safeAmount + month30;

  return (
    <div
      className={`relative flex flex-col rounded-4xl border bg-card p-6 transition-shadow hover:shadow-sm ${plan.accentClass} ${plan.ribbon ? "mt-6" : ""}`}
    >
      {/* Ribbon */}
      {plan.ribbon && (
        <div className="absolute -top-6 right-6">
          <span
            className={`inline-block rounded-t-xl px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
              plan.id === "elite"
                ? "bg-primary/20 text-primary"
                : "bg-foreground text-background"
            }`}
          >
            {plan.ribbon}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <span className={`mb-1.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${plan.badgeClass}`}>
            {plan.icon}
            {plan.badge}
          </span>
          <h3 className="text-base font-semibold text-foreground">{plan.name}</h3>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-foreground">
            {plan.rate}%
          </p>
          <p className="text-[10px] font-medium text-muted-foreground">per day</p>
        </div>
      </div>

      {/* Details */}
      <ul className="mb-4 space-y-2.5">
        {[
          { label: "Minimum", value: fmt(plan.minimum) },
          { label: "Cancel policy", value: "After 24 hours" },
          { label: "Payout", value: "Principal + profits" },
          { label: "Return type", value: "Simple interest" },
        ].map((item) => (
          <li key={item.label} className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{item.label}</span>
            <span className="font-medium text-foreground">{item.value}</span>
          </li>
        ))}
      </ul>

      {/* Calculator */}
      <div className="mb-4 rounded-2xl border border-border bg-muted/40 p-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          Estimate returns
        </p>
        <div className="mb-3.5 flex items-center gap-2">
          <span className="text-sm font-semibold text-muted-foreground">$</span>
          <input
            type="number"
            min={plan.minimum}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
        {amount < plan.minimum && (
          <p className="mb-2 text-xs text-destructive">
            Minimum investment is {fmt(plan.minimum)}
          </p>
        )}
        <div className="space-y-2">
          {[
            { label: "Daily profit",      value: fmt(daily) },
            { label: "7-day profit",      value: fmt(week7) },
            { label: "30-day profit",     value: fmt(month30) },
            { label: "Total after 30 days", value: fmt(totalMonth), bold: true },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{row.label}</span>
              <span className={`text-success ${row.bold ? "font-bold" : "font-medium"}`}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={() => onInvest(plan, safeAmount)}
        className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold transition-opacity outline-none focus-visible:ring-2 focus-visible:ring-ring ${plan.buttonClass}`}
      >
        Invest Now
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}

// ── Active Plan Card ──────────────────────────────────────────────────────────

function ActivePlanCard({
  plan,
  onCancel,
}: {
  plan: ActivePlan;
  onCancel: (plan: ActivePlan) => void;
}) {
  const cancelUnlockMs = plan.startedAt.getTime() + 24 * 60 * 60 * 1000;
  const nextCreditMs = plan.nextCreditAt.getTime();

  const cancelCountdown = useCountdown(cancelUnlockMs);
  const creditCountdown = useCountdown(nextCreditMs);

  const totalEarned = plan.profitPerCycle * plan.creditsEarned;
  const elapsed = Date.now() - plan.startedAt.getTime();
  const daysRunning = Math.floor(elapsed / (24 * 60 * 60 * 1000));
  const hoursRunning = Math.floor((elapsed % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

  const lastCreditDate =
    plan.creditsEarned > 0
      ? new Date(plan.startedAt.getTime() + plan.creditsEarned * 24 * 60 * 60 * 1000)
      : null;

  return (
    <Card>
      {/* Header */}
      <div className="mb-3.5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {planBadge(plan.planId, plan.planName)}
          <span className="flex items-center gap-1.5 text-xs font-medium text-success">
            <CircleDot className="size-3 animate-pulse" />
            Active
          </span>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Invested</p>
          <p className="text-sm font-bold text-foreground">{fmt(plan.invested)}</p>
        </div>
      </div>

      {/* Details row */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Daily rate", value: `${plan.rate}%` },
          {
            label: "Running",
            value:
              daysRunning > 0
                ? `${daysRunning}d ${hoursRunning}h`
                : `${hoursRunning}h`,
          },
          { label: "Total earned", value: `+${fmt(totalEarned)}` },
          {
            label: "Last credit",
            value: lastCreditDate
              ? lastCreditDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
              : "—",
          },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl bg-muted/50 p-3">
            <p className="mb-1 text-[10px] font-medium text-muted-foreground">{item.label}</p>
            <p className="text-sm font-semibold text-foreground">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Next credit */}
      <div className="mb-3.5 flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="size-3.5" />
          Next profit credit
        </div>
        <span className="font-mono text-sm font-semibold text-foreground">
          {creditCountdown.done ? "Crediting soon…" : creditCountdown.display}
        </span>
      </div>

      {/* Cancel section */}
      {cancelCountdown.done ? (
        <button
          type="button"
          onClick={() => onCancel(plan)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 py-2.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10 outline-none focus-visible:ring-2 focus-visible:ring-destructive"
        >
          Cancel Plan
        </button>
      ) : (
        <div>
          <button
            type="button"
            disabled
            title={`Available after ${cancelCountdown.display}`}
            className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-2xl border border-border bg-muted/30 py-2.5 text-sm font-semibold text-muted-foreground"
          >
            Cancel Plan
          </button>
          <p className="mt-1.5 text-center text-xs text-muted-foreground">
            Cancel unlocks in{" "}
            <span className="font-mono font-semibold text-foreground">
              {cancelCountdown.display}
            </span>
          </p>
        </div>
      )}
    </Card>
  );
}

// ── Investment Confirmation Modal ─────────────────────────────────────────────

function InvestModal({
  plan,
  amount,
  onConfirm,
  onClose,
}: {
  plan: Plan;
  amount: number;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [checked, setChecked] = useState(false);
  const daily = (amount * plan.rate) / 100;
  const now = new Date();

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/20 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md rounded-t-4xl rounded-b-none border border-border bg-card p-6 sm:rounded-4xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <span className={`mb-1.5 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${plan.badgeClass}`}>
              {plan.icon}
              {plan.badge}
            </span>
            <h2 className="text-base font-semibold text-foreground">Confirm Investment</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1 text-muted-foreground hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Amount + wallet */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-3">
            <span className="text-xs text-muted-foreground">Investment amount</span>
            <span className="text-sm font-bold text-foreground">{fmt(amount)}</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-3">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Wallet className="size-3.5" />
              Source wallet
            </span>
            <span className="text-sm font-medium text-foreground">Investment Wallet</span>
          </div>
        </div>

        {/* Breakdown */}
        <div className="mb-4 rounded-2xl border border-border bg-muted/40 p-4 space-y-2.5">
          {[
            { label: "Daily profit", value: `+${fmt(daily)}` },
            { label: "7-day estimate", value: `+${fmt(daily * 7)}` },
            { label: "30-day estimate", value: `+${fmt(daily * 30)}` },
          ].map((row) => (
            <div key={row.label} className="flex justify-between text-xs">
              <span className="text-muted-foreground">{row.label}</span>
              <span className="font-semibold text-success">{row.value}</span>
            </div>
          ))}
        </div>

        {/* Start time */}
        <div className="mb-4 rounded-2xl bg-muted/50 px-4 py-3">
          <p className="text-xs text-muted-foreground">
            Plan starts:{" "}
            <span className="font-medium text-foreground">
              {now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} at{" "}
              {now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </span>
          </p>
        </div>

        {/* Checkbox */}
        <label className="mb-4 flex cursor-pointer items-start gap-3 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 size-4 rounded accent-primary"
          />
          I understand this plan has a minimum 24-hour hold period before cancellation.
        </label>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl border border-border py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Go back
          </button>
          <button
            type="button"
            disabled={!checked}
            onClick={onConfirm}
            className={`flex-1 rounded-2xl py-3 text-sm font-semibold transition-opacity outline-none focus-visible:ring-2 focus-visible:ring-ring ${plan.buttonClass} ${!checked ? "opacity-40 cursor-not-allowed" : ""}`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Cancel Confirmation Modal ──────────────────────────────────────────────────

function CancelModal({
  plan,
  onConfirm,
  onClose,
}: {
  plan: ActivePlan;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const totalEarned = plan.profitPerCycle * plan.creditsEarned;
  const totalReturn = plan.invested + totalEarned;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/20 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md rounded-t-4xl rounded-b-none border border-border bg-card p-6 sm:rounded-4xl">
        <div className="mb-4 flex flex-col items-center text-center">
          <div className="mb-2.5 flex size-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="size-5 text-destructive" />
          </div>
          <h2 className="text-base font-semibold text-foreground">Cancel this plan?</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            This action is irreversible. Your plan will stop and all funds will be returned immediately.
          </p>
        </div>

        {/* Summary */}
        <div className="mb-4 space-y-2.5 rounded-2xl border border-border bg-background p-4">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Plan</span>
            <span className="font-medium text-foreground">{plan.planName}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Principal</span>
            <span className="font-medium text-foreground">{fmt(plan.invested)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Profit earned to date</span>
            <span className="font-medium text-success">+{fmt(totalEarned)}</span>
          </div>
          <div className="my-1 border-t border-border" />
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-foreground">Total returned</span>
            <span className="font-bold text-foreground">{fmt(totalReturn)}</span>
          </div>
          <div className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
            <Wallet className="size-3.5" />
            Sent to Investment Wallet
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl border border-border py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Keep plan
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-2xl bg-destructive py-3 text-sm font-semibold text-destructive-foreground transition-opacity hover:opacity-90 outline-none focus-visible:ring-2 focus-visible:ring-destructive"
          >
            Confirm cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Toast ──────────────────────────────────────────────────────────────────────

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-lg">
        <CheckCircle2 className="size-4 shrink-0 text-success" />
        <p className="text-sm font-medium text-foreground">{message}</p>
        <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── History Table ─────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

function HistoryTable({ rows }: { rows: HistoryRow[] }) {
  const [planFilter, setPlanFilter] = useState<"all" | PlanTier>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "cancelled">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const filtered = rows.filter((r) => {
    if (planFilter !== "all" && r.planId !== planFilter) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (dateFrom && r.date < dateFrom) return false;
    if (dateTo && r.date > dateTo) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      {/* Filter bar */}
      <div className="mb-3 flex flex-wrap gap-2">
        {/* Plan filter */}
        <div className="flex items-center rounded-xl bg-muted p-1 gap-1">
          {(["all", "starter", "growth", "elite"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => { setPlanFilter(f); setPage(1); }}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring capitalize ${
                planFilter === f
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all" ? "All plans" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex items-center rounded-xl bg-muted p-1 gap-1">
          {(["all", "active", "cancelled"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => { setStatusFilter(f); setPage(1); }}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                statusFilter === f
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Date range */}
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
          className="h-9 rounded-xl border border-border bg-background px-3 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
          className="h-9 rounded-xl border border-border bg-background px-3 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Search className="size-6 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No records match those filters.</p>
          </div>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-4xl border border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {["Date", "Plan", "Invested", "Rate", "Profit Credited", "Wallet", "Cumulative", "Status"].map((h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {paged.map((r) => {
                const isToday = r.date === today;
                const isCancelled = r.status === "cancelled";
                return (
                  <tr
                    key={r.id}
                    className={`transition-colors hover:bg-muted/30 ${
                      isToday ? "bg-primary/5" : ""
                    } ${isCancelled ? "opacity-60" : ""}`}
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">
                      {new Date(r.date + "T12:00:00").toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">{planBadge(r.planId, r.planName)}</td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">
                      {fmt(r.invested)}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{r.rate}%</td>
                    <td className="px-4 py-3 text-right font-semibold text-success">
                      +{fmt(r.profit)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {r.walletCredited}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-success">
                      +{fmt(r.cumulative)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          r.status === "active"
                            ? "bg-success/10 text-success"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {r.status === "active" ? "Active" : "Cancelled"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-foreground disabled:opacity-40 hover:bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Previous
          </button>
          <span className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-foreground disabled:opacity-40 hover:bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DailyProfitPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activePlans, setActivePlans] = useState<ActivePlan[]>([]);
  const [historyRows, setHistoryRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [investTarget, setInvestTarget] = useState<{ plan: Plan; amount: number } | null>(null);
  const [cancelTarget, setCancelTarget] = useState<ActivePlan | null>(null);

  // Toast
  const [toast, setToast] = useState<string | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  // Fetch plans from API
  useEffect(() => {
    fetch("/api/investment/daily-profit/plans")
      .then((r) => r.json())
      .then((data) => {
        const fetchedPlans: Plan[] = data.plans.map((p: any) => ({
          id: p.plan_id,
          name: p.name,
          rate: parseFloat(p.daily_rate),
          minimum: parseFloat(p.minimum_amount),
          icon: getIcon(p.plan_id),
          badge: p.badge_label,
          accentClass: "border-border",
          badgeClass: "bg-muted text-muted-foreground",
          buttonClass: "bg-foreground text-background hover:opacity-90",
        }));
        setPlans(fetchedPlans);
      })
      .catch(console.error);
  }, []);

  // Fetch stats and investments
  useEffect(() => {
    setLoading(true);
    fetch("/api/investment/daily-profit/stats")
      .then((r) => r.json())
      .then((data) => {
        // Map investments to ActivePlan
        const active: ActivePlan[] = data.investments.map((inv: any) => ({
          id: inv.id,
          planId: inv.plan_id,
          planName: inv.plan_name,
          rate: parseFloat(inv.daily_rate),
          invested: parseFloat(inv.amount),
          startedAt: new Date(inv.started_at),
          creditsEarned: inv.credits_earned,
          profitPerCycle: parseFloat(inv.profit_per_cycle),
          nextCreditAt: new Date(inv.next_credit_at),
        }));
        setActivePlans(active);

        // Map history
        const history: HistoryRow[] = data.history.map((h: any) => ({
          id: h.id,
          date: h.credited_at.split("T")[0],
          planName: h.plan_name,
          planId: h.plan_id,
          invested: parseFloat(h.invested_amount),
          rate: parseFloat(h.daily_rate),
          profit: parseFloat(h.profit_amount),
          walletCredited: "Investment Wallet",
          cumulative: parseFloat(h.cumulative_profit),
          status: h.status,
        }));
        setHistoryRows(history);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Derived stats
  const totalInvested = activePlans.reduce((s, p) => s + p.invested, 0);
  const totalEarnedAll = historyRows.reduce((s, r) => s + r.profit, 0);
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayProfit = historyRows
    .filter((r) => r.date === todayStr)
    .reduce((s, r) => s + r.profit, 0);

  async function handleInvestConfirm() {
    if (!investTarget) return;
    const { plan, amount } = investTarget;
    
    try {
      const res = await fetch("/api/investment/daily-profit/invest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id, amount }),
      });
      
      if (!res.ok) {
        const err = await res.json();
        setToast(err.error || "Investment failed");
        setInvestTarget(null);
        return;
      }

      // Refresh data
      const data = await fetch("/api/investment/daily-profit/stats").then(r => r.json());
      const active: ActivePlan[] = data.investments.map((inv: any) => ({
        id: inv.id,
        planId: inv.plan_id,
        planName: inv.plan_name,
        rate: parseFloat(inv.daily_rate),
        invested: parseFloat(inv.amount),
        startedAt: new Date(inv.started_at),
        creditsEarned: inv.credits_earned,
        profitPerCycle: parseFloat(inv.profit_per_cycle),
        nextCreditAt: new Date(inv.next_credit_at),
      }));
      setActivePlans(active);
      
      setToast(`${plan.name} activated! First profit credit in 24 hours.`);
      setInvestTarget(null);
    } catch (err) {
      console.error(err);
      setToast("Investment failed");
      setInvestTarget(null);
    }
  }

  async function handleCancelConfirm() {
    if (!cancelTarget) return;
    
    try {
      const res = await fetch("/api/investment/daily-profit/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ investmentId: cancelTarget.id }),
      });
      
      if (!res.ok) {
        const err = await res.json();
        setToast(err.error || "Cancel failed");
        setCancelTarget(null);
        return;
      }

      const total = cancelTarget.invested + cancelTarget.profitPerCycle * cancelTarget.creditsEarned;
      setActivePlans((prev) => prev.filter((p) => p.id !== cancelTarget.id));
      setToast(`Plan cancelled. ${fmt(total)} returned to Investment Wallet.`);
      setCancelTarget(null);
    } catch (err) {
      console.error(err);
      setToast("Cancel failed");
      setCancelTarget(null);
    }
  }

  return (
    <UserShell active="Daily Profit">
      <div className="overflow-y-auto px-5 py-6 sm:px-7 sm:py-8 space-y-8">

        {/* ── Header ── */}
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Daily Profit
          </h1>
        </div>

        {/* ── Section 1: Summary Stats ── */}
        <section aria-label="Profit Summary">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {
                label: "Total Invested",
                value: fmt(totalInvested),
                delta: { value: `${activePlans.length} active plan${activePlans.length !== 1 ? "s" : ""}`, positive: true },
              },
              {
                label: "Total Profit Earned",
                value: `+${fmt(totalEarnedAll)}`,
                delta: { value: "All time", positive: true },
              },
              {
                label: "Today's Profit",
                value: todayProfit > 0 ? `+${fmt(todayProfit)}` : "$0.00",
                delta: { value: "Credited today", positive: true },
              },
              {
                label: "Active Plans",
                value: String(activePlans.length),
                delta: {
                  value: activePlans.length > 0 ? "Earning daily" : "Start a plan below",
                  positive: activePlans.length > 0,
                },
              },
            ].map((item) => (
              <Card key={item.label}>
                <Stat
                  label={item.label}
                  value={item.value}
                  delta={item.delta}
                  loading={loading}
                />
              </Card>
            ))}
          </div>
        </section>

        {/* ── Section 2: Available Plans ── */}
        <section aria-label="Available Plans">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-foreground">Available Plans</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Choose a tier and invest to start earning fixed daily returns on your principal.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onInvest={(p, amt) => setInvestTarget({ plan: p, amount: amt })}
              />
            ))}
          </div>
        </section>

        {/* ── Section 3: Active Plans ── */}
        <section aria-label="My Active Plans">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">My Active Plans</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Live countdown to your next profit credit and cancel unlock.
              </p>
            </div>
          </div>

          {activePlans.length === 0 ? (
            <Card>
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                  <TrendingUp className="size-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">No active plans</p>
                <p className="max-w-xs text-xs text-muted-foreground">
                  Choose a plan above to start earning daily returns on your investment.
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {activePlans.map((plan) => (
                <ActivePlanCard
                  key={plan.id}
                  plan={plan}
                  onCancel={setCancelTarget}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Section 4: History Table ── */}
        <section aria-label="Profit History" id="profit-history">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Profit History</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Every profit credit across all plans, in one place.
              </p>
            </div>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-xl bg-muted px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted/70 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Download className="size-3" />
              Export CSV
            </button>
          </div>
          <HistoryTable rows={historyRows} />
        </section>

        <div className="h-20" />
      </div>

      {/* ── Modals ── */}
      {investTarget && (
        <InvestModal
          plan={investTarget.plan}
          amount={investTarget.amount}
          onConfirm={handleInvestConfirm}
          onClose={() => setInvestTarget(null)}
        />
      )}
      {cancelTarget && (
        <CancelModal
          plan={cancelTarget}
          onConfirm={handleCancelConfirm}
          onClose={() => setCancelTarget(null)}
        />
      )}

      {/* ── Toast ── */}
      {toast && <Toast message={toast} onClose={dismissToast} />}
    </UserShell>
  );
}