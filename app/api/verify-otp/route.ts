import { NextRequest, NextResponse } from "next/server";
import {
  bad,
  createSession,
  deleteExpiredPendingUsers,
  findUserByEmail,
  generateUserId,
  normalizeEmail,
  updateUser,
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
    const user = await verifyOtp(email, cleanCode, purpose, purpose === "signup");
    if (!user) return bad("Invalid code.", 400);
    if (purpose === "signup") {
      const userId = await generateUserId();
      const active = await updateUser(user.id, {
        user_id: userId,
        status: "active",
        verified_at: new Date().toISOString(),
      });
      return createSession(active, false);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Verification failed.";
    return bad(message, 500);
  }
}
