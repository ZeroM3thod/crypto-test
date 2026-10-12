import type { Account } from "./types";

export const ACCOUNTS: Account[] = [
  { id: "main",       name: "Main Wallet",  tone: "bg-primary text-primary-foreground",   symbol: "M", balance: 12480.32, currency: "USDT" },
  { id: "investment", name: "Investment",   tone: "bg-secondary text-secondary-foreground", symbol: "I", balance: 8320.10,  currency: "USDT" },
  { id: "trading",    name: "Trading",      tone: "bg-accent text-accent-foreground",     symbol: "T", balance: 4210.55,  currency: "USDT" },
  { id: "mining",     name: "Mining",       tone: "bg-muted text-muted-foreground",       symbol: "N", balance: 950.00,   currency: "USDT" },
  { id: "referral",   name: "Referral",     tone: "bg-primary/80 text-primary-foreground", symbol: "R", balance: 120.75,  currency: "USDT" },
];
