import { NextRequest, NextResponse } from "next/server";
import {
  backupCodes,
  bad,
  getSession,
  passwordHash,
  q,
  randomBase32,
  supabase,
  updateUser,
  verifyPassword,
  verifyTotp,
} from "@/lib/auth/backend";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);
  const rows = await supabase<{ id: string; created_at: string; expires_at: string }[]>(
    `auth_sessions?select=id,created_at,expires_at&user_id=eq.${q(session.user.id)}&revoked_at=is.null&order=created_at.desc`,
  );
  return NextResponse.json({
    twoFaEnabled: Boolean(session.user.two_fa_enabled),
    passwordChangedAt: session.user.password_changed_at || session.user.created_at || "",
    sessions: rows.map((s) => ({
      id: s.id,
      device: s.id === session.id ? "Current browser" : "Signed-in device",
      ip: "Stored by server",
      location: "Unknown",
      time: s.created_at,
      current: s.id === session.id,
    })),
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);
  const body = await req.json().catch(() => null);
  const action = String(body?.action || "");

  if (action === "password") {
    const current = String(body?.current || "");
    const next = String(body?.next || "");
    if (next.length < 8) return bad("Use at least 8 characters.");
    if (!verifyPassword(current, session.user.password_hash)) return bad("Wrong current password.", 401);
    await updateUser(session.user.id, { password_hash: passwordHash(next), password_changed_at: new Date().toISOString() });
    return NextResponse.json({ ok: true });
  }

  if (action === "2fa_setup") {
    const secret = randomBase32();
    const codes = backupCodes();
    await updateUser(session.user.id, { two_fa_secret: secret, backup_codes: codes });
    const label = encodeURIComponent(`Crypto Invest:${session.user.email}`);
    const issuer = encodeURIComponent("Crypto Invest");
    const otpauth = `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
    const qr = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(otpauth)}`;
    return NextResponse.json({ secret, backupCodes: codes, qr, otpauth });
  }

  if (action === "2fa_enable") {
    const code = String(body?.code || "");
    if (!session.user.two_fa_secret || !verifyTotp(session.user.two_fa_secret, code)) return bad("Invalid 2FA code.");
    await updateUser(session.user.id, { two_fa_enabled: true });
    return NextResponse.json({ ok: true });
  }

  if (action === "2fa_disable") {
    const password = String(body?.password || "");
    const code = String(body?.code || "");
    const ok = password
      ? verifyPassword(password, session.user.password_hash)
      : Boolean(session.user.two_fa_secret && verifyTotp(session.user.two_fa_secret, code));
    if (!ok) return bad("Enter your password or a valid 2FA code.", 401);
    await updateUser(session.user.id, { two_fa_enabled: false, two_fa_secret: null, backup_codes: null });
    return NextResponse.json({ ok: true });
  }

  if (action === "revoke_session") {
    await supabase(`auth_sessions?id=eq.${q(String(body?.id || ""))}&user_id=eq.${q(session.user.id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ revoked_at: new Date().toISOString() }),
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "revoke_others") {
    await supabase(`auth_sessions?user_id=eq.${q(session.user.id)}&id=neq.${q(session.id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ revoked_at: new Date().toISOString() }),
    });
    return NextResponse.json({ ok: true });
  }

  return bad("Unknown action.");
}
