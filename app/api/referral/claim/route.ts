import { NextRequest } from "next/server";
import { bad, getSession, supabase, q } from "@/lib/auth/backend";

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);

  const body = await req.json();
  const { milestoneId } = body;

  if (!milestoneId) return bad("milestoneId required");

  const user = session.user;

  // Get milestone details
  const milestones = await supabase<{ id: string; required_active: number; reward: number }[]>(
    `referral_milestones?select=id,required_active,reward&id=eq.${q(milestoneId)}&active=eq.true&limit=1`
  );
  const milestone = milestones[0];
  if (!milestone) return bad("Milestone not found");

  // Get user's current eligible referral count
  const referrals = await supabase<{ id: string }[]>(
    `referrals?select=id&referrer_id=eq.${q(user.id)}&is_eligible=eq.true`
  );
  const eligibleCount = referrals.length;

  // Check if user has enough eligible referrals
  if (eligibleCount < milestone.required_active) {
    return bad(`Insufficient eligible referrals. Need ${milestone.required_active}, have ${eligibleCount}`);
  }

  // Check if already claimed this milestone
  const existingClaims = await supabase<{ id: string }[]>(
    `referral_milestone_claims?select=id&user_id=eq.${q(user.id)}&milestone_id=eq.${q(milestoneId)}&limit=1`
  );
  if (existingClaims.length > 0) {
    return bad("Milestone already claimed");
  }

  // Create claim record
  await supabase("referral_milestone_claims", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      user_id: user.id,
      milestone_id: milestoneId,
      eligible_count_at_claim: eligibleCount,
      reward_amount: milestone.reward,
    }),
  });

  // Add reward to user's main wallet
  await supabase(`wallet_accounts?user_id=eq.${q(user.id)}&wallet=eq.main`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      balance: `balance + ${milestone.reward}`,
      updated_at: new Date().toISOString(),
    }),
  });

  // Record transaction
  await supabase("wallet_transactions", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      user_id: user.id,
      wallet: "main",
      type: "referral_milestone",
      amount: milestone.reward,
      status: "completed",
      tx_hash: `milestone_${milestoneId}_${Date.now()}`,
    }),
  });

  return Response.json({
    success: true,
    reward: milestone.reward,
    eligibleCount,
  });
}
