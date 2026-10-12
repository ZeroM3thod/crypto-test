import { NextRequest } from "next/server";
import { bad, getSession, supabase } from "@/lib/auth/backend";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);

  try {
    // Fetch Daily Profit investments
    const dailyProfitInvestments = await supabase<any[]>(
      `daily_profit_investments?select=*&user_id=eq.${session.user.id}&order=created_at.desc`
    );

    // Fetch AI Trading investments
    const aiTradingInvestments = await supabase<any[]>(
      `ai_trading_investments?select=*&user_id=eq.${session.user.id}&order=created_at.desc`
    );

    // Format Daily Profit investments
    const dailyProfitPackages = dailyProfitInvestments.map((inv: any) => {
      const earned = parseFloat(inv.total_profit || 0);
      const invested = parseFloat(inv.amount);
      
      return {
        id: inv.id,
        kind: "Daily Profit",
        name: inv.plan_name,
        tier: inv.plan_id.charAt(0).toUpperCase() + inv.plan_id.slice(1),
        status: inv.status === "active" ? "Active" : "Completed",
        invested: invested,
        rateLabel: "Daily Rate",
        rateValue: `${inv.daily_rate}%`,
        startDate: new Date(inv.started_at).toISOString().split('T')[0],
        endDate: inv.status === "active" ? "Ongoing" : new Date(inv.cancelled_at || inv.started_at).toISOString().split('T')[0],
        earned: earned,
        details: [
          { label: "Package Type", value: "Daily Profit" },
          { label: "Plan", value: inv.plan_name },
          { label: "Amount Invested", value: `$${invested.toFixed(2)}`, tone: "strong" },
          { label: "Daily Rate", value: `${inv.daily_rate}%` },
          { label: "Profit Per Cycle", value: `+$${parseFloat(inv.profit_per_cycle).toFixed(2)}`, tone: "success" },
          { label: "Credits Received", value: String(inv.credits_earned || 0) },
          { label: "Total Earned", value: `+$${earned.toFixed(2)}`, tone: "success" },
          { label: "Started", value: new Date(inv.started_at).toISOString().split('T')[0] },
          { label: "Payout", value: "Principal + profits" },
          { label: "Cancel Policy", value: "After 24 hours" },
          { label: "Wallet Credited", value: "Investment Wallet" },
        ],
      };
    });

    // Format AI Trading investments
    const aiTradingPackages = aiTradingInvestments.map((inv: any) => {
      const earned = parseFloat(inv.total_profit || 0);
      const invested = parseFloat(inv.amount);
      const currentValue = parseFloat(inv.current_value || invested);
      
      const startDate = new Date(inv.invested_at);
      const unlockDate = new Date(inv.unlock_at);
      const now = new Date();
      const totalDays = inv.lock_days;
      const elapsedMs = now.getTime() - startDate.getTime();
      const totalMs = unlockDate.getTime() - startDate.getTime();
      const progress = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));
      const daysElapsed = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
      
      const roi = invested > 0 ? ((currentValue - invested) / invested) * 100 : 0;
      
      return {
        id: inv.id,
        kind: "AI Trading",
        name: inv.strategy_name,
        tier: invested >= 100 ? "Elite" : invested >= 70 ? "Advanced" : invested >= 40 ? "Pro" : "Starter",
        status: inv.status === "running" ? "Active" : inv.status === "unlocked" ? "Completed" : "Completed",
        invested: invested,
        rateLabel: "Strategy ROI",
        rateValue: `${roi >= 0 ? '+' : ''}${roi.toFixed(1)}%`,
        startDate: new Date(inv.invested_at).toISOString().split('T')[0],
        endDate: new Date(inv.unlock_at).toISOString().split('T')[0],
        earned: earned,
        progress: Math.round(progress),
        details: [
          { label: "Package Type", value: "AI Trading" },
          { label: "Strategy", value: inv.strategy_name },
          { label: "Exchange", value: "Binance" },
          { label: "Amount Staked", value: `$${invested.toFixed(2)}`, tone: "strong" },
          { label: "Strategy ROI", value: `${roi >= 0 ? '+' : ''}${roi.toFixed(1)}%`, tone: "success" },
          { label: "Total Profit", value: `+$${earned.toFixed(2)}`, tone: "success" },
          { label: "Lock Period", value: `${totalDays} days` },
          { label: "Days Elapsed", value: `${daysElapsed} of ${totalDays}` },
          { label: "Start Date", value: new Date(inv.invested_at).toISOString().split('T')[0] },
          { label: "Unlock Date", value: new Date(inv.unlock_at).toISOString().split('T')[0] },
          { label: "Payout", value: "Stake + profits after lock" },
          { label: "Wallet Credited", value: "AI Trading Wallet" },
        ],
      };
    });

    const allPackages = [...dailyProfitPackages, ...aiTradingPackages];

    return Response.json({
      packages: allPackages,
      summary: {
        totalInvested: allPackages.reduce((sum, p) => sum + p.invested, 0),
        totalEarned: allPackages.reduce((sum, p) => sum + p.earned, 0),
        activeCount: allPackages.filter(p => p.status === "Active").length,
      },
    });
  } catch (err: any) {
    console.error("Failed to fetch investments:", err);
    return bad("Failed to fetch investments", 500);
  }
}
