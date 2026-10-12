// app/(user)/fund/history/page.tsx
"use client";

import { UserShell } from "@/app/(user)/_components/user-shell";
import { useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Send as SendIcon,
  Check,
  X,
  Clock,
  Wallet,
  ListFilter,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────
   Types
──────────────────────────────────────────────────────────── */

type TxnType = "deposit" | "withdrawal" | "send";
type TxnStatus = "approved" | "completed" | "pending" | "rejected" | "failed";

interface FundTxn {
  id: string;
  type: TxnType;
  date: string;
  amount: number;
  fee: number;
  net: number; // amount actually credited/debited from main balance
  coin: string;
  network?: string;
  counterparty?: string; // wallet address (deposit/withdraw) or recipient (send)
  status: TxnStatus;
  note?: string;
  reason?: string;
}

/* Placeholder data — replace with a real merged fetch from your API */
const ALL_HISTORY: FundTxn[] = [
  {
    id: "DEP-9C41A2",
    type: "deposit",
    date: "Jul 18, 2025",
    amount: 500,
    fee: 0,
    net: 500,
    coin: "USDT",
    network: "TRC-20",
    status: "approved",
  },
  {
    id: "SND-7A21F9",
    type: "send",
    date: "Jul 15, 2025",
    amount: 120,
    fee: 0.1,
    net: 120.1,
    coin: "USD",
    counterparty: "Jane Doe (jane@doe.com)",
    status: "completed",
  },
  {
    id: "WD-9F2A7C31",
    type: "withdrawal",
    date: "Jul 16, 2025",
    amount: 200,
    fee: 20,
    net: 180,
    coin: "USDT",
    network: "BEP-20",
    counterparty: "0xa73e40...c7c0e7",
    status: "approved",
  },
  {
    id: "DEP-B4E2F1",
    type: "deposit",
    date: "Jul 14, 2025",
    amount: 250,
    fee: 0,
    net: 250,
    coin: "USDC",
    network: "ERC-20",
    status: "pending",
  },
  {
    id: "SND-3B88C0",
    type: "send",
    date: "Jul 9, 2025",
    amount: 45,
    fee: 0.1,
    net: 45.1,
    coin: "USD",
    counterparty: "Michael Chen (USR10234)",
    status: "completed",
    note: "Split for dinner",
  },
  {
    id: "WD-4B8E1D02",
    type: "withdrawal",
    date: "Jul 11, 2025",
    amount: 75,
    fee: 7.5,
    net: 67.5,
    coin: "USDC",
    network: "BEP-20",
    counterparty: "0x91cd22...5f0a19",
    status: "pending",
    note: "Monthly cash-out",
  },
  {
    id: "DEP-A1C3E5",
    type: "deposit",
    date: "Jul 10, 2025",
    amount: 80,
    fee: 0,
    net: 80,
    coin: "USDT",
    network: "BEP-20",
    status: "rejected",
    reason: "Transaction hash could not be verified on-chain.",
  },
  {
    id: "SND-1F0E22",
    type: "send",
    date: "Jul 2, 2025",
    amount: 300,
    fee: 0.1,
    net: 300.1,
    coin: "USD",
    counterparty: "Amara Okafor (0xa73e40...c7c0e7)",
    status: "failed",
  },
  {
    id: "WD-1C5F9A44",
    type: "withdrawal",
    date: "Jul 3, 2025",
    amount: 40,
    fee: 4,
    net: 36,
    coin: "USDT",
    network: "BEP-20",
    counterparty: "0x77ab90...2e4b31",
    status: "rejected",
    reason: "Wallet address did not match verified profile records.",
  },
];

/* ────────────────────────────────────────────────────────────
   Config
──────────────────────────────────────────────────────────── */

type FilterTab = "all" | "deposit" | "withdrawal" | "send";

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "deposit", label: "Deposits" },
  { id: "withdrawal", label: "Withdrawals" },
  { id: "send", label: "Sends" },
];

const TYPE_META: Record<TxnType, { label: string; icon: typeof ArrowDownCircle; sign: "+" | "−" }> = {
  deposit: { label: "Deposit", icon: ArrowDownCircle, sign: "+" },
  withdrawal: { label: "Withdrawal", icon: ArrowUpCircle, sign: "−" },
  send: { label: "Send", icon: SendIcon, sign: "−" },
};

