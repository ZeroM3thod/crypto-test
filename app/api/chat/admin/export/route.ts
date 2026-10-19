import { NextRequest } from "next/server";
import { readChatArchive, writeChatArchive, type ArchivedChatMessage } from "@/lib/chat-archive";
import { bad, getSession, supabase } from "@/lib/auth/backend";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session || (session.user.role !== "admin" && session.user.role !== "owner")) {
    return bad("Unauthorized", 403);
  }

  const messages = await supabase<any[]>(
    `chat_messages?select=*&order=created_at.asc`
  );
  const existing = await readChatArchive();
  const merged = [...new Map([...existing, ...messages].map((m) => [m.id, m])).values()]
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  await writeChatArchive(merged as ArchivedChatMessage[]);
  if (messages.length) {
    const ids = messages.map((m: any) => m.id);
    await supabase(`chat_messages?id=in.(${ids.map(encodeURIComponent).join(",")})`, { method: "DELETE" });
  }
  return Response.json({ ok: true, transferred: messages.length, archivedTotal: merged.length });
}
