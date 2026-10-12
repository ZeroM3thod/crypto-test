// app/(user)/fund/send/page.tsx
"use client";

import { UserShell } from "@/app/(user)/_components/user-shell";
import { useState, useEffect } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Mail,
  Hash,
  Wallet,
  X,
  Send as SendIcon,
  User as UserIcon,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────
   Types
──────────────────────────────────────────────────────────── */

type LookupType = "email" | "userId" | "wallet";

interface Recipient {
  id: string;
  name: string;
  email: string;
  handle: string; // email, id, or wallet — whatever was searched
  lookupType: LookupType;
  avatarInitials: string;
  verified: boolean;
}

interface SendHistory {
  id: string;
  date: string;
  recipientName: string;
  recipientHandle: string;
  amount: number;
  fee: number;
  total: number;
  status: "completed" | "pending" | "failed";
  note?: string;
}

interface CompletedTxn extends SendHistory {
  senderPaid: number;
}

const SEND_FEE = 0.1; // flat $0.10, added on top

/* ────────────────────────────────────────────────────────────
   Small UI primitives (b/w/gray)
──────────────────────────────────────────────────────────── */

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-4xl border border-border bg-card p-6 ${className}`}>
      {children}
    </div>
  );
}

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-1.5 flex items-baseline gap-2">
      <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {children}
      </span>
      {hint && <span className="text-[11px] normal-case tracking-normal text-muted-foreground/70">{hint}</span>}
    </div>
  );
}

function StatusBadge({ status }: { status: SendHistory["status"] }) {
  const map: Record<SendHistory["status"], string> = {
    completed: "bg-foreground/10 text-foreground",
    pending: "bg-muted text-muted-foreground",
    failed: "bg-foreground/5 text-muted-foreground line-through",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${map[status]}`}>
      {status}
    </span>
  );
}

const LOOKUP_TABS: { id: LookupType; label: string; icon: typeof Mail; placeholder: string }[] = [
  { id: "email", label: "Email", icon: Mail, placeholder: "e.g. jane@doe.com" },
  { id: "userId", label: "User ID", icon: Hash, placeholder: "e.g. USR10234" },
  { id: "wallet", label: "Wallet Address", icon: Wallet, placeholder: "e.g. 0xA73e...c0e7" },
];

/* ────────────────────────────────────────────────────────────
   Page
──────────────────────────────────────────────────────────── */

