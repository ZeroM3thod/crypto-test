import { NextRequest, NextResponse } from "next/server";
import {
  assertRateLimit,
  bad,
  createOtp,
  findUserByEmail,
  getDevice,
  normalizeEmail,
  setDeviceCookie,
} from "@/lib/auth/backend";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const device = getDevice(req);

  try {
    await assertRateLimit(req, "forgot_password", device.id);
    const email = normalizeEmail(body?.email);
    const user = await findUserByEmail(email);
    if (!user || user.status !== "active") {
      return setDeviceCookie(bad("We couldn't find an account with that email.", 404), device.id);
    }
    await createOtp(user.id, email, "password_reset");
    return setDeviceCookie(NextResponse.json({ ok: true }), device.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Password reset failed.";
    return setDeviceCookie(bad(message, message.startsWith("Too many") ? 429 : 500), device.id);
  }
}
