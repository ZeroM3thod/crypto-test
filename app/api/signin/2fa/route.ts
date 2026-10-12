import { NextRequest } from "next/server";
import { bad, createSession, findUserById, readPending2fa, verifyTotp } from "@/lib/auth/backend";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const pending = readPending2fa(req);
  if (!pending) return bad("2FA session expired. Sign in again.", 401);

  const user = await findUserById(pending.userId);
  const code = String(body?.code || "");
  if (!user?.two_fa_secret || !verifyTotp(user.two_fa_secret, code)) return bad("Invalid 2FA code.", 400);

  const res = await createSession(user, pending.remember);
  res.cookies.delete("pending_2fa");
  return res;
}
