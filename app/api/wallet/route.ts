import { NextRequest, NextResponse } from "next/server";
import { bad, getSession, q, supabase, txHash } from "@/lib/auth/backend";

type WalletKey = "main" | "investment" | "trading";
type WalletRow = { wallet: WalletKey; balance: number | string; address: string | null };
type TxRow = {
  id: string;
  wallet: WalletKey;
  type: string;
  asset: string;
  amount: number | string;
  status: "completed" | "pending" | "failed";
  tx_hash: string;
  related_wallet: WalletKey | null;
  created_at: string;
};

const wallets: WalletKey[] = ["main", "investment", "trading"];
const labels: Record<WalletKey, string> = { main: "Main", investment: "Investment", trading: "Trading" };

function money(n: number, sign = false) {
  const prefix = sign && n > 0 ? "+" : n < 0 ? "-" : "";
  return `${prefix}$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function tx(t: TxRow) {
  const amount = Number(t.amount);
  return {
    id: t.id,
    date: new Date(t.created_at).toISOString().slice(0, 10),
    wallet: labels[t.wallet],
    type: t.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    asset: t.asset,
    amount: money(amount, true),
    status: t.status[0].toUpperCase() + t.status.slice(1),
    txHash: t.tx_hash.length > 14 ? `${t.tx_hash.slice(0, 6)}…${t.tx_hash.slice(-4)}` : t.tx_hash,
  };
}

function statTx(rows: TxRow[], wallet?: WalletKey) {
  const list = wallet ? rows.filter((r) => r.wallet === wallet) : rows;
  const completed = list.filter((r) => r.status === "completed");
  const sum = (types: string[], positive?: boolean) => completed
    .filter((r) => types.includes(r.type) && (positive === undefined || (positive ? Number(r.amount) > 0 : Number(r.amount) < 0)))
    .reduce((s, r) => s + Math.abs(Number(r.amount)), 0);
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const change24h = completed.filter((r) => new Date(r.created_at).getTime() >= dayAgo).reduce((s, r) => s + Number(r.amount), 0);
  return { list, completed, sum, change24h };
}

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);
  const [walletRows, txRows] = await Promise.all([
    supabase<WalletRow[]>(`wallet_accounts?select=wallet,balance,address&user_id=eq.${q(session.user.id)}&order=wallet.asc`),
    supabase<TxRow[]>(`wallet_transactions?select=*&user_id=eq.${q(session.user.id)}&order=created_at.desc&limit=200`),
  ]);

  const walletMap = Object.fromEntries(wallets.map((w) => [w, { balance: 0, address: null as string | null }]));
  for (const row of walletRows) walletMap[row.wallet] = { balance: Number(row.balance), address: row.address };
  const transactions = txRows.map(tx);
  const accounts = wallets.map((w) => ({ id: w, name: `${labels[w]} Wallet`, tone: w, symbol: labels[w][0], balance: walletMap[w].balance, currency: "USDT" }));
  const main = statTx(txRows, "main");
  const investment = statTx(txRows, "investment");
  const trading = statTx(txRows, "trading");
  const all = statTx(txRows);
  const totalIn = all.completed.filter((r) => Number(r.amount) > 0).reduce((s, r) => s + Number(r.amount), 0);
  const totalOut = all.completed.filter((r) => Number(r.amount) < 0).reduce((s, r) => s + Math.abs(Number(r.amount)), 0);

  return NextResponse.json({
    accounts,
    wallets: walletMap,
    mainAddress: walletMap.main.address || session.user.wallet_address || "",
    transactions,
    walletTransactions: {
      main: transactions.filter((t) => t.wallet === "Main"),
      investment: transactions.filter((t) => t.wallet === "Investment"),
      trading: transactions.filter((t) => t.wallet === "Trading"),
    },
    stats: {
      main: {
        totalDeposited: main.sum(["deposit"]),
        totalWithdrawn: main.sum(["withdrawal", "send"], false),
        totalTransferred: main.sum(["transfer"]),
        change24h: main.change24h,
      },
      investment: {
        totalInvested: investment.sum(["deposit", "transfer"]),
        activePlans: 0,
        todayProfit: investment.sum(["credit", "profit"]),
        totalProfit: investment.sum(["credit", "profit"]),
      },
      trading: {
        totalDeposited: trading.sum(["deposit", "transfer"]),
        realizedPl: trading.sum(["p/l credit", "profit"]),
        unrealizedPl: 0,
        activeStrategies: 0,
      },
      history: {
        totalTransactions: txRows.length,
        totalIn,
        totalOut,
        netFlow: totalIn - totalOut,
      },
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);
  const body = await req.json().catch(() => null);
  const from = String(body?.fromId || "") as WalletKey;
  const to = String(body?.toId || "") as WalletKey;
  const amount = Number(body?.amount || 0);
  if (!wallets.includes(from) || !wallets.includes(to) || from === to || amount <= 0) return bad("Invalid transfer.");
  await supabase("rpc/transfer_wallet_balance", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ p_user_id: session.user.id, p_from: from, p_to: to, p_amount: amount, p_tx_hash: txHash() }),
  });
  return NextResponse.json({ ok: true });
}
