// components/motion/order-panel.tsx
"use client";

import { ActionSwap } from "@/components/motion/action-swap";
import { StatefulButton, type ButtonState } from "@/components/motion/button";
import { cn } from "@/lib/utils";
import {
  ArrowDownUp,
  Check,
  Clock,
  Coins,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

export type OrderMode = "buy" | "sell";

export type OrderValue = {
  mode: OrderMode;
  amount: string;
  expiryId: string;
};

export type OrderExpiryOption = {
  id: string;
  label: string;
  seconds: number;
};

export const DEFAULT_EXPIRY_OPTIONS: OrderExpiryOption[] = [
  { id: "5m", label: "5m", seconds: 5 * 60 },
  { id: "15m", label: "15m", seconds: 15 * 60 },
  { id: "1h", label: "1H", seconds: 60 * 60 },
  { id: "4h", label: "4H", seconds: 4 * 60 * 60 },
  { id: "1d", label: "1D", seconds: 24 * 60 * 60 },
];

type Props = {
  /** Price of one unit, expressed as a fraction 0–1 (e.g. 0.167 = 16.7¢). */
  price: number;
  value: OrderValue;
  onValueChange: (value: OrderValue) => void;
  balance: number;
  holding: number;
  expiryOptions?: OrderExpiryOption[];
  quickAmounts?: number[];
  title?: string;
  subtitle?: ReactNode;
  className?: string;
};

// Green/red only — pulled from CSS vars so the panel follows your theme
// instead of hardcoded hex. Fall back to Tailwind's emerald/red if the
// vars aren't defined on :root.
const SUCCESS = "var(--success, #4ade80)";
const DESTRUCTIVE = "var(--destructive, #ef4444)";

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const first = window.setTimeout(() => setNow(Date.now()), 0);
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, [intervalMs]);
  return now;
}

const pad = (n: number) => String(n).padStart(2, "0");

