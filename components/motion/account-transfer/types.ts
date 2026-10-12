export type Account = {
  id: string;
  name: string;
  tone: string;
  symbol: string;
  balance: number;
  currency: string; // e.g. "USDT"
};

export type AccountSide = "from" | "to";
