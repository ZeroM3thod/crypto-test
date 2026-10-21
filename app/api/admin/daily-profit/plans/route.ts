import { NextRequest } from "next/server";
import { bad, getSession, supabase } from "@/lib/auth/backend";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);
  if (session.user.role !== "admin" && session.user.role !== "owner") {
    return bad("Forbidden", 403);
  }

  const plans = await supabase<any[]>(
    `daily_profit_plans?select=*&order=minimum_amount.asc`
  );

  return Response.json({ plans });
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);
  if (session.user.role !== "admin" && session.user.role !== "owner") {
    return bad("Forbidden", 403);
  }

  const body = await req.json().catch(() => null);
  const { plan_id, name, daily_rate, minimum_amount, badge_label, cancel_policy_hours, cancel_policy_seconds, profit_interval_seconds } = body ?? {};
  if (!/^[a-z0-9_]{1,64}$/.test(plan_id || "") || !String(name || "").trim() || !(Number(daily_rate) > 0) || !(Number(minimum_amount) > 0)) return bad("Invalid plan details", 400);

  await supabase("daily_profit_plans", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      plan_id,
      name,
      daily_rate,
      minimum_amount,
      badge_label,
      cancel_policy_hours: cancel_policy_seconds == null ? (cancel_policy_hours ?? 24) : Math.ceil(cancel_policy_seconds / 3600),
      cancel_policy_seconds: cancel_policy_seconds ?? (cancel_policy_hours ?? 24) * 3600,
      profit_interval_seconds: profit_interval_seconds ?? 86400,
      active: true,
    }),
  });

  return Response.json({ success: true });
}
