// app/(superadmin)/_components/ui.tsx
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-border bg-background p-4", className)}>
      {title || action ? (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title ? <h3 className="text-sm font-semibold text-foreground">{title}</h3> : <span />}
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

const TONES = {
  green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  red: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  gray: "bg-muted text-muted-foreground",
};

export function Badge({ tone = "gray", children }: { tone?: keyof typeof TONES; children: ReactNode }) {
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium capitalize", TONES[tone])}>
      {children}
    </span>
  );
}

const inputCls =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:ring-2 focus:ring-ring disabled:opacity-60";

export function Field({
  label,
  value,
  onChange,
  type = "text",
  readOnly,
  placeholder,
}: {
  label: string;
  value: string | number;
  onChange?: (v: string) => void;
  type?: "text" | "email" | "date" | "number";
  readOnly?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className={inputCls}
      />
    </label>
  );
}

export function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Btn({
  children,
  onClick,
  tone = "default",
  disabled,
  size = "default",
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: "default" | "primary" | "danger";
  disabled?: boolean;
  size?: "default" | "sm";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-lg px-3 text-sm font-medium transition-colors disabled:opacity-50",
        size === "default" ? "h-9" : "h-8 text-xs",
        tone === "primary" && "bg-foreground text-background hover:opacity-90",
        tone === "danger" && "bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 dark:text-rose-400",
        tone === "default" && "border border-border text-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}