export default function SendPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: find recipient, 2: amount, 3: success
  const [lookupType, setLookupType] = useState<LookupType>("email");
  const [lookupValue, setLookupValue] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [searching, setSearching] = useState(false);
  const [recipient, setRecipient] = useState<Recipient | null>(null);

  const [amount, setAmount] = useState("");
  const [selectedChip, setSelectedChip] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  const [completedTxn, setCompletedTxn] = useState<CompletedTxn | null>(null);
  const [history, setHistory] = useState<SendHistory[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalEntry, setModalEntry] = useState<SendHistory | null>(null);
  const [toast, setToast] = useState<{ msg: string; show: boolean }>({ msg: "", show: false });
  const [copied, setCopied] = useState(false);

  const [availableBalance, setAvailableBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch balance and history on mount
  useEffect(() => {
    fetch("/api/fund/send-history")
      .then((res) => res.json())
      .then((data) => {
        setAvailableBalance(data.balance || 0);
        setHistory(data.history || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const showToast = (msg: string) => {
    setToast({ msg, show: true });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3000);
  };

  const activeTab = LOOKUP_TABS.find((t) => t.id === lookupType)!;

  const findRecipient = async () => {
    const val = lookupValue.trim();
    setLookupError("");
    if (!val) {
      setLookupError(`Please enter a ${activeTab.label.toLowerCase()}`);
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(`/api/fund/lookup?type=${lookupType}&q=${encodeURIComponent(val)}`);
      const data = await res.json();
      
      setSearching(false);

      if (!res.ok || !data.found) {
        setLookupError(data.message || "No user found with that " + activeTab.label.toLowerCase() + ". Please check and try again.");
        return;
      }

      const rec = data.recipient;
      setRecipient({
        id: rec.id,
        name: rec.name,
        email: rec.email,
        handle: rec.handle,
        lookupType: rec.lookupType,
        avatarInitials: rec.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase(),
        verified: true,
      });
      setStep(2);
    } catch (err: any) {
      setSearching(false);
      setLookupError("Error looking up user. Please try again.");
    }
  };

  const parsedAmt = parseFloat(amount) || 0;
  const total = parsedAmt > 0 ? +(parsedAmt + SEND_FEE).toFixed(2) : 0;

  const selectAmt = (v: number) => {
    setSelectedChip(v);
    setAmount(String(v));
  };

  const onAmtChange = (v: string) => {
    setAmount(v);
    setSelectedChip(null);
  };

  const confirmSend = async () => {
    if (!recipient) return;
    if (!parsedAmt || parsedAmt < 1) {
      showToast("Please enter a valid amount (min $1)");
      return;
    }
    if (total > availableBalance) {
      showToast(`Insufficient balance. You need $${total.toFixed(2)} (incl. $${SEND_FEE.toFixed(2)} fee).`);
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/fund/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: recipient.id,
          amount: parsedAmt,
          note: note.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Transfer failed");
      }

      const newEntry: SendHistory = {
        id: data.transactionId,
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        recipientName: data.recipientName,
        recipientHandle: recipient.handle,
        amount: parsedAmt,
        fee: SEND_FEE,
        total,
        status: "completed",
        note: note.trim() || undefined,
      };

      setHistory((prev) => [newEntry, ...prev]);
      setCompletedTxn({ ...newEntry, senderPaid: total });
      setAvailableBalance((prev) => prev - total);
      setStep(3);
    } catch (err: any) {
      showToast(`Error: ${err.message || "Transfer failed"}`);
    } finally {
      setSending(false);
    }
  };

  const resetFlow = () => {
    setStep(1);
    setLookupType("email");
    setLookupValue("");
    setLookupError("");
    setRecipient(null);
    setAmount("");
    setSelectedChip(null);
    setNote("");
    setCompletedTxn(null);
  };

  const copyTxnId = () => {
    if (!completedTxn) return;
    navigator.clipboard?.writeText(completedTxn.id).then(() => {
      setCopied(true);
      showToast("Transaction ID copied");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const stepLabels = ["Recipient", "Amount", "Done"];

  if (loading) {
    return (
      <UserShell active="Send">
        <div className="flex h-full items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </UserShell>
    );
  }

  return (
    <UserShell active="Send">
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
              Send Money
            </h1>
          </div>

          {/* BALANCE CARD */}
          <div className="rounded-4xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Main Wallet Balance
                </div>
                <div className="mt-1.5 text-3xl font-semibold tracking-tight text-foreground">
                  ${availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">Available to send</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Fee</div>
                <div className="mt-1.5 text-sm text-foreground">${SEND_FEE.toFixed(2)} flat</div>
                <div className="mt-0.5 text-xs text-muted-foreground">Per transaction</div>
              </div>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center">
            {stepLabels.map((lbl, i) => {
              const n = (i + 1) as 1 | 2 | 3;
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
                  {n < 3 && (
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

          {/* ── STEP 1: FIND RECIPIENT ── */}
          {step === 1 && (
            <Card>
              <FieldLabel>Step 1 of 3</FieldLabel>
              <h2 className="mb-5 text-lg font-semibold text-foreground">Find Recipient</h2>

              {/* Tabs */}
              <div className="mb-4 grid grid-cols-3 gap-2">
                {LOOKUP_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = lookupType === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setLookupType(tab.id);
                        setLookupValue("");
                        setLookupError("");
                      }}
                      className={[
                        "flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-center transition-colors",
                        isActive
                          ? "border-foreground bg-foreground/5"
                          : "border-border hover:border-foreground/40",
                      ].join(" ")}
                    >
                      <Icon className={`size-4 ${isActive ? "text-foreground" : "text-muted-foreground"}`} />
                      <span
                        className={`text-[11px] font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}
                      >
                        {tab.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mb-2">
                <FieldLabel>{activeTab.label}</FieldLabel>
                <input
                  type="text"
                  placeholder={activeTab.placeholder}
                  value={lookupValue}
                  onChange={(e) => {
                    setLookupValue(e.target.value);
                    setLookupError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && findRecipient()}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground"
                />
              </div>

              {lookupError && (
                <div className="mb-4 flex items-start gap-2 rounded-2xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                  <span>{lookupError}</span>
                </div>
              )}

              <button
                onClick={findRecipient}
                disabled={searching}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {searching ? "Searching…" : "Find Recipient"} <ArrowRight className="size-4" />
              </button>
            </Card>
          )}

          {/* ── STEP 2: RECIPIENT CONFIRM + AMOUNT ── */}
          {step === 2 && recipient && (
            <Card>
              <button
                onClick={() => {
                  setStep(1);
                  setRecipient(null);
                }}
                className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="size-3.5" /> Back
              </button>
              <FieldLabel>Step 2 of 3</FieldLabel>
              <h2 className="mb-5 text-lg font-semibold text-foreground">Confirm Recipient & Amount</h2>

              {/* Recipient confirmation card */}
              <div className="mb-5 flex items-center gap-3 rounded-2xl border border-foreground bg-foreground/5 p-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background">
                  {recipient.avatarInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{recipient.name}</span>
                    {recipient.verified && <Check className="size-3.5 text-foreground" />}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">{recipient.handle}</div>
                </div>
                <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {LOOKUP_TABS.find((t) => t.id === recipient.lookupType)?.label}
                </span>
              </div>

              {/* Quick amounts */}
              <div className="mb-4">
                <FieldLabel>Quick Select</FieldLabel>
                <div className="grid grid-cols-4 gap-2">
                  {[25, 50, 100, 250].map((v) => {
                    const disabled = v + SEND_FEE > availableBalance;
                    return (
                      <button
                        key={v}
                        onClick={() => selectAmt(v)}
                        disabled={disabled}
                        className={[
                          "rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                          disabled
                            ? "cursor-not-allowed border-border text-muted-foreground opacity-40"
                            : selectedChip === v
                            ? "border-foreground bg-foreground text-background"
                            : "border-border text-foreground hover:border-foreground/40",
                        ].join(" ")}
                      >
                        ${v}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount input */}
              <div className="mb-5">
                <FieldLabel>Amount (USD)</FieldLabel>
                <input
                  type="number"
                  min={1}
                  placeholder="Enter amount e.g. 50"
                  value={amount}
                  onChange={(e) => onAmtChange(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground"
                />
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>Minimum: $1</span>
                  <span>
                    Balance:{" "}
                    <strong className="font-semibold text-foreground">
                      ${availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Note */}
              <div className="mb-5">
                <FieldLabel hint="(optional)">Note</FieldLabel>
                <input
                  type="text"
                  placeholder="What's this for?"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground"
                />
              </div>

              {/* Summary */}
              <div className="mb-5 rounded-2xl border border-border p-4">
                <div className="flex items-center justify-between border-b border-border py-2 first:pt-0">
                  <span className="text-xs text-muted-foreground">Sending</span>
                  <span className="text-sm font-medium text-foreground">
                    {amount ? `$${parsedAmt.toFixed(2)}` : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-border py-2">
                  <span className="text-xs text-muted-foreground">Transaction Fee</span>
                  <span className="text-sm font-medium text-foreground">+ ${SEND_FEE.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground">Total Deducted</span>
                  <span className="text-sm font-semibold text-foreground">
                    {amount ? `$${total.toFixed(2)}` : "—"}
                  </span>
                </div>
              </div>

              <div className="mb-5 flex items-start gap-2 rounded-2xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  Double-check the recipient before sending. A flat ${SEND_FEE.toFixed(2)} fee applies to every
                  transfer, and transfers cannot be reversed once completed.
                </span>
              </div>

              <button
                onClick={confirmSend}
                disabled={sending}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                <SendIcon className="size-4" /> {sending ? "Sending…" : "Send Money"}
              </button>
            </Card>
          )}

          {/* ── STEP 3: SUCCESS / FULL DETAILS ── */}
          {step === 3 && completedTxn && (
            <Card>
              <div className="mb-5 flex flex-col items-center text-center">
                <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-foreground text-background">
                  <Check className="size-6" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Transfer Successful</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  You sent ${completedTxn.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} to{" "}
                  {completedTxn.recipientName}
                </p>
              </div>

              {/* Transaction ID row */}
              <div className="mb-4 flex items-center gap-2 rounded-2xl border border-border bg-muted/30 p-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Transaction ID</div>
                  <div className="truncate font-mono text-sm text-foreground">{completedTxn.id}</div>
                </div>
                <button
                  onClick={copyTxnId}
                  className={[
                    "flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors",
                    copied ? "bg-foreground text-background" : "bg-muted text-foreground hover:bg-muted/70",
                  ].join(" ")}
                >
                  {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>

              {/* Full detail breakdown */}
              <div className="mb-5 rounded-2xl border border-border p-4">
                <div className="flex items-center justify-between border-b border-border py-2 first:pt-0">
                  <span className="text-xs text-muted-foreground">Date</span>
                  <span className="text-sm font-medium text-foreground">{completedTxn.date}</span>
                </div>
                <div className="flex items-center justify-between border-b border-border py-2">
                  <span className="text-xs text-muted-foreground">Recipient</span>
                  <span className="text-sm font-medium text-foreground">{completedTxn.recipientName}</span>
                </div>
                <div className="flex items-center justify-between border-b border-border py-2">
                  <span className="text-xs text-muted-foreground">Recipient Handle</span>
                  <span className="max-w-[200px] truncate text-right text-sm font-medium text-foreground">
                    {completedTxn.recipientHandle}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-border py-2">
                  <span className="text-xs text-muted-foreground">Amount Sent</span>
                  <span className="text-sm font-medium text-foreground">
                    ${completedTxn.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-border py-2">
                  <span className="text-xs text-muted-foreground">Transaction Fee</span>
                  <span className="text-sm font-medium text-foreground">+ ${completedTxn.fee.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between border-b border-border py-2">
                  <span className="text-xs text-muted-foreground">Total Paid</span>
                  <span className="text-sm font-semibold text-foreground">
                    ${completedTxn.senderPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className={`flex items-center justify-between py-2 ${completedTxn.note ? "border-b border-border" : ""}`}>
                  <span className="text-xs text-muted-foreground">Status</span>
                  <StatusBadge status={completedTxn.status} />
                </div>
                {completedTxn.note && (
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-muted-foreground">Note</span>
                    <span className="max-w-[200px] truncate text-right text-sm font-medium italic text-foreground">
                      {completedTxn.note}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={resetFlow}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
              >
                Send Another →
              </button>
            </Card>
          )}

          {/* ── TRANSACTION HISTORY ── */}
          <div>
            <h2 className="mb-4 text-sm font-semibold text-foreground">Previous Transactions</h2>
            <div className="flex flex-col gap-2">
              {history.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
                  No transactions yet.
                </div>
              ) : (
                history.map((h) => (
                  <div key={h.id} className="flex items-center justify-between rounded-2xl border border-border p-3.5">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                        {h.status === "completed" ? (
                          <Check className="size-4 text-foreground" />
                        ) : h.status === "failed" ? (
                          <X className="size-4 text-muted-foreground" />
                        ) : (
                          <UserIcon className="size-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{h.recipientName}</span>
                          <StatusBadge status={h.status} />
                        </div>
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">
                          {h.date} · {h.recipientHandle}
                          {h.note && <span className="ml-1.5 italic text-muted-foreground/80">· "{h.note}"</span>}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-sm font-semibold text-foreground">
                        −${h.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <button
                        onClick={() => {
                          setModalEntry(h);
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

        {/* DETAIL MODAL (history entries) */}
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
                  <h3 className="text-lg font-semibold text-foreground">Send Details</h3>
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
                  ["Recipient", modalEntry.recipientName],
                  ["Recipient Handle", modalEntry.recipientHandle],
                  ["Amount Sent", `$${modalEntry.amount.toFixed(2)}`],
                  ["Transaction Fee", `+ $${modalEntry.fee.toFixed(2)}`],
                  ["Total Paid", `$${modalEntry.total.toFixed(2)}`],
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
                {modalEntry.note && (
                  <div className="flex items-center justify-between border-t border-border pt-2">
                    <span className="text-xs text-muted-foreground">Note</span>
                    <span className="max-w-[200px] truncate text-right text-sm font-medium italic text-foreground">
                      {modalEntry.note}
                    </span>
                  </div>
                )}
              </div>

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