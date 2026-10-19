import { NextRequest } from "next/server";
import { avatarForUser, bad, getSession, q, supabase } from "@/lib/auth/backend";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);

  // Update user online status
  await supabase(`rpc/update_user_online_status`, {
    method: "POST",
    body: JSON.stringify({ p_user_id: session.user.id }),
  });

  // Get online users
  const users = await supabase<any[]>(
    `chat_online_users?select=user_id,auth_users(first_name,last_name,user_id)&last_seen=gte.${new Date(Date.now() - 5 * 60 * 1000).toISOString()}`
  );

  const bans = await supabase<any[]>(`chat_bans?select=user_id&active=eq.true&or=(expires_at.is.null,expires_at.gt.${encodeURIComponent(new Date().toISOString())})`);
  const bannedIds = new Set(bans.map((b) => b.user_id));
  const visibleUsers = users.filter((u) => !bannedIds.has(u.user_id));
  const onlineUsers = visibleUsers.map(u => ({
    id: u.user_id,
    username: `${u.auth_users?.first_name || "User"}_${u.auth_users?.last_name?.charAt(0) || "U"}`,
    avatarUrl: avatarForUser(u.user_id),
    avatar: avatarForUser(u.user_id),
    lang: "EN",
  }));

  // Get count with override
  const [countSetting] = await supabase<any[]>(
    `chat_settings?select=value&key=eq.online_count_override&limit=1`
  );
  
  let count = onlineUsers.length;
  if (countSetting?.value && countSetting.value !== "null") {
    count = parseInt(String(countSetting.value));
  }

  return Response.json({ users: onlineUsers, count, override: countSetting?.value && countSetting.value !== "null" ? countSetting.value : null });
}
