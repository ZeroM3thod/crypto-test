import { NextRequest } from "next/server";
import { bad, getSession, supabase, q } from "@/lib/auth/backend";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);

  // Get user's trading wallet balance
  let wallets: any[], investments: any[], trades: any[], roiHistory: any[], balance: number;
  try {
  wallets = await supabase<any[]>(`wallet_accounts?select=balance&user_id=eq.${q(session.user.id)}&wallet=eq.trading&limit=1`);
  balance = wallets[0]?.balance || 0;

  // Get investments
  investments = await supabase<any[]>(
    `ai_trading_investments?select=*&user_id=eq.${q(session.user.id)}&status=in.(running,unlocked)&order=created_at.desc`
  );

  // Get trade history
  trades = await supabase<any[]>(
    `ai_trades?select=*&user_id=eq.${q(session.user.id)}&order=executed_at.desc&limit=20`
  );
  roiHistory = await supabase<any[]>(`ai_trading_roi_history?select=*&user_id=eq.${q(session.user.id)}&order=credited_at.desc&limit=100`).catch(() => []);
  } catch (err) { return bad(err instanceof Error ? err.message : "Could not load AI trading account", 500); }

  const totalInvested = investments.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
  const totalProfit = investments.reduce((sum, inv) => sum + parseFloat(inv.total_profit), 0);
  const activeCount = investments.length;

  return Response.json({
    balance,
    totalInvested,
    totalProfit,
    activeStrategies: activeCount,
    investments,
    trades,
    roiHistory,
  });
}
