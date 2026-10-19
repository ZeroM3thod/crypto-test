import { NextRequest } from "next/server";
import { bad, getSession, q, supabase } from "@/lib/auth/backend";

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);

  const { messageId, reason } = await req.json();
  if (typeof messageId !== "string" || typeof reason !== "string" || !reason.trim() || reason.length > 1000) return bad("Message ID and a valid reason are required");

  const [message] = await supabase<any[]>(`chat_messages?select=id,user_id&deleted=eq.false&id=eq.${q(messageId)}&limit=1`);
  if (!message) return bad("Message not found", 404);
  if (message.user_id === session.user.id) return bad("You cannot report your own message");
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
