// app/api/dashboard/route.ts
import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import {
  getUserWallets,
  getUserProfitLoss,
  getDailyReturns,
  getUserActivity,
  getRecentTransactions,
  getUserNotifications,
} from '@/lib/dashboard-data';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user first name
    const { data: user } = await db
      .from('auth_users')
      .select('first_name')
      .eq('id', session.id)
      .single();

    const [wallets, profitLoss, dailyReturns, activity, transactions, notifications] = await Promise.all([
      getUserWallets(session.id),
      getUserProfitLoss(session.id),
      getDailyReturns(session.id, 90),
      getUserActivity(session.id),
      getRecentTransactions(session.id, 6),
      getUserNotifications(session.id, 4),
    ]);

    return NextResponse.json({
      firstName: user?.first_name || 'User',
      wallets,
      selectedWallet: 'main',
      profitLoss,
      dailyReturns,
      activity,
      transactions,
      notifications,
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
