// lib/admin/users-service.ts
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export type UserRow = {
  id: string;
  userId: string;
  name: string;
  email: string;
  mobileNumber: string | null;
  country: string;
  joinedAt: string;
  kyc: 'verified' | 'pending' | 'rejected' | 'not_verified';
  twoFA: boolean;
  status: 'active' | 'suspended' | 'pending';
  referredBy: string | null;
  totalBalance: number;
};

export type UserDetail = {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  mobileNumber: string | null;
  country: string;
  dob: string;
  joinedAt: string;
  walletAddress: string | null;
  kycStatus: string;
  twoFAEnabled: boolean;
  status: 'active' | 'suspended' | 'pending';
  role: 'user' | 'admin' | 'owner';
  referredBy: string | null;
  wallets: {
    main: { balance: number; address: string | null };
    investment: { balance: number };
    trading: { balance: number };
  };
  referrals: {
    referrerId: string | null;
    totalReferred: number;
    activeReferred: number;
  };
  investments: any[];
  aiTradingInvestments: any[];
  rewards: any[];
  loginHistory: any[];
};

export async function getAllUsers(): Promise<UserRow[]> {
  const session = await getSessionUser();
  const { data: users, error } = await db
    .from('auth_users')
    .select('*')
    .eq('role', 'user')
    .or(session?.role === 'owner' ? 'hidden_from_admins.eq.true,hidden_from_admins.eq.false' : 'hidden_from_admins.eq.false')
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Get wallet balances for each user
  const userIds = users?.map(u => u.id) || [];
  const { data: wallets } = await db
    .from('wallet_accounts')
    .select('user_id, wallet, balance')
    .in('user_id', userIds);

  // Get referrer info
  const { data: referrals } = await db
    .from('referrals')
    .select('referred_id, referrer_id')
    .in('referred_id', userIds);

  const walletMap = new Map<string, Record<string, number>>();
  wallets?.forEach(w => {
    if (!walletMap.has(w.user_id)) walletMap.set(w.user_id, {});
    walletMap.get(w.user_id)![w.wallet] = w.balance;
  });

  const referrerMap = new Map<string, string>();
  referrals?.forEach(r => {
    if (r.referrer_id) {
      referrerMap.set(r.referred_id, r.referrer_id);
    }
  });

  return users?.map(u => {
    const userWallets = walletMap.get(u.id) || {};
    const totalBalance = (userWallets.main || 0) + (userWallets.investment || 0) + (userWallets.trading || 0);
    
    return {
      id: u.user_id || u.id,
      userId: u.user_id || u.id,
      name: `${u.first_name} ${u.last_name}`,
      email: u.email,
      mobileNumber: null,
      country: u.country,
      joinedAt: new Date(u.created_at).toISOString().split('T')[0],
      kyc: u.kyc_status as any,
      twoFA: u.two_fa_enabled,
      status: u.status as any,
      referredBy: referrerMap.get(u.id) || null,
      totalBalance,
    };
  }) || [];
}

