import { NextRequest } from "next/server";
import { bad, supabase, q } from "@/lib/auth/backend";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "weekly";

  if (!["weekly", "monthly"].includes(period)) {
    return bad("Invalid period. Must be 'weekly' or 'monthly'");
  }

  // Calculate period boundaries
  const now = new Date();
  let periodStart: Date;
  
  if (period === "weekly") {
    // Start of current week (Sunday)
    periodStart = new Date(now);
    periodStart.setDate(now.getDate() - now.getDay());
    periodStart.setHours(0, 0, 0, 0);
  } else {
    // Start of current month
    periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  // Get referrals created in this period, grouped by referrer
  const referralsInPeriod = await supabase<any[]>(
    `referrals?select=referrer_id,is_eligible,auth_users!referrals_referrer_id_fkey(id,user_id,first_name,last_name)&created_at=gte.${q(periodStart.toISOString())}&order=referrer_id`
  );

  // Group and count eligible referrals by referrer
  const leaderboardMap = new Map<string, { user: any; eligibleCount: number }>();

  for (const ref of referralsInPeriod) {
    if (!ref.is_eligible) continue;
    
    const referrerId = ref.referrer_id;
    const existing = leaderboardMap.get(referrerId);
    
    if (existing) {
      existing.eligibleCount++;
    } else {
      leaderboardMap.set(referrerId, {
        user: ref.auth_users,
        eligibleCount: 1,
      });
    }
  }

  // Convert to array and sort by eligible count
  const sorted = Array.from(leaderboardMap.entries())
    .map(([userId, data]) => ({
      userId,
      user: data.user,
      eligibleCount: data.eligibleCount,
    }))
    .sort((a, b) => b.eligibleCount - a.eligibleCount);

  // Get prizes for this period
  const prizes = await supabase<{ rank: number; prize_amount: number }[]>(
    `referral_leaderboard_prizes?select=rank,prize_amount&period_type=eq.${period}&active=eq.true&order=rank.asc`
  );

  const prizeMap = new Map(prizes.map((p) => [p.rank, Number(p.prize_amount)]));

  // Build leaderboard with ranks and prizes
  const leaderboard = sorted.map((entry, index) => {
    const rank = index + 1;
    return {
      rank,
      userId: entry.user.user_id || entry.user.id.slice(0, 6).toUpperCase(),
      name: `${entry.user.first_name} ${entry.user.last_name}`,
      referrals: entry.eligibleCount,
      prize: prizeMap.get(rank) || 0,
    };
  });

  return Response.json({
    period,
    periodStart: periodStart.toISOString(),
    leaderboard,
    prizes: Array.from(prizeMap.entries()).map(([rank, amount]) => ({ rank, amount })),
  });
}
