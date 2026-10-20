import { NextRequest } from "next/server";
import { avatarForUser, bad, getSession, supabase } from "@/lib/auth/backend";

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session || (session.user.role !== "admin" && session.user.role !== "owner")) {
    return bad("Unauthorized", 403);
  }

  const { scriptContent } = await req.json();
  if (typeof scriptContent !== "string" || !scriptContent.trim() || scriptContent.length > 50000) return bad("Script content is required (max 50000 characters)");
  const lines = scriptContent.trim().split(/\r?\n/);
  if (lines.length > 100 || lines.some((line: string) => line.trim() && !/^\[\d{2}:\d{2}(?::\d{2})?\]\s+[^:]{1,24}:\s+.{1,2000}$/.test(line.trim()))) return bad("Script lines must use [HH:MM:SS] username: message format (max 100 lines)");

  const inserted: any[] = [];
  for (const line of lines) {
    const match = line.trim().match(/^\[(\d{2}:\d{2}(?::\d{2})?)\]\s+([^:]{1,24}):\s+(.{1,2000})$/);
    if (!match) continue;
    const username = match[2].trim();
    const words = username.split(/[ _]/);
    const [message] = await supabase<any[]>("chat_messages", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ user_id: null, username, first_name: words[0] || "Member", last_name: words.slice(1).join(" ") || "U", message: match[3].trim(), is_admin: false }),
    });
    if (!message) return bad(`Script line for ${username} was not inserted`, 500);
    inserted.push({ ...message, avatar_url: avatarForUser(message.user_id || username), avatar: avatarForUser(message.user_id || username) });
  }
  return Response.json({ ok: true, count: inserted.length, messages: inserted });
}