export async function getUserDetail(userId: string): Promise<UserDetail | null> {
  const session = await getSessionUser();
  // Try to find by user_id first, then by UUID
  let user = null;
  
  const { data: byUserId } = await db
    .from('auth_users')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (byUserId) {
    user = byUserId;
  } else {
    const { data: byUuid } = await db
      .from('auth_users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    user = byUuid;
  }

  if (!user) return null;
  if (session?.role !== 'owner' && user.hidden_from_admins) return null;

  // Get wallets
  const { data: wallets } = await db
    .from('wallet_accounts')
    .select('wallet, balance, address')
    .eq('user_id', user.id);

  const walletsMap = {
    main: { balance: 0, address: null as string | null },
    investment: { balance: 0 },
    trading: { balance: 0 },
  };
  wallets?.forEach(w => {
    if (w.wallet === 'main') {
      walletsMap.main = { balance: w.balance, address: w.address };
    } else if (w.wallet === 'investment') {
      walletsMap.investment = { balance: w.balance };
    } else if (w.wallet === 'trading') {
      walletsMap.trading = { balance: w.balance };
    }
  });

  // Get referral info
  const { data: referrer } = await db
    .from('referrals')
    .select('referrer_id')
    .eq('referred_id', user.id)
    .single();

  const { data: referred } = await db
    .from('referrals')
    .select('referred_id, is_eligible')
    .eq('referrer_id', user.id);

  // Get investments
  const { data: investments } = await db
    .from('daily_profit_investments')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Get AI trading
  const { data: aiTradingInvestments } = await db
    .from('ai_trading_investments')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Get rewards
  const { data: rewards } = await db
    .from('user_rewards')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Get login history
  const { data: loginHistory } = await db
    .from('login_history')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  const dobParts = user.dob_raw as any;
  const dob = `${dobParts?.year || '1990'}-${String(dobParts?.month || '01').padStart(2, '0')}-${String(dobParts?.day || '01').padStart(2, '0')}`;

  return {
    id: user.id,
    userId: user.user_id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    phone: user.phone,
    mobileNumber: null,
    country: user.country,
    dob,
    joinedAt: new Date(user.created_at).toISOString().split('T')[0],
    walletAddress: walletsMap.main.address,
    kycStatus: user.kyc_status,
    twoFAEnabled: user.two_fa_enabled,
    status: user.status,
    role: user.role,
    referredBy: referrer?.referrer_id || null,
    wallets: walletsMap,
    referrals: {
      referrerId: referrer?.referrer_id || null,
      totalReferred: referred?.length || 0,
      activeReferred: referred?.filter(r => r.is_eligible).length || 0,
    },
    investments: investments || [],
    aiTradingInvestments: aiTradingInvestments || [],
    rewards: rewards || [],
    loginHistory: loginHistory || [],
  };
}

export async function updateUser(userId: string, data: any) {
  // Find user by user_id or UUID
  let user = null;
  
  const { data: byUserId } = await db
    .from('auth_users')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (byUserId) {
    user = byUserId;
  } else {
    const { data: byUuid } = await db
      .from('auth_users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    user = byUuid;
  }

  if (!user) throw new Error('User not found');

  const { error } = await db
    .from('auth_users')
    .update(data)
    .eq('id', user.id);

  if (error) throw error;
}

export async function suspendUser(userId: string, adminId: string) {
  // Find user by user_id or UUID
  let user = null;
  
  const { data: byUserId } = await db
    .from('auth_users')
    .select('id, user_id')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (byUserId) {
    user = byUserId;
  } else {
    const { data: byUuid } = await db
      .from('auth_users')
      .select('id, user_id')
      .eq('id', userId)
      .maybeSingle();
    user = byUuid;
  }

  if (!user) throw new Error('User not found');

  // Update user status
  const { error: userError } = await db
    .from('auth_users')
    .update({ status: 'suspended', updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (userError) throw userError;

  // Revoke all sessions
  await db.rpc('revoke_user_sessions', { p_user_id: user.id });

  // Log admin action
  let admin = null;
  const { data: adminByUserId } = await db
    .from('auth_users')
    .select('id')
    .eq('user_id', adminId)
    .maybeSingle();
  
  if (adminByUserId) {
    admin = adminByUserId;
  } else {
    const { data: adminByUuid } = await db
      .from('auth_users')
      .select('id')
      .eq('id', adminId)
      .maybeSingle();
    admin = adminByUuid;
  }

  if (admin) {
    await db.rpc('log_admin_action', {
      p_admin_id: admin.id,
      p_target_user_id: user.id,
      p_action: 'suspend_user',
      p_details: { userId: user.user_id || user.id }
    });
  }
}

export async function activateUser(userId: string, adminId: string) {
  // Find user by user_id or UUID
  let user = null;
  
  const { data: byUserId } = await db
    .from('auth_users')
    .select('id, user_id')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (byUserId) {
    user = byUserId;
  } else {
    const { data: byUuid } = await db
      .from('auth_users')
      .select('id, user_id')
      .eq('id', userId)
      .maybeSingle();
    user = byUuid;
  }

  if (!user) throw new Error('User not found');

  const { error } = await db
    .from('auth_users')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (error) throw error;

  // Log admin action
  let admin = null;
  const { data: adminByUserId } = await db
    .from('auth_users')
    .select('id')
    .eq('user_id', adminId)
    .maybeSingle();
  
  if (adminByUserId) {
    admin = adminByUserId;
  } else {
    const { data: adminByUuid } = await db
      .from('auth_users')
      .select('id')
      .eq('id', adminId)
      .maybeSingle();
    admin = adminByUuid;
  }

  if (admin) {
    await db.rpc('log_admin_action', {
      p_admin_id: admin.id,
      p_target_user_id: user.id,
      p_action: 'activate_user',
      p_details: { userId: user.user_id || user.id }
    });
  }
}

export async function disable2FA(userId: string, adminId: string) {
  let user = null;
  
  const { data: byUserId } = await db
    .from('auth_users')
    .select('id, user_id')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (byUserId) {
    user = byUserId;
  } else {
    const { data: byUuid } = await db
      .from('auth_users')
      .select('id, user_id')
      .eq('id', userId)
      .maybeSingle();
    user = byUuid;
  }

  if (!user) throw new Error('User not found');

  const { error } = await db
    .from('auth_users')
    .update({ 
      two_fa_enabled: false, 
      two_fa_secret: null,
      backup_codes: null,
      updated_at: new Date().toISOString() 
    })
    .eq('id', user.id);

  if (error) throw error;

  let admin = null;
  const { data: adminByUserId } = await db
    .from('auth_users')
    .select('id')
    .eq('user_id', adminId)
    .maybeSingle();
  
  if (adminByUserId) {
    admin = adminByUserId;
  } else {
    const { data: adminByUuid } = await db
      .from('auth_users')
      .select('id')
      .eq('id', adminId)
      .maybeSingle();
    admin = adminByUuid;
  }

  if (admin) {
    await db.rpc('log_admin_action', {
      p_admin_id: admin.id,
      p_target_user_id: user.id,
      p_action: 'disable_2fa',
      p_details: { userId: user.user_id || user.id }
    });
  }
}

export async function addReferral(userId: string, referredUserId: string, adminId: string) {
  let user = null;
  const { data: byUserId } = await db
    .from('auth_users')
    .select('id, user_id')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (byUserId) {
    user = byUserId;
  } else {
    const { data: byUuid } = await db
      .from('auth_users')
      .select('id, user_id')
      .eq('id', userId)
      .maybeSingle();
    user = byUuid;
  }

  let referredUser = null;
  const { data: refByUserId } = await db
    .from('auth_users')
    .select('id, user_id')
    .eq('user_id', referredUserId)
    .maybeSingle();
  
  if (refByUserId) {
    referredUser = refByUserId;
  } else {
    const { data: refByUuid } = await db
      .from('auth_users')
      .select('id, user_id')
      .eq('id', referredUserId)
      .maybeSingle();
    referredUser = refByUuid;
  }

  if (!user || !referredUser) throw new Error('User not found');

  // Check if referral already exists
  const { data: existing } = await db
    .from('referrals')
    .select('id')
    .eq('referrer_id', user.id)
    .eq('referred_id', referredUser.id)
    .maybeSingle();

  if (existing) throw new Error('Referral already exists');

  const { error } = await db
    .from('referrals')
    .insert({
      referrer_id: user.id,
      referred_id: referredUser.id,
      is_eligible: false,
      created_at: new Date().toISOString()
    });

  if (error) throw error;

  let admin = null;
  const { data: adminByUserId } = await db
    .from('auth_users')
    .select('id')
    .eq('user_id', adminId)
    .maybeSingle();
  
  if (adminByUserId) {
    admin = adminByUserId;
  } else {
    const { data: adminByUuid } = await db
      .from('auth_users')
      .select('id')
      .eq('id', adminId)
      .maybeSingle();
    admin = adminByUuid;
  }

  if (admin) {
    await db.rpc('log_admin_action', {
      p_admin_id: admin.id,
      p_target_user_id: user.id,
      p_action: 'add_referral',
      p_details: { userId: user.user_id || user.id, referredUserId: referredUser.user_id || referredUser.id }
    });
  }
}
