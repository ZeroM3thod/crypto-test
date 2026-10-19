import { NextRequest } from "next/server";
import { readChatArchive } from "@/lib/chat-archive";
import { avatarForUser, bad, getSession, q, supabase } from "@/lib/auth/backend";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);

  const parsedLimit = Number(req.nextUrl.searchParams.get("limit") || 15);
  const limit = Number.isInteger(parsedLimit) ? Math.min(100, Math.max(1, parsedLimit)) : 15;
  const before = req.nextUrl.searchParams.get("before");
  const cursorFilter = before ? `&created_at=lt.${encodeURIComponent(before)}` : "";
  const [live, archived] = await Promise.all([supabase<any[]>(
    `chat_messages?select=id,user_id,username,first_name,last_name,message,is_admin,pinned,deleted,deleted_reason,reply_to,created_at&deleted=eq.false${cursorFilter}&order=created_at.desc&limit=${q(String(limit))}`
  ), readChatArchive()]);
  const archiveFiltered = archived.filter((m) => !m.deleted && (!before || m.created_at < before));
  const messages = [...archiveFiltered, ...live]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .filter((m, index, rows) => rows.findIndex((row) => row.id === m.id) === index)
    .slice(0, limit);

  const replyIds = [...new Set(messages.map((m) => m.reply_to).filter(Boolean))];
  const replies = replyIds.length ? await supabase<any[]>(`chat_messages?select=id,username,message&id=in.(${replyIds.map(q).join(",")})`) : [];
  const replyById = new Map(replies.map((r) => [r.id, r]));
  return Response.json(messages.reverse().map((m) => ({
    ...m,
    own: String(m.user_id) === String(session.user.id),
    username: m.username || `${m.first_name || "User"}_${m.last_name?.[0] || "U"}`,
    avatar_url: m.is_admin ? avatarForUser(m.user_id || "admin") : avatarForUser(m.username || m.user_id || "admin"),
    avatar: m.is_admin ? avatarForUser(m.user_id || "admin") : avatarForUser(m.username || m.user_id || "admin"),
    reply_to: replyById.get(m.reply_to) || null,
  })));
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);

  const { message, replyTo, persona } = await req.json();
  if (typeof message !== "string" || !message.trim()) return bad("Message is required");
  if (message.trim().length > 2000) return bad("Message is too long");

  // Check if user is banned
  const isAdmin = session.user.role === "admin" || session.user.role === "owner";
  const personaName = typeof persona?.username === "string" ? persona.username.trim().slice(0, 24) : "";
  if (persona && (!isAdmin || !personaName || personaName.toLowerCase() === "admin")) return bad("Invalid persona", 400);
  if (replyTo) {
    if (typeof replyTo !== "string") return bad("Invalid reply target");
    const [target] = await supabase<any[]>(`chat_messages?select=id&id=eq.${q(replyTo)}&deleted=eq.false&limit=1`);
    if (!target) return bad("Reply target not found", 404);
  }
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
      username: personaName || `${session.user.first_name}_${session.user.last_name?.charAt(0) || "U"}`,
      first_name: personaName ? personaName.split(/[ _]/)[0] : session.user.first_name,
      last_name: personaName ? (personaName.split(/[ _]/).slice(1).join(" ") || "U") : (session.user.last_name || "U"),
      message: message.trim(),
      is_admin: !personaName && isAdmin,
      reply_to: replyTo || null,
    }),
  });

  return Response.json(msg);
}
