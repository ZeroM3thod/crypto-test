import { db } from "@/lib/db";

export type Period = "today" | "7d" | "30d" | "all";
export type PeriodStats = { newUsers: number; deposit: number; withdraw: number; manualTradingProfit: number; sendMoneyFeeProfit: number; withdrawalFeeProfit: number; tradesCount: number; sendCount: number; withdrawCount: number };
export type TxnType = "Deposit" | "Withdraw" | "Send Money" | "Manual Trade";
export type TxnStatus = "completed" | "pending" | "failed";
export type Txn = { id: string; user: string; type: TxnType; amount: number; fee: number; status: TxnStatus; date: string };
export type AdminUser = { id: string; name: string; email: string; balance: number; status: "verified" | "pending" | "blocked"; joined: string };
export type DashboardData = { totalUsers: number; activeUsers: number; pendingWithdrawals: number; pendingKyc: number; totalDeposit: number; totalWithdraw: number; fundingAvailable: number; periods: Record<Period, PeriodStats>; transactions: Txn[]; users: AdminUser[] };

const emptyStats = (): PeriodStats => ({ newUsers: 0, deposit: 0, withdraw: 0, manualTradingProfit: 0, sendMoneyFeeProfit: 0, withdrawalFeeProfit: 0, tradesCount: 0, sendCount: 0, withdrawCount: 0 });
const date = (v?: string) => v ? new Date(v).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : "";
const nameOf = (u: any) => `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email || "User";
const statusOf = (s: string): TxnStatus => s === "approved" ? "completed" : s === "rejected" ? "failed" : "pending";
const since = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

function inPeriod(created: string, period: Period) {
  if (period === "all") return true;
  const t = new Date(created).getTime();
  if (period === "today") return t >= new Date().setHours(0, 0, 0, 0);
  return t >= new Date(since(period === "7d" ? 7 : 30)).getTime();
}

export async function getDashboardData(includeHidden = false): Promise<DashboardData> {
  let userQuery = db
    .from("auth_users")
    .select("id,user_id,first_name,last_name,email,status,kyc_status,hidden_from_admins,created_at")
    .eq("role", "user")
    .order("created_at", { ascending: false });
  if (!includeHidden) userQuery = userQuery.eq("hidden_from_admins", false);
  const { data: users } = await userQuery;
  const visibleUsers = users || [];
  const visibleIds = visibleUsers.map((u) => u.id);

  const [{ data: wallets }, { data: deposits }, { data: withdrawals }] = await Promise.all([
    visibleIds.length ? db.from("wallet_accounts").select("user_id,balance").in("user_id", visibleIds) : Promise.resolve({ data: [] as any[] }),
    visibleIds.length ? db.from("deposits").select("id,user_id,amount,status,created_at,auth_users(first_name,last_name,email)").in("user_id", visibleIds).order("created_at", { ascending: false }).limit(50) : Promise.resolve({ data: [] as any[] }),
    visibleIds.length ? db.from("withdrawals").select("id,user_id,amount,fee_amount,status,created_at,auth_users(first_name,last_name,email)").in("user_id", visibleIds).order("created_at", { ascending: false }).limit(50) : Promise.resolve({ data: [] as any[] }),
  ]);

  const balances = new Map<string, number>();
  for (const w of wallets || []) balances.set(w.user_id, (balances.get(w.user_id) || 0) + Number(w.balance || 0));

  const periods: Record<Period, PeriodStats> = { today: emptyStats(), "7d": emptyStats(), "30d": emptyStats(), all: emptyStats() };
  for (const p of Object.keys(periods) as Period[]) {
    periods[p].newUsers = visibleUsers.filter((u) => inPeriod(u.created_at, p)).length;
    periods[p].deposit = (deposits || []).filter((d) => d.status === "approved" && inPeriod(d.created_at, p)).reduce((s, d) => s + Number(d.amount || 0), 0);
    periods[p].withdraw = (withdrawals || []).filter((w) => w.status === "approved" && inPeriod(w.created_at, p)).reduce((s, w) => s + Number(w.amount || 0), 0);
    periods[p].withdrawalFeeProfit = (withdrawals || []).filter((w) => w.status === "approved" && inPeriod(w.created_at, p)).reduce((s, w) => s + Number(w.fee_amount || 0), 0);
    periods[p].withdrawCount = (withdrawals || []).filter((w) => inPeriod(w.created_at, p)).length;
  }

  const transactions: Txn[] = [
    ...(deposits || []).map((d: any) => ({ id: d.id, user: nameOf(d.auth_users), type: "Deposit" as const, amount: Number(d.amount || 0), fee: 0, status: statusOf(d.status), date: date(d.created_at) })),
    ...(withdrawals || []).map((w: any) => ({ id: w.id, user: nameOf(w.auth_users), type: "Withdraw" as const, amount: Number(w.amount || 0), fee: Number(w.fee_amount || 0), status: statusOf(w.status), date: date(w.created_at) })),
  ].sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).slice(0, 10);

  const totalDeposit = periods.all.deposit;
  const totalWithdraw = periods.all.withdraw;
  return {
    totalUsers: visibleUsers.length,
    activeUsers: visibleUsers.filter((u) => u.status === "active").length,
    pendingWithdrawals: (withdrawals || []).filter((w) => w.status === "pending").length,
    pendingKyc: visibleUsers.filter((u) => u.kyc_status === "pending").length,
    totalDeposit,
    totalWithdraw,
    fundingAvailable: totalDeposit - totalWithdraw,
    periods,
    transactions,
    users: visibleUsers.slice(0, 10).map((u) => ({ id: u.user_id || u.id, name: nameOf(u), email: u.email, balance: balances.get(u.id) || 0, status: u.status === "suspended" ? "blocked" : u.kyc_status === "verified" ? "verified" : "pending", joined: date(u.created_at) })),
  };
}
