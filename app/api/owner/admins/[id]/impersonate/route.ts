// app/api/owner/admins/[id]/impersonate/route.ts
import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/require-owner";
import { getAdminByPublicId, logImpersonation } from "@/lib/admin-data";
import { createSession, findUserById } from "@/lib/auth/backend";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const owner = await requireOwner();
  const { id } = await params;

  const target = await getAdminByPublicId(id);
  if (!target || target.status !== "active") {
    return NextResponse.json({ error: "Not an active admin" }, { status: 400 });
  }

  // Audit trail: who impersonated whom, when.
  await logImpersonation(owner.id, target.id);

  const admin = await findUserById(target.id);
  if (!admin) return NextResponse.json({ error: "Admin not found" }, { status: 404 });

  // Owner can impersonate admin without password and without 2FA requirement
  // Bypass 2FA verification by not creating pending 2FA when user role is admin and originating user is owner
  const token = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('hex');
  const expiresAt = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString();

  const response = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/auth_sessions`,
    {
      method: 'POST',
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: admin.id,
        token_hash: token,
        expires_at: expiresAt,
        impersonated_by: owner.id,
        impersonation_reason: 'owner_bypass'
      })
    }
  );

  if (!response.ok) return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });

  const res = NextResponse.json({ ok: true, redirect: '/admin/dashboard' });
  res.cookies.set('session_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 5 * 60 * 60,
    path: '/',
  });
  res.cookies.set('impersonating_admin_id', target.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 5 * 60 * 60,
    path: '/',
  });

  return res;
}
