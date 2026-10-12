import { NextRequest } from "next/server";
import { bad, getSession, supabase } from "@/lib/auth/backend";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);

  const plans = await supabase<any[]>(
    `daily_profit_plans?select=*&active=eq.true&order=minimum_amount.asc`
  );

  return Response.json({ plans });
}
