// lib/auth/require-user.ts
import { redirect } from "next/navigation";
import { getSessionUser, type SessionUser } from "./session";

export type UserSession = SessionUser;

/** Roles allowed into user pages. */
const USER_ROLES = new Set(["user", "admin", "owner"]);

/** Resolve the user session for a server component, or send them to sign-in. */
export async function requireUser(): Promise<UserSession> {
  const session = await getSessionUser();
  if (!session || !USER_ROLES.has(session.role)) redirect("/signin");
  return session;
}

/** Same check for route handlers: null when the caller is not authenticated. */
export async function getUserOrNull(): Promise<UserSession | null> {
  const session = await getSessionUser();
  return session && USER_ROLES.has(session.role) ? session : null;
}

export const userUnauthorized = () =>
  Response.json({ error: "Unauthorized" }, { status: 401 });
