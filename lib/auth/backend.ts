import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { renderOtpEmail } from "@/lib/email/templates/otp";

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
  referral_code?: string | null;
  kyc_status?: string | null;
  two_fa_enabled?: boolean | null;
  two_fa_secret?: string | null;
  backup_codes?: string[] | null;
  password_changed_at?: string | null;
  hidden_from_admins?: boolean | null;
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
    "280411580b.svg",
    "2dfd8e6133.svg",
    "37af80f2e8.svg",
    "3a3ef3c153.svg",
    "4043a3e4ce.svg",
    "46a901bfbd.svg",
    "627297a79c.svg",
    "74af47c15d.svg",
    "7a9c48e1b9.svg",
    "7c92a8fc73.svg",
    "7d399d1de0.svg",
    "87e9ca199a.svg",
    "88b158c9e6.svg",
    "94b4a92d42.svg",
    "a1ac78ebe2.svg",
    "a5ccb5667b.svg",
    "a624e74456.svg",
    "c16bb9db41.svg",
    "d251fcc9b1.svg",
    "f68735a503.svg",
  ];
  const fakeNames = "Anik_H Rahim_K Sadia_A Tanvir_M Nabil_R Fahim_H Rafi_S Imran_C Nusrat_J Sakib_A Mahin_T Ayesha_R Arif_M Tanjim_S Mim_N Shanto_D Sumaiya_F Rakib_U Farhan_I Jannat_B Aarav_S Vivaan_P Aanya_G Ishaan_R Diya_M Aditya_K Priya_S Arjun_V Ananya_D Rohan_J Kabir_A Meera_N Reyansh_T Ira_B Kavya_L Dev_C Aditi_W Vihaan_Q Saanvi_H Aryan_F Liam_W Noah_B Olivia_C Emma_D Lucas_M Mia_T Ethan_R Amelia_S Leo_P Sofia_G Mateo_L Isabella_K Oliver_J Chloe_N Daniel_A Yuki_T Haruto_S Sakura_M Ren_K Aiko_N Minjun_P Jiwoo_H Seojun_L Hana_C Jisoo_R Wei_Z Mei_L Jun_W Yuna_K Hiro_D Omar_A Layla_H Zain_R Mariam_S Yusuf_K Amir_N Noor_F Leila_M Samir_B Dina_T Luca_R Giulia_M Marco_F Elena_C Matteo_S Ines_D Hugo_P Camila_V Thiago_L Valentina_G Kwame_A Ama_B Kofi_D Zuri_M Nia_K Chidi_O Amara_E Tariq_J Amina_Y Malik_F Dara_S Sokha_N Minh_T Linh_P Arun_V Priyanka_D Kiran_J Riya_M Devika_S Ishan_B Maya_R Neil_K Tara_C Zoya_N Aman_L Hasan_Q Raisa_T Muntasir_E Tahmid_W Afra_Z Sohan_P Nafisa_G Adnan_Y Irfan_D Lamia_V Bikash_N Pooja_A Rahul_C Sneha_J Kunal_F Ishita_W Manav_B Riddhi_T Parth_M Shreya_K Zara_H Elias_P Mila_R Adam_S Lena_V Alex_D Ella_N James_C Ruby_L Oscar_F Amir_T Sara_B Rami_K Yara_M Talia_S Niko_A Elif_D Emir_G Aylin_P Kerem_J Diego_M Lucia_R Andres_C Sofia_L Pablo_T Freya_N Erik_B Astrid_H Sven_K Maja_D Maksim_P Anya_S Nikita_V Alina_C Dmitri_J Laila_R Owen_M Zane_T Kiara_B Jayden_N Aiden_F Ava_G Mason_W Layla_D Ezra_K Nora_P Theo_S Aria_C Kai_L Ivy_R Niamh_B Callum_M Freddie_J Isla_T Rowan_V Santiago_N Mariana_F Enzo_D Alma_K Rafael_P Aarohi_S Krishna_M Anushka_R Dhruv_C Ved_T Srinidhi_A Nandini_B Ritvik_J Ishani_V Om_L Ratul_M Oishi_D Mehedi_R Pritom_S Tisha_A Shafin_K Rumana_J Afnan_B Zubair_T Samiha_N Jubayer_F Rashed_C Maliha_P Saif_V Tasmia_G Shreyan_H Anvi_D Aarush_L Myra_W Reva_K Ibrahim_M Fatima_R Hamza_S Salma_A Bilal_N Nour_C Rayan_T Hiba_J Yara_F Karim_P Mariam_D Youssef_V Inaya_B Idris_K Aisha_L Abena_M Kojo_R Efua_S Tunde_A Lerato_N Sipho_D Thandi_J Neo_P Kabelo_F Amari_C Chloe_W Nathan_G Grace_T Isaac_B Zoe_H Evan_M Lily_R Ryan_S Hannah_K Aaron_D Junseo_P Sora_N Taeyang_C Nari_L Doyun_V Akira_J Rin_F Kaito_B Emi_T Naoki_A An_M Bao_R Thao_S Khanh_D Phuc_K Srey_P Vanna_C Dara_L Bounmy_N Kham_T Rohan_F Aarush_J Naira_V Yash_B Suhani_G Zainab_M Farid_R Hassan_C Rania_K Mina_D Elena_P Gabriel_S Nina_T Felix_A Milo_W Amelie_N Louis_B Clara_J Jonas_V Lara_F".split(" ");
  const key = id.trim().toLowerCase();
  const index = fakeNames.findIndex((name) => name.toLowerCase() === key);
  return `/avatar/${files[parseInt(hash(index < 0 ? id : `fake-user-${index}`).slice(0, 8), 16) % files.length]}`;
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

export async function assertRateLimit(req: NextRequest, action: string, deviceId: string, maxRequests = 5) {
  const since = new Date(Date.now() - TWELVE_HOURS_MS).toISOString();
  const ipHash = hash(getIp(req));
  const deviceHash = hash(deviceId || req.headers.get("user-agent") || "unknown");
  const [ipRows, deviceRows] = await Promise.all([
    supabase<{ id: string }[]>(`auth_attempts?select=id&action=eq.${q(action)}&ip_hash=eq.${q(ipHash)}&created_at=gte.${q(since)}`),
    supabase<{ id: string }[]>(`auth_attempts?select=id&action=eq.${q(action)}&device_hash=eq.${q(deviceHash)}&created_at=gte.${q(since)}`),
  ]);
  if (ipRows.length >= maxRequests || deviceRows.length >= maxRequests) {
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
  const { subject, html, text } = renderOtpEmail({
    code,
    purpose: purpose === "password_reset" ? "reset" : purpose,
    expiresInMinutes: OTP_TTL_MS / 60_000,
  });
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_EMAIL_FROM;
  if (apiKey && from) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: email, subject, html, text }),
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
