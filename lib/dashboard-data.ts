// lib/dashboard-data.ts
import { db } from './db';

export type WalletData = {
  wallet: 'main' | 'investment' | 'trading';
  balance: number;
  address: string | null;
};

export type ProfitLossData = {
  today: number;
  week: number;
  month: number;
  total: number;
};

export type DailyReturn = {
  date: string;
  return: number;
};

export type ActivityData = {
  investment: {
    totalInvested: number;
    activePlans: number;
    todayProfit: number;
    totalProfit: number;
  };
  aiTrading: {
    tradingBalance: number;
    activeStrategies: number;
    currentPnl: number;
    totalPnl: number;
  };
  referral: {
    totalReferrals: number;
    activeReferrals: number;
    totalEarnings: number;
    pendingEarnings: number;
  };
};

export type RecentTransaction = {
  id: string;
  date: string;
  type: string;
  amount: string;
  asset: string;
  status: 'Completed' | 'Pending' | 'Failed';
  txHash: string;
};

export type NotificationItem = {
  id: string;
  title: string;
  description: string;
  icon: string;
  created_at: string;
};

export async function getUserWallets(userId: string): Promise<WalletData[]> {
  const { data, error } = await db
    .from('wallet_accounts')
    .select('wallet, balance, address')
    .eq('user_id', userId)
    .order('wallet', { ascending: true });

  if (error) throw error;
  return data as WalletData[];
}

export async function getUserProfitLoss(userId: string): Promise<ProfitLossData> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  // ponytail: simple sum of profit events, real system needs realized vs unrealized tracking
  const { data: dailyProfits } = await db
    .from('daily_profit_history')
    .select('profit_amount, credited_at')
    .eq('user_id', userId)
    .gte('credited_at', today.toISOString());

  const { data: aiTrades } = await db
    .from('ai_trades')
    .select('pnl, executed_at')
    .eq('user_id', userId);

  const todayDaily = dailyProfits?.filter(p => new Date(p.credited_at) >= today).reduce((sum, p) => sum + Number(p.profit_amount), 0) || 0;
  const todayAi = aiTrades?.filter(t => new Date(t.executed_at) >= today).reduce((sum, t) => sum + Number(t.pnl), 0) || 0;
  
  const weekDaily = dailyProfits?.filter(p => new Date(p.credited_at) >= weekAgo).reduce((sum, p) => sum + Number(p.profit_amount), 0) || 0;
  const weekAi = aiTrades?.filter(t => new Date(t.executed_at) >= weekAgo).reduce((sum, t) => sum + Number(t.pnl), 0) || 0;
  
  const monthDaily = dailyProfits?.filter(p => new Date(p.credited_at) >= monthAgo).reduce((sum, p) => sum + Number(p.profit_amount), 0) || 0;
  const monthAi = aiTrades?.filter(t => new Date(t.executed_at) >= monthAgo).reduce((sum, t) => sum + Number(t.pnl), 0) || 0;
  
  const totalDaily = dailyProfits?.reduce((sum, p) => sum + Number(p.profit_amount), 0) || 0;
  const totalAi = aiTrades?.reduce((sum, t) => sum + Number(t.pnl), 0) || 0;

  return {
    today: todayDaily + todayAi,
    week: weekDaily + weekAi,
    month: monthDaily + monthAi,
    total: totalDaily + totalAi,
  };
}

