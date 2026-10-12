import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
const OTP_TTL_MS = 15 * 60 * 1000;
const SESSION_TTL_MS = 5 * 60 * 60 * 1000;
const PHONE_PATTERN = /^\+[1-9]\d{6,14}$/;

type Dob = { month?: string; day?: string; year?: string };
type DbUser = {
  id: string;
  email: string;
  user_id: string | null;
  password_hash: string;
  status: "pending" | "active";
  role?: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  country?: string | null;
  dob_month?: string | null;
  dob_day?: string | null;
  dob_year?: string | null;
  created_at?: string;
  wallet_address?: string | null;
  kyc_status?: string | null;
  two_fa_enabled?: boolean | null;
  two_fa_secret?: string | null;
  backup_codes?: string[] | null;
  password_changed_at?: string | null;
};
type OtpPurpose = "signup" | "password_reset";

export type AuthUser = DbUser;

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

function supabaseHeaders(extra?: HeadersInit) {
  const key = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

export async function supabase<T>(path: string, init: RequestInit = {}): Promise<T> {
  const base = requireEnv("SUPABASE_URL").replace(/\/$/, "");
  const res = await fetch(`${base}/rest/v1/${path}`, {
    ...init,
    headers: supabaseHeaders(init.headers),
  });
  if (!res.ok) throw new Error(await res.text());
  const text = await res.text();
  if (!text) return null as T;
  return JSON.parse(text) as T;
}

function q(value: string) {
  return encodeURIComponent(value);
}

export { q };

export function bad(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}

export function normalizeEmail(email: unknown) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

export function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function authSecret() {
  return process.env.AUTH_SECRET || process.env.OTP_SECRET || requireEnv("SUPABASE_SERVICE_ROLE_KEY");
}

export function signValue(value: string) {
  return createHmac("sha256", authSecret()).update(value).digest("hex");
}

export function avatarForUser(id: string) {
  const files = [
    "0ba54b0d95.svg",
    "120029819f.svg",
    "2dfd8e6133.svg",
    "4043a3e4ce.svg",
    "46a901bfbd.svg",
    "627297a79c.svg",
    "7a9c48e1b9.svg",
    "7d399d1de0.svg",
    "94b4a92d42.svg",
    "a1ac78ebe2.svg",
    "a624e74456.svg",
    "d251fcc9b1.svg",
  ];
  return `/avatar/${files[parseInt(hash(id).slice(0, 8), 16) % files.length]}`;
}

export function getIp(req: NextRequest) {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export function getDevice(req: NextRequest) {
  const existing = req.cookies.get("auth_device_id")?.value;
  return { id: existing || randomBytes(16).toString("hex"), isNew: !existing };
}

export function setDeviceCookie(res: NextResponse, deviceId: string) {
  res.cookies.set("auth_device_id", deviceId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return res;
}

export async function assertRateLimit(req: NextRequest, action: string, deviceId: string) {
  const since = new Date(Date.now() - TWELVE_HOURS_MS).toISOString();
  const ipHash = hash(getIp(req));
  const deviceHash = hash(deviceId || req.headers.get("user-agent") || "unknown");
  const [ipRows, deviceRows] = await Promise.all([
    supabase<{ id: string }[]>(`auth_attempts?select=id&action=eq.${q(action)}&ip_hash=eq.${q(ipHash)}&created_at=gte.${q(since)}`),
    supabase<{ id: string }[]>(`auth_attempts?select=id&action=eq.${q(action)}&device_hash=eq.${q(deviceHash)}&created_at=gte.${q(since)}`),
  ]);
  if (ipRows.length >= 5 || deviceRows.length >= 5) {
    throw new Error("Too many attempts. Please try again after 12 hours.");
  }
  return { ipHash, deviceHash };
}

export async function recordFailedAuthAttempt(action: string, ipHash: string, deviceHash: string) {
  await supabase("auth_attempts", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ action, ip_hash: ipHash, device_hash: deviceHash }),
  });
}

export function validatePhone(phone: string) {
  return PHONE_PATTERN.test(phone.replace(/[\s-]/g, ""));
}

export function passwordHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${key}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;
  const actual = Buffer.from(scryptSync(password, salt, 64).toString("hex"));
  const expected = Buffer.from(key);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function otpHash(email: string, code: string, purpose: OtpPurpose) {
  return hash(`${email}:${purpose}:${code}:${process.env.OTP_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || ""}`);
}

