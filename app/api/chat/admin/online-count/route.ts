import { NextRequest } from "next/server";
import { bad, getSession, supabase } from "@/lib/auth/backend";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session || (session.user.role !== "admin" && session.user.role !== "owner")) return bad("Unauthorized", 403);
  const [row] = await supabase<any[]>("chat_settings?select=value&key=eq.online_count_override&limit=1");
  return Response.json({ count: row?.value ?? null });
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session || (session.user.role !== "admin" && session.user.role !== "owner")) {
    return bad("Unauthorized", 403);
  }

  const { count } = await req.json();
  if (count !== null && (!Number.isInteger(count) || count < 0 || count > 100000)) return bad("Count must be null or an integer from 0 to 100000");

  await supabase("chat_settings?on_conflict=key", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ key: "online_count_override", value: count }),
  });

  return Response.json({ ok: true });
}
