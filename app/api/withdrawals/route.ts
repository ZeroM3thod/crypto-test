import { NextRequest } from "next/server";
import { bad, getSession, supabase, q } from "@/lib/auth/backend";

const WITHDRAWAL_FEE_RATE = 0.1; // 10%

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);

  const body = await req.json().catch(() => null);
  const amount = parseFloat(body?.amount) || 0;
  const coin = String(body?.coin || "").trim();
  const network = String(body?.network || "").trim();
  const walletAddress = String(body?.walletAddress || "").trim();

  if (amount < 10) return bad("Minimum withdrawal amount is $10");
  if (!coin || !["USDT", "USDC"].includes(coin)) return bad("Invalid coin");
  if (!network || !["BEP20", "Aptos"].includes(network)) return bad("Invalid network");
  if (!walletAddress || walletAddress.length < 26) return bad("Valid wallet address required");

  const feeAmount = amount * WITHDRAWAL_FEE_RATE;
  const netPayout = amount - feeAmount;

  // Check main wallet balance
  const wallets = await supabase<{ balance: number }[]>(
    `wallet_accounts?select=balance&user_id=eq.${q(session.user.id)}&wallet=eq.main&limit=1`
  );
  const balance = wallets[0]?.balance || 0;

  if (balance < amount) {
    return bad(`Insufficient balance. Available: $${balance.toFixed(2)}`);
  }

  // Deduct from main wallet
  await supabase(`wallet_accounts?user_id=eq.${q(session.user.id)}&wallet=eq.main`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      balance: balance - amount,
      updated_at: new Date().toISOString(),
    }),
  });

  // Create withdrawal request
  await supabase("withdrawals", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      user_id: session.user.id,
      coin,
      network_code: network,
      amount,
      fee_percentage: WITHDRAWAL_FEE_RATE * 100,
      fee_amount: feeAmount,
      net_payout: netPayout,
      wallet_address: walletAddress,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
  });

  // Record pending transaction
  await supabase("wallet_transactions", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      user_id: session.user.id,
      wallet: "main",
      type: "withdrawal_pending",
      asset: coin,
      amount: -amount,
      status: "pending",
      tx_hash: crypto.randomUUID(),
    }),
  });

  return Response.json({ success: true });
}

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);

  // Fetch user's withdrawal history
  const withdrawals = await supabase<any[]>(
    `withdrawals?select=*&user_id=eq.${q(session.user.id)}&order=created_at.desc`
  );

  return Response.json({
    withdrawals: withdrawals.map((w) => ({
      id: w.id,
      date: w.created_at.split("T")[0],
      amount: parseFloat(w.amount),
      fee: parseFloat(w.fee_amount),
      receive: parseFloat(w.net_payout),
      coin: w.coin,
      network: w.network_code,
      wallet: w.wallet_address,
      status: w.status,
      reason: w.rejection_reason || "",
    })),
  });
}
