// app/(superadmin)/_components/finance-ui.tsx
"use client";

import { useEffect, type ReactNode } from "react";
import { Search, type LucideIcon } from "lucide-react";
import { AnimatedBadge } from "@/components/motion/animated-badge";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { cn } from "@/lib/utils";
import type { ReqStatus } from "@/lib/finance-data";

export const statusTone = { pending: "amber", approved: "green", rejected: "red" } as const satisfies Record<
  ReqStatus,
  "amber" | "green" | "red"
>;

export const usd = (n: number) =>
  `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

export const nowStamp = () => new Date().toISOString().slice(0, 16).replace("T", " ");

/** Tiny fetch wrapper. Throws on non-2xx so callers can catch. */
export async function api(url: string, method: "POST" | "PATCH" | "DELETE", body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(String(res.status));
  return res.json().catch(() => ({}));
}

/** Right-side slide-over panel. Closes on backdrop click and Escape. */
export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-xl flex-col border-l border-border bg-background shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-border p-5">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-foreground">{title}</h2>
            {subtitle ? <p className="truncate text-xs text-muted-foreground">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg px-2 py-1 text-sm text-muted-foreground hover:bg-muted"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer ? <div className="border-t border-border p-4">{footer}</div> : null}
      </aside>
    </div>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  invalid,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  invalid?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className={cn(
          "w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring",
          invalid ? "border-rose-500" : "border-border",
        )}
      />
    </label>
  );
}

export function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-right font-medium text-foreground">{value || "-"}</span>
    </div>
  );
}

/** Pill tabs with counts, same look as the user detail tabs. */
export function FilterTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { value: T; label: string; count: number }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex w-fit gap-1 overflow-x-auto rounded-xl bg-muted p-1">
      {tabs.map((t) => (
        <button
          key={t.value}
          type="button"
          onClick={() => onChange(t.value)}
          className={cn(
            "shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            value === t.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t.label} <span className="text-xs opacity-60">{t.count}</span>
        </button>
      ))}
    </div>
  );
}

const BADGE = {
  pending: "warning",
  approved: "success",
  completed: "success",
  rejected: "danger",
  failed: "danger",
} as const;

export function StatusBadge({ status }: { status: keyof typeof BADGE }) {
  return (
    <AnimatedBadge status={BADGE[status]} size="sm">
      <span className="capitalize">{status}</span>
    </AnimatedBadge>
  );
}

export function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function StatCard({
  label,
  value,
  format,
  icon: Icon,
  hint,
  positive,
}: {
  label: string;
  value: number;
  format?: (n: number) => string;
  icon: LucideIcon;
  hint?: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <span className="grid size-8 place-items-center rounded-lg bg-muted text-foreground">
          <Icon aria-hidden="true" className="size-4" />
        </span>
      </div>
      <div
        className={
          positive
            ? "mt-3 text-2xl font-semibold tracking-tight tabular-nums text-(--color-success)"
            : "mt-3 text-2xl font-semibold tracking-tight tabular-nums text-foreground"
        }
      >
        <AnimatedNumber value={value} format={format ?? ((n) => Math.round(n).toLocaleString())} />
      </div>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="relative block w-full sm:w-72">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
      />
    </label>
  );
}
