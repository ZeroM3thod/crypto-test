// app/(user)/wallet/history/page.tsx
"use client";

import { UserShell } from "@/app/(user)/_components/user-shell";
import {
  ArrowDownRight,
  ArrowUpRight,
  Download,
} from "lucide-react";
import { useState } from "react";
import { Table } from "@/components/motion/table";
import { money, useWalletData } from "../use-wallet-data";

// ── Shared primitives (identical to dashboard) ──────────────────────────────

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-4xl border border-border bg-card p-6 ${className}`}>
      {children}
    </div>
  );
}

function Stat({ label, value, delta, loading = false }: {
  label: string;
  value: string;
  delta?: { value: string; positive: boolean };
  loading?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
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
          className="text-xs font-medium text-foreground transition-opacity hover:opacity-75 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// ── Data ────────────────────────────────────────────────────────────────────

type WalletTransaction = {
  id: string;
  date: string;
  wallet: string;
  type: string;
  asset: string;
  amount: string;
  status: "Completed" | "Pending" | "Failed";
  txHash: string;
};

const TX_COLUMNS = [
  { key: "date",   header: "Date",   width: "110px" },
  {
    key: "wallet", header: "Wallet", width: "110px",
    cell: (r: WalletTransaction) => {
      const colors: Record<string, string> = {
        Main:       "bg-foreground/10 text-foreground",
        Investment: "bg-success/10 text-success",
        Trading:    "bg-destructive/10 text-destructive",
        Mining:     "bg-muted text-muted-foreground",
        Referral:   "bg-foreground/10 text-foreground",
      };
      return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${colors[r.wallet] ?? "bg-muted text-muted-foreground"}`}>
          {r.wallet}
        </span>
      );
    },
  },
  { key: "type",   header: "Type",   width: "130px" },
  { key: "asset",  header: "Asset",  width: "100px" },
  { key: "amount", header: "Amount", width: "120px", align: "right" as const,
    cell: (r: WalletTransaction) => (
      <span className={`text-xs font-semibold ${r.amount.startsWith("+") ? "text-success" : r.amount.startsWith("-") ? "text-destructive" : "text-foreground"}`}>
        {r.amount}
      </span>
    ),
  },
  {
    key: "status", header: "Status", width: "100px",
    cell: (r: WalletTransaction) => {
      const tone: Record<WalletTransaction["status"], string> = {
        Completed: "text-success",
        Pending:   "text-foreground",
        Failed:    "text-destructive",
      };
      return <span className={`text-xs font-semibold ${tone[r.status]}`}>{r.status}</span>;
    },
  },
  {
    key: "txHash", header: "Tx Hash",
    cell: (r: WalletTransaction) => (
      <span className="font-mono text-xs text-muted-foreground">{r.txHash}</span>
    ),
  },
];

// ── Filter bar — daily-profit pill style ────────────────────────────────────

type FilterBarProps = {
  wallet: string; setWallet: (v: string) => void;
  status: string; setStatus: (v: string) => void;
};

function FilterBar({ wallet, setWallet, status, setStatus }: FilterBarProps) {
  const wallets  = ["All", "Main", "Investment", "Trading", "Mining", "Referral"];
  const statuses = ["All", "Completed", "Pending", "Failed"];

  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      {/* Wallet pill group */}
      <div className="inline-flex items-center gap-0.5 rounded-2xl border border-border bg-muted p-1">
        {wallets.map((w) => (
          <button
            key={w}
            type="button"
            onClick={() => setWallet(w)}
            className={`rounded-xl px-3 py-1 text-[11px] font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              wallet === w
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {w}
          </button>
        ))}
      </div>

      {/* Status pill group */}
      <div className="inline-flex items-center gap-0.5 rounded-2xl border border-border bg-muted p-1 w-fit">
        {statuses.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`rounded-xl px-3 py-1 text-[11px] font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              status === s
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function WalletHistoryPage() {
  const { data } = useWalletData();
  const [walletFilter, setWalletFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Safe fallback in case transactions are not loaded yet
  const transactions = data.transactions ?? [];

  const filtered = transactions.filter((t) => {
    if (walletFilter !== "All" && t.wallet !== walletFilter) return false;
    if (statusFilter !== "All" && t.status !== statusFilter) return false;
    return true;
  });

  const handleExport = () => {
    const headers = ["Date", "Wallet", "Type", "Asset", "Amount", "Status", "Tx Hash"];
    const rows = filtered.map((t) => [t.date, t.wallet, t.type, t.asset, t.amount, t.status, t.txHash]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = "wallet-history.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <UserShell active="Wallet">
      <div className="overflow-y-auto px-5 py-6 sm:px-7 sm:py-8 space-y-8">

        {/* ── Heading ───────────────────────────────────── */}
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Wallet History
          </h1>
        </div>

        {/* ── Summary Stats ─────────────────────────────── */}
        <section aria-label="History Summary">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total Transactions", value: `${data.stats.history.totalTransactions || transactions.length}`, delta: { value: "All wallets", positive: true } },
              { label: "Total In",           value: money(data.stats.history.totalIn, true),                          delta: { value: "All time",    positive: true } },
              { label: "Total Out",          value: money(-(data.stats.history.totalOut || 0)),                       delta: { value: "All time",    positive: false } },
              { label: "Net Flow",           value: money(data.stats.history.netFlow, true),                          delta: { value: "All time",    positive: (data.stats.history.netFlow || 0) >= 0 } },
            ].map((item) => (
              <Card key={item.label}>
                <Stat label={item.label} value={item.value} delta={item.delta} />
              </Card>
            ))}
          </div>
        </section>

        {/* ── Unified Transaction Table ──────────────────── */}
        <section aria-label="All Transactions">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">All Transactions</h2>
            <button
              type="button"
              onClick={handleExport}
              className="flex items-center gap-1.5 rounded-xl bg-muted px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted/70 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Download className="size-3.5" />
              Export CSV
            </button>
          </div>
          <FilterBar
            wallet={walletFilter} setWallet={setWalletFilter}
            status={statusFilter} setStatus={setStatusFilter}
          />
          <Table
            data={filtered}
            columns={TX_COLUMNS}
            getRowId={(r) => r.id}
            height={480}
            rowHeight={44}
          />
          <p className="mt-2 text-[11px] text-muted-foreground">
            Showing {filtered.length} of {transactions.length} transactions
          </p>
        </section>

        <div className="h-20" />
      </div>
    </UserShell>
  );
}