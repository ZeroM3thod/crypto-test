// lib/admin-review-data.ts
export type ReviewStatus = "pending" | "approved" | "rejected";
export type Network = "BEP20" | "ERC20" | "Aptos" | "Polygon_POS" | "Solana";
export type Coin = "USDT" | "USDC";

export type Deposit = {
  id: string;
  name: string;
  username: string;
  userId: string;
  coin: Coin;
  amount: number;
  network: Network;
  hash: string;
  date: string; // YYYY-MM-DD
  reason: string;
  status: ReviewStatus;
};

export type Withdraw = {
  id: string;
  name: string;
  username: string;
  userId: string;
  coin: Coin;
  amount: number;
  fee: number;
  network: Network;
  address: string;
  date: string; // YYYY-MM-DD
  reason: string;
  status: ReviewStatus;
};

// TODO: Replace with actual database queries
export function getDeposits(): Deposit[] {
  return [];
}

// TODO: Replace with actual database queries
export function getWithdraws(): Withdraw[] {
  return [];
}
