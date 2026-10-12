// app/api/admin/users/[id]/add-referral/route.ts
import { NextResponse } from 'next/server';
import { adminUnauthorized, getAdminOrNull } from '@/lib/auth/require-admin';
import { addReferral, getUserDetail } from '@/lib/admin/users-service';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminOrNull();
  if (!session) return adminUnauthorized();

  const { id } = await params;

  try {
    const body = await req.json();
    const referredUserId = body.referredUserId;

    if (!referredUserId) {
      return NextResponse.json({ error: 'referredUserId is required' }, { status: 400 });
    }

    if (!(await getUserDetail(id)) || !(await getUserDetail(referredUserId))) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    await addReferral(id, referredUserId, session.id);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Failed to add referral:', error);
    return NextResponse.json({ error: error.message || 'Failed to add referral' }, { status: 500 });
  }
}
