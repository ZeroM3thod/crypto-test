import { NextRequest } from "next/server";
import { bad, getSession, supabase } from "@/lib/auth/backend";

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session || (session.user.role !== "admin" && session.user.role !== "owner")) {
    return bad("Unauthorized", 403);
  }

  const { userId, reason, expiresAt } = await req.json();
  if (typeof userId !== "string" || typeof reason !== "string" || !reason.trim()) return bad("User ID and reason are required");
  if (expiresAt != null && (!Number.isFinite(Date.parse(expiresAt)) || Date.parse(expiresAt) <= Date.now())) return bad("Ban expiry must be in the future");
  if (session.user.id === userId) return bad("Cannot ban yourself");
  await supabase("chat_bans", {
    method: "POST",
    headers: { Prefer: "return=minimal,resolution=merge-duplicates" },
    body: JSON.stringify({ user_id: userId, banned_by: session.user.id, reason: reason.trim(), active: true, banned_at: new Date().toISOString(), expires_at: expiresAt }),
  });

  return Response.json({ ok: true });
}
