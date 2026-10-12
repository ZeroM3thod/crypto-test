import { NextRequest } from "next/server";
import { bad, getSession, supabase, q } from "@/lib/auth/backend";
import { visibleUserIdsFor, inFilter } from "@/lib/admin/visibility";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);

  // Check admin/owner role
  const userRoles = await supabase<{ role: string }[]>(
    `auth_users?select=role&id=eq.${q(session.user.id)}&limit=1`
  );
  if (!userRoles[0] || !["admin", "owner"].includes(userRoles[0].role)) {
    return bad("Forbidden", 403);
  }

  const visibleIds = await visibleUserIdsFor(session.user.role);
  if (!visibleIds.length) return Response.json({ withdrawals: [] });

  const withdrawals = await supabase<any[]>(
    `withdrawals?select=id,user_id,coin,network_code,amount,fee_amount,net_payout,wallet_address,status,rejection_reason,created_at,updated_at&user_id=in.${inFilter(visibleIds.map(q))}&order=created_at.desc`
  );

  // Fetch user details for each withdrawal
  const userIds = [...new Set(withdrawals.map(w => w.user_id))];
  const users = await supabase<any[]>(
    `auth_users?select=id,user_id,first_name,last_name,email&id=in.(${userIds.map(id => q(id)).join(',')})`
  );

  const userMap = new Map(users.map(u => [u.id, u]));

  return Response.json({
    withdrawals: withdrawals.map((w) => {
      const user = userMap.get(w.user_id) || { user_id: 'N/A', first_name: 'Unknown', last_name: 'User', email: 'N/A' };
      return {
        id: w.id,
        name: `${user.first_name} ${user.last_name}`,
        username: user.email,
        userId: user.user_id,
        coin: w.coin,
        amount: parseFloat(w.amount),
        fee: parseFloat(w.fee_amount),
        network: w.network_code,
        address: w.wallet_address,
        date: w.created_at.split("T")[0],
        reason: w.rejection_reason || "",
        status: w.status,
      };
    }),
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);

  // Check admin/owner role
  const userRoles = await supabase<{ role: string }[]>(
    `auth_users?select=role&id=eq.${q(session.user.id)}&limit=1`
  );
  if (!userRoles[0] || !["admin", "owner"].includes(userRoles[0].role)) {
    return bad("Forbidden", 403);
  }

  const body = await req.json().catch(() => null);
  const withdrawalId = String(body?.withdrawalId || "").trim();
  const action = String(body?.action || "").trim();
  const reason = String(body?.reason || "").trim();

  if (!withdrawalId) return bad("withdrawalId required");
  if (!["approve", "reject"].includes(action)) return bad("Invalid action");

  if (userRoles[0].role !== "owner") {
    const rows = await supabase<{ user_id: string }[]>(`withdrawals?select=user_id&id=eq.${q(withdrawalId)}&limit=1`);
    const visibleIds = await visibleUserIdsFor(session.user.role);
    if (!rows[0] || !visibleIds.includes(rows[0].user_id)) return bad("Not found", 404);
  }

  if (action === "approve") {
    // Call approve_withdrawal function
    await supabase("rpc/approve_withdrawal", {
      method: "POST",
      body: JSON.stringify({
        p_withdrawal_id: withdrawalId,
        p_admin_id: session.user.id,
      }),
    });
  } else {
    // Reject
    if (!reason || reason.length < 5) return bad("Rejection reason required (min 5 chars)");
    
    await supabase("rpc/reject_withdrawal", {
      method: "POST",
      body: JSON.stringify({
        p_withdrawal_id: withdrawalId,
        p_admin_id: session.user.id,
        p_reason: reason,
      }),
    });
  }

  return Response.json({ success: true });
}

// Owner can update withdrawal details
export async function PUT(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);

  // Check owner role
  const userRoles = await supabase<{ role: string }[]>(
    `auth_users?select=role&id=eq.${q(session.user.id)}&limit=1`
  );
  if (!userRoles[0] || userRoles[0].role !== "owner") {
    return bad("Forbidden", 403);
  }

  const body = await req.json().catch(() => null);
  const withdrawalId = String(body?.withdrawalId || "").trim();
  const coin = String(body?.coin || "").trim();
  const network = String(body?.network || "").trim();
  const amount = parseFloat(body?.amount) || 0;
  const walletAddress = String(body?.walletAddress || "").trim();
  const date = String(body?.date || "").trim();

  if (!withdrawalId) return bad("withdrawalId required");
  if (!coin || !["USDT", "USDC"].includes(coin)) return bad("Invalid coin");
  if (!network) return bad("Invalid network");
  if (amount <= 0) return bad("Amount must be greater than 0");
  if (!walletAddress) return bad("Wallet address required");

  const feeAmount = amount * 0.1;
  const netPayout = amount - feeAmount;

  const updateData: any = {
    coin,
    network_code: network,
    amount,
    fee_amount: feeAmount,
    net_payout: netPayout,
    wallet_address: walletAddress,
    updated_at: new Date().toISOString(),
  };

  if (date) {
    updateData.created_at = date;
  }

  await supabase(`withdrawals?id=eq.${q(withdrawalId)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(updateData),
  });

  return Response.json({ success: true });
}
