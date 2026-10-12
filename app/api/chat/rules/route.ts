import { NextRequest } from "next/server";
import { bad, getSession, supabase } from "@/lib/auth/backend";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);

  const rules = await supabase<any[]>(
    `community_rules?select=id,rule_text,rule_order&order=rule_order.asc`
  );

  return Response.json(rules);
}
