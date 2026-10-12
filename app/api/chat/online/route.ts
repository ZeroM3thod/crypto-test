import { NextRequest } from "next/server";
import { bad, getSession, q, supabase } from "@/lib/auth/backend";

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

  const onlineUsers = users.map(u => ({
    id: u.user_id,
    username: `${u.auth_users.first_name}_${u.auth_users.last_name?.charAt(0) || "U"}`,
    avatar: u.auth_users.first_name?.charAt(0) || "U",
  }));

  // Get count with override
  const [countSetting] = await supabase<any[]>(
    `chat_settings?select=value&key=eq.online_count_override&limit=1`
  );
  
  let count = onlineUsers.length;
  if (countSetting?.value && countSetting.value !== "null") {
    count = parseInt(String(countSetting.value));
  }

  return Response.json({ users: onlineUsers, count });
}
