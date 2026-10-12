import { NextRequest } from "next/server";
import { bad, getSession, supabase } from "@/lib/auth/backend";

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session || (session.user.role !== "admin" && session.user.role !== "owner")) {
    return bad("Unauthorized", 403);
  }

  const { userId } = await req.json();
  if (!userId) return bad("User ID is required");

  await supabase(`rpc/unban_user_from_chat`, {
    method: "POST",
    body: JSON.stringify({
      p_user_id: userId,
      p_admin_id: session.user.id,
    }),
  });

  return Response.json({ ok: true });
}