/* ────────────────────────────────────────────────────────────
   Small UI primitives (b/w/gray)
──────────────────────────────────────────────────────────── */

function StatusBadge({ status }: { status: TxnStatus }) {
  const map: Record<TxnStatus, string> = {
    approved: "bg-foreground/10 text-foreground",
    completed: "bg-foreground/10 text-foreground",
    pending: "bg-muted text-muted-foreground",
    rejected: "bg-foreground/5 text-muted-foreground line-through",
    failed: "bg-foreground/5 text-muted-foreground line-through",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${map[status]}`}>
      {status}
    </span>
  );
}

function StatusIcon({ status }: { status: TxnStatus }) {
  if (status === "approved" || status === "completed") return <Check className="size-4 text-foreground" />;
  if (status === "rejected" || status === "failed") return <X className="size-4 text-muted-foreground" />;
  return <Clock className="size-4 text-muted-foreground" />;
}

/* ────────────────────────────────────────────────────────────
   Page
──────────────────────────────────────────────────────────── */

export default function FundHistoryPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalEntry, setModalEntry] = useState<FundTxn | null>(null);

  const filtered = useMemo(() => {
    if (activeTab === "all") return ALL_HISTORY;
    return ALL_HISTORY.filter((t) => t.type === activeTab);
  }, [activeTab]);

  const stats = useMemo(() => {
    const deposited = ALL_HISTORY.filter((t) => t.type === "deposit" && t.status === "approved").reduce(
      (s, t) => s + t.amount,
      0
    );
    const withdrawn = ALL_HISTORY.filter((t) => t.type === "withdrawal" && t.status === "approved").reduce(
      (s, t) => s + t.amount,
      0
    );
    const sent = ALL_HISTORY.filter((t) => t.type === "send" && t.status === "completed").reduce(
      (s, t) => s + t.amount,
      0
    );
    return { deposited, withdrawn, sent };
  }, []);

  const counts = useMemo(() => {
    return {
      all: ALL_HISTORY.length,
      deposit: ALL_HISTORY.filter((t) => t.type === "deposit").length,
      withdrawal: ALL_HISTORY.filter((t) => t.type === "withdrawal").length,
      send: ALL_HISTORY.filter((t) => t.type === "send").length,
    };
  }, []);

  return (
    <UserShell active="Fund History">
      <div className="relative overflow-y-auto px-5 py-6 sm:px-7 sm:py-8">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Header */}
          <div>
            <p className="text-xs font-medium text-muted-foreground">Transactions</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Fund History
            </h1>
          </div>

          {/* SUMMARY CARD */}
          <div className="rounded-4xl border border-border bg-card p-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Deposited</div>
                <div className="mt-1.5 text-lg font-semibold tracking-tight text-success sm:text-xl">
                  ${stats.deposited.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Withdrawn</div>
                <div className="mt-1.5 text-lg font-semibold tracking-tight text-destructive sm:text-xl">
                  ${stats.withdrawn.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Sent</div>
                <div className="mt-1.5 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                  ${stats.sent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {FILTER_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={[
                    "flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-medium transition-colors",
                    isActive
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground",
                  ].join(" ")}
                >
                  {tab.label}
                  <span
                    className={[
                      "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                      isActive ? "bg-background/20 text-background" : "bg-muted text-muted-foreground",
                    ].join(" ")}
                  >
                    {counts[tab.id]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Transaction list */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                {FILTER_TABS.find((t) => t.id === activeTab)?.label} Records
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ListFilter className="size-3.5" />
                {filtered.length} {filtered.length === 1 ? "record" : "records"}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {filtered.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
                  No {activeTab === "all" ? "" : FILTER_TABS.find((t) => t.id === activeTab)?.label.toLowerCase() + " "}
                  records yet.
                </div>
              ) : (
                filtered.map((t) => {
                  const meta = TYPE_META[t.type];
                  const Icon = meta.icon;
                  return (
                    <div key={t.id} className="flex items-center justify-between rounded-2xl border border-border p-3.5">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                          <Icon className="size-4 text-foreground" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{meta.label}</span>
                            <StatusBadge status={t.status} />
                          </div>
                          <div className="mt-0.5 truncate text-xs text-muted-foreground">
                            {t.date} · {t.coin}
                            {t.network ? ` · ${t.network}` : ""}
                            {t.counterparty && <span className="ml-1">· {t.counterparty}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-sm font-semibold text-foreground">
                          {meta.sign}${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <button
                          onClick={() => {
                            setModalEntry(t);
                            setModalOpen(true);
                          }}
                          className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
                        >
                          View →
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* DETAIL MODAL */}
        {modalOpen && modalEntry && (
          <div
            className="fixed inset-0 z-[900] flex items-end justify-center bg-foreground/30 backdrop-blur-sm sm:items-center"
            onClick={(e) => {
              if (e.target === e.currentTarget) setModalOpen(false);
            }}
          >
            <div className="w-full max-w-md rounded-t-4xl border border-border bg-card p-6 sm:rounded-4xl">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {TYPE_META[modalEntry.type].label}
                  </p>
                  <h3 className="text-lg font-semibold text-foreground">Transaction Details</h3>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/70"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="mb-4 flex items-center gap-3 rounded-2xl border border-border bg-muted/30 p-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                  <StatusIcon status={modalEntry.status} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-xs text-foreground">{modalEntry.id}</div>
                  <div className="text-xs text-muted-foreground">{modalEntry.date}</div>
                </div>
                <StatusBadge status={modalEntry.status} />
              </div>

              <div className="mb-4 rounded-2xl border border-border p-4">
                <div className="flex items-center justify-between border-b border-border py-2 first:pt-0">
                  <span className="text-xs text-muted-foreground">Type</span>
                  <span className="text-sm font-medium text-foreground">{TYPE_META[modalEntry.type].label}</span>
                </div>
                <div className="flex items-center justify-between border-b border-border py-2">
                  <span className="text-xs text-muted-foreground">Amount</span>
                  <span className="text-sm font-medium text-foreground">
                    {modalEntry.amount.toFixed(2)} {modalEntry.coin}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-border py-2">
                  <span className="text-xs text-muted-foreground">Fee</span>
                  <span className="text-sm font-medium text-foreground">
                    {modalEntry.fee > 0 ? `${modalEntry.type === "deposit" ? "" : "+ "}$${modalEntry.fee.toFixed(2)}` : "Free"}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-border py-2">
                  <span className="text-xs text-muted-foreground">
                    {modalEntry.type === "deposit" ? "Amount Credited" : modalEntry.type === "withdrawal" ? "Amount Received" : "Total Deducted"}
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {modalEntry.net.toFixed(2)} {modalEntry.coin}
                  </span>
                </div>
                {modalEntry.network && (
                  <div className="flex items-center justify-between border-b border-border py-2">
                    <span className="text-xs text-muted-foreground">Network</span>
                    <span className="text-sm font-medium text-foreground">{modalEntry.network}</span>
                  </div>
                )}
                {modalEntry.counterparty && (
                  <div className={`flex items-center justify-between py-2 ${modalEntry.note ? "border-b border-border" : ""}`}>
                    <span className="text-xs text-muted-foreground">
                      {modalEntry.type === "deposit" ? "From" : modalEntry.type === "withdrawal" ? "To Wallet" : "Recipient"}
                    </span>
                    <span className="max-w-[200px] truncate text-right text-sm font-medium text-foreground">
                      {modalEntry.counterparty}
                    </span>
                  </div>
                )}
                {modalEntry.note && (
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-muted-foreground">Note</span>
                    <span className="max-w-[200px] truncate text-right text-sm font-medium italic text-foreground">
                      {modalEntry.note}
                    </span>
                  </div>
                )}
              </div>

              {(modalEntry.status === "rejected" || modalEntry.status === "failed") && modalEntry.reason && (
                <div className="mb-4 rounded-2xl border border-border bg-muted/30 p-4">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {modalEntry.status === "rejected" ? "Rejection Reason" : "Failure Reason"}
                  </p>
                  <p className="text-sm text-foreground">{modalEntry.reason}</p>
                </div>
              )}

              <button
                onClick={() => setModalOpen(false)}
                className="w-full rounded-2xl border border-border py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted/50"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </UserShell>
  );
}