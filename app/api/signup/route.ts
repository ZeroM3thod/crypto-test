import { NextRequest, NextResponse } from "next/server";
import {
  assertRateLimit,
  bad,
  createOtp,
  createPendingUser,
  deleteExpiredPendingUsers,
  findUserByEmail,
  getDevice,
  normalizeEmail,
  recordFailedAuthAttempt,
  setDeviceCookie,
  validatePhone,
} from "@/lib/auth/backend";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const device = getDevice(req);

  try {
    const limits = await assertRateLimit(req, "signup", device.id);
    await deleteExpiredPendingUsers();
    const email = normalizeEmail(body?.email);
    const firstName = String(body?.firstName || "").trim();
    const lastName = String(body?.lastName || "").trim();
    const mobile = String(body?.mobile || "").trim();
    const country = String(body?.country || "").trim();
    const password = String(body?.password || "");
    if (!firstName || !lastName || !email || !mobile || !country || password.length < 8) {
      await recordFailedAuthAttempt("signup", limits.ipHash, limits.deviceHash);
      return setDeviceCookie(bad("Please complete all required fields."), device.id);
    }
    if (!validatePhone(mobile)) {
      await recordFailedAuthAttempt("signup", limits.ipHash, limits.deviceHash);
      return setDeviceCookie(bad("Phone number must include + country code."), device.id);
    }
    const existing = await findUserByEmail(email);
    if (existing?.status === "active") {
      await recordFailedAuthAttempt("signup", limits.ipHash, limits.deviceHash);
      return setDeviceCookie(bad("That email is already registered.", 409), device.id);
    }
    const user = existing || await createPendingUser({
      firstName,
      lastName,
      email,
      mobile,
      country,
      dob: body?.dob || {},
      referral: String(body?.referral || ""),
      password,
      ...limits,
    });
    await createOtp(user.id, email, "signup");
    return setDeviceCookie(NextResponse.json({ ok: true }), device.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Signup failed.";
    return setDeviceCookie(bad(message, message.startsWith("Too many") ? 429 : 500), device.id);
  }
}
