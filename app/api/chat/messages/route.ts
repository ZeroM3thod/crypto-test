import { NextRequest } from "next/server";
import { avatarForUser, bad, getSession, q, supabase } from "@/lib/auth/backend";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);

  const parsedLimit = Number(req.nextUrl.searchParams.get("limit") || 100);
  const limit = String(Number.isInteger(parsedLimit) ? Math.min(200, Math.max(1, parsedLimit)) : 100);
  
  const messages = await supabase<any[]>(
    `chat_messages?select=id,user_id,username,first_name,last_name,message,is_admin,pinned,deleted,deleted_reason,reply_to,created_at&deleted=eq.false&order=created_at.desc&limit=${q(limit)}`
  );

  return Response.json(messages.reverse().map((m) => ({
    ...m,
    own: String(m.user_id) === String(session.user.id),
    username: m.username || `${m.first_name || "User"}_${m.last_name?.[0] || "U"}`,
    avatar_url: avatarForUser(m.user_id || "admin"),
    avatar: avatarForUser(m.user_id || "admin"),
  })));
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);

  const { message, replyTo } = await req.json();
  if (!message?.trim()) return bad("Message is required");
  if (message.trim().length > 2000) return bad("Message is too long");

  // Check if user is banned
  const isAdmin = session.user.role === "admin" || session.user.role === "owner";
  const bans = isAdmin ? [] : await supabase<any[]>(
    `chat_bans?select=id&user_id=eq.${q(session.user.id)}&active=eq.true&limit=1`
  );
  if (bans.length > 0) return bad("You are banned from chat", 403);

  // Check if chat is locked
  const [settings] = await supabase<any[]>(
    `chat_settings?select=value&key=eq.chat_locked&limit=1`
  );
  const isLocked = settings?.value === true || settings?.value === "true";
  
  if (isLocked && !isAdmin) {
    return bad("Chat is currently locked", 403);
  }

  // Update online status
  await supabase(`rpc/update_user_online_status`, {
    method: "POST",
    body: JSON.stringify({ p_user_id: session.user.id }),
  });

  // Insert message
  const [msg] = await supabase<any[]>("chat_messages", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      user_id: session.user.id,
      username: `${session.user.first_name}_${session.user.last_name?.charAt(0) || "U"}`,
      first_name: session.user.first_name,
      last_name: session.user.last_name || "U",
      message: message.trim(),
      is_admin: session.user.role === "admin" || session.user.role === "owner",
      reply_to: replyTo || null,
    }),
  });

  return Response.json(msg);
}
