// app/(user)/investment/overview/page.tsx
"use client";

import { UserShell } from "@/app/(user)/_components/user-shell";
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Bot,
  Plus,
  Eye,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Table } from "@/components/motion/table";

// ── Shared primitives (same as dashboard) ───────────────────────────────────

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-4xl border border-border bg-card p-6 ${className}`}>
      {children}
    </div>
  );
}

function Badge({
  label,
  tone = "default",
}: {
  label: string;
  tone?: "default" | "success" | "destructive" | "muted" | "warning";
}) {
  const colors: Record<string, string> = {
    default:     "bg-foreground/10 text-foreground",
    success:     "bg-success/10 text-success",
    destructive: "bg-destructive/10 text-destructive",
    muted:       "bg-muted text-muted-foreground",
    warning:     "bg-destructive/10 text-destructive",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${colors[tone]}`}
    >
      {label}
    </span>
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
    <div className="flex flex-col gap-1">
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

function SectionHeader({
  title,
  action,
  actionLabel,
}: {
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
          className="text-xs font-medium text-muted-foreground transition-opacity hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  message,
  actionLabel,
  onAction,
}: {
  icon: React.ElementType;
  message: string;
  actionLabel: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <div className="grid size-10 place-items-center rounded-xl bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
      <button
        type="button"
        onClick={onAction}
        className="rounded-xl bg-muted px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted/70 outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {actionLabel}
      </button>
    </div>
  );
}

// ── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
      <div
        className="h-full rounded-full bg-foreground/40 transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number, decimals = 2) {
  return "$" + n.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// ── Data ─────────────────────────────────────────────────────────────────────

type PlanStatus = "Active" | "Paused" | "Completed" | "Expired";

type PackageKind = "Daily Profit" | "AI Trading";

type DetailRow = {
  label: string;
  value: string;
  tone?: "success" | "strong";
};

// One shape for every package the user bought / invested in
type InvestedPackage = {
  id: string;
  kind: PackageKind;
  name: string;
  tier: string;
  status: PlanStatus;
  invested: number;      // amount invested (Daily Profit) or amount staked (AI Trading)
  rateLabel: string;     // "Daily Rate" | "Strategy ROI"
  rateValue: string;     // "2.1%" | "+24.1%"
  startDate: string;
  endDate: string;       // "Ongoing" for Daily Profit plans, unlock date for AI Trading
  earned: number;        // returns so far
  progress?: number;     // only for packages with a fixed lock period (AI Trading)
  details: DetailRow[];  // rows shown inside the View Details dialog
};

type HistoryRow = {
  id: string;
  name: string;
  amount: string;
  startDate: string;
  endDate: string;
  totalReturn: string;
  status: PlanStatus;
};

const INVESTMENT_HISTORY: HistoryRow[] = [
  { id: "h1", name: "Growth Starter", amount: "$1,000.00", startDate: "2025-02-01", endDate: "2025-04-01", totalReturn: "+$320.00", status: "Completed" },
  { id: "h2", name: "Basic Plan",     amount: "$500.00",   startDate: "2025-01-15", endDate: "2025-03-15", totalReturn: "+$96.00",  status: "Completed" },
  { id: "h3", name: "Pro Monthly",    amount: "$2,000.00", startDate: "2024-12-01", endDate: "2025-02-01", totalReturn: "+$432.00", status: "Completed" },
  { id: "h4", name: "Quick Start",    amount: "$300.00",   startDate: "2025-04-10", endDate: "2025-05-10", totalReturn: "$0.00",    status: "Expired"   },
  { id: "h5", name: "Test Plan",      amount: "$200.00",   startDate: "2025-05-01", endDate: "2025-05-15", totalReturn: "$0.00",    status: "Expired"   },
];

type HistoryFilter = "All" | PlanStatus;
const FILTERS: HistoryFilter[] = ["All", "Active", "Completed", "Expired", "Paused"];

const statusTone = (s: PlanStatus): "success" | "warning" | "destructive" | "muted" => {
  if (s === "Active")    return "success";
  if (s === "Paused")    return "warning";
  if (s === "Completed") return "muted";
  return "destructive";
};

