// app/api/admin/users/route.ts
import { NextResponse } from 'next/server';
import { getAdminOrNull, adminUnauthorized } from '@/lib/auth/require-admin';
import { getAllUsers } from '@/lib/admin/users-service';

export async function GET() {
  const session = await getAdminOrNull();
  if (!session) return adminUnauthorized();

  try {
    const users = await getAllUsers();
    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch users' }, { status: 500 });
  }
}
