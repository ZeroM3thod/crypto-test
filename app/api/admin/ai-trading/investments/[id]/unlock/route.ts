import { NextRequest } from "next/server";
import { bad, getSession, supabase, q } from "@/lib/auth/backend";
import { canSeeUser } from "@/lib/admin/visibility";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);
  if (session.user.role !== "admin" && session.user.role !== "owner") {
    return bad("Forbidden", 403);
  }

  const { id } = await params;

  const rows = await supabase<{ user_id: string }[]>(`ai_trading_investments?select=user_id&id=eq.${q(id)}&limit=1`);
  if (!rows[0] || !(await canSeeUser(rows[0].user_id, session.user.role))) return bad("Not found", 404);

  await supabase(`ai_trading_investments?id=eq.${q(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      status: "unlocked",
      updated_at: new Date().toISOString(),
    }),
  });

  return Response.json({ success: true });
}
