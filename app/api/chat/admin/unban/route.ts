import { NextRequest } from "next/server";
import { bad, getSession, q, supabase } from "@/lib/auth/backend";

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session || (session.user.role !== "admin" && session.user.role !== "owner")) {
    return bad("Unauthorized", 403);
  }

  const { userId } = await req.json();
  if (typeof userId !== "string") return bad("User ID is required");

  await supabase(`chat_bans?user_id=eq.${q(userId)}&active=eq.true`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ active: false, unbanned_at: new Date().toISOString(), unbanned_by: session.user.id }),
  });

  return Response.json({ ok: true });
}
