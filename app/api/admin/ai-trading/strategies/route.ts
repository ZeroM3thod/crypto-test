import { NextRequest } from "next/server";
import { bad, getSession, supabase } from "@/lib/auth/backend";
import { db } from "@/lib/db";
import { visibleUserIdsFor } from "@/lib/admin/visibility";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);
  if (session.user.role !== "admin" && session.user.role !== "owner") {
    return bad("Forbidden", 403);
  }

  let strategies: any[];
  try { strategies = await supabase<any[]>(
    `ai_trading_strategies?select=*&order=min_stake.asc`
  ); } catch (err) { return bad(err instanceof Error ? err.message : "Could not load strategies", 500); }
  const visible = await visibleUserIdsFor(session.user.role);
  const { data: investments, error } = visible.length ? await db.from("ai_trading_investments").select("strategy_id,user_id,amount").in("user_id", visible).in("status", ["running", "unlocked"]) : { data: [], error: null };
  if (error) return bad(error.message, 400);
  const stats = (investments || []).reduce((out: Record<string, any[]>, row: any) => ((out[row.strategy_id] ||= []).push(row), out), {});
  const todayDhaka = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(new Date());
  const todayRows = await supabase<any[]>(`ai_trading_daily_schedule?select=strategy_id,roi_pct,credit_at&date=eq.${todayDhaka}`);
  return Response.json({ strategies: strategies.map((s) => ({ ...s, today_roi_pct: todayRows.find(x => x.strategy_id === s.strategy_id)?.roi_pct ?? null, today_credit_at: todayRows.find(x => x.strategy_id === s.strategy_id)?.credit_at ?? null, investor_count: (stats[s.strategy_id] || []).length, total_staked: (stats[s.strategy_id] || []).reduce((sum: number, i: any) => sum + Number(i.amount), 0) })) });
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);
  if (session.user.role !== "admin" && session.user.role !== "owner") {
    return bad("Forbidden", 403);
  }

  const body = await req.json().catch(() => null);
  const { strategy_id, name, exchange, min_stake, lock_days, total_roi_pct, days_running } = body ?? {};
  if (!/^[a-z0-9_]{1,64}$/.test(strategy_id || "") || !String(name || "").trim() || !String(exchange || "").trim() || !(Number(min_stake) > 0) || !(Number.isInteger(Number(lock_days)) && Number(lock_days) > 0) || !Number.isFinite(Number(total_roi_pct ?? 0)) || !Number.isInteger(Number(days_running ?? 0)) || Number(days_running ?? 0) < 0) return bad("Invalid strategy fields", 400);

  try { await supabase("ai_trading_strategies", {
    method: "POST",
    headers: { Prefer: "return=representation" },
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
  }); } catch (error) { return bad(error instanceof Error ? error.message : "Create failed", 400); }

  return Response.json({ success: true });
}
