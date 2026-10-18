import { NextRequest } from "next/server";
import { bad, getSession } from "@/lib/auth/backend";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);
  if (session.user.role !== "admin" && session.user.role !== "owner") return bad("Forbidden", 403);
  const { id } = await params;
  const { data, error } = await db.from("ai_trading_daily_schedule").select("*").eq("strategy_id", id).order("date", { ascending: false });
  if (error) return bad(error.message, 400);
  return Response.json({ entries: data });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);
  if (session.user.role !== "admin" && session.user.role !== "owner") {
    return bad("Forbidden", 403);
  }

  const { id: strategyId } = await params;
  const body = await req.json().catch(() => null);
  const { entries } = body ?? {}; // [{ date: "2026-10-15", time: "09:00", roi: 2.4 }, ...]

  if (!entries || !Array.isArray(entries)) return bad("Invalid entries", 400);

  for (const entry of entries) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.date) || typeof entry.roi !== "number" || !Number.isFinite(entry.roi) || entry.roi < -100) {
      return bad("Invalid entry format", 400);
    }

    const today = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString().slice(0, 10);
    if (entry.date < today) return bad("Date cannot be in the past", 400);
    if (entry.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(entry.time)) return bad("Invalid time", 400);

    const creditAt = new Date(`${entry.date}T${entry.time || "23:59"}:00+06:00`);
    if (!Number.isFinite(creditAt.getTime()) || (entry.date === today && creditAt.getTime() < Date.now())) return bad("Date and time cannot be in the past", 400);
    const { error } = await db.rpc("set_manual_daily_roi_at", {
      p_strategy_id: strategyId,
      p_date: entry.date,
      p_roi_pct: entry.roi,
      p_credit_at: creditAt.toISOString(),
      p_admin_id: session.user.id,
    });

    if (error) return bad(error.message, 400);
  }

  return Response.json({ success: true });
}
