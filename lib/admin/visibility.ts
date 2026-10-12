import { db } from "@/lib/db";

export async function visibleUserIdsFor(role?: string) {
  const query = db.from("auth_users").select("id").eq("role", "user");
  const { data, error } = role === "owner" ? await query : await query.eq("hidden_from_admins", false);
  if (error) throw error;
  return (data || []).map((u) => u.id as string);
}

export async function canSeeUser(userId: string, role?: string) {
  if (role === "owner") return true;
  const { data, error } = await db.from("auth_users").select("hidden_from_admins").eq("id", userId).maybeSingle();
  if (error) throw error;
  return Boolean(data && !data.hidden_from_admins);
}

export function inFilter(ids: string[]) {
  return `(${ids.join(",")})`;
}
