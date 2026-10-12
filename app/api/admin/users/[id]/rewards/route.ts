// app/api/admin/users/[id]/rewards/route.ts
import { NextResponse } from 'next/server';
import { adminUnauthorized, getAdminOrNull } from '@/lib/auth/require-admin';
import { db } from '@/lib/db';
import { getUserDetail } from '@/lib/admin/users-service';

const err = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminOrNull();
  if (!session) return adminUnauthorized();

  const { id } = await params;

  try {
    const body = await req.json();

    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const wallet = body.wallet;
    const rewardType = body.type;
    const amount = body.amount;

    if (!title) return err('Reward title is required', 400);
    if (!description) return err('Reward description is required', 400);
    if (!['main', 'investment', 'trading'].includes(wallet)) return err('Invalid wallet', 400);
    if (!['withdrawable', 'non_withdrawable'].includes(rewardType)) return err('Invalid reward type', 400);
    if (typeof amount !== 'number' || amount <= 0) return err('Amount must be greater than 0', 400);

    const user = await getUserDetail(id);
    if (!user) return err('User not found', 404);

    // Get admin user id
    const { data: admin } = await db
      .from('auth_users')
      .select('id')
      .or(`user_id.eq.${session.id},id.eq.${session.id}`)
      .single();

    if (!admin) return err('Admin not found', 404);

    // Send reward using function
    const { data: rewardId, error: rewardError } = await db.rpc('send_user_reward', {
      p_user_id: user.id,
      p_admin_id: admin.id,
      p_title: title,
      p_description: description,
      p_amount: amount,
      p_wallet: wallet,
      p_reward_type: rewardType
    });

    if (rewardError) throw rewardError;

    // Fetch created reward
    const { data: reward } = await db
      .from('user_rewards')
      .select('*')
      .eq('id', rewardId)
      .single();

    return NextResponse.json({ 
      reward: {
        id: reward.id,
        title: reward.title,
        description: reward.description,
        amount: reward.amount,
        wallet: reward.wallet,
        type: reward.reward_type,
        sentAt: reward.created_at,
        sentBy: session.id,
        status: 'credited'
      }
    });
  } catch (error: any) {
    console.error('Failed to send reward:', error);
    return err(error.message || 'Failed to send reward', 500);
  }
}
