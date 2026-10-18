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
  if (!body || typeof body !== "object") return bad("Invalid strategy", 400);
  const allowed = ["name", "exchange", "min_stake", "lock_days", "days_running", "total_roi_pct"] as const;
  const update = Object.fromEntries(allowed.filter((key) => body[key] !== undefined).map((key) => [key, body[key]]));
  if (!Object.keys(update).length || (update.name !== undefined && !String(update.name).trim()) || (update.exchange !== undefined && !String(update.exchange).trim()) ||
      (update.min_stake !== undefined && !(Number(update.min_stake) > 0)) ||
      (update.lock_days !== undefined && !(Number.isInteger(Number(update.lock_days)) && Number(update.lock_days) > 0)) ||
      (update.days_running !== undefined && !(Number.isInteger(Number(update.days_running)) && Number(update.days_running) >= 0)) ||
      (update.total_roi_pct !== undefined && !Number.isFinite(Number(update.total_roi_pct)))) return bad("Invalid strategy fields", 400);

  // Update strategy
  const { data, error: updateError } = await db
    .from('ai_trading_strategies')
    .update({
      ...update,
      updated_at: new Date().toISOString(),
    })
    .eq('strategy_id', strategyId)
    .select('strategy_id');

  if (updateError) return bad(updateError.message, 400);
  if (!data?.length) return bad("Strategy not found or database rejected the update", 404);

  return Response.json({ success: true });
}
