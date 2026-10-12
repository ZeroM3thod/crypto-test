// lib/users-data.ts
// MOCK DATA LAYER. Replace getUsers()/getUser() with real DB calls.

export type Tx = {
  id: string;
  date: string;
  type: string;
  amount: number;
  status: string;
  hash: string;
};
export type WalletKey = "main" | "mining" | "investment" | "trading" | "referral";
// lockedBalance = non-withdrawable reward principal held in this wallet.
// Withdrawals may only use balance - lockedBalance; investing may use all of it.
// If that principal funded a plan, it is burned when the plan ends
// (see burnLockedPrincipal below).
export type Wallet = {
  address: string;
  balance: number;
  lockedBalance: number;
  transactions: Tx[];
};

export type ReferralMember = {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
  level: number;
  totalDeposit: number;
  balance: number;
};
export type Investment = {
  id: string;
  plan: string;
  amount: number;
  dailyRoi: number;
  startDate: string;
  endDate: string;
  earned: number;
  status: string;
};
export type AiStrategy = {
  id: string;
  name: string;
  pair: string;
  allocated: number;
  pnl: number;
  winRate: number;
  status: string;
};
export type ManualTrade = {
  id: string;
  date: string;
  pair: string;
  direction: string; // "long" | "short"
  size: number;
  entry: number;
  exit: number;
  pnl: number;
  status: string;
};
export type LoginRecord = {
  id: string;
  ip: string;
  device: string;
  browser: string;
  app: string;
  location: string;
  at: string;
  status: string;
};

/** Rewards can only be sent to these two wallets. */
export type RewardWallet = "main" | "investment";
export type RewardType = "withdrawable" | "non_withdrawable";

export type Reward = {
  id: string;
  title: string;
  description: string;
  amount: number;
  wallet: RewardWallet;
  type: RewardType;
  sentAt: string;
  sentBy: string;
  status: "credited";
};

export type DailyProfit = {
  id: string;
  investmentId: string;
  plan: string;
  date: string; // YYYY-MM-DD
  invested: number;
  roi: number; // daily ROI %
  profit: number;
  wallet: string; // where the profit was credited
  status: "credited" | "pending";
};

export type AiTrade = {
  id: string;
  strategyId: string;
  strategy: string;
  date: string;
  pair: string;
  direction: "long" | "short";
  size: number;
  entry: number;
  exit: number;
  pnl: number;
  status: string;
};

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  joinedAt: string;
  dob: string;
  country: string;
  walletAddress: string;
  kyc: {
    status: "verified" | "pending" | "rejected" | "not_submitted";
    documentType: string;
    documentNumber: string;
    submittedAt: string;
  };
  twoFA: boolean;
  referredBy: string; // user id, or "OWNER"
  status: "active" | "suspended";
  wallets: Record<WalletKey, Wallet>;
  referrals: ReferralMember[];
  investments: Investment[];
  aiStrategies: AiStrategy[];
  manualTrades: ManualTrade[];
  logins: LoginRecord[];
  rewards: Reward[];
  dailyProfits: DailyProfit[];
  aiTrades: AiTrade[];
};

export type UserRow = {
  id: string;
  name: string;
  email: string;
  country: string;
  joinedAt: string;
  kyc: User["kyc"]["status"];
  twoFA: boolean;
  status: User["status"];
  referredBy: string;
  totalBalance: number;
};

const FIRST = ["Ava", "Leo", "Mia", "Kai", "Zoe", "Eli", "Noa", "Ren", "Ivy", "Jude"];
const LAST = ["Cole", "Frost", "Vale", "Reyes", "Okafor", "Sato", "Lund", "Marsh", "Bose", "Quinn"];
const COUNTRIES = ["Bangladesh", "India", "United States", "United Kingdom", "Germany", "UAE", "Singapore", "Canada"];
const PAIRS = ["BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT"];
const PLANS = ["Starter", "Silver", "Gold", "Platinum"];
const DEVICES = ["iPhone 15", "Pixel 8", "MacBook Pro", "Windows PC"];
const BROWSERS = ["Chrome 126", "Safari 17", "Firefox 127", "Edge 126"];

const pad = (n: number) => String(n).padStart(2, "0");
const pick = <T,>(arr: T[], n: number) => arr[Math.abs(n) % arr.length];
const date = (i: number, n: number) =>
  `2025-${pad(1 + ((i + n) % 12))}-${pad(1 + ((i * (n + 1)) % 28))}`;
const addr = (seed: number) =>
  "0x" +
  Array.from({ length: 8 }, (_, j) =>
    ((seed * (j + 3) * 2654435761) >>> 0).toString(16).padStart(5, "0").slice(0, 5),
  )
    .join("")
    .slice(0, 40);

function buildWallet(i: number, k: number): Wallet {
  return {
    address: addr(i * 10 + k + 1),
    balance: 100 + ((i * 37 * (k + 1)) % 9000),
    lockedBalance: 0,
    transactions: Array.from({ length: 6 }, (_, n) => ({
      id: `TX-${i}-${k}-${n}`,
      date: `${date(i, n + k)} ${pad(8 + n)}:${pad((n * 11) % 60)}`,
      type: pick(["deposit", "withdraw", "transfer", "profit", "bonus"], i + n + k),
      amount: 10 + ((i * 13 + n * 71) % 900),
      status: pick(["completed", "pending", "failed"], i + n * 2),
      hash: addr(i * 100 + k * 10 + n),
    })),
  };
}

