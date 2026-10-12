// lib/auth/require-admin.ts
// Server-side admin guard. TODO: replace the placeholder session lookup with your
// real auth (JWT/session table) — see lib/auth/require-owner.ts.
import { redirect } from "next/navigation";
import { getSessionUser, type SessionUser } from "./session";

export type AdminSession = SessionUser;

/** Roles allowed into the /admin panel. */
const ADMIN_ROLES = new Set(["admin", "owner"]);

/** Resolve the admin session for a server component, or send them to sign-in. */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getSessionUser();
  if (!session || !ADMIN_ROLES.has(session.role)) redirect("/404");
  return session;
}

/** Same check for route handlers: null when the caller is not an admin. */
export async function getAdminOrNull(): Promise<AdminSession | null> {
  const session = await getSessionUser();
  return session && ADMIN_ROLES.has(session.role) ? session : null;
}

export const adminUnauthorized = () =>
  Response.json({ error: "Unauthorized" }, { status: 401 });
