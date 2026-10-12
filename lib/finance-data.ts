// lib/finance-data.ts
// MOCK DATA LAYER. Replace getDeposits()/getWithdrawals() with real DB calls.

export type ReqStatus = "pending" | "approved" | "rejected";

export type Deposit = {
  id: string;
  userId: string;
  userName: string;
  email: string;
  amount: number;
  currency: string;
  network: string;
  method: string;
  address: string; // deposit address the user paid to
  txHash: string;
  requestedAt: string;
  status: ReqStatus;
  rejectReason: string;
  reviewedAt: string;
  note: string; // internal admin note
};

export type Withdrawal = {
  id: string;
  userId: string;
  userName: string;
  email: string;
  amount: number;
  fee: number;
  currency: string;
  network: string;
  address: string; // destination address
  sourceWallet: string;
  requestedAt: string;
  status: ReqStatus;
  rejectReason: string;
  txHash: string; // filled after the payout is sent
  reviewedAt: string;
  note: string;
};

const FIRST = ["Ava", "Leo", "Mia", "Kai", "Zoe", "Eli", "Noa", "Ren", "Ivy", "Jude"];
const LAST = ["Cole", "Frost", "Vale", "Reyes", "Okafor", "Sato", "Lund", "Marsh", "Bose", "Quinn"];
const NETWORKS = ["TRC20", "ERC20", "BEP20", "BTC"];
const METHODS = ["Crypto Transfer", "Crypto Transfer", "Manual Payment"];

const pad = (n: number) => String(n).padStart(2, "0");
const pick = <T,>(arr: T[], n: number) => arr[Math.abs(n) % arr.length];
const stamp = (i: number, n: number) =>
  `2025-${pad(1 + ((i + n) % 12))}-${pad(1 + ((i * (n + 1)) % 28))} ${pad(8 + (i % 12))}:${pad((i * 7) % 60)}`;
const addr = (seed: number) =>
  "0x" +
  Array.from({ length: 8 }, (_, j) =>
    ((seed * (j + 3) * 2654435761) >>> 0).toString(16).padStart(5, "0").slice(0, 5),
  )
    .join("")
    .slice(0, 40);

function who(i: number) {
  const first = FIRST[i % FIRST.length];
  const last = LAST[(i * 7) % LAST.length];
  return {
    userId: `USR-${1000 + (i % 200)}`,
    userName: `${first} ${last}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@example.com`,
  };
}

const DEPOSITS: Deposit[] = Array.from({ length: 120 }, (_, i) => {
  const status = pick<ReqStatus>(["pending", "approved", "approved", "rejected", "pending"], i);
  return {
    id: `DEP-${20000 + i}`,
    ...who(i),
    amount: 50 + ((i * 137) % 4950),
    currency: "USDT",
    network: pick(NETWORKS, i),
    method: pick(METHODS, i),
    address: addr(i + 1),
    txHash: addr(i * 31 + 7),
    requestedAt: stamp(i, 1),
    status,
    rejectReason: status === "rejected" ? "Transaction not found on the network" : "",
    reviewedAt: status === "pending" ? "" : stamp(i, 2),
    note: "",
  };
});

const WITHDRAWALS: Withdrawal[] = Array.from({ length: 90 }, (_, i) => {
  const status = pick<ReqStatus>(["pending", "approved", "rejected", "approved", "pending"], i);
  const amount = 30 + ((i * 89) % 3000);
  return {
    id: `WDR-${30000 + i}`,
    ...who(i + 3),
    amount,
    fee: Math.round(amount * 0.02 * 100) / 100,
    currency: "USDT",
    network: pick(NETWORKS, i + 1),
    address: addr(i + 500),
    sourceWallet: pick(["Main Wallet", "Referral Wallet", "Mining Wallet"], i),
    requestedAt: stamp(i, 4),
    status,
    rejectReason: status === "rejected" ? "KYC not verified" : "",
    txHash: status === "approved" ? addr(i * 17 + 3) : "",
    reviewedAt: status === "pending" ? "" : stamp(i, 5),
    note: "",
  };
});

export const getDeposits = () => DEPOSITS;
export const getWithdrawals = () => WITHDRAWALS;
