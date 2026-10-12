// app/(user)/fund/deposit/page.tsx
"use client";

import { UserShell } from "@/app/(user)/_components/user-shell";
import { useCallback, useState, useEffect } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Copy,
  X,
  Wallet,
  Clock,
  AlertTriangle,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────
   Config — assets, networks, addresses
──────────────────────────────────────────────────────────── */

type Asset = "USDT" | "USDC";
type Network = "BEP20" | "ERC20" | "Aptos" | "Polygon_POS" | "Solana";

const ASSETS: { id: Asset; name: string; symbol: string }[] = [
  { id: "USDT", name: "Tether USD", symbol: "₮" },
  { id: "USDC", name: "USD Coin", symbol: "$" },
];

const ADDRESSES: Record<Asset, Record<Network, string>> = {
  USDT: {
    BEP20: "0xa73e4002d2bd14f11b6637934ca5ae9af7c7c0e7",
    ERC20: "0xa73e4002d2bd14f11b6637934ca5ae9af7c7c0e7",
    Aptos: "0xa73e4002d2bd14f11b6637934ca5ae9af7c7c0e7",
    Polygon_POS: "0xa73e4002d2bd14f11b6637934ca5ae9af7c7c0e7",
    Solana: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
  },
  USDC: {
    BEP20: "0xa73e4002d2bd14f11b6637934ca5ae9af7c7c0e7",
    ERC20: "0xa73e4002d2bd14f11b6637934ca5ae9af7c7c0e7",
    Aptos: "0xa73e4002d2bd14f11b6637934ca5ae9af7c7c0e7",
    Polygon_POS: "0xa73e4002d2bd14f11b6637934ca5ae9af7c7c0e7",
    Solana: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
  },
};

const QR_IMAGES: Record<Asset, Record<Network, string>> = {
  USDT: {
    BEP20: "/qr/usdt-bep20.png",
    ERC20: "/qr/usdt-erc20.png",
    Aptos: "/qr/usdt-aptos.png",
    Polygon_POS: "/qr/usdt-polygon.png",
    Solana: "/qr/usdt-solana.png",
  },
  USDC: {
    BEP20: "/qr/usdc-bep20.png",
    ERC20: "/qr/usdc-erc20.png",
    Aptos: "/qr/usdc-aptos.png",
    Polygon_POS: "/qr/usdc-polygon.png",
    Solana: "/qr/usdc-solana.png",
  },
};

const NET_INFO: Record<Network, { chain: string; desc: string }> = {
  BEP20: { chain: "BNB Smart Chain (BEP-20)", desc: "Low fees, fast confirmation" },
  ERC20: { chain: "Ethereum Network (ERC-20)", desc: "Most widely supported" },
  Aptos: { chain: "Aptos Network", desc: "High-speed Layer 1" },
  Polygon_POS: { chain: "Polygon (POS)", desc: "Low-cost Ethereum scaling" },
  Solana: { chain: "Solana Network", desc: "Ultra-fast transactions" },
};

interface DepState {
  amount: number;
  asset: Asset;
  network: Network | "";
  address: string;
}

interface DepHistory {
  id: string;
  date: string;
  amount: number;
  asset: string;
  network: string;
  status: "approved" | "pending" | "rejected";
  reason?: string;
}

/* TODO: Fetch from API */
const INITIAL_HISTORY: DepHistory[] = [];

/* ────────────────────────────────────────────────────────────
   Small UI primitives (b/w/gray, shadcn-style tokens)
──────────────────────────────────────────────────────────── */

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-4xl border border-border bg-card p-6 ${className}`}>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
      {children}
    </span>
  );
}

function StatusBadge({ status }: { status: DepHistory["status"] }) {
  const map: Record<DepHistory["status"], string> = {
    approved: "bg-foreground/10 text-foreground",
    pending: "bg-muted text-muted-foreground",
    rejected: "bg-foreground/5 text-muted-foreground line-through",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${map[status]}`}>
      {status}
    </span>
  );
}

/* ────────────────────────────────────────────────────────────
   Page
──────────────────────────────────────────────────────────── */

