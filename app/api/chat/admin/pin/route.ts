import { NextRequest } from "next/server";
import { bad, getSession, q, supabase } from "@/lib/auth/backend";

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session || (session.user.role !== "admin" && session.user.role !== "owner")) {
    return bad("Unauthorized", 403);
  }

  const { messageId, pinned } = await req.json();
  if (!messageId) return bad("Message ID is required");

  await supabase(`chat_messages?id=eq.${q(messageId)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ pinned: !!pinned }),
  });

  return Response.json({ ok: true });
}
