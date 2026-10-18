import { NextRequest } from "next/server";
import { bad, getSession, supabase } from "@/lib/auth/backend";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);

  try {
    const strategies = await supabase<any[]>(`ai_trading_strategies?select=*&active=eq.true&order=min_stake.asc`);
    const dhakaToday = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(new Date());
    const schedules = await supabase<any[]>(`ai_trading_daily_schedule?select=strategy_id,roi_pct,date&date=eq.${dhakaToday}`);
    return Response.json({ strategies: strategies.map(s => ({ ...s, today_roi_pct: schedules.find(r => r.strategy_id === s.strategy_id)?.roi_pct ?? 0 })) });
  } catch (err) {
    return bad(err instanceof Error ? err.message : "Could not load strategies", 500);
  }
}
