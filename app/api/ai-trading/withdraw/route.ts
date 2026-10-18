import { NextRequest } from "next/server";
import { bad, getSession, supabase } from "@/lib/auth/backend";

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);

  const body = await req.json().catch(() => null);
  const investmentId = String(body?.investmentId || "").trim();

  if (!/^[0-9a-f-]{36}$/i.test(investmentId)) return bad("Valid investmentId required");

  // Return current investment state with useful pre-migration diagnostics.
  try {
    await supabase("rpc/withdraw_ai_trading_investment", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      p_user_id: session.user.id,
      p_investment_id: investmentId,
    }),
    });
  } catch (err) {
    return bad(err instanceof Error ? err.message : "Withdrawal failed", 400);
  }

  return Response.json({ success: true });
}
