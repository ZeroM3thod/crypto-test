// app/(user)/wallet/main/page.tsx
"use client";

import { UserShell } from "@/app/(user)/_components/user-shell";
import { useRouter } from "next/navigation";
import {
  ArrowDownRight,
  ArrowUpRight,
  Copy,
  QrCode,
  ArrowLeftRight,
  Download,
  Upload,
  Check,
  Send,
} from "lucide-react";
import { useState } from "react";
import { Table } from "@/components/motion/table";
import { AccountTransfer } from "@/components/motion/account-transfer";
import { money, useWalletData } from "../use-wallet-data";

// ── Shared primitives ────────────────────────────────────────────────────────

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-4xl border border-border bg-card p-6 ${className}`}>
      {children}
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-muted text-muted-foreground">
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

// ── Wallet-specific data ─────────────────────────────────────────────────────

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
  { id: "t1", date: "2025-07-18", type: "Deposit",    asset: "USDT", amount: "+$500.00",   status: "Completed", txHash: "0x4f3a…c91e" },
  { id: "t2", date: "2025-07-17", type: "Withdrawal", asset: "USDT", amount: "-$200.00",   status: "Completed", txHash: "0x8b2d…f04c" },
  { id: "t3", date: "2025-07-16", type: "Deposit",    asset: "BTC",  amount: "+$1,000.00", status: "Completed", txHash: "0x1c7e…a83b" },
  { id: "t4", date: "2025-07-15", type: "Transfer",   asset: "ETH",  amount: "-$150.00",   status: "Pending",   txHash: "0x9d5f…7721" },
  { id: "t5", date: "2025-07-14", type: "Deposit",    asset: "USDT", amount: "+$250.00",   status: "Completed", txHash: "0x3e2a…bb49" },
  { id: "t6", date: "2025-07-13", type: "Withdrawal", asset: "BTC",  amount: "-$80.00",    status: "Failed",    txHash: "0x6f1c…2d30" },
  { id: "t7", date: "2025-07-12", type: "Transfer",   asset: "USDT", amount: "-$300.00",   status: "Completed", txHash: "0x2a1b…9e4f" },
  { id: "t8", date: "2025-07-11", type: "Deposit",    asset: "ETH",  amount: "+$750.00",   status: "Completed", txHash: "0x7c3d…1a82" },
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

// ── Filter bar — same style as Daily Profit page ─────────────────────────────

function FilterBar({
  type, setType, status, setStatus,
}: {
  type: string; setType: (v: string) => void;
  status: string; setStatus: (v: string) => void;
}) {
  const types    = ["All", "Deposit", "Withdrawal", "Transfer"];
  const statuses = ["All", "Completed", "Pending", "Failed"];

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {/* Type filter */}
      <div className="flex items-center rounded-xl bg-muted p-1 gap-1">
        <span className="text-[11px] font-medium text-muted-foreground px-1.5">Type</span>
        {types.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              type === t
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex items-center rounded-xl bg-muted p-1 gap-1">
        <span className="text-[11px] font-medium text-muted-foreground px-1.5">Status</span>
        {statuses.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              status === s
                ? "bg-background text-foreground shadow-sm"
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

// ── Modals ───────────────────────────────────────────────────────────────────

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
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-medium text-muted-foreground hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function DepositModal({ open, onClose, address }: { open: boolean; onClose: () => void; address: string }) {
  return (
    <Modal open={open} onClose={onClose} title="Deposit">
      <div className="space-y-4">
        <div className="rounded-2xl bg-muted p-4 text-center">
          <img className="mx-auto mb-3 size-24 rounded-2xl border border-border bg-card" alt="Wallet QR code" src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(address)}`} />
          <p className="text-[11px] font-medium text-muted-foreground mb-1">Wallet Address</p>
          <p className="font-mono text-xs text-foreground break-all">{address}</p>
        </div>
        <p className="text-[11px] text-muted-foreground text-center">
          Send only USDT (TRC-20 / ERC-20) to this address. Other assets may be lost.
        </p>
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

// ── Wallet Balance Card ──────────────────────────────────────────────────────

