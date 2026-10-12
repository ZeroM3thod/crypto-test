import { NextRequest } from "next/server";
import { bad, getSession, supabase } from "@/lib/auth/backend";

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);

  const { messageId, reason } = await req.json();
  if (!messageId || !reason?.trim()) return bad("Message ID and reason are required");

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
