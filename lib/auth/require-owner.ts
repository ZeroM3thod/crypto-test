// lib/auth/require-owner.ts
import { redirect } from "next/navigation";
import { getSessionUser, type SessionUser } from "./session";

export type OwnerSession = SessionUser;

/** Resolve the owner session for a server component, or send them to sign-in. */
export async function requireOwner(): Promise<OwnerSession> {
  const session = await getSessionUser();
  if (!session || session.role !== "owner") redirect("/404");
  return session;
}

/** Same check for route handlers: null when the caller is not the owner. */
export async function getOwnerOrNull(): Promise<OwnerSession | null> {
  const session = await getSessionUser();
  return session && session.role === "owner" ? session : null;
}

export const ownerUnauthorized = () =>
  Response.json({ error: "Unauthorized - Owner access required" }, { status: 403 });
