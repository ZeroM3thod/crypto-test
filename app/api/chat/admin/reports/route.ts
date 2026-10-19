import { NextRequest } from "next/server";
import { bad, getSession, q, supabase } from "@/lib/auth/backend";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session || !["admin", "owner"].includes(session.user.role || "")) return bad("Unauthorized", 403);
  return Response.json(await supabase<any[]>("chat_reports?select=id,message_id,reported_by,reason,status,created_at,chat_messages(id,user_id,username,message)&status=in.(pending,seen)&order=created_at.desc"));
}

export async function PATCH(req: NextRequest) {
  const session = await getSession(req);
  if (!session || !["admin", "owner"].includes(session.user.role || "")) return bad("Unauthorized", 403);
  const { reportId, action, reason } = await req.json();
  if (typeof reportId !== "string" || !["dismiss", "ban", "seen"].includes(action) || (action === "ban" && (typeof reason !== "string" || !reason.trim()))) return bad("Invalid report action");
  const [report] = await supabase<any[]>(`chat_reports?select=id,message_id,chat_messages(user_id)&id=eq.${q(reportId)}&status=in.(pending,seen)&limit=1`);
  if (!report) return bad("Pending report not found", 404);
  if (report.chat_messages?.user_id === session.user.id) return bad("Cannot take action on your own message");
  if (action === "seen") {
    await supabase(`chat_reports?id=eq.${q(reportId)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ status: "seen", reviewed_by: session.user.id, reviewed_at: new Date().toISOString() }) });
    return Response.json({ ok: true });
  }
  if (action === "ban") {
    const userId = report.chat_messages?.user_id;
    if (!userId || userId === session.user.id) return bad("Cannot ban this user");
    const [existing] = await supabase<any[]>(`chat_bans?select=id&user_id=eq.${q(userId)}&active=eq.true&limit=1`);
    if (!existing) await supabase("chat_bans", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ user_id: userId, banned_by: session.user.id, reason: reason.trim().slice(0, 1000), active: true, banned_at: new Date().toISOString(), expires_at: null }) });
  }
  await supabase(`chat_reports?id=eq.${q(reportId)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ status: action === "ban" ? "reviewed" : "dismissed", reviewed_by: session.user.id, reviewed_at: new Date().toISOString() }) });
  return Response.json({ ok: true });
}
