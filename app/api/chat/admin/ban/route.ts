import { NextRequest } from "next/server";
import { bad, getSession, supabase } from "@/lib/auth/backend";

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session || (session.user.role !== "admin" && session.user.role !== "owner")) {
    return bad("Unauthorized", 403);
  }

  const { userId, reason } = await req.json();
  if (!userId || !reason?.trim()) return bad("User ID and reason are required");

  await supabase(`rpc/ban_user_from_chat`, {
    method: "POST",
    body: JSON.stringify({
      p_user_id: userId,
      p_admin_id: session.user.id,
      p_reason: reason.trim(),
    }),
  });

  return Response.json({ ok: true });
}
