import { NextRequest } from "next/server";
import { bad, getSession } from "@/lib/auth/backend";
import { db } from "@/lib/db";
import { visibleUserIdsFor } from "@/lib/admin/visibility";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);
  if (session.user.role !== "admin" && session.user.role !== "owner") {
    return bad("Forbidden", 403);
  }

  const { id } = await params;
  const { data: investment } = await db.from("ai_trading_investments").select("user_id").eq("id", id).maybeSingle();
  const visible = await visibleUserIdsFor(session.user.role);
  if (!investment || !visible.includes(investment.user_id)) return bad("Investment not found", 404);

  // Force unlock via DB function
  const { error } = await db.rpc('force_unlock_investment', {
    p_investment_id: id,
    p_admin_id: session.user.id
  });

  if (error) return bad(error.message, 400);

  return Response.json({ success: true });
}
