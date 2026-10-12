import { NextRequest } from "next/server";
import { bad, getSession, supabase } from "@/lib/auth/backend";

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);

  const body = await req.json().catch(() => null);
  const strategyId = String(body?.strategyId || "").trim();
  const amount = parseFloat(body?.amount) || 0;

  if (!strategyId) return bad("strategyId required");
  if (amount <= 0) return bad("Invalid amount");

  // Call DB function to create investment
  const result = await supabase("rpc/create_ai_trading_investment", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      p_user_id: session.user.id,
      p_strategy_id: strategyId,
      p_amount: amount,
    }),
  }).catch((err: Error) => {
    return bad(err.message || "Investment failed");
  });

  return Response.json({ success: true, investmentId: result });
}
