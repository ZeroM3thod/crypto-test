import { NextRequest } from "next/server";
import { bad, getSession, supabase, q, txHash } from "@/lib/auth/backend";

const SEND_FEE = 0.1;

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);

  const body = await req.json().catch(() => null);
  const recipientId = String(body?.recipientId || "").trim();
  const amount = parseFloat(body?.amount) || 0;
  const note = String(body?.note || "").trim();

  if (!recipientId) return bad("recipientId required");
  if (amount < 1) return bad("Minimum send amount is $1");

  const total = amount + SEND_FEE;

  // Get sender's main wallet balance
  const senderWallets = await supabase<{ balance: number }[]>(
    `wallet_accounts?select=balance&user_id=eq.${q(session.user.id)}&wallet=eq.main&limit=1`
  );
  const senderBalance = senderWallets[0]?.balance || 0;

  if (senderBalance < total) {
    return bad(`Insufficient balance. You need $${total.toFixed(2)} (incl. $${SEND_FEE.toFixed(2)} fee).`);
  }

  // Verify recipient exists and is active
  const recipients = await supabase<{ id: string; first_name: string; last_name: string; email: string }[]>(
    `auth_users?select=id,first_name,last_name,email&id=eq.${q(recipientId)}&status=eq.active&limit=1`
  );
  const recipient = recipients[0];
  if (!recipient) return bad("Recipient not found or inactive");

  // Prevent sending to self
  if (recipient.id === session.user.id) {
    return bad("You cannot send money to yourself");
  }

  const txId = txHash();

  // Deduct from sender's main wallet
  await supabase(`wallet_accounts?user_id=eq.${q(session.user.id)}&wallet=eq.main`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      balance: senderBalance - total,
      updated_at: new Date().toISOString(),
    }),
  });

  // Add to recipient's main wallet
  await supabase(`wallet_accounts?user_id=eq.${q(recipientId)}&wallet=eq.main`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      balance: `balance + ${amount}`,
      updated_at: new Date().toISOString(),
    }),
  });

  // Record sender's transaction (debit with fee)
  await supabase("wallet_transactions", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      user_id: session.user.id,
      wallet: "main",
      type: "send",
      amount: -total,
      status: "completed",
      tx_hash: txId,
      asset: "USDT",
    }),
  });

  // Record recipient's transaction (credit)
  await supabase("wallet_transactions", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      user_id: recipientId,
      wallet: "main",
      type: "receive",
      amount: amount,
      status: "completed",
      tx_hash: txId,
      asset: "USDT",
    }),
  });

  // Record in send_transactions table for history
  await supabase("send_transactions", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      sender_id: session.user.id,
      recipient_id: recipientId,
      amount,
      fee: SEND_FEE,
      total,
      note: note || null,
      tx_hash: txId,
      status: "completed",
    }),
  });

  return Response.json({
    success: true,
    transactionId: txId,
    amount,
    fee: SEND_FEE,
    total,
    recipientName: `${recipient.first_name} ${recipient.last_name}`.trim(),
    recipientEmail: recipient.email,
  });
}