const HISTORY_COLUMNS = [
  { key: "name",        header: "Plan Name",     width: "160px" },
  { key: "amount",      header: "Amount",        width: "120px", align: "right" as const },
  { key: "startDate",   header: "Start Date",    width: "120px" },
  { key: "endDate",     header: "End Date",      width: "120px" },
  {
    key: "totalReturn",
    header: "Total Return",
    width: "120px",
    align: "right" as const,
    cell: (r: HistoryRow) => (
      <span className={`text-xs font-semibold ${r.totalReturn.startsWith("+") ? "text-success" : "text-muted-foreground"}`}>
        {r.totalReturn}
      </span>
    ),
  },
  {
    key: "status",
    header: "Status",
    width: "110px",
    cell: (r: HistoryRow) => <Badge label={r.status} tone={statusTone(r.status)} />,
  },
];

// ── Package Card (Daily Profit + AI Trading) ─────────────────────────────────

function PackageCard({
  pkg,
  onView,
}: {
  pkg: InvestedPackage;
  onView: (pkg: InvestedPackage) => void;
}) {
  const Icon = pkg.kind === "AI Trading" ? Bot : TrendingUp;
  const isAiTrading = pkg.kind === "AI Trading";
  const lockElapsed = typeof pkg.progress === "number" && pkg.progress >= 100;

  return (
    <Card>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-semibold text-foreground">{pkg.name}</p>
            <Badge label={pkg.tier} tone="default" />
          </div>
          <div className="flex items-center gap-2">
            <Badge label={pkg.status} tone={statusTone(pkg.status)} />
            <Badge label={pkg.kind} tone="muted" />
          </div>
        </div>
        <div className="grid size-8 place-items-center rounded-xl bg-muted text-muted-foreground shrink-0">
          <Icon className="size-4" />
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">{isAiTrading ? "Staked" : "Invested"}</span>
          <span className="font-medium text-foreground">{fmt(pkg.invested)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">{pkg.rateLabel}</span>
          <span className="font-medium text-foreground">{pkg.rateValue}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Start Date</span>
          <span className="font-medium text-foreground">{pkg.startDate}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">{isAiTrading ? "Unlock Date" : "End Date"}</span>
          <span className="font-medium text-foreground">{pkg.endDate}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">{isAiTrading ? "Profit So Far" : "Returns So Far"}</span>
          <span className="font-semibold text-success">+{fmt(pkg.earned)}</span>
        </div>
      </div>

      {typeof pkg.progress === "number" && (
        <div className="mb-4">
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1.5">
            <span>{lockElapsed ? "Lock period ended" : "Lock period elapsed"}</span>
            <span>{pkg.progress}%</span>
          </div>
          <ProgressBar value={pkg.progress} />
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onView(pkg)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-muted py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted/70 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Eye className="size-3" />
          View Details
        </button>
        {/* AI Trading stakes are locked for 15 days, so only Daily Profit plans can be cancelled */}
        {!isAiTrading && (pkg.status === "Active" || pkg.status === "Paused") ? (
          <button
            type="button"
            className="flex items-center justify-center gap-1.5 rounded-xl bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/20 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-3" />
            Cancel
          </button>
        ) : null}
      </div>
    </Card>
  );
}

// ── Package Details Dialog ───────────────────────────────────────────────────

function PackageDetailsDialog({
  pkg,
  onClose,
}: {
  pkg: InvestedPackage;
  onClose: () => void;
}) {
  // Close on Esc + lock background scroll while open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const valueClass = (tone?: DetailRow["tone"]) =>
    tone === "success"
      ? "font-semibold text-success"
      : tone === "strong"
      ? "font-semibold text-foreground"
      : "font-medium text-foreground";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${pkg.name} details`}
        className="w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Package Details</h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid size-7 place-items-center rounded-xl bg-muted text-muted-foreground transition-colors hover:bg-muted/70 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Title */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-semibold text-foreground">{pkg.name}</p>
              <Badge label={pkg.tier} tone="default" />
            </div>
            <div className="flex items-center gap-2">
              <Badge label={pkg.status} tone={statusTone(pkg.status)} />
              <Badge label={pkg.kind} tone="muted" />
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3 mb-6">
            {pkg.details.map((row) => (
              <div key={row.label} className="flex justify-between gap-4 text-xs">
                <span className="text-muted-foreground">{row.label}</span>
                <span className={`text-right ${valueClass(row.tone)}`}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Progress (only for fixed lock-period packages) */}
          {typeof pkg.progress === "number" && (
            <div className="mb-6">
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1.5">
                <span>Lock period elapsed</span>
                <span>{pkg.progress}%</span>
              </div>
              <ProgressBar value={pkg.progress} />
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-muted py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted/70 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Close
          </button>
        </Card>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function InvestmentOverviewPage() {
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("All");
  const [selectedPackage, setSelectedPackage] = useState<InvestedPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<InvestedPackage[]>([]);
  const [summary, setSummary] = useState({ totalInvested: 0, totalEarned: 0, activeCount: 0 });

  // Fetch investments from backend
  useEffect(() => {
    const fetchInvestments = async () => {
      try {
        const res = await fetch("/api/investment/overview");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setPackages(data.packages || []);
        setSummary(data.summary || { totalInvested: 0, totalEarned: 0, activeCount: 0 });
      } catch (err) {
        console.error("Failed to fetch investments:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvestments();
    const interval = setInterval(fetchInvestments, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const filteredHistory =
    historyFilter === "All"
      ? INVESTMENT_HISTORY
      : INVESTMENT_HISTORY.filter((r) => r.status === historyFilter);

  // Summary stats derived from the packages shown below
  const totalInvested = summary.totalInvested;
  const totalEarned   = summary.totalEarned;
  const activeCount   = summary.activeCount;
  const roi           = totalInvested > 0 ? (totalEarned / totalInvested) * 100 : 0;

  return (
    <UserShell active="Overview">
      <div className="overflow-y-auto px-5 py-6 sm:px-7 sm:py-8 space-y-8">

        {/* ── Greeting ───────────────────────────── */}
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Investment Overview
          </h1>
        </div>

        {/* ── Summary Stats ──────────────────────── */}
        <section aria-label="Investment Summary">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total Invested",       value: fmt(totalInvested),        delta: { value: `Across ${packages.length} packages`, positive: true } },
              { label: "Total Returns Earned", value: `+${fmt(totalEarned)}`,    delta: { value: "All time",                                     positive: true } },
              { label: "Active Plans",         value: String(activeCount),       delta: { value: "Running now",                                  positive: true } },
              { label: "ROI %",                value: `+${roi.toFixed(1)}%`,     delta: { value: "Lifetime return",                              positive: true } },
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

        {/* ── New Investment CTA ──────────────────── */}
        <div className="flex justify-end">
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-xs font-semibold text-background transition-opacity hover:opacity-80 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus className="size-3.5" />
            New Investment
          </button>
        </div>

        {/* ── Active Plans (Daily Profit + AI Trading) ── */}
        <section aria-label="Active Investment Plans">
          <SectionHeader title="Active Plans" actionLabel="View all plans" action={() => {}} />
          {packages.length === 0 ? (
            <Card>
              <EmptyState
                icon={TrendingUp}
                message="You have no active investment plans yet."
                actionLabel="Start your first investment"
              />
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {packages.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} onView={setSelectedPackage} />
              ))}
            </div>
          )}
          <p className="mt-3 text-[11px] text-muted-foreground">
            AI Trading stakes are locked for 15 days from the day you invest. Past performance does not guarantee future results.
          </p>
        </section>

        {/* ── Investment History ──────────────────── */}
        <section aria-label="Investment History">
          <SectionHeader title="Investment History" />

          {/* Filter bar */}
          <div className="mb-4 flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setHistoryFilter(f)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  historyFilter === f
                    ? "bg-foreground text-background"
                    : "bg-muted text-foreground hover:bg-muted/70"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {filteredHistory.length === 0 ? (
            <Card>
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <p className="text-sm text-muted-foreground">No results for selected filter.</p>
              </div>
            </Card>
          ) : (
            <Table
              data={filteredHistory}
              columns={HISTORY_COLUMNS}
              getRowId={(r) => r.id}
              height={280}
              rowHeight={44}
            />
          )}
        </section>

        <div className="h-20" />
      </div>

      {/* ── Package Details Dialog ──────────────── */}
      {selectedPackage && (
        <PackageDetailsDialog
          pkg={selectedPackage}
          onClose={() => setSelectedPackage(null)}
        />
      )}
    </UserShell>
  );
}