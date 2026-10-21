import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail, normalizeEmail, q, supabase } from "@/lib/auth/backend";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = normalizeEmail(body?.email);
  const referral = typeof body?.referral === "string" ? body.referral.trim() : "";
  try {
    const [user, owners] = await Promise.all([
      email ? findUserByEmail(email) : null,
      referral ? supabase<{ id: string }[]>(`auth_users?select=id&or=(user_id.eq.${q(referral)},referral_code.eq.${q(referral)})&status=eq.active&limit=1`) : Promise.resolve([]),
    ]);
    return NextResponse.json({ emailExists: Boolean(user), referralExists: !referral || owners.length > 0 });
  } catch {
    return NextResponse.json({ message: "Could not validate signup details." }, { status: 500 });
  }
}
