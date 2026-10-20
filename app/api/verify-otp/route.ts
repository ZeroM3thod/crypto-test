import { NextRequest, NextResponse } from "next/server";
import {
  bad,
  createSession,
  deleteExpiredPendingUsers,
  findUserByEmail,
  generateUserId,
  normalizeEmail,
  updateUser,
  supabase,
  q,
  verifyOtp,
} from "@/lib/auth/backend";

export async function POST(req: NextRequest) {
  const { email: rawEmail, code } = await req.json().catch(() => ({}));
  const email = normalizeEmail(rawEmail);
  const cleanCode = String(code || "");

  try {
    await deleteExpiredPendingUsers();
    const existing = await findUserByEmail(email);
    const purpose = existing?.status === "pending" ? "signup" : "password_reset";
    // Verification can fail later while activating the account; don't consume the OTP until that succeeds.
    const user = await verifyOtp(email, cleanCode.trim(), purpose, false);
    if (!user) return bad("Invalid code.", 400);
    if (purpose === "signup") {
      const userId = await generateUserId();
      const active = await updateUser(user.id, {
        user_id: userId,
        status: "active",
        verified_at: new Date().toISOString(),
      });
      const refCode = String(user.referral_code || "").trim();
      if (refCode) {
        const owners = await supabase<{id:string}[]>(`auth_users?select=id&or=(user_id.eq.${q(refCode)},referral_code.eq.${q(refCode)})&status=eq.active&limit=1`);
        if (owners[0] && owners[0].id !== user.id) await supabase("referrals?on_conflict=referred_id", {method:"POST",headers:{Prefer:"resolution=ignore-duplicates,return=minimal"},body:JSON.stringify({referrer_id:owners[0].id,referred_id:user.id})});
      }
      return createSession(active, false);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Verification failed.";
    return bad(message, 500);
  }
}
