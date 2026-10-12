// Example: Call this whenever a user earns daily profit or AI trading profit
// Place these calls in your profit distribution logic

import { supabase, q } from "@/lib/auth/backend";

/**
 * Record daily profit and create commission for referrer
 * Call this when distributing daily profit to a user
 */
export async function recordDailyProfit(userId: string, profitAmount: number) {
  await supabase<any>(`rpc/record_profit_with_commission`, {
    method: "POST",
    body: JSON.stringify({
      p_user_id: userId,
      p_source: "daily_profit",
      p_profit_amount: profitAmount,
    }),
  });
}

/**
 * Record AI trading profit and create commission for referrer
 * Call this when distributing AI trading profit to a user
 */
export async function recordAITradingProfit(userId: string, profitAmount: number) {
  await supabase<any>(`rpc/record_profit_with_commission`, {
    method: "POST",
    body: JSON.stringify({
      p_user_id: userId,
      p_source: "ai_trading",
      p_profit_amount: profitAmount,
    }),
  });
}

/**
 * Mark referral as eligible after first deposit
 * Call this after a user makes their first deposit
 */
export async function markReferralEligibleOnFirstDeposit(userId: string) {
  await supabase<any>(`rpc/mark_referral_eligible`, {
    method: "POST",
    body: JSON.stringify({
      p_user_id: userId,
    }),
  });
}
