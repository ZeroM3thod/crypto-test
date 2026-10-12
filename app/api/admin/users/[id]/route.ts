// app/api/admin/users/[id]/route.ts
import { NextResponse } from 'next/server';
import { adminUnauthorized, getAdminOrNull } from '@/lib/auth/require-admin';
import { getUserDetail, updateUser, suspendUser, activateUser } from '@/lib/admin/users-service';
import { db } from '@/lib/db';

const err = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminOrNull();
  if (!session) return adminUnauthorized();

  const { id } = await params;
  
  try {
    const user = await getUserDetail(id);
    if (!user) return err('User not found', 404);
    
    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('Failed to fetch user:', error);
    return err(error.message || 'Failed to fetch user', 500);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminOrNull();
  if (!session) return adminUnauthorized();

  const { id } = await params;
  
  try {
    const user = await getUserDetail(id);
    if (!user) return err('User not found', 404);

    const body = await req.json();
    
    // Handle suspend/activate
    if (body.status && body.status !== user.status) {
      if (body.status === 'suspended') {
        await suspendUser(id, session.id);
      } else if (body.status === 'active') {
        await activateUser(id, session.id);
      }
    }

    // Update user fields
    const updateData: any = {};
    
    if (body.firstName) updateData.first_name = body.firstName;
    if (body.lastName) updateData.last_name = body.lastName;
    if (body.email) updateData.email = body.email;
    if (body.mobileNumber !== undefined) updateData.mobile_number = body.mobileNumber;
    if (body.country) updateData.country = body.country;
    if (body.twoFA !== undefined) updateData.two_fa_enabled = body.twoFA;
    
    if (Object.keys(updateData).length > 0) {
      updateData.updated_at = new Date().toISOString();
      await updateUser(id, updateData);
    }

    // Update wallet balances if provided
    if (body.wallets) {
      for (const [wallet, data] of Object.entries(body.wallets as any)) {
        if ((data as any).balance !== undefined) {
          await db
            .from('wallet_accounts')
            .update({ balance: (data as any).balance, updated_at: new Date().toISOString() })
            .eq('user_id', user.id)
            .eq('wallet', wallet);
        }
      }
    }

    return NextResponse.json({ ok: true, id, updatedBy: session.id });
  } catch (error: any) {
    console.error('Failed to update user:', error);
    return err(error.message || 'Failed to update user', 500);
  }
}
