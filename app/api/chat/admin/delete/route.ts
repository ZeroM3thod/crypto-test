import { NextRequest } from "next/server";
import { bad, getSession, supabase } from "@/lib/auth/backend";

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session || (session.user.role !== "admin" && session.user.role !== "owner")) {
    return bad("Unauthorized", 403);
  }

  const { messageId, reason } = await req.json();
  if (!messageId || !reason?.trim()) return bad("Message ID and reason are required");

  await supabase(`rpc/delete_chat_message`, {
    method: "POST",
    body: JSON.stringify({
      p_message_id: messageId,
      p_admin_id: session.user.id,
      p_reason: reason.trim(),
    }),
  });

  return Response.json({ ok: true });
}
