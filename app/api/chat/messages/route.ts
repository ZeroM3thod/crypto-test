import { NextRequest } from "next/server";
import { readChatArchive } from "@/lib/chat-archive";
import { avatarForUser, bad, getSession, q, supabase } from "@/lib/auth/backend";

function isMissingReplyColumn(error: unknown) {
  return /reply_(to|username|message).*(does not exist|schema cache)|column.*reply_(to|username|message)/i.test(error instanceof Error ? error.message : String(error));
}

function isMissingReplyMetadata(error: unknown) {
  return /reply_(username|message).*(does not exist|schema cache)|column.*reply_(username|message)/i.test(error instanceof Error ? error.message : String(error));
}

function replyCompatibilityError(error: unknown) {
  const text = error instanceof Error ? error.message : String(error);
  return isMissingReplyColumn(error) || /reply_(username|message)|chat_messages_reply_to_fkey|Key \(reply_to\)|reply_to/i.test(text);
}

export async function GET(req: NextRequest) {
  try {
    await fetch(new URL("/api/chat/admin/schedule", req.url), { headers: { cookie: req.headers.get("cookie") || "" }, cache: "no-store" });
  } catch (error) { console.error("Scheduled chat delivery failed:", error); }
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);

  const parsedLimit = Number(req.nextUrl.searchParams.get("limit") || 15);
  const limit = Number.isInteger(parsedLimit) ? Math.min(100, Math.max(1, parsedLimit)) : 15;
  const before = req.nextUrl.searchParams.get("before");
  const cursorFilter = before ? `&created_at=lt.${encodeURIComponent(before)}` : "";
  let live: any[], archived: any[];
  [archived] = await Promise.all([readChatArchive()]);
  try {
    try {
      live = await supabase<any[]>(`chat_messages?select=id,user_id,username,first_name,last_name,message,is_admin,pinned,deleted,deleted_reason,reply_to,reply_username,reply_message,created_at&deleted=eq.false${cursorFilter}&order=created_at.desc&limit=${q(String(limit))}`);
    } catch (error) {
      if (!isMissingReplyMetadata(error)) throw error;
      try {
        live = await supabase<any[]>(`chat_messages?select=id,user_id,username,first_name,last_name,message,is_admin,pinned,deleted,deleted_reason,reply_to,created_at&deleted=eq.false${cursorFilter}&order=created_at.desc&limit=${q(String(limit))}`);
      } catch (replyColumnError) {
        if (!isMissingReplyColumn(replyColumnError)) throw replyColumnError;
        live = await supabase<any[]>(`chat_messages?select=id,user_id,username,first_name,last_name,message,is_admin,pinned,deleted,deleted_reason,created_at&deleted=eq.false${cursorFilter}&order=created_at.desc&limit=${q(String(limit))}`);
      }
    }
  } catch (error) {
    console.error("Chat messages GET failed:", error);
    return bad("Unable to load chat messages. Check Supabase chat_messages schema.", 503);
  }
  const archiveFiltered = archived.filter((m) => !m.deleted && (!before || m.created_at < before));
  const messages = [...archiveFiltered, ...live]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .filter((m, index, rows) => rows.findIndex((row) => row.id === m.id || (row.username === m.username && row.message === m.message && Math.abs(Date.parse(row.created_at) - Date.parse(m.created_at)) < 2000)) === index)
    .slice(0, limit);

  const replyIds = [...new Set(messages.map((m) => m.reply_to).filter(Boolean))];
  let replies: any[] = [];
  if (replyIds.length) {
    try { replies = await supabase<any[]>(`chat_messages?select=id,username,message&id=in.(${replyIds.map(q).join(",")})`); }
    catch (error) { console.error("Reply preview lookup failed:", error); }
  }
  const replyById = new Map(replies.map((r) => [r.id, r]));
  const archivedById = new Map(archived.map((m) => [m.id, m]));
  const relatedIds = [...new Set(messages.flatMap((m) => [m.id, m.reply_to]).filter(Boolean))];
  let relatedLive: any[] = [];
  if (relatedIds.length) {
    try { relatedLive = await supabase<any[]>(`chat_messages?select=id,username,message&id=in.(${relatedIds.map(q).join(",")})`); }
    catch (error) { console.error("Related reply lookup failed:", error); }
  }
  const relatedById = new Map(relatedLive.map((r) => [r.id, r]));
  return Response.json(messages.reverse().map((m) => ({
    ...m,
    own: String(m.user_id) === String(session.user.id),
    username: m.username || `${m.first_name || "User"}_${m.last_name?.[0] || "U"}`,
    avatar_url: avatarForUser(m.user_id || m.username || "admin"),
    avatar: avatarForUser(m.user_id || m.username || "admin"),
     reply_to: replyById.get(m.reply_to) || relatedById.get(m.reply_to) || archivedById.get(m.reply_to) || (m.reply_message ? { username: m.reply_username, message: m.reply_message } : null),
  })));
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);

  let body: any;
  try { body = await req.json(); } catch { return bad("Invalid request body"); }
  const { message, replyTo, persona } = body;
  if (typeof message !== "string" || !message.trim()) return bad("Message is required");
  if (message.trim().length > 2000) return bad("Message is too long");
  let filter: any;
  try { [filter] = await supabase<any[]>("chat_settings?select=value&key=eq.blocked_words&limit=1"); }
  catch (error) { console.error("Chat settings lookup failed:", error); return bad("Chat settings unavailable. Check server logs.", 503); }
  const blockedWords = Array.isArray(filter?.value) ? filter.value.filter((w: unknown): w is string => typeof w === "string") : [];
  if (blockedWords.some((word: string) => word && message.toLowerCase().includes(word.toLowerCase()))) return bad("Message blocked by chat moderation", 422);

  // Check if user is banned
  const isAdmin = session.user.role === "admin" || session.user.role === "owner";
  const personaName = typeof persona?.username === "string" ? persona.username.trim().slice(0, 24) : "";
  if (persona && (!isAdmin || !personaName || personaName.toLowerCase() === "admin")) return bad("Invalid persona", 400);
  let replyTarget: any = null;
  let replyIsArchived = false;
  if (replyTo) {
    if (typeof replyTo !== "string") return bad("Invalid reply target");
    let target: any;
    try { [target] = await supabase<any[]>(`chat_messages?select=id&id=eq.${q(replyTo)}&deleted=eq.false&limit=1`); }
    catch (error) { console.error("Reply target lookup failed:", error); return bad("Reply feature unavailable. Apply Supabase/auth.sql.", 503); }
    if (!target) {
      const archive = await readChatArchive();
      target = archive.find((row) => row.id === replyTo && !row.deleted);
      replyIsArchived = Boolean(target);
    }
    if (!target) return bad("Original message no longer exists; refresh chat and retry.", 404);
    if (target.user_id === null || target.user_id === undefined) replyIsArchived = true;
    replyTarget = target;
  }
  let bans: any[] = [];
  if (!isAdmin) {
    try {
      bans = await supabase<any[]>(`chat_bans?select=id&user_id=eq.${q(session.user.id)}&active=eq.true&or=(expires_at.is.null,expires_at.gt.${encodeURIComponent(new Date().toISOString())})&limit=1`);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      if (!/expires_at.*(does not exist|schema cache)|column.*expires_at/i.test(detail)) {
        console.error("Chat ban lookup failed:", error);
        return bad("Chat moderation unavailable. Check chat_bans schema.", 503);
      }
      try { bans = await supabase<any[]>(`chat_bans?select=id&user_id=eq.${q(session.user.id)}&active=eq.true&limit=1`); }
      catch (fallbackError) { console.error("Chat ban fallback failed:", fallbackError); return bad("Chat moderation unavailable.", 503); }
    }
  }
  if (bans.length > 0) return bad("You are banned from chat", 403);

  // Check if chat is locked
  let settings: any;
  try { [settings] = await supabase<any[]>(
    `chat_settings?select=value&key=eq.chat_locked&limit=1`
  ); } catch (error) { console.error("Chat lock lookup failed:", error); return bad("Chat settings unavailable. Check server logs.", 503); }
  const isLocked = settings?.value === true || settings?.value === "true";
  
  if (isLocked && !isAdmin) {
    return bad("Chat is currently locked", 403);
  }

  // Update online status
  try { await supabase(`rpc/update_user_online_status`, {
    method: "POST",
    body: JSON.stringify({ p_user_id: session.user.id }),
  }); } catch (error) { console.error("Online status update failed:", error); }

  // Insert message
  const messageRow = {
    user_id: personaName ? null : session.user.id,
    username: personaName || `${session.user.first_name}_${session.user.last_name?.charAt(0) || "U"}`,
    first_name: personaName ? personaName.split(/[ _]/)[0] : session.user.first_name,
    last_name: personaName ? (personaName.split(/[ _]/).slice(1).join(" ") || "U") : (session.user.last_name || "U"),
    message: message.trim(),
    is_admin: !personaName && isAdmin,
  };
  let inserted: any[];
  try {
    inserted = await supabase<any[]>("chat_messages", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ ...messageRow, reply_to: replyTo && !replyIsArchived ? replyTo : null, reply_username: replyTarget?.username || null, reply_message: replyTarget?.message || null }),
    });
  } catch (error) {
    // Old production schemas may not expose reply_to in PostgREST yet.
    const detail = error instanceof Error ? error.message : String(error);
    const canRetryWithoutReply = replyCompatibilityError(error);
    if (!replyTo || !canRetryWithoutReply) {
      console.error("Chat message insert failed:", error);
      return bad(`Message could not be saved: ${detail.slice(0, 400)}`, 500);
    }
    try {
      inserted = await supabase<any[]>("chat_messages", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ user_id: messageRow.user_id, username: messageRow.username, first_name: messageRow.first_name, last_name: messageRow.last_name, message: messageRow.message, is_admin: messageRow.is_admin }),
      });
    } catch (fallbackError) {
      console.error("Chat reply fallback insert failed:", fallbackError);
      const detail = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
      return bad(`Message could not be saved: ${detail.slice(0, 400)}`, 500);
    }
  }
  if (!inserted?.[0]) return bad("Message save returned no row. Check database permissions.", 500);
  return Response.json(inserted[0]);
}
