import { NextRequest } from "next/server";
import { bad, getSession, supabase, q } from "@/lib/auth/backend";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);

  const userId = session.user.id;

  // Get main wallet balance
  const wallets = await supabase<{ balance: number }[]>(
    `wallet_accounts?select=balance&user_id=eq.${q(userId)}&wallet=eq.main&limit=1`
  );
  const balance = wallets[0]?.balance || 0;

  // Get send transaction history
  const sendTxns = await supabase<any[]>(
    `send_transactions?select=*,sender:auth_users!send_transactions_sender_id_fkey(first_name,last_name,email),recipient:auth_users!send_transactions_recipient_id_fkey(first_name,last_name,email,user_id,wallet_address)&sender_id=eq.${q(userId)}&order=created_at.desc&limit=50`
  );

  const history = sendTxns.map((txn) => ({
    id: txn.tx_hash,
    date: new Date(txn.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    recipientName: `${txn.recipient.first_name} ${txn.recipient.last_name}`.trim(),
    recipientEmail: txn.recipient.email,
    recipientUserId: txn.recipient.user_id,
    recipientWallet: txn.recipient.wallet_address,
    amount: Number(txn.amount),
    fee: Number(txn.fee),
    total: Number(txn.total),
    status: txn.status,
    note: txn.note,
  }));

  return Response.json({
    balance,
    history,
  });
}
