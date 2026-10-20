import { NextRequest } from "next/server";
import { bad, getSession, supabase } from "@/lib/auth/backend";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session || !["admin", "owner"].includes(session.user.role || "")) return bad("Unauthorized", 403);
  let body: any;
  try { body = await req.json(); } catch { return bad("Invalid JSON"); }
  const lines = body?.lines;
  if (!Array.isArray(lines) || !lines.length || lines.length > 100 || lines.some((l: any) => typeof l?.username !== "string" || !l.username.trim() || typeof l?.message !== "string" || !l.message.trim() || l.message.length > 2000 || !Number.isFinite(Date.parse(l.scheduledAt)))) return bad("Provide 1-100 valid scheduled messages");
  const added = lines.map((l: any) => ({ username: l.username.trim().slice(0, 24), message: l.message.trim(), scheduled_at: new Date(l.scheduledAt).toISOString(), created_by: session.user.id }));
  const result = await supabase<any[]>("chat_scheduled_messages", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(added) });
  return Response.json({ ok: true, count: result.length });
}

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);
  return Response.json({ ok: true });
}
