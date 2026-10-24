import { NextRequest } from "next/server";
import { bad, getSession, supabase, q } from "@/lib/auth/backend";
import { notifyRequest } from "@/lib/email/request-notification";

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);

  const body = await req.json().catch(() => null);
  const amount = parseFloat(body?.amount) || 0;
  const coin = String(body?.coin || "").trim();
  const network = String(body?.network || "").trim();
  const transactionHash = String(body?.transactionHash || "").trim();

  if (amount < 10) return bad("Minimum deposit amount is $10");
  if (!coin || !["USDT", "USDC"].includes(coin)) return bad("Invalid coin");
  if (!network || !["BEP20", "ERC20", "Aptos", "Polygon_POS", "Solana"].includes(network)) {
    return bad("Invalid network");
  }
  if (!transactionHash || transactionHash.length < 10) {
    return bad("Valid transaction hash required");
  }

  // Create deposit request
  await supabase("deposits?select=*", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      user_id: session.user.id,
      coin,
      network_code: network,
      amount,
      transaction_hash: transactionHash,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
  });

  await notifyRequest("Deposit", session.user.id, { amount, coin, network_code: network, transaction_hash: transactionHash });

  return Response.json({ success: true });
}

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);

  // Fetch user's deposit history
  const deposits = await supabase<any[]>(
    `deposits?select=*&user_id=eq.${q(session.user.id)}&order=created_at.desc`
  );

  return Response.json({
    deposits: deposits.map((d) => ({
      id: d.id,
      date: d.created_at.split("T")[0],
      amount: parseFloat(d.amount),
      coin: d.coin,
      network: d.network_code,
      status: d.status,
      reason: d.rejection_reason || "",
    })),
  });
}