function WalletBalanceCard({
  balance,
  address,
  change24h,
  onDeposit,
  onWithdraw,
  onTransfer,
  onSend,
}: {
  balance: number;
  address: string;
  change24h: number;
  onDeposit: () => void;
  onWithdraw: () => void;
  onTransfer: () => void;
  onSend: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(address).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const positive = change24h >= 0;

  return (
    <Card className="w-full">
      <div className="flex flex-col gap-5">
        {/* Balance */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Main Wallet Balance</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
              ${balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className={`mt-1 flex items-center gap-1 text-xs font-medium ${positive ? "text-success" : "text-destructive"}`}>
              {positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
              {positive ? "+" : ""}{change24h.toFixed(2)} USDT today
            </p>
          </div>
          <Badge label="USDT" />
        </div>

        {/* Address */}
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-muted px-3 py-2">
          <span className="font-mono text-xs text-muted-foreground flex-1 break-all">{address}</span>
          <button
            type="button"
            onClick={handleCopy}
            className="grid size-7 place-items-center rounded-xl bg-card text-muted-foreground transition-colors hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            title="Copy address"
          >
            {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
          </button>
          <button
            type="button"
            className="grid size-7 place-items-center rounded-xl bg-card text-muted-foreground transition-colors hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            title="Show QR code"
          >
            <QrCode className="size-3.5" />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Deposit",  icon: <Download className="size-4" />,       action: onDeposit  },
            { label: "Withdraw", icon: <Upload className="size-4" />,         action: onWithdraw },
            { label: "Transfer", icon: <ArrowLeftRight className="size-4" />, action: onTransfer },
            { label: "Send",     icon: <Send className="size-4" />,           action: onSend     },
          ].map(({ label, icon, action }) => (
            <button
              key={label}
              type="button"
              onClick={action}
              className="flex flex-col items-center gap-1.5 rounded-2xl bg-muted py-3 text-foreground transition-colors hover:bg-muted/70 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {icon}
              <span className="text-[11px] font-semibold">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function MainWalletPage() {
  const router = useRouter();
  const { data, transfer } = useWalletData();
  const [depositOpen, setDepositOpen]   = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  const [typeFilter,   setTypeFilter]   = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const filtered = data.walletTransactions.main.filter((t) => {
    if (typeFilter   !== "All" && t.type   !== typeFilter)   return false;
    if (statusFilter !== "All" && t.status !== statusFilter) return false;
    return true;
  });

  return (
    <UserShell active="Wallet">
      <div className="overflow-y-auto px-5 py-6 sm:px-7 sm:py-8 space-y-8">

        {/* ── Heading ─────────────────────────────────── */}
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Main Wallet
          </h1>
        </div>

        {/* ── Balance Card ─────────────────────────────── */}
        <section aria-label="Wallet Balance">
          <div className="flex w-full flex-col items-start gap-4 p-2">
            <WalletBalanceCard
              balance={data.wallets.main.balance}
              address={data.mainAddress}
              change24h={data.stats.main.change24h || 0}
              onDeposit={() => router.push("/fund/deposit")}
              onWithdraw={() => router.push("/fund/withdraw")}
              onTransfer={() => setTransferOpen(true)}
              onSend={() => router.push("/fund/send")}
            />
          </div>
        </section>

        {/* ── Stats Row ────────────────────────────────── */}
        <section aria-label="Wallet Stats">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total Deposited",   value: money(data.stats.main.totalDeposited), delta: { value: "All time",      positive: true  } },
              { label: "Total Withdrawn",   value: money(data.stats.main.totalWithdrawn), delta: { value: "All time",      positive: false } },
              { label: "Total Transferred", value: money(data.stats.main.totalTransferred),  delta: { value: "All time",      positive: true  } },
              { label: "24h Change",         value: money(data.stats.main.change24h, true),   delta: { value: "vs yesterday",  positive: (data.stats.main.change24h || 0) >= 0  } },
            ].map((item) => (
              <Card key={item.label}>
                <Stat label={item.label} value={item.value} delta={item.delta} />
              </Card>
            ))}
          </div>
        </section>

        {/* ── Transaction History ──────────────────────── */}
        <section aria-label="Transaction History">
          <SectionHeader title="Transaction History" actionLabel="Export CSV" action={() => {}} />
          <FilterBar
            type={typeFilter}     setType={setTypeFilter}
            status={statusFilter} setStatus={setStatusFilter}
          />
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

      <DepositModal  open={depositOpen}  onClose={() => setDepositOpen(false)} address={data.mainAddress} />
      <TransferModal open={transferOpen} onClose={() => setTransferOpen(false)} accounts={data.accounts} onTransfer={transfer} />
    </UserShell>
  );
}
