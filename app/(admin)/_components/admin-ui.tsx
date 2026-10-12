"use client";

import { ArrowDownRight, ArrowUpRight, X } from "lucide-react";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";

// ── Class helpers ────────────────────────────────────────────────────────
export const inputCls =
  "h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60";

export const btnPrimary =
  "inline-flex items-center justify-center gap-1.5 rounded-2xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40";

export const btnGhost =
  "inline-flex items-center justify-center gap-1.5 rounded-2xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring";

export const btnDanger =
  "inline-flex items-center justify-center gap-1.5 rounded-2xl bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground transition-opacity hover:opacity-90 outline-none focus-visible:ring-2 focus-visible:ring-destructive";

export const btnSmall =
  "inline-flex items-center justify-center gap-1 rounded-xl border border-border bg-background px-2.5 py-1.5 text-[11px] font-semibold text-foreground transition-colors hover:bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40";

export const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── Primitives ───────────────────────────────────────────────────────────
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-4xl border border-border bg-card p-6 ${className}`}>{children}</div>
  );
}

export function Badge({
  label,
  tone = "default",
}: {
  label: string;
  tone?: "default" | "success" | "destructive" | "muted";
}) {
  const colors: Record<string, string> = {
    default: "bg-foreground/10 text-foreground",
    success: "bg-success/10 text-success",
    destructive: "bg-destructive/10 text-destructive",
    muted: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${colors[tone]}`}
    >
      {label}
    </span>
  );
}

export function Stat({
  label,
  value,
  delta,
  icon,
}: {
  label: string;
  value: string;
  delta?: { value: string; positive: boolean };
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
      </div>
      <p className="text-lg font-semibold text-foreground">{value}</p>
      {delta && (
        <p
          className={`flex items-center gap-1 text-xs font-medium ${
            delta.positive ? "text-success" : "text-destructive"
          }`}
        >
          {delta.positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
          {delta.value}
        </p>
      )}
    </div>
  );
}

export function SectionHeader({
  title,
  description,
  right,
}: {
  title: string;
  description?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      {right}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        checked ? "bg-success" : "bg-muted"
      }`}
    >
      <span
        className={`absolute top-0.5 size-5 rounded-full bg-background shadow transition-all ${
          checked ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

const emptySubscribe = () => () => {};

// ── Modal (portal + spring, same feel as your invest dialog) ─────────────
export function Modal({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  // Portal target only exists on the client; skip SSR output.
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-4xl border border-border bg-card shadow-xl sm:rounded-4xl"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          >
            <div className="flex items-start justify-between gap-3 p-6 pb-4">
              <div>
                <h3 className="text-sm font-semibold text-card-foreground">{title}</h3>
                {subtitle && <p className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 pb-2">{children}</div>
            {footer && <div className="flex gap-2 p-6 pt-4">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

// ── Time helper ──────────────────────────────────────────────────────────
export function workingTime(startedAtISO: string) {
  const ms = Math.max(0, Date.now() - new Date(startedAtISO).getTime());
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  return d > 0 ? `${d}d ${h}h` : `${h}h`;
}
