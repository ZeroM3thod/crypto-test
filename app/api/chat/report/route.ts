import { NextRequest } from "next/server";
import { bad, getSession, supabase } from "@/lib/auth/backend";

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);

  const { messageId, reason } = await req.json();
  if (typeof messageId !== "string" || typeof reason !== "string" || !reason.trim() || reason.length > 1000) return bad("Message ID and a valid reason are required");

  const [message] = await supabase<any[]>(`chat_messages?select=id& id=eq.${encodeURIComponent(messageId)}&limit=1`.replace("& id", "&id"));
  if (!message) return bad("Message not found", 404);
  await supabase("chat_reports", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      message_id: messageId,
      reported_by: session.user.id,
      reason: reason.trim(),
    }),
  });

  return Response.json({ ok: true });
}
