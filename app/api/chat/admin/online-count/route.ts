import { NextRequest } from "next/server";
import { bad, getSession, supabase } from "@/lib/auth/backend";

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session || (session.user.role !== "admin" && session.user.role !== "owner")) {
    return bad("Unauthorized", 403);
  }

  const { count } = await req.json();

  await supabase(`chat_settings?key=eq.online_count_override`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ value: count === null ? "null" : count }),
  });

  return Response.json({ ok: true });
}