function code6() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function sendOtp(email: string, code: string, purpose: OtpPurpose) {
  const subject = purpose === "signup" ? "Confirm your account" : "Reset your password";
  const text = `Your ${subject.toLowerCase()} code is ${code}. It expires in 15 minutes.`;
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_EMAIL_FROM;
  if (apiKey && from) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: email, subject, text }),
    });
    if (!res.ok) {
      if (process.env.NODE_ENV !== "production") {
        console.info(`[auth:${purpose}] ${email} code: ${code}`);
        return;
      }
      throw new Error(await res.text());
    }
    return;
  }
  if (process.env.NODE_ENV === "production") throw new Error("Email provider is not configured.");
  console.info(`[auth:${purpose}] ${email} code: ${code}`);
}

export async function createOtp(userId: string, email: string, purpose: OtpPurpose) {
  const code = code6();
  await supabase("auth_otps", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      user_id: userId,
      purpose,
      code_hash: otpHash(email, code, purpose),
      expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
    }),
  });
  await sendOtp(email, code, purpose);
}

export async function verifyOtp(email: string, code: string, purpose: OtpPurpose, consume = true) {
  const users = await supabase<DbUser[]>(`auth_users?select=*&email=eq.${q(email)}&limit=1`);
  const user = users[0];
  if (!user) return null;
  const rows = await supabase<{ id: string; expires_at: string }[]>(
    `auth_otps?select=id,expires_at&user_id=eq.${q(user.id)}&purpose=eq.${q(purpose)}&code_hash=eq.${q(otpHash(email, code, purpose))}&consumed_at=is.null&order=created_at.desc&limit=1`,
  );
  const otp = rows[0];
  if (!otp || new Date(otp.expires_at).getTime() < Date.now()) return null;
  if (consume) {
    await supabase(`auth_otps?id=eq.${q(otp.id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ consumed_at: new Date().toISOString() }),
    });
  }
  return user;
}

async function userIdExists(userId: string) {
  const rows = await supabase<{ id: string }[]>(`auth_users?select=id&user_id=eq.${q(userId)}&limit=1`);
  return rows.length > 0;
}

export async function generateUserId() {
  for (let i = 0; i < 20; i++) {
    const userId = String(Math.floor(100000 + Math.random() * 900000));
    if (!(await userIdExists(userId))) return userId;
  }
  throw new Error("Could not generate user ID.");
}

export async function findUserByEmail(email: string) {
  const rows = await supabase<DbUser[]>(`auth_users?select=*&email=eq.${q(email)}&limit=1`);
  return rows[0] || null;
}

export async function deleteExpiredPendingUsers() {
  const cutoff = new Date(Date.now() - OTP_TTL_MS).toISOString();
  await supabase(`auth_users?status=eq.pending&created_at=lt.${q(cutoff)}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  });
}

export async function findUserByIdentifier(identifier: string) {
  const column = /^\d{6}$/.test(identifier) ? "user_id" : "email";
  const rows = await supabase<DbUser[]>(`auth_users?select=*&${column}=eq.${q(identifier.toLowerCase())}&limit=1`);
  return rows[0] || null;
}

export async function createPendingUser(input: {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  country: string;
  dob: Dob;
  referral: string;
  password: string;
  ipHash: string;
  deviceHash: string;
}) {
  const [setting] = await supabase<{ value: boolean | string }[]>(`auth_settings?select=value&key=eq.restricted_mode&limit=1`).catch(() => []);
  const restrictedMode = setting?.value === true || setting?.value === "true";
  const referral = input.referral.trim();
  const visibleByReferral = referral
    ? (await supabase<{ public_id: string }[]>(`restricted_people?select=public_id&public_id=eq.${q(referral)}&limit=1`).catch(() => [])).length > 0
    : false;
  const body = {
    first_name: input.firstName.trim(),
    last_name: input.lastName.trim(),
    email: input.email,
    phone: input.mobile.trim(),
    country: input.country.trim(),
    dob_month: input.dob.month || null,
    dob_day: input.dob.day || null,
    dob_year: input.dob.year || null,
    dob_raw: input.dob,
    referral_code: referral || null,
    hidden_from_admins: restrictedMode && !visibleByReferral,
    wallet_address: generateWalletAddress(),
    password_hash: passwordHash(input.password),
    created_ip_hash: input.ipHash,
    created_device_hash: input.deviceHash,
    status: "pending",
  };
  const rows = await supabase<DbUser[]>("auth_users", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(body),
  });
  const user = rows[0];
  await supabase("wallet_accounts", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify([
      { user_id: user.id, wallet: "main", balance: 0, address: body.wallet_address },
      { user_id: user.id, wallet: "investment", balance: 0, address: null },
      { user_id: user.id, wallet: "trading", balance: 0, address: null },
    ]),
  });
  return user;
}

