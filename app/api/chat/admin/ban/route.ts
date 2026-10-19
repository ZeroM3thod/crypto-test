import { NextRequest } from "next/server";
import { bad, getSession, supabase } from "@/lib/auth/backend";

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session || (session.user.role !== "admin" && session.user.role !== "owner")) {
    return bad("Unauthorized", 403);
  }

  const { userId, reason, expiresAt } = await req.json();
  if (!userId || !reason?.trim()) return bad("User ID and reason are required");
  if (expiresAt != null && (!Number.isFinite(Date.parse(expiresAt)) || Date.parse(expiresAt) <= Date.now())) return bad("Ban expiry must be in the future");
  await supabase("chat_bans", {
    method: "POST",
    headers: { Prefer: "return=minimal,resolution=merge-duplicates" },
    body: JSON.stringify({ user_id: userId, admin_id: session.user.id, reason: reason.trim(), active: true, banned_at: new Date().toISOString(), expires_at: expiresAt || null }),
  });

  return Response.json({ ok: true });
}
