import { NextRequest } from "next/server";
import { bad, getSession } from "@/lib/auth/backend";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);
  if (session.user.role !== "admin" && session.user.role !== "owner") {
    return bad("Forbidden", 403);
  }

  const { id: strategyId } = await params;
  const body = await req.json().catch(() => null);

  // Update strategy
  const { error: updateError } = await db
    .from('ai_trading_strategies')
    .update({
      ...body,
      updated_at: new Date().toISOString(),
    })
    .eq('strategy_id', strategyId);

  if (updateError) return bad(updateError.message, 400);

  // If cycle_total_roi_pct changed, regenerate schedule
  if (body.cycle_total_roi_pct !== undefined) {
    const { data: strategy } = await db
      .from('ai_trading_strategies')
      .select('total_roi_pct, days_running')
      .eq('strategy_id', strategyId)
      .single();

    if (strategy) {
      await db.rpc('generate_30day_roi_schedule', {
        p_strategy_id: strategyId,
        p_total_roi_pct: body.cycle_total_roi_pct,
        p_days_running: strategy.days_running,
      });
    }
  }

  return Response.json({ success: true });
}
