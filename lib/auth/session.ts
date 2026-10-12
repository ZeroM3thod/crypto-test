// lib/auth/session.ts
// Server-side session helpers for the admin panel.
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type SessionUser = { 
  id: string; 
  role: string;
  user_id?: string;
  kyc_status?: string;
};

async function sha256(value: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Resolve the signed-in user on the server.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    // Get session token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    
    if (token) {
      // Verify token exists in auth_sessions and is not expired/revoked
      const { data: session } = await supabase
        .from("auth_sessions")
        .select("user_id, expires_at, revoked_at")
        .eq("token_hash", await sha256(token))
        .maybeSingle();
      
      if (session && !session.revoked_at && new Date(session.expires_at) > new Date()) {
        // Get user from database
        const { data: user } = await supabase
          .from("auth_users")
          .select("id, user_id, role, kyc_status, status")
          .eq("id", session.user_id)
          .maybeSingle();
        
        if (user && user.status !== 'suspended') {
          return {
            id: user.id,
            role: user.role,
            user_id: user.user_id,
            kyc_status: user.kyc_status,
          };
        }
      }
      
      // Token is invalid, return null (no fallback)
      return null;
    }
    
    // No token provided, return null
    return null;
  } catch (err) {
    console.error("Session error:", err);
    return null;
  }
}

/**
 * The admin the current request should act as.
 *
 * While the owner is impersonating, `impersonating_admin_id` names the admin.
 * The cookie only counts if the real session is the owner, so a forged cookie
 * does nothing once getSessionUser() is wired to real sessions.
 */
export async function getEffectiveAdminId(): Promise<{
  id: string | undefined;
  impersonating: boolean;
}> {
  const session = await getSessionUser();
  const cookieStore = await cookies();
  const imp = cookieStore.get("impersonating_admin_id")?.value;
  if (imp && session?.role === "owner") return { id: imp, impersonating: true };
  return { id: session?.id, impersonating: false };
}

/** True while the owner has an active admin-impersonation cookie. */
export async function isImpersonating(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.has("impersonating_admin_id");
}
