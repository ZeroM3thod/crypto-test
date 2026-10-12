// app/(user)/wallet/investment/page.tsx
"use client";

import { UserShell } from "@/app/(user)/_components/user-shell";
import {
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeftRight,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { Table } from "@/components/motion/table";
import { AccountTransfer } from "@/components/motion/account-transfer";
import { money, useWalletData } from "../use-wallet-data";

// ── Shared primitives (identical to dashboard) ──────────────────────────────

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-4xl border border-border bg-card p-6 ${className}`}>
      {children}
    </div>
  );
}

function Badge({ label, tone = "default" }: { label: string; tone?: "default" | "success" | "destructive" | "muted" }) {
  const colors: Record<string, string> = {
    default:     "bg-muted text-muted-foreground",
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
          className="text-xs font-medium text-muted-foreground transition-opacity hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-border rounded"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// ── Data ────────────────────────────────────────────────────────────────────

type Transaction = {
  id: string;
  date: string;
  type: string;
  asset: string;
  amount: string;
  status: "Completed" | "Pending" | "Failed";
  txHash: string;
};

const TRANSACTIONS: Transaction[] = [
  { id: "i1", date: "2025-07-18", type: "Credit",   asset: "USDT", amount: "+$28.40",    status: "Completed", txHash: "0x4f3a…c91e" },
  { id: "i2", date: "2025-07-17", type: "Credit",   asset: "USDT", amount: "+$28.40",    status: "Completed", txHash: "0x8b2d…f04c" },
  { id: "i3", date: "2025-07-16", type: "Deposit",  asset: "USDT", amount: "+$2,000.00", status: "Completed", txHash: "0x1c7e…a83b" },
  { id: "i4", date: "2025-07-15", type: "Credit",   asset: "USDT", amount: "+$27.90",    status: "Completed", txHash: "0x9d5f…7721" },
  { id: "i5", date: "2025-07-14", type: "Transfer", asset: "USDT", amount: "-$500.00",   status: "Pending",   txHash: "0x3e2a…bb49" },
  { id: "i6", date: "2025-07-13", type: "Credit",   asset: "USDT", amount: "+$26.80",    status: "Completed", txHash: "0x6f1c…2d30" },
];

const TX_COLUMNS = [
  { key: "date",   header: "Date",   width: "110px" },
  { key: "type",   header: "Type",   width: "110px" },
  { key: "asset",  header: "Asset",  width: "80px" },
  { key: "amount", header: "Amount", width: "120px", align: "right" as const },
  {
    key: "status", header: "Status", width: "100px",
    cell: (r: Transaction) => {
      const tone: Record<Transaction["status"], string> = {
        Completed: "text-success",
        Pending:   "text-muted-foreground",
        Failed:    "text-destructive",
      };
      return <span className={`text-xs font-semibold ${tone[r.status]}`}>{r.status}</span>;
    },
  },
  {
    key: "txHash", header: "Tx Hash",
    cell: (r: Transaction) => (
      <span className="font-mono text-xs text-muted-foreground">{r.txHash}</span>
    ),
  },
];

// ── Modal ───────────────────────────────────────────────────────────────────

function Modal({ open, onClose, title, children, maxWidth = "max-w-sm" }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; maxWidth?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-4">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${maxWidth} rounded-4xl border border-border bg-card p-6 shadow-xl`}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <button type="button" onClick={onClose} className="text-xs font-medium text-muted-foreground hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-border rounded">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function TransferModal({ open, onClose, accounts, onTransfer }: { open: boolean; onClose: () => void; accounts: React.ComponentProps<typeof AccountTransfer>["accounts"]; onTransfer: (fromId: string, toId: string, amount: number) => Promise<boolean> }) {
  return (
    <Modal open={open} onClose={onClose} title="Transfer" maxWidth="max-w-[460px]">
      <div className="flex w-full items-center justify-center">
        <AccountTransfer
          defaultFromId="main"
          defaultToId="investment"
          accounts={accounts}
          onConfirm={async ({ fromId, toId, amount }) => {
            if (await onTransfer(fromId, toId, amount)) onClose();
          }}
        />
      </div>
    </Modal>
  );
}

function InvestNowModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const plans = [
    { name: "Starter", roi: "0.5%/day", min: "$100",   duration: "30 days" },
    { name: "Growth",  roi: "0.8%/day", min: "$500",   duration: "60 days" },
    { name: "Pro",     roi: "1.2%/day", min: "$2,000", duration: "90 days" },
  ];
  const [selected, setSelected] = useState("Growth");
  return (
    <Modal open={open} onClose={onClose} title="Invest Now">
      <div className="space-y-3">
        <div className="space-y-2">
          {plans.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => setSelected(p.name)}
              className={`w-full flex items-center justify-between rounded-2xl border px-3 py-2 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-border ${
                selected === p.name
                  ? "border-foreground/20 bg-muted"
                  : "border-border bg-muted hover:bg-muted/70"
              }`}
            >
              <div>
                <p className="text-xs font-semibold text-foreground">{p.name}</p>
                <p className="text-[11px] text-muted-foreground">Min {p.min} · {p.duration}</p>
              </div>
              <span className="text-xs font-semibold text-success">{p.roi}</span>
            </button>
          ))}
        </div>
        <button type="button" className="w-full rounded-2xl bg-foreground py-2.5 text-xs font-semibold text-background transition-opacity hover:opacity-90 outline-none focus-visible:ring-2 focus-visible:ring-border">
          Invest with {selected}
        </button>
      </div>
    </Modal>
  );
}

// ── Filter bar ──────────────────────────────────────────────────────────────

function FilterBar({ type, setType }: { type: string; setType: (v: string) => void }) {
  const types = ["All", "Credit", "Deposit", "Transfer"];
  return (
    <div className="mb-4 flex items-center gap-1 rounded-xl bg-muted p-1">
      {types.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => setType(t)}
          className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-border ${
            type === t
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function InvestmentWalletPage() {
  const { data, transfer } = useWalletData();
  const [transferOpen,  setTransferOpen]  = useState(false);
  const [investNowOpen, setInvestNowOpen] = useState(false);
  const [typeFilter,    setTypeFilter]    = useState("All");

  const filtered = data.walletTransactions.investment.filter((t) => typeFilter === "All" || t.type === typeFilter);

  return (
    <UserShell active="Wallet">
      <div className="overflow-y-auto px-5 py-6 sm:px-7 sm:py-8 space-y-8">

        {/* ── Heading ───────────────────────────────────── */}
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Investment Wallet
          </h1>
        </div>

        {/* ── Balance Card ──────────────────────────────── */}
        <section aria-label="Wallet Balance">
          <div className="flex w-full flex-col items-start gap-4 p-2">
            <Card className="w-full">
              <div className="flex flex-col gap-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Investment Balance</p>
                    <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">{money(data.wallets.investment.balance)}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs font-medium text-success">
                      <ArrowUpRight className="size-3" />
                      {money(data.stats.investment.todayProfit, true)} today
                    </p>
                  </div>
                  <Badge label="Active" tone="success" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setInvestNowOpen(true)}
                    className="flex flex-col items-center gap-1.5 rounded-2xl bg-muted py-3 text-foreground transition-colors hover:bg-muted/70 outline-none focus-visible:ring-2 focus-visible:ring-border"
                  >
                    <TrendingUp className="size-4" />
                    <span className="text-[11px] font-semibold">Invest Now</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransferOpen(true)}
                    className="flex flex-col items-center gap-1.5 rounded-2xl bg-muted py-3 text-foreground transition-colors hover:bg-muted/70 outline-none focus-visible:ring-2 focus-visible:ring-border"
                  >
                    <ArrowLeftRight className="size-4" />
                    <span className="text-[11px] font-semibold">Transfer Out</span>
                  </button>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* ── Stats Row ─────────────────────────────────── */}
        <section aria-label="Investment Stats">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total Invested", value: money(data.stats.investment.totalInvested), delta: { value: "All time",  positive: true } },
              { label: "Active Plans",   value: String(data.stats.investment.activePlans || 0),          delta: { value: "Running",  positive: true } },
              { label: "Today's Profit", value: money(data.stats.investment.todayProfit, true),    delta: { value: "Realized", positive: true } },
              { label: "Total Profit",   value: money(data.stats.investment.totalProfit, true), delta: { value: "Realized", positive: true } },
            ].map((item) => (
              <Card key={item.label}>
                <Stat label={item.label} value={item.value} delta={item.delta} />
              </Card>
            ))}
          </div>
        </section>

        {/* ── Transaction History ───────────────────────── */}
        <section aria-label="Transaction History">
          <SectionHeader title="Transaction History" actionLabel="Export CSV" action={() => {}} />
          <FilterBar type={typeFilter} setType={setTypeFilter} />
          <Table
            data={filtered}
            columns={TX_COLUMNS}
            getRowId={(r) => r.id}
            height={320}
            rowHeight={44}
          />
        </section>

        <div className="h-20" />
      </div>

      <TransferModal  open={transferOpen}  onClose={() => setTransferOpen(false)} accounts={data.accounts} onTransfer={transfer} />
      <InvestNowModal open={investNowOpen} onClose={() => setInvestNowOpen(false)} />
    </UserShell>
  );
}
