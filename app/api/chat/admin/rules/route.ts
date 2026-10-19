import { NextRequest } from "next/server";
import { bad, getSession, q, supabase } from "@/lib/auth/backend";

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session || (session.user.role !== "admin" && session.user.role !== "owner")) {
    return bad("Unauthorized", 403);
  }

  const { rules, blockedWords = [] } = await req.json();
  if (!Array.isArray(rules) || rules.length > 50 || rules.some((r) => typeof r !== "string" || !r.trim() || r.length > 500)) return bad("Rules must be at most 50 non-empty strings, max 500 characters each");
  if (!Array.isArray(blockedWords) || blockedWords.length > 100 || blockedWords.some((w: unknown) => typeof w !== "string" || w.length > 100)) return bad("Invalid blocked words");

  await supabase("community_rules?id=not.is.null", { method: "DELETE", headers: { Prefer: "return=minimal" } });
  if (rules.length) await supabase("community_rules", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(rules.map((rule, i) => ({ rule_text: rule.trim(), rule_order: i + 1 }))) });
  await supabase("chat_settings?on_conflict=key", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ key: "blocked_words", value: blockedWords.map((w: string) => w.trim()).filter(Boolean) }) });

  return Response.json({ ok: true });
}
