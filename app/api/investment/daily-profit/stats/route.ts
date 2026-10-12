import { NextRequest } from "next/server";
import { bad, getSession, supabase, q } from "@/lib/auth/backend";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);

  // Get active investments
  const investments = await supabase<any[]>(
    `daily_profit_investments?select=*&user_id=eq.${q(session.user.id)}&status=eq.active`
  );

  // Get all-time profit history
  const history = await supabase<any[]>(
    `daily_profit_history?select=*&user_id=eq.${q(session.user.id)}&order=credited_at.desc`
  );

  const totalInvested = investments.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
  const totalProfit = history.reduce((sum, h) => sum + parseFloat(h.profit_amount), 0);
  
  const today = new Date().toISOString().split('T')[0];
  const todayProfit = history
    .filter(h => h.credited_at.startsWith(today))
    .reduce((sum, h) => sum + parseFloat(h.profit_amount), 0);

  return Response.json({
    totalInvested,
    totalProfit,
    todayProfit,
    activePlans: investments.length,
    investments,
    history,
  });
}
