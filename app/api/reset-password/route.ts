import { NextRequest, NextResponse } from "next/server";
import { bad, normalizeEmail, passwordHash, updateUser, verifyOtp } from "@/lib/auth/backend";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = normalizeEmail(body?.email);
  const code = String(body?.otp || "");
  const password = String(body?.password || "");
  if (password.length < 8) return bad("Use at least 8 characters.");

  try {
    const user = await verifyOtp(email, code, "password_reset");
    if (!user) return bad("Invalid code.", 400);
    await updateUser(user.id, { password_hash: passwordHash(password) });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Password update failed.";
    return bad(message, 500);
  }
}
