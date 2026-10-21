// app/(user)/ai-trading/page.tsx
"use client";

import { UserShell } from "@/app/(user)/_components/user-shell";
import { DitherLoader } from "@/components/motion/loader";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  Lock,
  LockOpen,
  Calendar,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { Table } from "@/components/motion/table";
import { StatefulButton, type ButtonState } from "@/components/motion/button";
import { SlideActionButton } from "@/components/motion/slide-action-button";

// ── Helpers ──────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── Shared primitives ────────────────────────────────────────────────────

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-4xl border border-border bg-card p-6 ${className}`}>
      {children}
    </div>
  );
}

function Badge({ label, tone = "default" }: { label: string; tone?: "default" | "success" | "destructive" | "muted" }) {
  const colors: Record<string, string> = {
    default:     "bg-foreground/10 text-foreground",
    success:     "bg-success/10 text-success",
    destructive: "bg-destructive/10 text-destructive",
    muted:       "bg-muted text-muted-foreground",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${colors[tone]}`}>
      {label}
    </span>
  );
}

function Stat({ label, value, delta, loading = false, icon }: {
  label: string;
  value: string;
  delta?: { value: string; positive: boolean };
  loading?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      </div>
      {loading ? (
        <div className="h-6 w-24 animate-pulse rounded-md bg-muted" />
      ) : (
        <p className="text-lg font-semibold text-foreground">{value}</p>
      )}
      {delta && !loading && (
        <p className={`flex items-center gap-1 text-xs font-medium ${delta.positive ? "text-success" : "text-destructive"}`}>
          {delta.positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
          {delta.value}
        </p>
      )}
    </div>
  );
}

function SectionHeader({ title, action, actionLabel }: {
  title: string;
  action?: () => void;
  actionLabel?: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {action && actionLabel && (
        <button
          type="button"
          onClick={action}
          className="text-xs font-medium text-foreground/80 transition-opacity hover:opacity-75 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// ── Strategy tier data ───────────────────────────────────────────────────

type StrategyStatus = "not-invested" | "running" | "unlocked";

type Strategy = {
  id: string;
  name: string;
  exchange: string;
  minStake: number;
  roiPct: number;
  todayRoiPct?: number;
  daysRunning: number;
  lockDays: number;
  daysElapsed: number;
  status: StrategyStatus;
  invested?: number;
  currentProfit?: number;
  investmentId?: string;
};

// ── Invest dialog ────────────────────────────────────────────────────────

function InvestDialogContent({
  strategy,
  balance,
  onClose,
  onConfirm,
}: {
  strategy: Strategy;
  balance: number;
  onClose: () => void;
  onConfirm: (amount: number) => void;
}) {
  const [amount, setAmount] = useState(String(strategy.minStake));
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const sliderWrapRef = useRef<HTMLDivElement>(null);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const value = parseFloat(amount);
  const maxAmount = Math.floor(balance);

  let error: string | null = null;
  if (!amount || Number.isNaN(value) || value <= 0) error = "Enter an amount to invest";
  else if (value < strategy.minStake) error = `Minimum stake is $${fmt(strategy.minStake)}`;
  else if (value > balance) error = "Amount exceeds your AI Trading balance";
  const valid = error === null;

  const unlockDate = new Date(Date.now() + strategy.lockDays * 24 * 60 * 60 * 1000);
  const unlockLabel = unlockDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const quickAmounts = [
    { label: "Min", value: strategy.minStake },
    { label: "2×", value: strategy.minStake * 2 },
    { label: "5×", value: strategy.minStake * 5 },
    { label: "Max", value: maxAmount },
  ].filter((q) => q.value >= strategy.minStake && q.value <= balance);

  // Focus input on open
  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  // Escape to close + lock body scroll
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !done) onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [done, onClose]);

  // Block the slider (pointer + keyboard) until the amount is valid
  useEffect(() => {
    const el = sliderWrapRef.current;
    if (!el) return;
    if (valid) el.removeAttribute("inert");
    else el.setAttribute("inert", "");
  }, [valid]);

  useEffect(
    () => () => {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    },
    [],
  );

  const handleComplete = () => {
    if (!valid || done) return;
    setDone(true);
    // Let the "Invested" state show briefly before closing
    confirmTimerRef.current = setTimeout(() => onConfirm(value), 900);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => {
          if (!done) onClose();
        }}
        aria-hidden="true"
      />

      {/* Panel */}
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="invest-dialog-title"
        className="relative w-full max-w-md rounded-t-4xl border border-border bg-card p-6 shadow-xl sm:rounded-4xl"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-foreground/5 text-foreground">
              <Bot className="size-4" />
            </div>
            <div>
              <h3 id="invest-dialog-title" className="text-sm font-semibold text-card-foreground">
                Invest in {strategy.name}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Min ${fmt(strategy.minStake)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={done}
            aria-label="Close"
            className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Amount input */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <label
              htmlFor="invest-amount"
              className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground"
            >
              Amount (USDT)
            </label>
            <span className="text-[11px] text-muted-foreground">
              Available: <span className="font-medium text-foreground">${fmt(balance)}</span>
            </span>
          </div>

          <div
            className={`mt-2 flex items-center gap-2 rounded-2xl border bg-background px-4 py-3 transition-colors focus-within:ring-2 focus-within:ring-ring ${
              error && amount ? "border-destructive/60" : "border-border"
            }`}
          >
            <span className="text-lg font-semibold text-muted-foreground">$</span>
            <input
              ref={inputRef}
              id="invest-amount"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.00"
              value={amount}
              disabled={done}
              onChange={(e) => {
                const next = e.target.value;
                if (/^\d*\.?\d{0,2}$/.test(next)) setAmount(next);
              }}
              aria-invalid={!valid}
              aria-describedby="invest-amount-help"
              className="w-full bg-transparent text-lg font-semibold text-foreground outline-none placeholder:text-muted-foreground/50 disabled:opacity-60"
            />
          </div>

          <p
            id="invest-amount-help"
            className={`mt-2 min-h-4 text-xs font-medium ${error ? "text-destructive" : "text-muted-foreground"}`}
          >
            {error ?? "You can withdraw once the lock period ends."}
          </p>

          {/* Quick picks */}
          {quickAmounts.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {quickAmounts.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  disabled={done}
                  onClick={() => setAmount(String(q.value))}
                  className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                >
                  {q.label}
                  <span className="ml-1 text-muted-foreground">${fmt(q.value)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="mt-5 space-y-2 rounded-2xl bg-background p-3">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Lock period</span>
            <span className="font-medium text-foreground">{strategy.lockDays} days</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Withdrawal opens</span>
            <span className="font-medium text-foreground">{unlockLabel}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Historical ROI</span>
            <span className="font-medium text-success">+{strategy.roiPct.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Balance after</span>
            <span className="font-medium text-foreground">
              ${fmt(valid ? balance - value : balance)}
            </span>
          </div>
        </div>

        <p className="mt-3 text-[11px] text-muted-foreground">
          Your stake is locked for {strategy.lockDays} days from today. Past performance does not
          guarantee future results.
        </p>

        {/* Slide to confirm */}
        <div
          ref={sliderWrapRef}
          className={`mt-5 transition-opacity ${valid ? "opacity-100" : "opacity-50"}`}
        >
          <SlideActionButton
            className="w-full"
            fillClassName="bg-foreground"
            thumbClassName="bg-foreground text-background"
            completeLabel="Invested"
            resetDelay={5000}
            onComplete={handleComplete}
          >
            {`Slide to invest $${valid ? fmt(value) : "0.00"}`}
          </SlideActionButton>
        </div>
      </motion.div>
    </motion.div>
  );
}

function InvestDialog({
  strategy,
  balance,
  onClose,
  onConfirm,
}: {
  strategy: Strategy | null;
  balance: number;
  onClose: () => void;
  onConfirm: (strategy: Strategy, amount: number) => void;
}) {
  // Portal target only exists on the client
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {strategy && (
        <InvestDialogContent
          key={strategy.id}
          strategy={strategy}
          balance={balance}
          onClose={onClose}
          onConfirm={(amount) => onConfirm(strategy, amount)}
        />
      )}
    </AnimatePresence>,
    document.body,
  );
}

// ── Strategy card ────────────────────────────────────────────────────────

function StrategyCard({
  strategy,
  onInvest,
}: {
  strategy: Strategy;
  onInvest: (strategy: Strategy) => void;
}) {
  const isLocked = strategy.status === "running";
  const isUnlocked = strategy.status === "unlocked";
  const isEmpty = strategy.status === "not-invested";
  const daysLeft = Math.max(0, strategy.lockDays - strategy.daysElapsed);
  const lockPct = isUnlocked
    ? 100
    : Math.min(100, Math.max(0, (strategy.daysElapsed / Math.max(1, strategy.lockDays)) * 100));
  const [state, setState] = useState<ButtonState>("idle");

  const runWithdraw = async () => {
    if (state === "loading") return;
    setState("loading");

    try {
      const res = await fetch("/api/ai-trading/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ investmentId: strategy.investmentId }),
      });

      if (res.ok) {
        setState("success");
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setState("idle");
        const err = await res.json();
        alert(err.message || err.error || "Withdrawal failed");
      }
    } catch (err) {
      console.error(err);
      setState("idle");
      alert("Withdrawal failed");
    }
  };

  return (
    <div className="group flex flex-col overflow-hidden rounded-4xl border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-lg">
      {/* ── Hero: name, status, big ROI ───────────────── */}
      <div className="relative bg-foreground/[0.04] px-6 pb-5 pt-6">
        {/* soft decorative ring */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-10 size-36 rounded-full border border-foreground/5"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-4 -top-4 size-20 rounded-full border border-foreground/5"
        />

        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-foreground text-background">
              <Bot className="size-4" />
            </div>
            <p className="text-sm font-semibold text-card-foreground">{strategy.name}</p>
          </div>
          {isEmpty && <Badge label="Available" tone="muted" />}
          {isLocked && <Badge label="Locked" tone="destructive" />}
          {isUnlocked && <Badge label="Unlocked" tone="success" />}
        </div>

        <div className="relative mt-6">
          <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            <TrendingUp className="size-3" /> Total ROI
          </p>
          <p className="mt-1 text-4xl font-semibold tracking-tight text-success">
            +{strategy.roiPct.toFixed(1)}
            <span className="ml-0.5 text-xl font-medium">%</span>
          </p>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-4 p-6">
        {/* Plan details */}
        <dl className="divide-y divide-border text-xs">
          <div className="flex items-center justify-between pb-2.5">
            <dt className="flex items-center gap-1.5 text-muted-foreground">
              <Wallet className="size-3.5" /> Min. stake
            </dt>
            <dd className="font-semibold text-foreground">${strategy.minStake.toFixed(2)}</dd>
          </div>
          <div className="flex items-center justify-between py-2.5">
            <dt className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="size-3.5" /> Days running
            </dt>
            <dd className="font-semibold text-foreground">{strategy.daysRunning}</dd>
          </div>
          <div className="flex items-center justify-between pt-2.5">
            <dt className="flex items-center gap-1.5 text-muted-foreground">
              <Lock className="size-3.5" /> Lock period
            </dt>
            <dd className="font-semibold text-foreground">{strategy.lockDays} days</dd>
          </div>
        </dl>

        {/* Your position */}
        {!isEmpty && (
          <div className="rounded-2xl bg-background p-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Your invested
                </p>
                <p className="mt-0.5 text-base font-semibold text-foreground">
                  ${fmt(strategy.invested ?? 0)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Profit
                </p>
                <p className="mt-0.5 text-base font-semibold text-success">
                  +${fmt(strategy.currentProfit ?? 0)}
                </p>
              </div>
            </div>

            {/* Lock progress */}
            <div className="mt-4">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full bg-foreground"
                  initial={{ width: 0 }}
                  animate={{ width: `${lockPct}%` }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                />
              </div>
              <p
                className={`mt-2 flex items-center gap-1 text-[11px] font-medium ${
                  isUnlocked ? "text-success" : "text-muted-foreground"
                }`}
              >
                {isUnlocked ? <LockOpen className="size-3" /> : <Lock className="size-3" />}
                {isUnlocked ? "Withdrawal available now" : `Unlocks in ${daysLeft}d`}
              </p>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-auto">
          {isEmpty && (
            <StatefulButton
              className="h-10 w-full text-xs"
              state="idle"
              onClick={() => onInvest(strategy)}
            >
              Invest from ${strategy.minStake}
            </StatefulButton>
          )}
          {isLocked && (
            <button
              type="button"
              disabled
              className="h-10 w-full cursor-not-allowed rounded-full bg-muted text-xs font-semibold text-muted-foreground"
            >
              Locked · {daysLeft}d remaining
            </button>
          )}
          {isUnlocked && (
            <StatefulButton
              className="h-10 w-full text-xs"
              variant="outline"
              state={state}
              onClick={runWithdraw}
            >
              Withdraw
            </StatefulButton>
          )}
        </div>
      </div>
    </div>
  );
}

// ── AI trade history ───────────────────────────────────────────────────────

type AiTrade = {
  id: string;
  date: string;
  strategy: string;
  size: number;
  duration: string;
  pnl: number;
};

const AI_TRADE_COLUMNS = [
  { key: "date",     header: "Date",     width: "110px" },
  { key: "strategy", header: "Strategy", width: "160px" },
  { key: "result",   header: "Result",   width: "90px",
    cell: (r: AiTrade) => (
      <Badge label={r.pnl >= 0 ? "Win" : "Loss"} tone={r.pnl >= 0 ? "success" : "destructive"} />
    ),
  },
  { key: "duration", header: "Duration", width: "100px" },
  { key: "size",     header: "Trade Size", width: "110px",
    cell: (r: AiTrade) => (
      <span className="text-xs text-foreground">${fmt(r.size)}</span>
    ),
  },
  { key: "pnl",      header: "P&L",      align: "right" as const,
    cell: (r: AiTrade) => (
      <span className={`text-xs font-semibold ${r.pnl >= 0 ? "text-success" : "text-destructive"}`}>
        {r.pnl >= 0 ? "+" : "-"}${fmt(Math.abs(r.pnl))}
      </span>
    ),
  },
];

export default function AiTradingPage() {
  const [loading, setLoading] = useState(true);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [balance, setBalance] = useState(0);
  const [investing, setInvesting] = useState<Strategy | null>(null);
  const [trades, setTrades] = useState<AiTrade[]>([]);
  const [roiHistory, setRoiHistory] = useState<any[]>([]);

  async function refreshAiTrading() {
    const [sr, ar] = await Promise.all([fetch("/api/ai-trading/strategies"), fetch("/api/ai-trading/stats")]);
    const [sd, data] = await Promise.all([sr.json(), ar.json()]);
    if (!sr.ok || !ar.ok) throw new Error(sd.message || data.message || "AI Trading refresh failed");
    const mapped: Strategy[] = sd.strategies.map((s: any) => {
      const inv = data.investments.find((x: any) => x.strategy_id === s.strategy_id);
      const elapsed = inv ? Math.max(0, Math.floor((Date.now() - new Date(inv.invested_at).getTime()) / 86400000)) : 0;
      const daysLeft = inv ? Math.max(0, Math.ceil((new Date(inv.unlock_at).getTime() - Date.now()) / 86400000)) : 0;
      return { id:s.strategy_id,name:s.name,exchange:s.exchange,minStake:Number(s.min_stake),roiPct:Number(s.total_roi_pct),todayRoiPct:Number(s.today_roi_pct||0),daysRunning:Number(s.days_running),lockDays:Number(inv?.lock_days ?? s.lock_days),daysElapsed:elapsed,status:!inv?"not-invested":inv.status === "unlocked" || daysLeft === 0?"unlocked":"running",invested:inv?Number(inv.amount):undefined,currentProfit:inv?Number(inv.total_profit):undefined,investmentId:inv?.id };
    });
    setStrategies(mapped);
    setBalance(Number(data.balance) || 0);
    setTrades(data.trades.map((t: any) => ({ id:t.id,date:t.executed_at.split("T")[0],strategy:t.strategy_name,size:Number(t.trade_size),duration:`${Math.floor(t.duration_minutes/60)}h ${t.duration_minutes%60}m`,pnl:Number(t.pnl) })));
    setRoiHistory(data.roiHistory || []);
  }

  useEffect(() => {
    setLoading(true);
    refreshAiTrading().catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => { if (!document.hidden) refreshAiTrading().catch(console.error); }, 15000);
    const onFocus = () => { if (!document.hidden) refreshAiTrading().catch(console.error); };
    window.addEventListener("focus", onFocus);
    return () => { clearInterval(timer); window.removeEventListener("focus", onFocus); };
  }, []);

  const totalInvested = strategies.reduce((sum, s) => sum + (s.invested ?? 0), 0);
  const totalProfit = strategies.reduce((sum, s) => sum + (s.currentProfit ?? 0), 0);
  const activeCount = strategies.filter((s) => s.status !== "not-invested").length;

  // Trade history summary
  const tradeCount = trades.length;
  const winCount = trades.filter((t) => t.pnl >= 0).length;
  const winRate = tradeCount > 0 ? (winCount / tradeCount) * 100 : 0;
  const netPnl = trades.reduce((sum, t) => sum + t.pnl, 0);

  async function handleInvest(strategy: Strategy, amount: number) {
    try {
      const res = await fetch("/api/ai-trading/invest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategyId: strategy.id, amount }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.message || err.error || "Investment failed");
        setInvesting(null);
        return;
      }

      // Refresh stats
      await refreshAiTrading();
      setInvesting(null);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Investment failed");
      setInvesting(null);
    }
  }

  return (
    <UserShell active="AI Trading">
      {loading ? <div className="grid min-h-[70vh] place-items-center"><DitherLoader size={44} label="Loading AI trading data" /></div> : <>
      <div className="overflow-y-auto px-5 py-6 sm:px-7 sm:py-8 space-y-8">

        {/* ── Header ────────────────────────────────────── */}
        <div>
          <p className="text-xs font-medium text-muted-foreground">AI-managed strategies</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            AI Trading
          </h1>
        </div>

        {/* ── Summary stats ─────────────────────────────── */}
        <section aria-label="AI Trading Summary">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card>
              <Stat label="AI Trading Balance" value={`$${fmt(balance)}`} icon={<Wallet className="size-3.5" />} loading={loading} />
            </Card>
            <Card>
              <Stat label="Total Invested" value={`$${totalInvested.toFixed(2)}`} icon={<Bot className="size-3.5" />} loading={loading} />
            </Card>
            <Card>
              <Stat
                label="Total AI Profit"
                value={`+$${totalProfit.toFixed(2)}`}
                delta={{ value: "All time", positive: true }}
                loading={loading}
              />
            </Card>
            <Card>
              <Stat label="Active Strategies" value={String(activeCount)} loading={loading} />
            </Card>
          </div>
        </section>

        {/* ── Strategy cards ────────────────────────────── */}
        <section aria-label="Strategies">
          <SectionHeader title="Strategies" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {strategies.map((s) => (
              <StrategyCard key={s.id} strategy={s} onInvest={setInvesting} />
            ))}
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Every plan locks your stake for 15 days from the day you invest — withdrawals open automatically once the lock period ends. Past performance does not guarantee future results.
          </p>
        </section>

        {/* ── AI activity / trade history ───────────────── */}
        <section aria-label="AI Trade History">
          <SectionHeader title="AI Trade History" />

          {/* History summary */}
          <div className="mb-3 grid grid-cols-3 gap-3">
            <Card>
              <Stat label="Total Trades" value={String(tradeCount)} loading={loading} />
            </Card>
            <Card>
              <Stat label="Win Rate" value={`${winRate.toFixed(0)}%`} loading={loading} />
            </Card>
            <Card>
              <Stat
                label="Net P&L"
                value={`${netPnl >= 0 ? "+" : "-"}$${fmt(Math.abs(netPnl))}`}
                delta={{ value: "Last 8 trades", positive: netPnl >= 0 }}
                loading={loading}
              />
            </Card>
          </div>

          <Table
            data={trades}
            columns={AI_TRADE_COLUMNS}
            getRowId={(r) => r.id}
            height={400}
            rowHeight={44}
          />
          <SectionHeader title="Daily ROI History" />
          <div className="space-y-2">
            {roiHistory.length === 0 ? <p className="text-xs text-muted-foreground">No credited ROI yet.</p> : roiHistory.map((entry) => (
              <div key={entry.id} className="flex justify-between rounded-xl border border-border px-3 py-2 text-xs">
                <span className="text-muted-foreground">{entry.date} · {entry.strategy_id}</span>
                <span className={Number(entry.profit_amount) < 0 ? "text-destructive" : "text-success"}>{Number(entry.roi_pct) > 0 ? "+" : ""}{entry.roi_pct}% · ${fmt(Number(entry.profit_amount))}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="h-20" />
      </div>

      {/* ── Invest dialog ───────────────────────────────── */}
      <InvestDialog
        strategy={investing}
        balance={balance}
        onClose={() => setInvesting(null)}
        onConfirm={handleInvest}
      />
      </>}
    </UserShell>
  );
}
