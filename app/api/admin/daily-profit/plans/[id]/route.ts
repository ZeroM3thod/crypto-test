import { NextRequest } from "next/server";
import { bad, getSession, supabase, q } from "@/lib/auth/backend";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);
  if (session.user.role !== "admin" && session.user.role !== "owner") {
    return bad("Forbidden", 403);
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (body?.cancel_policy_seconds != null) body.cancel_policy_hours = Math.ceil(body.cancel_policy_seconds / 3600);

  await supabase(`daily_profit_plans?id=eq.${q(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      ...body,
      updated_at: new Date().toISOString(),
    }),
  });

  return Response.json({ success: true });
}
