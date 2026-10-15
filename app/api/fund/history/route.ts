import { NextRequest } from "next/server";
import { bad, getSession, supabase, q } from "@/lib/auth/backend";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);

  const userId = session.user.id;

  try {
    // Fetch deposits
    const deposits = await supabase<any[]>(
      `deposits?select=id,coin,network_code,amount,status,rejection_reason,created_at&user_id=eq.${q(userId)}&order=created_at.desc&limit=100`
    );

    // Fetch withdrawals
    const withdrawals = await supabase<any[]>(
      `withdrawals?select=id,coin,network_code,amount,fee_amount,net_payout,wallet_address,status,rejection_reason,created_at&user_id=eq.${q(userId)}&order=created_at.desc&limit=100`
    );

    // Fetch send transactions (sender)
    const sendTxns = await supabase<any[]>(
      `send_transactions?select=tx_hash,amount,fee,total,note,status,created_at,recipient:auth_users!send_transactions_recipient_id_fkey(first_name,last_name,email,user_id,wallet_address)&sender_id=eq.${q(userId)}&order=created_at.desc&limit=100`
    );

    // Fetch receive transactions (recipient)
    const receiveTxns = await supabase<any[]>(
      `send_transactions?select=tx_hash,amount,fee,total,note,status,created_at,sender:auth_users!send_transactions_sender_id_fkey(first_name,last_name,email,user_id,wallet_address)&recipient_id=eq.${q(userId)}&order=created_at.desc&limit=100`
    );

    // Transform deposits
    const depositHistory = deposits.map((d) => ({
      id: `DEP-${d.id.slice(0, 6).toUpperCase()}`,
      type: "deposit",
      date: new Date(d.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      amount: Number(d.amount),
      fee: 0,
      net: Number(d.amount),
      coin: d.coin,
      network: d.network_code,
      status: d.status,
      reason: d.rejection_reason,
      timestamp: new Date(d.created_at).getTime(),
    }));

    // Transform withdrawals
    const withdrawalHistory = withdrawals.map((w) => ({
      id: `WD-${w.id.slice(0, 8).toUpperCase()}`,
      type: "withdrawal",
      date: new Date(w.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      amount: Number(w.amount),
      fee: Number(w.fee_amount),
      net: Number(w.net_payout),
      coin: w.coin,
      network: w.network_code,
      counterparty: w.wallet_address.length > 20 
        ? `${w.wallet_address.slice(0, 8)}...${w.wallet_address.slice(-6)}` 
        : w.wallet_address,
      status: w.status,
      reason: w.rejection_reason,
      timestamp: new Date(w.created_at).getTime(),
    }));

    // Transform send transactions
    const sendHistory = sendTxns.map((s) => ({
      id: `SND-${s.tx_hash.slice(0, 6).toUpperCase()}`,
      type: "send",
      date: new Date(s.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      amount: Number(s.amount),
      fee: Number(s.fee),
      net: Number(s.total),
      coin: "USD",
      counterparty: `${s.recipient.first_name} ${s.recipient.last_name}`.trim() + 
        ` (${s.recipient.email})`,
      status: s.status,
      note: s.note,
      timestamp: new Date(s.created_at).getTime(),
    }));

    // Transform receive transactions
    const receiveHistory = receiveTxns.map((r) => ({
      id: `RCV-${r.tx_hash.slice(0, 6).toUpperCase()}`,
      type: "receive",
      date: new Date(r.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      amount: Number(r.amount),
      fee: 0,
      net: Number(r.amount),
      coin: "USD",
      counterparty: `${r.sender.first_name} ${r.sender.last_name}`.trim() + 
        ` (${r.sender.email})`,
      status: r.status,
      note: r.note,
      timestamp: new Date(r.created_at).getTime(),
    }));

    // Merge all transactions and sort by timestamp (newest first)
    const allHistory = [
      ...depositHistory,
      ...withdrawalHistory,
      ...sendHistory,
      ...receiveHistory,
    ].sort((a, b) => b.timestamp - a.timestamp);

    // Calculate stats
    const stats = {
      deposited: depositHistory
        .filter((d) => d.status === "approved")
        .reduce((sum, d) => sum + d.amount, 0),
      withdrawn: withdrawalHistory
        .filter((w) => w.status === "approved")
        .reduce((sum, w) => sum + w.amount, 0),
      sent: sendHistory
        .filter((s) => s.status === "completed")
        .reduce((sum, s) => sum + s.amount, 0),
      received: receiveHistory
        .filter((r) => r.status === "completed")
        .reduce((sum, r) => sum + r.amount, 0),
    };

    return Response.json({
      history: allHistory,
      stats,
    });
  } catch (error) {
    console.error("Error fetching transaction history:", error);
    return bad("Failed to fetch transaction history", 500);
  }
}
