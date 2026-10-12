import { NextRequest, NextResponse } from "next/server";
import { hash, supabase, q } from "@/lib/auth/backend";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("session_token")?.value;
  
  if (token) {
    // Revoke session in DB
    await supabase(`auth_sessions?token_hash=eq.${q(hash(token))}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ revoked_at: new Date().toISOString() }),
    }).catch(() => {});
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.delete("session_token");
  res.cookies.delete("pending_2fa");
  res.cookies.delete("impersonating_admin_id");
  return res;
}