export async function updateUser(id: string, body: Record<string, unknown>) {
  const rows = await supabase<DbUser[]>(`auth_users?id=eq.${q(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(body),
  });
  return rows[0];
}

export async function createSession(user: DbUser, remember: boolean) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  await supabase("auth_sessions", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ user_id: user.id, token_hash: hash(token), expires_at: expiresAt }),
  });
  
  // Determine redirect based on role
  let redirect = "/dashboard";
  if (user.role === "owner") {
    redirect = "/owner";
  } else if (user.role === "admin") {
    redirect = "/admin/dashboard";
  }
  
  const res = NextResponse.json({ ok: true, redirect });
  res.cookies.set("session_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_MS / 1000,
    path: "/",
  });
  return res;
}

export function createPending2fa(user: DbUser, remember: boolean) {
  const payload = `${user.id}:${remember ? "1" : "0"}:${Date.now()}`;
  const res = NextResponse.json({ twoFactorRequired: true, redirect: "/signin/2fa" });
  res.cookies.set("pending_2fa", `${payload}.${signValue(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 10 * 60,
    path: "/",
  });
  return res;
}

export function readPending2fa(req: NextRequest) {
  const raw = req.cookies.get("pending_2fa")?.value;
  const [payload, sig] = raw?.split(".") || [];
  if (!payload || sig !== signValue(payload)) return null;
  const [userId, remember, created] = payload.split(":");
  if (!userId || Date.now() - Number(created) > 10 * 60 * 1000) return null;
  return { userId, remember: remember === "1" };
}

export async function findUserById(id: string) {
  const rows = await supabase<DbUser[]>(`auth_users?select=*&id=eq.${q(id)}&limit=1`);
  return rows[0] || null;
}

export async function getSessionTokenUser(token: string) {
  const rows = await supabase<{ user_id: string; expires_at: string; auth_users: DbUser }[]>(
    `auth_sessions?select=user_id,expires_at,auth_users(*)&token_hash=eq.${q(hash(token))}&revoked_at=is.null&limit=1`,
  );
  const session = rows[0];
  if (!session || new Date(session.expires_at).getTime() < Date.now()) return null;
  return session.auth_users;
}

export async function getSession(req: NextRequest) {
  const token = req.cookies.get("session_token")?.value;
  if (!token) return null;
  const rows = await supabase<{ id: string; user_id: string; expires_at: string; auth_users: DbUser }[]>(
    `auth_sessions?select=id,user_id,expires_at,auth_users(*)&token_hash=eq.${q(hash(token))}&revoked_at=is.null&limit=1`,
  );
  const session = rows[0];
  if (!session || new Date(session.expires_at).getTime() < Date.now()) return null;
  return { ...session, user: session.auth_users };
}

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function randomBase32(length = 32) {
  const bytes = randomBytes(length);
  let out = "";
  for (const b of bytes) out += BASE32[b % BASE32.length];
  return out;
}

function base32ToBuffer(input: string) {
  let bits = "";
  for (const c of input.replace(/=+$/g, "").toUpperCase()) {
    const v = BASE32.indexOf(c);
    if (v < 0) continue;
    bits += v.toString(2).padStart(5, "0");
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

export function totp(secret: string, step = Math.floor(Date.now() / 30000)) {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(step));
  const hmac = createHmac("sha1", base32ToBuffer(secret)).update(msg).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code = (hmac.readUInt32BE(offset) & 0x7fffffff) % 1000000;
  return String(code).padStart(6, "0");
}

export function verifyTotp(secret: string, code: string) {
  const clean = code.replace(/\s/g, "");
  const now = Math.floor(Date.now() / 30000);
  return [-1, 0, 1].some((w) => totp(secret, now + w) === clean);
}

export function backupCodes() {
  return Array.from({ length: 8 }, () => randomBytes(4).toString("hex").toUpperCase().replace(/(.{4})/, "$1-"));
}

export function generateWalletAddress() {
  return `0x${randomBytes(20).toString("hex")}`;
}

export function txHash() {
  return `0x${randomBytes(12).toString("hex")}`;
}
