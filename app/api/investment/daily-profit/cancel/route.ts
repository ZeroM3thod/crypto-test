import { NextRequest } from "next/server";
import { bad, getSession, supabase } from "@/lib/auth/backend";

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);

  const body = await req.json().catch(() => null);
  const investmentId = String(body?.investmentId || "").trim();

  if (!investmentId) return bad("investmentId required");

  // Call DB function to cancel investment
  await supabase("rpc/cancel_daily_profit_investment", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      p_user_id: session.user.id,
      p_investment_id: investmentId,
    }),
  }).catch((err: Error) => {
    return bad(err.message || "Cancel failed");
  });

  return Response.json({ success: true });
}
