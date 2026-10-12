// app/api/user/rewards/unviewed/route.ts
import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { db } from '@/lib/db';

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: rewards, error } = await db
      .from('user_rewards')
      .select('*')
      .eq('user_id', session.id)
      .eq('viewed', false)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ rewards: rewards || [] });
  } catch (error: any) {
    console.error('Failed to fetch unviewed rewards:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch rewards' }, { status: 500 });
  }
}
