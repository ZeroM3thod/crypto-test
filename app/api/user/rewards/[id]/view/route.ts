// app/api/user/rewards/[id]/view/route.ts
import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { db } from '@/lib/db';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { error } = await db
      .from('user_rewards')
      .update({ viewed: true })
      .eq('id', id)
      .eq('user_id', session.id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Failed to mark reward as viewed:', error);
    return NextResponse.json({ error: error.message || 'Failed to update reward' }, { status: 500 });
  }
}
