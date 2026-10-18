import { NextRequest } from "next/server";
import { bad, getSession, supabase } from "@/lib/auth/backend";

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);

  const body = await req.json().catch(() => null);
  const strategyId = String(body?.strategyId || "").trim();
  const amount = Number(body?.amount);

  if (!strategyId) return bad("strategyId required");
  if (!Number.isFinite(amount) || amount <= 0 || Math.round(amount * 100) !== amount * 100) return bad("Invalid amount");

  // Call DB function to create investment
  let result;
  try {
    result = await supabase("rpc/create_ai_trading_investment", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      p_user_id: session.user.id,
      p_strategy_id: strategyId,
      p_amount: amount,
    }),
    });
  } catch (err) {
    return bad(err instanceof Error ? err.message : "Investment failed", 400);
  }

  const investmentId = typeof result === "string" ? result : Array.isArray(result) ? result[0] : result;
  return Response.json({ success: true, investmentId });
}
