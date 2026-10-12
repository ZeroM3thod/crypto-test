import { NextRequest } from "next/server";
import { bad, getSession, supabase } from "@/lib/auth/backend";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session || (session.user.role !== "admin" && session.user.role !== "owner")) {
    return bad("Unauthorized", 403);
  }

  const messages = await supabase<any[]>(
    `chat_messages?select=id,user_id,username,first_name,last_name,message,is_admin,pinned,deleted,deleted_reason,created_at&order=created_at.asc`
  );

  const rules = await supabase<any[]>(
    `community_rules?select=rule_text&order=rule_order.asc`
  );

  return Response.json({
    messages,
    rules: rules.map(r => r.rule_text),
    exportedAt: new Date().toISOString(),
  });
}
