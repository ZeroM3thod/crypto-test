// app/(user)/ai-trading/page.tsx
"use client";

import { UserShell } from "@/app/(user)/_components/user-shell";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  Lock,
  LockOpen,
  Calendar,
  Percent,
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
  daysRunning: number;
  lockDays: number;
  daysElapsed: number;
  status: StrategyStatus;
  invested?: number;
  currentProfit?: number;
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
  const [state, setState] = useState<ButtonState>("idle");

  const runWithdraw = async () => {
    if (state === "loading") return;
    setState("loading");
    
    try {
      const res = await fetch("/api/ai-trading/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ investmentId: strategy.id }),
      });

      if (res.ok) {
        setState("success");
        // Refresh page after 1s
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setState("idle");
        const err = await res.json();
        alert(err.error || "Withdrawal failed");
      }
    } catch (err) {
      console.error(err);
      setState("idle");
      alert("Withdrawal failed");
    }
  };

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-foreground/5 text-foreground">
            <Bot className="size-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-card-foreground">{strategy.name}</p>
            <p className="text-[11px] text-muted-foreground">Min ${strategy.minStake}</p>
          </div>
        </div>
        {isEmpty && <Badge label="Available" tone="muted" />}
        {isLocked && <Badge label="Locked" tone="destructive" />}
        {isUnlocked && <Badge label="Unlocked" tone="success" />}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Min. Stake</p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">${strategy.minStake.toFixed(2)}</p>
        </div>
        <div>
          <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            <Percent className="size-3" /> Total ROI
          </p>
          <p className="mt-0.5 text-sm font-semibold text-success">+{strategy.roiPct.toFixed(1)}%</p>
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

      {!isEmpty && (
        <div className="mt-4 space-y-2 rounded-2xl bg-background p-3">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Your Invested</span>
            <span className="font-medium text-foreground">${strategy.invested?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Current Profit</span>
            <span className="font-medium text-success">+${strategy.currentProfit?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Withdrawal</span>
            <span className={`flex items-center gap-1 font-medium ${isUnlocked ? "text-success" : "text-destructive"}`}>
              {isUnlocked ? <LockOpen className="size-3" /> : <Lock className="size-3" />}
              {isUnlocked ? "Available now" : `Unlocks in ${daysLeft}d`}
            </span>
          </div>
        </div>
      )}

      <div className="mt-4">
        {isEmpty && (
          <StatefulButton
            className="h-10 w-full text-xs"
            variant="success"
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
            Locked until {strategy.lockDays - strategy.daysElapsed}d remain
          </button>
        )}
        {isUnlocked && (
          <StatefulButton
            className="h-10 w-full text-xs"
            variant="destructive"
            state={state}
            onClick={runWithdraw}
          >
            Withdraw
          </StatefulButton>
        )}
      </div>
    </Card>
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

  // Fetch available strategies
  useEffect(() => {
    fetch("/api/ai-trading/strategies")
      .then((r) => r.json())
      .then((data) => {
        const strats: Strategy[] = data.strategies.map((s: any) => ({
          id: s.strategy_id,
          name: s.name,
          exchange: s.exchange,
          minStake: parseFloat(s.min_stake),
          roiPct: parseFloat(s.total_roi_pct),
          daysRunning: s.days_running,
          lockDays: s.lock_days,
          daysElapsed: 0,
          status: "not-invested" as StrategyStatus,
        }));
        setStrategies(strats);
      })
      .catch(console.error);
  }, []);

  // Fetch stats and investments
  useEffect(() => {
    setLoading(true);
    fetch("/api/ai-trading/stats")
      .then((r) => r.json())
      .then((data) => {
        setBalance(parseFloat(data.balance) || 0);

        // Merge strategies with user investments
        setStrategies((prevStrats) => {
          const investmentMap = new Map<string, any>(
            data.investments.map((inv: any): [string, any] => [inv.strategy_id, inv])
          );

          return prevStrats.map((s) => {
            const inv = investmentMap.get(s.id);
            if (!inv) return s;

            const elapsed = Math.floor(
              (Date.now() - new Date(inv.invested_at).getTime()) / 86400000
            );
            const daysLeft = Math.max(0, inv.lock_days - elapsed);
            const status: StrategyStatus =
              inv.status === "unlocked" ? "unlocked" : daysLeft === 0 ? "unlocked" : "running";

            return {
              ...s,
              status,
              daysElapsed: elapsed,
              invested: parseFloat(inv.amount),
              currentProfit: parseFloat(inv.total_profit),
            };
          });
        });

        // Map trades
        const aiTrades: AiTrade[] = data.trades.map((t: any) => ({
          id: t.id,
          date: t.executed_at.split("T")[0],
          strategy: t.strategy_name,
          size: parseFloat(t.trade_size),
          duration: `${Math.floor(t.duration_minutes / 60)}h ${t.duration_minutes % 60}m`,
          pnl: parseFloat(t.pnl),
        }));
        setTrades(aiTrades);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
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
        alert(err.error || "Investment failed");
        setInvesting(null);
        return;
      }

      // Refresh stats
      const data = await fetch("/api/ai-trading/stats").then((r) => r.json());
      setBalance(parseFloat(data.balance) || 0);

      setStrategies((prev) =>
        prev.map((s) => {
          if (s.id !== strategy.id) return s;
          return {
            ...s,
            status: "running" as StrategyStatus,
            invested: amount,
            currentProfit: 0,
            daysElapsed: 0,
          };
        })
      );

      setInvesting(null);
    } catch (err) {
      console.error(err);
      alert("Investment failed");
      setInvesting(null);
    }
  }

  return (
    <UserShell active="AI Trading">
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
          <SectionHeader title="AI Trade History" actionLabel="View all" action={() => {}} />

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
    </UserShell>
  );
}