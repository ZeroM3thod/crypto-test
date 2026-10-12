import { NextRequest } from "next/server";
import { bad, getSession, supabase } from "@/lib/auth/backend";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);

  const strategies = await supabase<any[]>(
    `ai_trading_strategies?select=*&active=eq.true&order=min_stake.asc`
  );

  return Response.json({ strategies });
}