function formatRemaining(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function OrderPanel({
  price,
  value,
  onValueChange,
  balance,
  holding,
  expiryOptions = DEFAULT_EXPIRY_OPTIONS,
  quickAmounts = [1, 5, 10, 100],
  title = "Manual Order",
  subtitle,
  className,
}: Props) {
  const [touched, setTouched] = useState(false);
  const [submitState, setSubmitState] = useState<ButtonState>("idle");
  const now = useNow();

  const amount = Math.max(0, Number(value.amount) || 0);
  const shares = price > 0 ? amount / price : 0;
  const payout = shares * 1;
  const potentialProfit = payout - amount;
  const isBuy = value.mode === "buy";
  const canSubmit = amount > 0 && amount <= (isBuy ? balance : holding);

  const expiry =
    expiryOptions.find((o) => o.id === value.expiryId) ?? expiryOptions[0];
  const periodMs = (expiry?.seconds ?? 0) * 1000;
  const closesAtMs =
    now !== null && periodMs > 0
      ? (Math.floor(now / periodMs) + 1) * periodMs
      : null;
  const remaining = closesAtMs !== null && now !== null ? closesAtMs - now : null;
  const closesLabel =
    closesAtMs === null
      ? "—"
      : new Date(closesAtMs).toLocaleString(
          "en-US",
          periodMs >= 86_400_000
            ? { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }
            : { hour: "2-digit", minute: "2-digit", hourCycle: "h23" },
        );

  const patch = (partial: Partial<OrderValue>) => {
    setSubmitState("idle");
    onValueChange({ ...value, ...partial });
  };

  const setAmountFromString = (raw: string) => {
    const cleaned = raw.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    const normalized =
      parts.length > 2 ? `${parts[0]}.${parts.slice(1).join("")}` : cleaned;
    patch({ amount: normalized });
  };

  const submit = async () => {
    if (submitState === "loading") return;
    setSubmitState("loading");
    await new Promise((r) => setTimeout(r, 900));
    setSubmitState("success");
  };

  const priceLabel = useMemo(() => `${(price * 100).toFixed(1)}¢`, [price]);

  const headerIcon = isBuy ? (
    <TrendingUp className="size-4" />
  ) : (
    <TrendingDown className="size-4" />
  );

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-3xl border border-border bg-background",
        "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.12)]",
        className,
      )}
    >
      {/* Header */}
      <div className="border-b border-border/80 px-4 pt-4">
        <div className="flex items-start justify-between gap-3 pb-3">
          <div className="min-w-0">
            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              <Coins className="size-3.5" />
              Manual trading
            </div>
            <h3 className="text-base font-semibold leading-snug tracking-tight text-foreground sm:text-lg">
              {title}
            </h3>
            {subtitle ? (
              <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
        </div>

        {/* Mode toggle */}
        <div role="tablist" aria-label="Order side" className="relative flex gap-1 rounded-full bg-card p-1">
          {(["buy", "sell"] as const).map((mode) => {
            const active = value.mode === mode;
            return (
              <button
                key={mode}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => patch({ mode })}
                className={cn(
                  "relative flex-1 rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-colors",
                  active ? "text-background" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="op-mode-pill"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                    className="absolute inset-0 rounded-full"
                    style={{ background: mode === "buy" ? SUCCESS : DESTRUCTIVE }}
                  />
                )}
                <span className="relative z-10">{mode}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Trade expiry */}
      <div className="px-3 pt-3">
        <div className="rounded-2xl border border-border bg-card p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <Clock className="size-3.5" />
              Trade expires
            </span>
            <span aria-live="off" className="text-sm font-semibold tabular-nums text-foreground">
              {remaining !== null ? formatRemaining(remaining) : "--:--"}
            </span>
          </div>

          <div role="radiogroup" aria-label="Trade expiry" className="mt-2 flex gap-1 rounded-full bg-background p-1">
            {expiryOptions.map((o) => {
              const active = o.id === expiry?.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => patch({ expiryId: o.id })}
                  className={cn(
                    "relative flex-1 rounded-full px-2 py-1.5 text-xs font-semibold transition-colors",
                    active ? "text-background" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="op-expiry-pill"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                      className="absolute inset-0 rounded-full bg-foreground"
                    />
                  )}
                  <span className="relative z-10">{o.label}</span>
                </button>
              );
            })}
          </div>

          <p className="mt-2 text-[11px] text-muted-foreground">
            Closes at <span className="font-semibold text-foreground tabular-nums">{closesLabel}</span>
          </p>
        </div>
      </div>

      {/* Amount */}
      <div className="px-3 pt-3">
        <div className="rounded-2xl border border-border bg-card p-3">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="op-amount" className="text-[11px] font-medium text-muted-foreground">
              Amount (USDT)
            </label>
            <span className="text-[11px] text-muted-foreground">
              {isBuy ? "Balance" : "Holding"}:{" "}
              <span className="font-semibold text-foreground tabular-nums">
                {isBuy ? balance.toFixed(2) : holding.toFixed(2)}
              </span>
            </span>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <span className="text-lg font-semibold text-muted-foreground">$</span>
            <input
              id="op-amount"
              inputMode="decimal"
              autoComplete="off"
              value={value.amount}
              onChange={(e) => setAmountFromString(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="0.00"
              className={cn(
                "w-full min-w-0 bg-transparent text-2xl font-semibold tabular-nums text-foreground outline-none placeholder:text-muted-foreground/50",
                touched && !canSubmit && amount > 0 && "text-destructive",
              )}
            />
            <div className="flex shrink-0 gap-1">
              {quickAmounts.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => patch({ amount: String(q) })}
                  className="rounded-full border border-border bg-background px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-muted-foreground/40 hover:text-foreground"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="space-y-1.5 px-4 pt-3 text-xs">
        <SummaryRow
          label="Avg. price"
          value={priceLabel}
          icon={<ActionSwap showA={isBuy} a={<span>·</span>} b={<span>·</span>} />}
        />
        <SummaryRow label="Units" value={shares.toLocaleString("en-US", { maximumFractionDigits: 2 })} />
        <SummaryRow label={isBuy ? "Cost" : "Est. proceeds"} value={`$${amount.toFixed(2)}`} />
        <SummaryRow
          label="Potential profit"
          value={`${potentialProfit >= 0 ? "+" : "-"}$${Math.abs(potentialProfit).toFixed(2)}`}
          tone={potentialProfit >= 0 ? SUCCESS : DESTRUCTIVE}
          bold
        />
        <SummaryRow label="Payout if correct" value={`$${payout.toFixed(2)}`} />
        <SummaryRow label="Expires" value={closesLabel} />
      </div>

      {/* Submit */}
      <div className="p-4">
        <StatefulButton
          className="h-12 w-full text-sm"
          variant={isBuy ? "success" : "destructive"}
          state={submitState}
          disabled={!canSubmit}
          onClick={submit}
        >
          <span className="inline-flex items-center gap-2">
            {headerIcon}
            {isBuy ? `Buy · $${amount.toFixed(2)}` : `Sell · $${amount.toFixed(2)}`}
            <Check className="hidden size-4" />
            <ArrowDownUp className="size-4 opacity-60" />
          </span>
        </StatefulButton>

        <AnimatePresence>
          {touched && amount > (isBuy ? balance : holding) && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mt-2 text-center text-[11px] text-destructive"
            >
              {isBuy ? "Insufficient balance" : "Insufficient units"}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, tone, bold, icon }: {
  label: string;
  value: string;
  tone?: string;
  bold?: boolean;
  icon?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className={cn("tabular-nums", bold ? "font-semibold" : "font-medium")} style={tone ? { color: tone } : undefined}>
        {value}
      </span>
    </div>
  );
}
