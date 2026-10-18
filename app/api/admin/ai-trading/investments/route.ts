import { NextRequest } from "next/server";
import { bad, getSession, supabase, q } from "@/lib/auth/backend";
import { visibleUserIdsFor, inFilter } from "@/lib/admin/visibility";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);
  if (session.user.role !== "admin" && session.user.role !== "owner") {
    return bad("Forbidden", 403);
  }

  const visibleIds = await visibleUserIdsFor(session.user.role);
  if (!visibleIds.length) return Response.json({ investments: [] });

  let investments;
  try { investments = await supabase<any[]>(
    `ai_trading_investments?select=*,user:auth_users(first_name,last_name,email)&user_id=in.${inFilter(visibleIds.map(q))}&order=created_at.desc`
  ); } catch (err) { return bad(err instanceof Error ? err.message : "Could not load investments", 500); }

  return Response.json({ investments });
}
