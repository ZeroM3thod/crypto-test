// app/api/admin/users/[id]/disable-2fa/route.ts
import { NextResponse } from 'next/server';
import { adminUnauthorized, getAdminOrNull } from '@/lib/auth/require-admin';
import { disable2FA, getUserDetail } from '@/lib/admin/users-service';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminOrNull();
  if (!session) return adminUnauthorized();

  const { id } = await params;

  try {
    if (!(await getUserDetail(id))) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    await disable2FA(id, session.id);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Failed to disable 2FA:', error);
    return NextResponse.json({ error: error.message || 'Failed to disable 2FA' }, { status: 500 });
  }
}
