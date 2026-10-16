import { NextRequest } from "next/server";
import { bad, getSession } from "@/lib/auth/backend";
import { db } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);
  if (session.user.role !== "admin" && session.user.role !== "owner") {
    return bad("Forbidden", 403);
  }

  const { id: strategyId } = await params;
  const body = await req.json();
  const { cycle_total_roi_pct } = body;

  if (typeof cycle_total_roi_pct !== "number") {
    return bad("cycle_total_roi_pct is required", 400);
  }

  // Get current strategy data
  const { data: strategy, error: fetchError } = await db
    .from('ai_trading_strategies')
    .select('days_running')
    .eq('strategy_id', strategyId)
    .single();

  if (fetchError || !strategy) {
    return bad("Strategy not found", 404);
  }

  // Call DB function to regenerate schedule
  const { error } = await db.rpc('generate_30day_roi_schedule', {
    p_strategy_id: strategyId,
    p_total_roi_pct: cycle_total_roi_pct,
    p_days_running: strategy.days_running,
  });

  if (error) return bad(error.message, 400);

  return Response.json({ success: true });
}
