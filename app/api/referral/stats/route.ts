import { NextRequest } from "next/server";
import { bad, getSession, supabase, q } from "@/lib/auth/backend";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);

  const user = session.user;

  // Get stats using DB function
  const statsResult = await supabase<{ get_referral_stats: any }[]>(
    `rpc/get_referral_stats?p_user_id=${q(user.id)}`
  );
  const stats = statsResult[0]?.get_referral_stats || {
    total_referred: 0,
    active_referred: 0,
    total_commission: 0,
    commission_by_source: {},
  };

  // Get referred users list
  const referrals = await supabase<any[]>(
    `referrals?select=id,referred_id,is_eligible,first_deposit_at,created_at,auth_users!referrals_referred_id_fkey(id,user_id,first_name,last_name,email,created_at)&referrer_id=eq.${q(user.id)}&order=created_at.desc`
  );

  // Get commission per referred user
  const referredUsers = await Promise.all(
    referrals.map(async (ref) => {
      const refUser = ref.auth_users;
      const commissions = await supabase<{ commission_amount: number }[]>(
        `referral_commissions?select=commission_amount&referrer_id=eq.${q(user.id)}&referred_id=eq.${q(ref.referred_id)}`
      );
      const totalCommission = commissions.reduce((sum, c) => sum + Number(c.commission_amount), 0);

      // Get total deposited (sum of deposit transactions)
      const deposits = await supabase<{ amount: number }[]>(
        `wallet_transactions?select=amount&user_id=eq.${q(ref.referred_id)}&type=eq.deposit`
      );
      const totalDeposited = deposits.reduce((sum, d) => sum + Number(d.amount), 0);

      return {
        id: refUser.user_id || refUser.id.slice(0, 8).toUpperCase(),
        name: `${refUser.first_name} ${refUser.last_name}`,
        email: refUser.email,
        joined: new Date(refUser.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        active: ref.is_eligible,
        totalDeposited,
        commissionEarned: totalCommission,
      };
    })
  );

  // Get milestones
  const milestones = await supabase<{ id: string; required_active: number; reward: number }[]>(
    `referral_milestones?select=id,required_active,reward&active=eq.true&order=required_active.asc`
  );

  // Get user's referral code (from auth_users.referral_code or generate from user_id)
  const referralCode = user.user_id || user.id.slice(0, 6).toUpperCase();

  return Response.json({
    referralCode,
    referralLink: `https://quantex.com/join?ref=${referralCode}`,
    stats: {
      totalReferred: stats.total_referred,
      activeReferred: stats.active_referred,
      totalCommission: Number(stats.total_commission),
      commissionBySource: {
        daily: Number(stats.commission_by_source?.daily_profit || 0),
        aiTrading: Number(stats.commission_by_source?.ai_trading || 0),
      },
    },
    referredUsers,
    milestones: milestones.map((m) => ({
      id: m.id,
      requiredActive: m.required_active,
      reward: Number(m.reward),
    })),
  });
}
