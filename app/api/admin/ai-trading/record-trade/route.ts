import { NextRequest } from "next/server";
import { bad, getSession, supabase, q } from "@/lib/auth/backend";
import { canSeeUser } from "@/lib/admin/visibility";

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);
  if (session.user.role !== "admin" && session.user.role !== "owner") {
    return bad("Forbidden", 403);
  }

  const body = await req.json().catch(() => null);
  const { investment_id, trade_size, duration_minutes, pnl } = body ?? {};
  if (typeof investment_id !== "string" || !(Number(trade_size) > 0) || !Number.isInteger(Number(duration_minutes)) || Number(duration_minutes) <= 0 || !Number.isFinite(Number(pnl))) return bad("Invalid trade details", 400);

  const rows = await supabase<{ user_id: string }[]>(`ai_trading_investments?select=user_id&id=eq.${q(investment_id)}&limit=1`);
  if (!rows[0] || !(await canSeeUser(rows[0].user_id, session.user.role))) return bad("Not found", 404);

  // Call DB function to record trade
  try { await supabase("rpc/record_ai_trade", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      p_investment_id: investment_id,
      p_trade_size: trade_size,
      p_duration_minutes: duration_minutes,
      p_pnl: pnl,
    }),
  }); } catch (err) { return bad(err instanceof Error ? err.message : "Trade update failed", 400); }

  return Response.json({ success: true });
}
