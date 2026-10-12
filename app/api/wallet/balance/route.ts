import { NextRequest } from "next/server";
import { bad, getSession, supabase, q } from "@/lib/auth/backend";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);

  // Fetch main wallet balance
  const wallets = await supabase<{ balance: number }[]>(
    `wallet_accounts?select=balance&user_id=eq.${q(session.user.id)}&wallet=eq.main&limit=1`
  );

  const mainBalance = wallets[0]?.balance || 0;

  return Response.json({
    mainBalance: parseFloat(mainBalance.toString()),
  });
}
