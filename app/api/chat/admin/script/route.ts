import { NextRequest } from "next/server";
import { bad, getSession, supabase } from "@/lib/auth/backend";

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session || (session.user.role !== "admin" && session.user.role !== "owner")) {
    return bad("Unauthorized", 403);
  }

  const { scriptContent } = await req.json();
  if (!scriptContent?.trim()) return bad("Script content is required");

  const count = await supabase<{ count: number }[]>(`rpc/insert_script_messages`, {
    method: "POST",
    body: JSON.stringify({
      p_script_content: scriptContent.trim(),
      p_admin_id: session.user.id,
    }),
  });

  return Response.json({ ok: true, count: count[0]?.count || 0 });
}
