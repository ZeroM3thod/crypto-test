// app/api/admin/users/[id]/login-as/route.ts
import { NextResponse } from 'next/server';
import { getAdminOrNull } from '@/lib/auth/require-admin';
import { db } from '@/lib/db';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminOrNull();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only owner can use this feature
  let adminUser = null;
  const { data: adminByUserId } = await db
    .from('auth_users')
    .select('role, id')
    .eq('user_id', session.id)
    .maybeSingle();
  
  if (adminByUserId) {
    adminUser = adminByUserId;
  } else {
    const { data: adminByUuid } = await db
      .from('auth_users')
      .select('role, id')
      .eq('id', session.id)
      .maybeSingle();
    adminUser = adminByUuid;
  }

  if (!adminUser || adminUser.role !== 'owner') {
    return NextResponse.json({ error: 'Only owner can login as user' }, { status: 403 });
  }

  const { id } = await params;

  try {
    // Get target user - try user_id first, then UUID
    let targetUser = null;
    const { data: byUserId } = await db
      .from('auth_users')
      .select('id, user_id, email, status')
      .eq('user_id', id)
      .maybeSingle();
    
    if (byUserId) {
      targetUser = byUserId;
    } else {
      const { data: byUuid } = await db
        .from('auth_users')
        .select('id, user_id, email, status')
        .eq('id', id)
        .maybeSingle();
      targetUser = byUuid;
    }

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetUser.status === 'suspended') {
      return NextResponse.json({ error: 'Cannot login as suspended user' }, { status: 400 });
    }

    // Create session token for target user
    const tokenHash = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const { error: sessionError } = await db
      .from('auth_sessions')
      .insert({
        user_id: targetUser.id,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      });

    if (sessionError) throw sessionError;

    // Log admin action
    await db.rpc('log_admin_action', {
      p_admin_id: adminUser.id,
      p_target_user_id: targetUser.id,
      p_action: 'login_as_user',
      p_details: { targetUserId: targetUser.user_id || targetUser.id }
    });

    return NextResponse.json({ 
      token: tokenHash,
      userId: targetUser.user_id || targetUser.id 
    });
  } catch (error: any) {
    console.error('Failed to login as user:', error);
    return NextResponse.json({ error: error.message || 'Failed to login as user' }, { status: 500 });
  }
}
