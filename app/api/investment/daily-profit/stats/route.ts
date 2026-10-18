import { NextRequest } from "next/server";
import { bad, getSession, supabase, q } from "@/lib/auth/backend";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);

  await supabase("rpc/process_daily_profit_credits", { method: "POST" });

  // Get active investments
  const [investments, history] = await Promise.all([
    supabase<any[]>(`daily_profit_investments?select=*&user_id=eq.${q(session.user.id)}&status=eq.active`),
    supabase<any[]>(`daily_profit_history?select=*&user_id=eq.${q(session.user.id)}&order=credited_at.desc`),
  ]);
  const planIds = [...new Set(investments.map((inv) => inv.plan_id))];
  const plans = planIds.length ? await supabase<any[]>(`daily_profit_plans?select=plan_id,cancel_policy_seconds,cancel_policy_hours,profit_interval_seconds&plan_id=in.(${planIds.map(q).join(",")})`) : [];
  const planSettings = new Map(plans.map((plan) => [plan.plan_id, plan]));
  for (const investment of investments) Object.assign(investment, planSettings.get(investment.plan_id));

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
  }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