export async function getDailyReturns(userId: string, days: number = 90): Promise<DailyReturn[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data: dailyProfits } = await db
    .from('daily_profit_history')
    .select('profit_amount, credited_at')
    .eq('user_id', userId)
    .gte('credited_at', startDate.toISOString())
    .order('credited_at', { ascending: true });

  const { data: aiTrades } = await db
    .from('ai_trades')
    .select('pnl, executed_at')
    .eq('user_id', userId)
    .gte('executed_at', startDate.toISOString())
    .order('executed_at', { ascending: true });

  const byDate = new Map<string, number>();

  dailyProfits?.forEach(p => {
    const date = new Date(p.credited_at).toISOString().split('T')[0];
    byDate.set(date, (byDate.get(date) || 0) + Number(p.profit_amount));
  });

  aiTrades?.forEach(t => {
    const date = new Date(t.executed_at).toISOString().split('T')[0];
    byDate.set(date, (byDate.get(date) || 0) + Number(t.pnl));
  });

  return Array.from(byDate.entries())
    .map(([date, return_]) => ({ date, return: return_ }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getUserActivity(userId: string): Promise<ActivityData> {
  const { data: investments } = await db
    .from('daily_profit_investments')
    .select('amount, status, total_profit')
    .eq('user_id', userId);

  const { data: aiInvestments } = await db
    .from('ai_trading_investments')
    .select('amount, current_value, total_profit, status')
    .eq('user_id', userId);

  const { data: referralStats } = await db
    .rpc('get_referral_stats', { p_user_id: userId });

  const activeInvestments = investments?.filter(i => i.status === 'active') || [];
  const totalInvested = activeInvestments.reduce((sum, i) => sum + Number(i.amount), 0);
  const totalProfit = investments?.reduce((sum, i) => sum + Number(i.total_profit), 0) || 0;

  // Today's profit from daily investments
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const { data: todayProfits } = await db
    .from('daily_profit_history')
    .select('profit_amount')
    .eq('user_id', userId)
    .gte('credited_at', today.toISOString());

  const todayProfit = todayProfits?.reduce((sum, p) => sum + Number(p.profit_amount), 0) || 0;

  const aiActive = aiInvestments?.filter(i => i.status === 'running' || i.status === 'unlocked') || [];
  const tradingBalance = aiActive.reduce((sum, i) => sum + Number(i.current_value), 0);
  const totalAiProfit = aiInvestments?.reduce((sum, i) => sum + Number(i.total_profit), 0) || 0;

  const { data: todayAiTrades } = await db
    .from('ai_trades')
    .select('pnl')
    .eq('user_id', userId)
    .gte('executed_at', today.toISOString());

  const currentPnl = todayAiTrades?.reduce((sum, t) => sum + Number(t.pnl), 0) || 0;

  return {
    investment: {
      totalInvested,
      activePlans: activeInvestments.length,
      todayProfit,
      totalProfit,
    },
    aiTrading: {
      tradingBalance,
      activeStrategies: aiActive.length,
      currentPnl,
      totalPnl: totalAiProfit,
    },
    referral: {
      totalReferrals: referralStats?.total_referred || 0,
      activeReferrals: referralStats?.active_referred || 0,
      totalEarnings: Number(referralStats?.total_commission || 0),
      pendingEarnings: 0, // ponytail: add pending commission table if needed
    },
  };
}

export async function getRecentTransactions(userId: string, limit: number = 6): Promise<RecentTransaction[]> {
  const { data, error } = await db
    .from('wallet_transactions')
    .select('id, wallet, type, asset, amount, status, tx_hash, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return data.map(t => ({
    id: t.id,
    date: new Date(t.created_at).toISOString().split('T')[0],
    type: formatTransactionType(t.type),
    amount: formatAmount(t.amount),
    asset: t.asset || 'USDT',
    status: mapStatus(t.status),
    txHash: t.tx_hash.slice(0, 6) + '…' + t.tx_hash.slice(-4),
  }));
}

export async function getUserNotifications(userId: string, limit: number = 4): Promise<NotificationItem[]> {
  // ponytail: create notifications table for persistent messages
  // For now, pull from recent activity in wallet_transactions and login_history
  
  const { data: recentTxs } = await db
    .from('wallet_transactions')
    .select('id, type, amount, asset, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return (recentTxs || []).map(tx => ({
    id: tx.id,
    title: getNotificationTitle(tx.type),
    description: getNotificationDescription(tx.type, tx.amount, tx.asset),
    icon: getNotificationIcon(tx.type),
    created_at: tx.created_at,
  }));
}

function formatTransactionType(type: string): string {
  const map: Record<string, string> = {
    deposit: 'Deposit',
    withdrawal_pending: 'Withdrawal',
    withdrawal_refund: 'Refund',
    transfer: 'Transfer',
    daily_profit_invest: 'Investment',
    daily_profit_credit: 'Profit',
    daily_profit_cancel: 'Cancel',
    ai_trading_invest: 'AI Invest',
    ai_trading_withdraw: 'AI Withdraw',
    referral_commission: 'Commission',
  };
  return map[type] || type;
}

function formatAmount(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount >= 0 ? '+' : '-';
  return `${sign}$${abs.toFixed(2)}`;
}

function mapStatus(status: string): 'Completed' | 'Pending' | 'Failed' {
  if (status === 'completed') return 'Completed';
  if (status === 'pending') return 'Pending';
  return 'Failed';
}

function getNotificationTitle(type: string): string {
  const map: Record<string, string> = {
    deposit: 'Deposit Confirmed',
    withdrawal_pending: 'Withdrawal Pending',
    withdrawal_refund: 'Withdrawal Refunded',
    daily_profit_credit: 'Daily Profit Credited',
    ai_trading_invest: 'AI Trading Activated',
    referral_commission: 'Referral Commission Earned',
  };
  return map[type] || 'Transaction';
}

function getNotificationDescription(type: string, amount: number, asset: string): string {
  const abs = Math.abs(amount);
  const formatted = `$${abs.toFixed(2)}`;
  
  const map: Record<string, string> = {
    deposit: `Your deposit of ${formatted} has been confirmed.`,
    withdrawal_pending: `Withdrawal request of ${formatted} is being processed.`,
    withdrawal_refund: `Withdrawal of ${formatted} has been refunded.`,
    daily_profit_credit: `Daily profit of ${formatted} has been credited.`,
    ai_trading_invest: `AI Trading strategy activated with ${formatted}.`,
    referral_commission: `Referral commission of ${formatted} earned.`,
  };
  
  return map[type] || `Transaction of ${formatted} ${asset}.`;
}

function getNotificationIcon(type: string): string {
  const map: Record<string, string> = {
    deposit: 'ArrowDownRight',
    withdrawal_pending: 'ArrowUpRight',
    withdrawal_refund: 'ArrowDownRight',
    daily_profit_credit: 'TrendingUp',
    ai_trading_invest: 'Bot',
    referral_commission: 'Users',
  };
  return map[type] || 'Bell';
}