function buildUser(i: number): User {
  const first = FIRST[i % FIRST.length];
  const last = LAST[(i * 7) % LAST.length];
  const keys: WalletKey[] = ["main", "mining", "investment", "trading", "referral"];
  const wallets = Object.fromEntries(
    keys.map((key, k) => [key, buildWallet(i, k)]),
  ) as Record<WalletKey, Wallet>;

  return {
    id: `USR-${1000 + i}`,
    firstName: first,
    lastName: last,
    email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@example.com`,
    joinedAt: date(i, 3),
    dob: `${1975 + (i % 30)}-${pad(1 + (i % 12))}-${pad(1 + ((i * 3) % 28))}`,
    country: pick(COUNTRIES, i * 3),
    walletAddress: wallets.main.address,
    kyc: {
      status: pick(["verified", "pending", "rejected", "not_submitted"] as const, i),
      documentType: pick(["Passport", "National ID", "Driving License"], i),
      documentNumber: `DOC${100000 + i * 37}`,
      submittedAt: date(i, 5),
    },
    twoFA: i % 3 === 0,
    referredBy: i % 3 === 0 ? "OWNER" : `USR-${1000 + Math.floor(i / 3)}`,
    status: i % 11 === 0 ? "suspended" : "active",
    wallets,
    referrals: Array.from({ length: i % 5 }, (_, n) => ({
      id: `USR-${5000 + i * 10 + n}`,
      name: `${pick(FIRST, n + i)} ${pick(LAST, n * 3)}`,
      email: `ref${i}${n}@example.com`,
      joinedAt: date(i, n),
      level: 1 + (n % 3),
      totalDeposit: 200 + ((i + n) * 53) % 3000,
      balance: 50 + ((i + n) * 29) % 1500,
    })),
    investments: Array.from({ length: (i % 3) + 1 }, (_, n) => ({
      id: `INV-${i}-${n}`,
      plan: pick(PLANS, i + n),
      amount: 500 + ((i + n) * 211) % 5000,
      dailyRoi: 1 + ((i + n) % 4) * 0.5,
      startDate: date(i, n),
      endDate: date(i, n + 4),
      earned: 20 + ((i + n) * 17) % 600,
      status: pick(["running", "completed", "cancelled"], i + n),
    })),
    aiStrategies: Array.from({ length: (i % 2) + 1 }, (_, n) => ({
      id: `AI-${i}-${n}`,
      name: pick(["Grid Bot", "DCA Bot", "Momentum AI", "Arbitrage AI"], i + n),
      pair: pick(PAIRS, i + n),
      allocated: 300 + ((i + n) * 97) % 4000,
      pnl: ((i * 31 + n * 17) % 600) - 200,
      winRate: 50 + ((i + n) % 40),
      status: pick(["running", "paused", "stopped"], i + n),
    })),
    manualTrades: Array.from({ length: 8 }, (_, n) => ({
      id: `TR-${i}-${n}`,
      date: `${date(i, n)} ${pad(9 + n)}:${pad((n * 7) % 60)}`,
      pair: pick(PAIRS, i + n),
      direction: (i + n) % 2 === 0 ? "long" : "short",
      size: 100 + ((i + n) * 47) % 2000,
      entry: 1000 + ((i + n) * 131) % 60000,
      exit: 1000 + ((i + n) * 149) % 60000,
      pnl: ((i * 13 + n * 29) % 400) - 150,
      status: pick(["closed", "open"], n),
    })),
    logins: Array.from({ length: 5 }, (_, n) => ({
      id: `LG-${i}-${n}`,
      ip: `${103 + n}.${(i * 7) % 255}.${(n * 31) % 255}.${(i + n) % 255}`,
      device: pick(DEVICES, i + n),
      browser: pick(BROWSERS, i + n),
      app: pick(["Web App", "iOS App 2.4.1", "Android App 2.4.0"], i + n),
      location: pick(COUNTRIES, i + n),
      at: `${date(i, n)} ${pad(6 + n)}:${pad((n * 13) % 60)}`,
      status: pick(["success", "success", "failed"], i + n),
    })),
    // No reward / profit-credit / AI-trade rows exist yet — [] until real data does.
    rewards: [],
    dailyProfits: [],
    aiTrades: [],
  };
}

const USERS: User[] = Array.from({ length: 200 }, (_, i) => buildUser(i));

export function getUsers(): User[] {
  return USERS;
}
export function getUser(id: string): User | undefined {
  return USERS.find((u) => u.id === id);
}
export function toRow(u: User): UserRow {
  return {
    id: u.id,
    name: `${u.firstName} ${u.lastName}`,
    email: u.email,
    country: u.country,
    joinedAt: u.joinedAt,
    kyc: u.kyc.status,
    twoFA: u.twoFA,
    status: u.status,
    referredBy: u.referredBy,
    totalBalance: Object.values(u.wallets).reduce((s, w) => s + w.balance, 0),
  };
}

/**
 * End-of-plan rule for a principal that came from a non-withdrawable reward:
 * the principal is BURNED — it leaves both balance and lockedBalance (the
 * daily profit it earned stays withdrawable). Clamped to lockedBalance so no
 * more than the locked reward can be burned. Call this when an investment
 * ends; swap for a DB transaction when the investment engine lands.
 */
export function burnLockedPrincipal(wallet: Wallet, principal: number): Wallet {
  const burn = Math.max(0, Math.min(principal, wallet.lockedBalance));
  return {
    ...wallet,
    balance: Math.max(0, wallet.balance - burn),
    lockedBalance: wallet.lockedBalance - burn,
  };
}
