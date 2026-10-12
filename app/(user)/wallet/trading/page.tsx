// app/(user)/wallet/trading/page.tsx
"use client";

import { UserShell } from "@/app/(user)/_components/user-shell";
import {
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeftRight,
  Bot,
} from "lucide-react";
import { useState } from "react";
import { Table } from "@/components/motion/table";
import { AccountTransfer } from "@/components/motion/account-transfer";
import { money, useWalletData } from "../use-wallet-data";

// ── Shared primitives ──────────────────────────────────────────────────────

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
  { id: "tr1", date: "2025-07-18", type: "P/L Credit",  asset: "BTC/USDT", amount: "+$68.00",   status: "Completed", txHash: "0x4f3a…c91e" },
  { id: "tr2", date: "2025-07-17", type: "P/L Credit",  asset: "ETH/USDT", amount: "+$48.00",   status: "Completed", txHash: "0x8b2d…f04c" },
  { id: "tr3", date: "2025-07-16", type: "Deposit",     asset: "USDT",     amount: "+$1,000.00",status: "Completed", txHash: "0x1c7e…a83b" },
  { id: "tr4", date: "2025-07-15", type: "P/L Debit",   asset: "BNB/USDT", amount: "-$24.00",   status: "Completed", txHash: "0x9d5f…7721" },
  { id: "tr5", date: "2025-07-14", type: "Withdrawal",  asset: "USDT",     amount: "-$200.00",  status: "Pending",   txHash: "0x3e2a…bb49" },
  { id: "tr6", date: "2025-07-13", type: "P/L Credit",  asset: "SOL/USDT", amount: "+$70.00",   status: "Completed", txHash: "0x6f1c…2d30" },
];

const TX_COLUMNS = [
  { key: "date",   header: "Date",   width: "110px" },
  { key: "type",   header: "Type",   width: "120px" },
  { key: "asset",  header: "Asset",  width: "100px" },
  { key: "amount", header: "Amount", width: "120px", align: "right" as const },
  {
    key: "status", header: "Status", width: "100px",
    cell: (r: Transaction) => {
      const tone: Record<Transaction["status"], string> = {
        Completed: "text-success",
        Pending:   "text-foreground",
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
          <button type="button" onClick={onClose} className="text-xs font-medium text-muted-foreground hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FundTradingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [amount, setAmount] = useState("");
  return (
    <Modal open={open} onClose={onClose} title="Fund Trading">
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Transfer funds from your Main Wallet to start or add to your trading balance.
        </p>
        <div>
          <label className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Amount (USDT)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="mt-1 w-full rounded-2xl border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <p className="text-[11px] text-muted-foreground">Main Wallet available: $12,480.32 · Instant</p>
        <button type="button" className="w-full rounded-2xl bg-foreground py-2.5 text-xs font-semibold text-background transition-opacity hover:opacity-90 outline-none focus-visible:ring-2 focus-visible:ring-ring">
          Fund Trading Wallet
        </button>
      </div>
    </Modal>
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

function FilterBar({ type, setType }: { type: string; setType: (v: string) => void }) {
  const types = ["All", "P/L Credit", "P/L Debit", "Deposit", "Withdrawal"];
  return (
    <div className="mb-4 flex flex-wrap items-center gap-1 rounded-2xl border border-border bg-card px-3 py-1.5 w-fit">
      <span className="text-[11px] font-medium text-muted-foreground mr-1">Type:</span>
      {types.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => setType(t)}
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            type === t ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function TradingWalletPage() {
  const { data, transfer } = useWalletData();
  const [fundOpen,     setFundOpen]     = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [typeFilter,   setTypeFilter]   = useState("All");

  const filtered = data.walletTransactions.trading.filter((t) => typeFilter === "All" || t.type === typeFilter);

  return (
    <UserShell active="Wallet">
      <div className="overflow-y-auto px-5 py-6 sm:px-7 sm:py-8 space-y-8">

        {/* ── Heading ───────────────────────────────────── */}
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Trading Wallet
          </h1>
        </div>

        {/* ── Balance Card ──────────────────────────────── */}
        <section aria-label="Wallet Balance">
          <div className="flex w-full flex-col items-start gap-4 p-2">
            <Card className="w-full">
              <div className="flex flex-col gap-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Trading Balance</p>
                    <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">{money(data.wallets.trading.balance)}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs font-medium text-success">
                      <ArrowUpRight className="size-3" />
                      {money(data.stats.trading.unrealizedPl, true)} unrealized P/L
                    </p>
                  </div>
                  <Badge label="Active" tone="success" />
                </div>

                {/* Unrealized balance indicator */}
                <div className="rounded-2xl bg-muted px-3 py-2.5 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground">Open Positions P/L</p>
                    <p className="text-sm font-semibold text-success">{money(data.stats.trading.unrealizedPl, true)}</p>
                  </div>
                  <Bot className="size-5 text-muted-foreground" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFundOpen(true)}
                    className="flex flex-col items-center gap-1.5 rounded-2xl bg-muted py-3 text-foreground transition-colors hover:bg-muted/70 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <ArrowDownRight className="size-4" />
                    <span className="text-[11px] font-semibold">Fund Trading</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransferOpen(true)}
                    className="flex flex-col items-center gap-1.5 rounded-2xl bg-muted py-3 text-foreground transition-colors hover:bg-muted/70 outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
        <section aria-label="Trading Stats">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total Deposited",    value: money(data.stats.trading.totalDeposited), delta: { value: "All time",    positive: true } },
              { label: "Realized P/L",       value: money(data.stats.trading.realizedPl, true),  delta: { value: "All time",    positive: true } },
              { label: "Unrealized P/L",     value: money(data.stats.trading.unrealizedPl, true),   delta: { value: "Open trades", positive: true } },
              { label: "Active Strategies",  value: String(data.stats.trading.activeStrategies || 0),          delta: { value: "Running",    positive: true } },
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

      <FundTradingModal open={fundOpen}     onClose={() => setFundOpen(false)} />
      <TransferModal    open={transferOpen} onClose={() => setTransferOpen(false)} accounts={data.accounts} onTransfer={transfer} />
    </UserShell>
  );
}
