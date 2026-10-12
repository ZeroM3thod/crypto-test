// app/(public)/_components/data.ts

/** Shared card surface used by most boxes on the page */
export const CARD = "bg-surface-container-lowest border border-outline-variant";

export type IconItem = { icon: string; title: string; desc: string };

/* ---------- Hero preview card ---------- */
export const WALLET_TABS = ["Main", "Investment", "Trading"];
export const ACTIVE_WALLET_TAB = "Investment";

export const PNL = [
  { label: "Today", value: "+1.8%" },
  { label: "7-Day", value: "+9.4%" },
  { label: "30-Day", value: "+31.2%" },
  { label: "All-Time", value: "+86.7%" },
];

/* ---------- Trust strip ---------- */
export const METRICS = [
  { value: "$10M+", label: "Total assets managed" },
  { value: "2.5%", label: "Max daily plan return" },
  { value: "68.4%", label: "AI trading win rate" },
  { value: "99.98%", label: "Platform uptime" },
  { value: "50,000+", label: "Active traders" },
];

/* ---------- Features ---------- */
export const FEATURES: (IconItem & { cta: string })[] = [
  {
    icon: "trending_up",
    title: "Automated Daily Profits",
    desc: "Plans from 1.7% to 2.5% per day, credited every 24 hours to your Investment Wallet.",
    cta: "Explore plans",
  },
  {
    icon: "smart_toy",
    title: "Quantitative AI Trading",
    desc: "Momentum, EMA and grid-scalping strategies with automated risk controls.",
    cta: "Explore AI trading",
  },
  {
    icon: "account_balance_wallet",
    title: "3-Wallet Smart Partitioning",
    desc: "Separate trading capital and investment principal into distinct vaults.",
    cta: "Explore wallets",
  },
  {
    icon: "groups",
    title: "5% Lifetime Affiliate Program",
    desc: "Earn 5% on referral profits, milestone cash bonuses and up to $1,000 monthly leaderboard prizes.",
    cta: "Explore referrals",
  },
  {
    icon: "swap_horiz",
    title: "Instant Peer-to-Peer Transfers",
    desc: "Send funds by Email or User ID with instant settlement and a flat $0.10 fee.",
    cta: "Explore transfers",
  },
];

/* ---------- Referral ---------- */
export const REFERRAL_POINTS = [
  "Claim at 5 referrals for $5.00, or keep going and skip to a bigger payout.",
  "Counter resets to 0 after every claim, so you can earn unlimited bonuses.",
  "Targets run from 5 referrals ($5) up to 150 referrals ($180).",
];

export const REFERRAL_TIERS = [
  { referrals: 5, bonus: 5 },
  { referrals: 10, bonus: 10 },
  { referrals: 15, bonus: 18 },
  { referrals: 20, bonus: 25 },
  { referrals: 30, bonus: 40 },
  { referrals: 50, bonus: 65 },
  { referrals: 100, bonus: 120 },
  { referrals: 150, bonus: 180 },
];

/* ---------- How it works ---------- */
export const STEPS: IconItem[] = [
  {
    icon: "person_add",
    title: "1. Create account",
    desc: "Sign up in under 60 seconds and enable 2FA.",
  },
  {
    icon: "download",
    title: "2. Deposit crypto",
    desc: "Fund your Main Wallet with USDT or USDC via TRC-20, BEP-20 or ERC-20.",
  },
  {
    icon: "tune",
    title: "3. Pick a strategy",
    desc: "Activate a daily profit plan or AI trading package.",
  },
  {
    icon: "payments",
    title: "4. Collect & withdraw",
    desc: "Profits credit every 24 hours. Withdraw to your Main Wallet when cycles end.",
  },
];

/* ---------- Wallets ---------- */
export const WALLETS: IconItem[] = [
  {
    icon: "account_balance",
    title: "Main Wallet",
    desc: "Central hub for deposits and withdrawals.",
  },
  {
    icon: "savings",
    title: "Investment Wallet",
    desc: "Daily profit growth and reinvestment.",
  },
  {
    icon: "candlestick_chart",
    title: "Trading Wallet",
    desc: "Dedicated margin for AI strategies and manual orders.",
  },
  {
    icon: "swap_horiz",
    title: "Zero-Fee Transfers",
    desc: "Move funds between your wallets instantly.",
  },
];

/* ---------- Pricing ---------- */
export type Plan = {
  name: string;
  price: string;
  unit: string;
  desc: string;
  cta: string;
  popular?: boolean;
};

export const PLANS: Plan[] = [
  {
    name: "Starter",
    price: "1.7%",
    unit: "/day",
    desc: "Daily profit plan from $30, credited every 24 hours.",
    cta: "Start Plan",
  },
  {
    name: "Growth",
    price: "2.1%",
    unit: "/day",
    desc: "Higher daily rate with automatic crediting to your Investment Wallet.",
    cta: "Start Plan",
  },
  {
    name: "AI Trading",
    price: "$100",
    unit: "min",
    desc: "Algorithmic trading with a 15-day lock and daily P&L updates.",
    cta: "Activate",
  },
  {
    name: "Elite",
    price: "2.5%",
    unit: "/day",
    desc: "Our top daily profit tier with a live dividend countdown.",
    cta: "Go Elite",
    popular: true,
  },
];

/* ---------- Security ---------- */
export const SECURITY = [
  { title: "2FA", desc: "Google Authenticator" },
  { title: "KYC", desc: "4-step verification" },
  { title: "IP Tracking", desc: "Login audit trail" },
  { title: "24/7", desc: "Ticket support" },
];

/* ---------- FAQ ---------- */
export const FAQ = [
  {
    q: "Can I claim multiple referral targets simultaneously?",
    a: "No. Once you claim a target, your counter resets to 0. Claim smaller targets along the way or hold out for higher tier rewards.",
  },
  {
    q: "When are AI trading results credited?",
    a: "Results are recorded and credited every 24 hours inside your strategy dashboard.",
  },
  {
    q: "Can I cancel my AI Trading Package before 15 days?",
    a: "No. Funds are deployed in open positions, so capital stays locked for the full 15-day cycle.",
  },
  {
    q: "What is the minimum withdrawal amount?",
    a: "Once a cycle completes or a bonus is claimed, funds can be withdrawn according to standard platform wallet limits.",
  },
];

/* ---------- Footer ---------- */
export const FOOTER_COLUMNS: Record<string, string[]> = {
  Products: ["Daily Profit", "AI Trading", "Manual Trading"],
  Wallets: ["Deposit", "Withdraw", "Transfer", "History"],
  Community: ["Live Chat", "Announcements", "Referral Leaderboard", "Support"],
  Legal: ["Privacy", "Terms", "Security"],
};
