import { NextRequest } from "next/server";
import { bad, getSession, supabase, q } from "@/lib/auth/backend";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);
  if (session.user.role !== "admin" && session.user.role !== "owner") {
    return bad("Forbidden", 403);
  }

  const strategies = await supabase<any[]>(
    `ai_trading_strategies?select=*&order=min_stake.asc`
  );

  return Response.json({ strategies });
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);
  if (session.user.role !== "admin" && session.user.role !== "owner") {
    return bad("Forbidden", 403);
  }

  const body = await req.json().catch(() => null);
  const { strategy_id, name, exchange, min_stake, lock_days, total_roi_pct, days_running } = body;

  await supabase("ai_trading_strategies", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      strategy_id,
      name,
      exchange: exchange || "Binance",
      min_stake,
      lock_days: lock_days || 15,
      total_roi_pct: total_roi_pct || 0,
      days_running: days_running || 0,
      active: true,
    }),
  });

  return Response.json({ success: true });
}
