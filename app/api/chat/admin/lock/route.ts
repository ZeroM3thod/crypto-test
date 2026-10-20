import { NextRequest } from "next/server";
import { bad, getSession, supabase } from "@/lib/auth/backend";
import { q } from "@/lib/auth/backend";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);
  const [setting] = await supabase<any[]>("chat_settings?select=value&key=eq.chat_locked&limit=1");
  const [ban] = await supabase<any[]>(`chat_bans?select=reason,banned_at,expires_at&user_id=eq.${q(session.user.id)}&active=eq.true&limit=1`);
  const banExpiry = ban?.expires_at ? Date.parse(ban.expires_at) : null;
  const banned = !!ban && (banExpiry === null || banExpiry > Date.now());
  return Response.json({ locked: setting?.value === true || setting?.value === "true", banned, banReason: banned ? ban.reason : null, bannedAt: banned ? ban.banned_at : null, expiresAt: banned ? ban.expires_at : null });
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session || (session.user.role !== "admin" && session.user.role !== "owner")) return bad("Unauthorized", 403);
  const { locked } = await req.json();
  if (typeof locked !== "boolean") return bad("Locked must be boolean");
  await supabase("chat_settings?on_conflict=key", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ key: "chat_locked", value: locked }),
  });
  return Response.json({ ok: true });
}
