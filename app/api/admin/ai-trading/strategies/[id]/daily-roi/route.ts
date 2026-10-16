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
  const { entries } = body; // [{ date: "2026-10-15", roi: 2.4 }, ...]

  if (!entries || !Array.isArray(entries)) return bad("Invalid entries", 400);

  for (const entry of entries) {
    if (!entry.date || typeof entry.roi !== "number") {
      return bad("Invalid entry format", 400);
    }

    const { error } = await db.rpc('set_manual_daily_roi', {
      p_strategy_id: strategyId,
      p_date: entry.date,
      p_roi_pct: entry.roi,
      p_admin_id: session.user.id
    });

    if (error) return bad(error.message, 400);
  }

  return Response.json({ success: true });
}
