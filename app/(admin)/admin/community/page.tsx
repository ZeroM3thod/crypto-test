// app/(admin)/admin/community/page.tsx
import { AdminShell } from "../../_components/admin-shell";
import { CommunityChatView } from "../../_components/community-chat-view";
import { requireAdmin } from "@/lib/auth/require-admin";
import { supabase, q } from "@/lib/auth/backend";

async function getChatData() {
  try {
    const [messages, users, bans, rules, settings] = await Promise.all([
      supabase<any[]>(`chat_messages?select=*&order=created_at.asc&limit=100`),
      supabase<any[]>(`auth_users?select=id,first_name,last_name,user_id&limit=100`),
      supabase<any[]>(`chat_bans?select=*&active=eq.true`),
      supabase<any[]>(`community_rules?select=rule_text&order=rule_order.asc`),
      supabase<any[]>(`chat_settings?select=key,value`),
    ]);

    const formattedMessages = messages.map((m: any) => ({
      id: m.id,
      userId: m.user_id || "system",
      username: `${m.first_name}_${m.last_name?.charAt(0) || "U"}`,
      avatar: m.first_name?.charAt(0) || "U",
      text: m.message,
      timestamp: new Date(m.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      lang: "EN",
      pinned: m.pinned,
      deleted: m.deleted,
    }));

    const formattedUsers = users.map((u: any) => ({
      id: u.id,
      username: `${u.first_name}_${u.last_name?.charAt(0) || "U"}`,
      avatar: u.first_name?.charAt(0) || "U",
      lang: "EN",
    }));

    const formattedBans = bans.map((b: any) => ({
      userId: b.user_id,
      username: b.user_id,
      avatar: "U",
      reason: b.reason,
      bannedAt: b.banned_at,
      expiresAt: null,
      by: "Admin",
    }));

    return {
      messages: formattedMessages,
      users: formattedUsers,
      bans: formattedBans,
      rules: rules.map((r: any) => r.rule_text),
    };
  } catch (err) {
    console.error("Failed to fetch chat data:", err);
    return {
      messages: [],
      users: [],
      bans: [],
      rules: [
        "Be respectful to all members.",
        "No spam, scam links, or unsolicited promotions.",
        "No hate speech, racism, or personal attacks.",
        "Do not share private keys or wallet credentials.",
        "English is preferred but all languages are welcome.",
      ],
    };
  }
}

export default async function AdminCommunityPage() {
  await requireAdmin();
  const data = await getChatData();

  return (
    <AdminShell active="Community">
      <CommunityChatView
        initialMessages={data.messages}
        users={data.users}
        initialBans={data.bans}
        initialRules={data.rules}
        initialBlockedWords={[]}
        initialScripts={[]}
      />
    </AdminShell>
  );
}
