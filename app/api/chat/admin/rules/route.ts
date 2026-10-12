import { NextRequest } from "next/server";
import { bad, getSession, q, supabase } from "@/lib/auth/backend";

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session || (session.user.role !== "admin" && session.user.role !== "owner")) {
    return bad("Unauthorized", 403);
  }

  const { rules } = await req.json();
  if (!Array.isArray(rules)) return bad("Rules must be an array");

  // Delete all existing rules
  await supabase(`community_rules`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  });

  // Insert new rules
  if (rules.length > 0) {
    await supabase("community_rules", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(
        rules.map((rule, i) => ({
          rule_text: rule,
          rule_order: i + 1,
        }))
      ),
    });
  }

  return Response.json({ ok: true });
}
