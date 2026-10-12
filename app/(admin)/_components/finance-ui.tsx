// app/(admin)/_components/finance-ui.tsx
"use client";

import { Search, type LucideIcon } from "lucide-react";
import { AnimatedBadge } from "@/components/motion/animated-badge";
import { AnimatedNumber } from "@/components/motion/animated-number";

export const usd = (n: number) =>
  `$${n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

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

export function PageHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
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
        <AnimatedNumber
          value={value}
          format={format ?? ((n) => Math.round(n).toLocaleString())}
        />
      </div>
      {hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
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
  placeholder: string;
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
