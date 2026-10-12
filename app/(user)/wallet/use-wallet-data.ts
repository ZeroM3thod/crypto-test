"use client";

import { useCallback, useEffect, useState } from "react";
import type { Account } from "@/components/motion/account-transfer";

export type WalletTransaction = {
  id: string;
  date: string;
  wallet: string;
  type: string;
  asset: string;
  amount: string;
  status: "Completed" | "Pending" | "Failed";
  txHash: string;
};

type WalletData = {
  accounts: Account[];
  wallets: Record<string, { balance: number; address: string | null }>;
  mainAddress: string;
  transactions: WalletTransaction[];
  walletTransactions: Record<string, WalletTransaction[]>;
  stats: Record<string, Record<string, number>>;
};

const empty: WalletData = {
  accounts: [],
  wallets: {
    main: { balance: 0, address: null },
    investment: { balance: 0, address: null },
    trading: { balance: 0, address: null },
  },
  mainAddress: "",
  transactions: [],
  walletTransactions: { main: [], investment: [], trading: [] },
  stats: { main: {}, investment: {}, trading: {}, history: {} },
};

export function money(n = 0, sign = false) {
  const prefix = sign && n > 0 ? "+" : n < 0 ? "-" : "";
  return `${prefix}$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function useWalletData() {
  const [data, setData] = useState<WalletData>(empty);

  const reload = useCallback(async () => {
    const res = await fetch("/api/wallet");
    const json = await res.json().catch(() => null);
    if (res.ok && json) setData(json);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const transfer = useCallback(async (fromId: string, toId: string, amount: number) => {
    const res = await fetch("/api/wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromId, toId, amount }),
    });
    if (res.ok) await reload();
    return res.ok;
  }, [reload]);

  return { data, reload, transfer };
}