export default function DepositPage() {
  const [step, setStep] = useState(1);
  const [depState, setDepState] = useState<DepState>({
    amount: 0,
    asset: "USDT",
    network: "",
    address: "",
  });
  const [customAmt, setCustomAmt] = useState("");
  const [selectedChip, setSelectedChip] = useState<number | null>(null);
  const [txnId, setTxnId] = useState("");
  const [history, setHistory] = useState<DepHistory[]>(INITIAL_HISTORY);
  const [addrCopied, setAddrCopied] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalEntry, setModalEntry] = useState<DepHistory | null>(null);
  const [toast, setToast] = useState<{ msg: string; show: boolean }>({ msg: "", show: false });
  const [submitting, setSubmitting] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToast({ msg, show: true });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3000);
  }, []);

  const goToStep2 = () => {
    if (!depState.amount || depState.amount < 30) {
      showToast("Please enter a valid amount (min $30)");
      return;
    }
    setStep(2);
  };

  const goToStep3 = () => {
    if (!depState.network) {
      showToast("Please select a network");
      return;
    }
    const addr = ADDRESSES[depState.asset][depState.network as Network];
    setDepState((s) => ({ ...s, address: addr }));
    setAddrCopied(false);
    setStep(3);
  };

  const goToStep4 = () => setStep(4);

  const confirmDeposit = async () => {
    if (!txnId.trim() || txnId.trim().length < 10) {
      showToast("Please enter a valid transaction ID");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: depState.amount,
          coin: depState.asset,
          network: depState.network,
          transactionHash: txnId.trim(),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Submission failed");
      }

      // Refresh history
      fetchHistory();

      showToast("Deposit submitted — pending review");
      setDepState({ amount: 0, asset: "USDT", network: "", address: "" });
      setCustomAmt("");
      setTxnId("");
      setSelectedChip(null);
      setStep(1);
    } catch (err: any) {
      showToast(`Error: ${err.message || "Submission failed"}`);
    } finally {
      setSubmitting(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/deposits");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.deposits || []);
      }
    } catch (err) {
      console.error("Failed to fetch deposit history:", err);
    }
  };

  // Fetch history on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  const copyAddress = () => {
    if (!depState.address) return;
    navigator.clipboard?.writeText(depState.address).then(() => {
      setAddrCopied(true);
      showToast("Address copied");
      setTimeout(() => setAddrCopied(false), 2000);
    });
  };

  const stepLabels = ["Amount", "Network", "Payment", "Confirm"];
  const netMeta = depState.network ? NET_INFO[depState.network as Network] : null;

  return (
    <UserShell active="Deposit">
      <div className="relative overflow-y-auto px-5 py-6 sm:px-7 sm:py-8">
        {/* Toast */}
        {toast.show && (
          <div className="fixed right-6 top-6 z-[999] flex items-center gap-2 rounded-2xl border border-border bg-foreground px-4 py-3 text-sm font-medium text-background shadow-lg">
            <Check className="size-4" />
            {toast.msg}
          </div>
        )}

        <div className="mx-auto max-w-2xl space-y-6">
          {/* Header */}
          <div>
            <p className="text-xs font-medium text-muted-foreground">Transactions</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Make a Deposit
            </h1>
          </div>

          {/* Step indicator */}
          <div className="flex items-center">
            {stepLabels.map((lbl, i) => {
              const n = i + 1;
              const isDone = step > n;
              const isActive = step === n;
              return (
                <div key={n} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={[
                        "flex size-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                        isDone
                          ? "bg-foreground text-background"
                          : isActive
                          ? "border-2 border-foreground text-foreground"
                          : "border border-border text-muted-foreground",
                      ].join(" ")}
                    >
                      {isDone ? <Check className="size-3.5" /> : n}
                    </div>
                    <span
                      className={[
                        "text-[10px] font-medium uppercase tracking-wide",
                        isDone || isActive ? "text-foreground" : "text-muted-foreground",
                      ].join(" ")}
                    >
                      {lbl}
                    </span>
                  </div>
                  {n < 4 && (
                    <div
                      className={[
                        "mx-2 h-px flex-1 transition-colors",
                        step > n ? "bg-foreground" : "bg-border",
                      ].join(" ")}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* ── STEP 1: AMOUNT & ASSET ── */}
          {step === 1 && (
            <Card>
              <Label>Step 1 of 4</Label>
              <h2 className="mb-5 text-lg font-semibold text-foreground">Select Asset & Amount</h2>

              {/* Asset selector */}
              <div className="mb-5">
                <Label>Asset</Label>
                <div className="grid grid-cols-2 gap-2">
                  {ASSETS.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setDepState((s) => ({ ...s, asset: a.id, network: "" }))}
                      className={[
                        "flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors",
                        depState.asset === a.id
                          ? "border-foreground bg-foreground/5"
                          : "border-border hover:border-foreground/40",
                      ].join(" ")}
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-foreground">
                        {a.symbol}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground">{a.id}</div>
                        <div className="truncate text-xs text-muted-foreground">{a.name}</div>
                      </div>
                      {depState.asset === a.id && (
                        <Check className="ml-auto size-4 shrink-0 text-foreground" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick amounts */}
              <div className="mb-5">
                <Label>Quick Select</Label>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {[100, 250, 500, 1000, 2000, 5000].map((v) => (
                    <button
                      key={v}
                      onClick={() => {
                        setSelectedChip(v);
                        setCustomAmt(String(v));
                        setDepState((s) => ({ ...s, amount: v }));
                      }}
                      className={[
                        "flex flex-col items-center gap-0.5 rounded-2xl border p-3 transition-colors",
                        selectedChip === v
                          ? "border-foreground bg-foreground text-background"
                          : "border-border text-foreground hover:border-foreground/40",
                      ].join(" ")}
                    >
                      <span className="text-sm font-semibold">
                        ${v >= 1000 ? `${v / 1000}K` : v}
                      </span>
                      <span
                        className={[
                          "text-[10px] uppercase tracking-wide",
                          selectedChip === v ? "text-background/70" : "text-muted-foreground",
                        ].join(" ")}
                      >
                        {depState.asset}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom amount */}
              <div className="mb-5">
                <Label>Custom Amount ({depState.asset})</Label>
                <input
                  type="number"
                  min={30}
                  placeholder="Enter amount e.g. 750"
                  value={customAmt}
                  onChange={(e) => {
                    setCustomAmt(e.target.value);
                    const v = parseFloat(e.target.value) || 0;
                    setDepState((s) => ({ ...s, amount: v }));
                    setSelectedChip(null);
                  }}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground"
                />
                <p className="mt-1.5 text-xs text-muted-foreground">Minimum deposit: $30</p>
              </div>

              {/* Summary pill */}
              <div className="mb-5 flex items-center gap-3 rounded-2xl border border-border bg-muted/40 p-4">
                <div className="flex size-9 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
                  {ASSETS.find((a) => a.id === depState.asset)?.symbol}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">
                    {ASSETS.find((a) => a.id === depState.asset)?.name}
                  </div>
                  <div className="text-xs text-muted-foreground">Stablecoin · 1 {depState.asset} ≈ $1.00</div>
                </div>
                <div className="text-lg font-semibold text-foreground">
                  {depState.amount > 0 ? `$${depState.amount.toLocaleString()}` : "—"}
                </div>
              </div>

              <button
                onClick={goToStep2}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
              >
                Continue <ArrowRight className="size-4" />
              </button>
            </Card>
          )}

          {/* ── STEP 2: NETWORK ── */}
          {step === 2 && (
            <Card>
              <button
                onClick={() => setStep(1)}
                className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="size-3.5" /> Back
              </button>
              <Label>Step 2 of 4</Label>
              <h2 className="mb-5 text-lg font-semibold text-foreground">Select Network</h2>

              <div className="mb-5 flex flex-col gap-2.5">
                {(Object.keys(NET_INFO) as Network[]).map((net) => {
                  const meta = NET_INFO[net];
                  const isSelected = depState.network === net;
                  const displayName = net === "Polygon_POS" ? "Polygon POS" : net;
                  return (
                    <button
                      key={net}
                      onClick={() => setDepState((s) => ({ ...s, network: net }))}
                      className={[
                        "flex items-center gap-3 rounded-2xl border p-4 text-left transition-colors",
                        isSelected
                          ? "border-foreground bg-foreground/5"
                          : "border-border hover:border-foreground/40",
                      ].join(" ")}
                    >
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted">
                        <Wallet className="size-5 text-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">{displayName}</span>
                        </div>
                        <div className="text-xs font-medium text-muted-foreground">{meta.chain}</div>
                        <div className="text-xs text-muted-foreground">{meta.desc}</div>
                      </div>
                      {isSelected ? (
                        <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                          <Check className="size-3.5" />
                        </div>
                      ) : (
                        <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Free
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {!depState.network && (
                <div className="mb-4 rounded-2xl border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                  Select a network above to continue
                </div>
              )}

              <button
                onClick={goToStep3}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
              >
                Continue <ArrowRight className="size-4" />
              </button>
            </Card>
          )}

          {/* ── STEP 3: PAYMENT ── */}
          {step === 3 && (
            <Card>
              <button
                onClick={() => setStep(2)}
                className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="size-3.5" /> Back
              </button>
              <Label>Step 3 of 4</Label>
              <h2 className="mb-1 text-lg font-semibold text-foreground">Send Payment</h2>
              {netMeta && (
                <p className="mb-5 text-xs text-muted-foreground">
                  Sending <strong className="text-foreground">{depState.asset}</strong> via{" "}
                  <strong className="text-foreground">{depState.network}</strong> · {netMeta.chain}
                </p>
              )}

              <div className="mb-5 grid gap-5 sm:grid-cols-[160px_1fr]">
                {/* QR */}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex size-[160px] items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted/40">
                    <img
                      src={QR_IMAGES[depState.asset][depState.network as Network]}
                      alt={`QR code for ${depState.asset} ${depState.network} deposit`}
                      className="size-full object-cover"
                    />
                  </div>
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Scan to pay</span>
                </div>

                {/* Address + summary */}
                <div className="flex flex-col gap-4">
                  <div>
                    <Label>Deposit Address</Label>
                    <div className="flex items-center gap-2 rounded-2xl border border-border bg-muted/30 p-3">
                      <span className="flex-1 truncate font-mono text-xs text-foreground">
                        {depState.address}
                      </span>
                      <button
                        onClick={copyAddress}
                        className={[
                          "flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors",
                          addrCopied
                            ? "bg-foreground text-background"
                            : "bg-muted text-foreground hover:bg-muted/70",
                        ].join(" ")}
                      >
                        {addrCopied ? <Check className="size-3" /> : <Copy className="size-3" />}
                        {addrCopied ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border p-3">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">You Send</span>
                      <span className="text-sm font-semibold text-foreground">
                        {depState.amount} {depState.asset}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-border py-2">
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Network Fee</span>
                      <span className="text-sm font-medium text-foreground">Free</span>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">You Receive</span>
                      <span className="text-sm font-semibold text-foreground">
                        {depState.amount} {depState.asset}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-5 flex items-start gap-2 rounded-2xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  Only send <strong className="text-foreground">{depState.asset}</strong> using the{" "}
                  <strong className="text-foreground">{depState.network}</strong> network. Sending other assets or
                  using the wrong network will result in permanent loss.
                </span>
              </div>

              <button
                onClick={goToStep4}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
              >
                I&apos;ve Sent the Payment <ArrowRight className="size-4" />
              </button>
            </Card>
          )}

          {/* ── STEP 4: CONFIRM ── */}
          {step === 4 && (
            <Card>
              <button
                onClick={() => setStep(3)}
                className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="size-3.5" /> Back
              </button>
              <Label>Step 4 of 4</Label>
              <h2 className="mb-2 text-lg font-semibold text-foreground">Confirm & Submit</h2>
              <p className="mb-5 text-sm text-muted-foreground">
                Enter the blockchain transaction ID to complete your deposit request.
              </p>

              <div className="mb-5">
                <Label>Transaction ID / Hash</Label>
                <input
                  type="text"
                  placeholder="e.g. 0xabcd1234…ef56 or TXN hash"
                  value={txnId}
                  onChange={(e) => setTxnId(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground"
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Copy the transaction hash from your wallet or exchange after sending.
                </p>
              </div>

              <div className="mb-5 rounded-2xl border border-border p-4">
                {[
                  ["Asset", depState.asset],
                  ["Amount", `${depState.amount} ${depState.asset}`],
                  ["Network", depState.network],
                  ["To Receive", `${depState.amount} ${depState.asset}`],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between border-b border-border py-2 last:border-none">
                    <span className="text-xs text-muted-foreground">{k}</span>
                    <span className="text-sm font-medium text-foreground">{v}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={confirmDeposit}
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                <Check className="size-4" /> {submitting ? "Submitting…" : "Confirm Deposit"}
              </button>
            </Card>
          )}

          {/* ── DEPOSIT HISTORY ── */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Deposit History</h2>
            </div>
            <div className="flex flex-col gap-2">
              {history.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
                  No deposit records yet.
                </div>
              ) : (
                history.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between rounded-2xl border border-border p-3.5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                        {d.status === "approved" ? (
                          <Check className="size-4 text-foreground" />
                        ) : d.status === "rejected" ? (
                          <X className="size-4 text-muted-foreground" />
                        ) : (
                          <Clock className="size-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs text-foreground">
                            {d.id.slice(0, 8).toUpperCase()}
                          </span>
                          <StatusBadge status={d.status} />
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {d.date} · {d.network}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-sm font-semibold text-foreground">
                        +{d.amount.toLocaleString()} {d.asset}
                      </div>
                      <button
                        onClick={() => {
                          setModalEntry(d);
                          setModalOpen(true);
                        }}
                        className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
                      >
                        View →
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Transaction detail modal */}
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
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Transaction</p>
                  <h3 className="text-lg font-semibold text-foreground">Deposit Details</h3>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/70"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="mb-4 rounded-2xl border border-border p-4">
                {[
                  ["Transaction ID", modalEntry.id],
                  ["Date", modalEntry.date],
                  ["Amount Sent", `${modalEntry.amount} ${modalEntry.asset}`],
                  ["Network Fee", "Free"],
                  ["Amount Received", `${modalEntry.amount} ${modalEntry.asset}`],
                  ["Network", modalEntry.network],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between border-b border-border py-2 last:border-none">
                    <span className="text-xs text-muted-foreground">{k}</span>
                    <span className="max-w-[200px] truncate text-right text-sm font-medium text-foreground">{v}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <StatusBadge status={modalEntry.status} />
                </div>
              </div>

              {modalEntry.status === "rejected" && modalEntry.reason && (
                <div className="mb-4 rounded-2xl border border-border bg-muted/30 p-4">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Rejection Reason
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