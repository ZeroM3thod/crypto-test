import { NextRequest } from "next/server";
import { bad, getSession, supabase, q } from "@/lib/auth/backend";

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);

  const body = await req.json().catch(() => null);
  const planId = String(body?.planId || "").trim();
  const amount = parseFloat(body?.amount) || 0;

  if (!planId) return bad("planId required");
  if (amount <= 0) return bad("Invalid amount");

  const wallets = await supabase<{ balance: number | string }[]>(`wallet_accounts?select=balance&user_id=eq.${q(session.user.id)}&wallet=eq.investment&limit=1`);
  if (Number(wallets[0]?.balance ?? 0) < amount) return bad("Not enough dollars in your Investment Wallet to invest in this package.");

  // Call DB function to create investment
  let result;
  try { result = await supabase("rpc/create_daily_profit_investment", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      p_user_id: session.user.id,
      p_plan_id: planId,
      p_amount: amount,
    }),
  }); } catch (err) {
    const message = err instanceof Error ? err.message : "Investment failed";
    return bad(message.toLowerCase().includes("insufficient") ? "Not enough dollars in your Investment Wallet to invest in this package." : message);
  }

  return Response.json({ success: true, investmentId: result });
}
