import { NextRequest } from "next/server";
import { bad, getSession, supabase, q } from "@/lib/auth/backend";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);
  const rows = await supabase<any[]>(
    `send_transactions?select=tx_hash,amount,fee,total,note,status,created_at,sender:auth_users!send_transactions_sender_id_fkey(first_name,last_name,email)&recipient_id=eq.${q(session.user.id)}&receipt_seen=eq.false&order=created_at.asc&limit=50`
  );
  return Response.json({ receipts: rows.map((r) => ({
    id: r.tx_hash,
    amount: Number(r.amount),
    fee: Number(r.fee),
    total: Number(r.total),
    note: r.note,
    status: r.status,
    date: r.created_at,
    sender: `${r.sender.first_name} ${r.sender.last_name}`.trim(),
    email: r.sender.email,
  })) });
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);
  const { ids } = await req.json().catch(() => ({ ids: [] }));
  if (!Array.isArray(ids) || !ids.length || ids.some((id) => typeof id !== "string")) return bad("ids required");
  await supabase(`send_transactions?recipient_id=eq.${q(session.user.id)}&tx_hash=in.(${ids.map(q).join(",")})`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ receipt_seen: true }),
  });
  return Response.json({ success: true });
}
