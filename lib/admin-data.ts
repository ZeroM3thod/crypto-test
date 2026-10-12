// lib/admin-data.ts
import { db } from "@/lib/db";
import type { UserRow } from "@/lib/users-data";

export type AdminRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "suspended";
  usersManaged: number;
  lastLogin: string;
  createdAt: string;
};

export type ManagedUser = UserRow & { hiddenFromAdmins: boolean };

export type RestrictedEntry = {
  id: string;
  name: string;
  kind: "Admin" | "User";
  addedAt: string;
};

type DbAuthUser = {
  id: string;
  user_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string;
  country: string | null;
  status: "active" | "suspended" | "pending";
  role: "user" | "admin" | "owner";
  kyc_status: string | null;
  two_fa_enabled: boolean | null;
  referral_code: string | null;
  hidden_from_admins: boolean | null;
  created_at: string;
};

function nameOf(u: Pick<DbAuthUser, "first_name" | "last_name" | "email">) {
  return `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email;
}

function publicId(u: Pick<DbAuthUser, "user_id" | "id">) {
  return u.user_id || u.id;
}

function day(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

async function walletTotals(ids: string[]) {
  if (!ids.length) return new Map<string, number>();
  const { data } = await db.from("wallet_accounts").select("user_id,balance").in("user_id", ids);
  const totals = new Map<string, number>();
  for (const row of data || []) totals.set(row.user_id, (totals.get(row.user_id) || 0) + Number(row.balance || 0));
  return totals;
}

export async function getAdmins(): Promise<AdminRow[]> {
  const { data: admins, error } = await db
    .from("auth_users")
    .select("id,user_id,first_name,last_name,email,status,role,created_at")
    .in("role", ["admin"])
    .order("created_at", { ascending: false });
  if (error) throw error;

  const ids = (admins || []).map((a) => a.id);
  const { data: sessions } = ids.length
    ? await db.from("auth_sessions").select("user_id,last_activity_at,created_at").in("user_id", ids).order("created_at", { ascending: false })
    : { data: [] as any[] };
  const last = new Map<string, string>();
  for (const s of sessions || []) if (!last.has(s.user_id)) last.set(s.user_id, s.last_activity_at || s.created_at);

  return (admins || []).map((a: any) => ({
    id: publicId(a),
    name: nameOf(a),
    email: a.email,
    role: "Admin",
    status: a.status === "suspended" ? "suspended" : "active",
    usersManaged: 0,
    lastLogin: last.get(a.id)?.replace("T", " ").slice(0, 16) || "",
    createdAt: day(a.created_at),
  }));
}

export async function getManagedUsers(): Promise<ManagedUser[]> {
  const { data: users, error } = await db
    .from("auth_users")
    .select("id,user_id,first_name,last_name,email,country,status,role,kyc_status,two_fa_enabled,referral_code,hidden_from_admins,created_at")
    .eq("role", "user")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const totals = await walletTotals((users || []).map((u) => u.id));
  return ((users || []) as DbAuthUser[]).map((u) => ({
    id: publicId(u),
    name: nameOf(u),
    email: u.email,
    country: u.country || "",
    joinedAt: day(u.created_at),
    kyc: (u.kyc_status === "verified" || u.kyc_status === "pending" || u.kyc_status === "rejected" ? u.kyc_status : "not_submitted") as UserRow["kyc"],
    twoFA: Boolean(u.two_fa_enabled),
    status: u.status === "suspended" ? "suspended" : "active",
    referredBy: u.referral_code || "Direct signup",
    totalBalance: totals.get(u.id) || 0,
    hiddenFromAdmins: Boolean(u.hidden_from_admins),
  }));
}

export async function getAdminVisibleUsers(): Promise<ManagedUser[]> {
  return (await getManagedUsers()).filter((u) => !u.hiddenFromAdmins);
}

export async function setUserHidden(ids: string[], hidden: boolean): Promise<void> {
  const { error } = await db.from("auth_users").update({ hidden_from_admins: hidden }).in("user_id", ids);
  if (error) throw error;
}

export async function getAdminByPublicId(id: string): Promise<{ id: string; publicId: string; status: string } | null> {
  const { data, error } = await db.from("auth_users").select("id,user_id,status,role").eq("user_id", id).eq("role", "admin").maybeSingle();
  if (error) throw error;
  return data ? { id: data.id, publicId: data.user_id || data.id, status: data.status } : null;
}

export async function getAdminById(id: string): Promise<AdminRow | null> {
  const query = db.from("auth_users").select("id,user_id,first_name,last_name,email,status,role,created_at").eq("role", "admin");
  const { data, error } = /^[0-9a-f-]{36}$/i.test(id)
    ? await query.eq("id", id).maybeSingle()
    : await query.eq("user_id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: publicId(data),
    name: nameOf(data),
    email: data.email,
    role: "Admin",
    status: data.status === "suspended" ? "suspended" : "active",
    usersManaged: 0,
    lastLogin: "",
    createdAt: day(data.created_at),
  };
}

export async function logImpersonation(ownerId: string, adminId: string): Promise<void> {
  await db.from("impersonation_log").insert({ owner_id: ownerId, admin_id: adminId }).throwOnError();
}

export type BalanceChangeEntry = {
  adminId: string;
  userId: string;
  wallet: string;
  from: number;
  to: number;
  at: string;
};

export async function logBalanceChange(entry: Omit<BalanceChangeEntry, "at">): Promise<void> {
  await db.from("admin_actions").insert({
    admin_id: entry.adminId,
    target_user_id: entry.userId,
    action: "balance_change",
    details: { wallet: entry.wallet, from: entry.from, to: entry.to },
  }).throwOnError();
}

export async function getRestrictedMode(): Promise<boolean> {
  const { data } = await db.from("auth_settings").select("value").eq("key", "restricted_mode").maybeSingle();
  return data?.value === true || data?.value === "true";
}

export async function setRestrictedMode(enabled: boolean): Promise<void> {
  await db.from("auth_settings").upsert({ key: "restricted_mode", value: enabled }).throwOnError();
}

export async function getRestrictedPeople(): Promise<RestrictedEntry[]> {
  const { data, error } = await db.from("restricted_people").select("public_id,name,kind,created_at").order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((r: any) => ({ id: r.public_id, name: r.name, kind: r.kind, addedAt: day(r.created_at) }));
}

export async function addRestrictedPeople(ids: string[]): Promise<{ added: RestrictedEntry[]; missing: string[] }> {
  const clean = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
  if (!clean.length) return { added: [], missing: [] };
  const { data: users, error } = await db.from("auth_users").select("id,user_id,first_name,last_name,email,role").in("user_id", clean).in("role", ["user", "admin"]);
  if (error) throw error;
  const rows = (users || []).map((u: any) => ({ public_id: u.user_id || u.id, name: nameOf(u), kind: u.role === "admin" ? "Admin" : "User" }));
  if (rows.length) await db.from("restricted_people").upsert(rows, { onConflict: "public_id" }).throwOnError();
  const found = new Set(rows.map((r) => r.public_id));
  return {
    added: rows.map((r) => ({ id: r.public_id, name: r.name, kind: r.kind as "Admin" | "User", addedAt: day(new Date().toISOString()) })),
    missing: clean.filter((id) => !found.has(id)),
  };
}

export async function removeRestrictedPerson(id: string): Promise<void> {
  await db.from("restricted_people").delete().eq("public_id", id).throwOnError();
}
