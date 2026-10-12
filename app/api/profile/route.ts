import { NextRequest, NextResponse } from "next/server";
import { avatarForUser, bad, getSession, q, supabase, updateUser, validatePhone, verifyPassword, type AuthUser } from "@/lib/auth/backend";

const MONTHS: Record<string, string> = {
  january: "01",
  february: "02",
  march: "03",
  april: "04",
  may: "05",
  june: "06",
  july: "07",
  august: "08",
  september: "09",
  october: "10",
  november: "11",
  december: "12",
};

function dob(u: { dob_year?: string | null; dob_month?: string | null; dob_day?: string | null }) {
  if (!u.dob_year || !u.dob_month || !u.dob_day) return "";
  const month = MONTHS[String(u.dob_month).toLowerCase()] || String(u.dob_month).padStart(2, "0");
  const day = String(u.dob_day).padStart(2, "0");
  if (!/^\d{4}$/.test(String(u.dob_year)) || !/^\d{2}$/.test(month) || !/^\d{2}$/.test(day)) return "";
  return `${u.dob_year}-${month}-${day}`;
}

function profile(u: AuthUser) {
  const fullName = `${u.first_name || ""} ${u.last_name || ""}`.trim();
  const fields = [u.email, fullName, dob(u), u.country, u.wallet_address, u.kyc_status === "verified", u.two_fa_enabled];
  return {
    id: u.id,
    firstName: u.first_name || "",
    lastName: u.last_name || "",
    fullName,
    userId: u.user_id || u.id,
    email: u.email,
    mobile: u.phone || "",
    dob: dob(u),
    memberSince: u.created_at || new Date().toISOString(),
    walletAddress: u.wallet_address || "Not set",
    country: u.country || "",
    kycVerified: u.kyc_status === "verified",
    twoFaEnabled: Boolean(u.two_fa_enabled),
    avatarUrl: avatarForUser(u.id),
    passwordChangedAt: u.password_changed_at || u.created_at || "",
    profileStrength: Math.round((fields.filter(Boolean).length / fields.length) * 100),
  };
}

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);
  return NextResponse.json({ profile: profile(session.user) });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);
  const body = await req.json().catch(() => null);
  const firstName = String(body?.firstName || "").trim();
  const lastName = String(body?.lastName || "").trim();
  const phone = String(body?.mobile || "").trim();
  const country = String(body?.country || "").trim();
  const [year, month, day] = String(body?.dob || "").split("-");
  if (!firstName || !lastName) return bad("First and last name are required.");
  if (phone && !validatePhone(phone)) return bad("Phone number must include + country code.");

  const user = await updateUser(session.user.id, {
    first_name: firstName,
    last_name: lastName,
    phone,
    country,
    dob_year: year || null,
    dob_month: month || null,
    dob_day: day || null,
  });
  return NextResponse.json({ profile: profile(user) });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);
  const body = await req.json().catch(() => null);
  if (!verifyPassword(String(body?.password || ""), session.user.password_hash)) return bad("Wrong password.", 401);
  await supabase(`auth_users?id=eq.${q(session.user.id)}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("auth_session");
  return res;
}
