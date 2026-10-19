import { NextRequest } from "next/server";
import { bad, getSession, q, supabase } from "@/lib/auth/backend";

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session || (session.user.role !== "admin" && session.user.role !== "owner")) {
    return bad("Unauthorized", 403);
  }

  const { messageId, reason } = await req.json();
  if (typeof messageId !== "string" || typeof reason !== "string" || !reason.trim()) return bad("Message ID and reason are required");

  await supabase(`chat_messages?id=eq.${q(messageId)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ deleted: true, deleted_at: new Date().toISOString(), deleted_by: session.user.id, deleted_reason: reason.trim() }),
  });

  return Response.json({ ok: true });
}
