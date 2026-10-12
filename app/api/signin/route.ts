import { NextRequest } from "next/server";
import {
  assertRateLimit,
  bad,
  createSession,
  createPending2fa,
  findUserByIdentifier,
  getDevice,
  getIp,
  hash,
  recordFailedAuthAttempt,
  setDeviceCookie,
  verifyPassword,
} from "@/lib/auth/backend";
import { recordLoginAttempt } from "@/lib/auth/login-history";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const device = getDevice(req);
  const ipAddress = getIp(req);
  const ipHash = hash(ipAddress);
  const deviceHash = hash(device.id);
  const userAgent = req.headers.get("user-agent") || "Unknown";

  try {
    await assertRateLimit(req, "signin", device.id);
    const identifier = String(body?.identifier || "").trim().toLowerCase();
    const password = String(body?.password || "");
    const user = await findUserByIdentifier(identifier);

    // User not found or wrong password
    if (!user || user.status !== "active" || !verifyPassword(password, user.password_hash)) {
      await recordFailedAuthAttempt("signin", ipHash, deviceHash);
      await recordLoginAttempt({
        userId: user?.id,
        email: user?.email || identifier,
        status: "failed",
        ipAddress,
        ipHash,
        deviceHash,
        userAgent,
        failureReason: !user ? "User not found" : user.status !== "active" ? "Account inactive" : "Wrong password",
      });
      return setDeviceCookie(bad("Invalid email/user ID or password.", 401), device.id);
    }

    // 2FA required
    if (user.two_fa_enabled && user.two_fa_secret) {
      return setDeviceCookie(createPending2fa(user, Boolean(body?.remember)), device.id);
    }

    // Success - record and create session
    await recordLoginAttempt({
      userId: user.id,
      email: user.email,
      status: "success",
      ipAddress,
      ipHash,
      deviceHash,
      userAgent,
    });

    return setDeviceCookie(await createSession(user, Boolean(body?.remember)), device.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sign in failed.";
    return setDeviceCookie(bad(message, message.startsWith("Too many") ? 429 : 500), device.id);
  }
}
