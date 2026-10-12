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
  if (!visibleIds.length) return Response.json({ deposits: [] });

  const deposits = await supabase<any[]>(
    `deposits?select=id,user_id,coin,network_code,amount,transaction_hash,status,rejection_reason,created_at,updated_at&user_id=in.${inFilter(visibleIds.map(q))}&order=created_at.desc`
  );

  // Fetch user details for each deposit
  const userIds = [...new Set(deposits.map(d => d.user_id))];
  const users = await supabase<any[]>(
    `auth_users?select=id,user_id,first_name,last_name,email&id=in.(${userIds.map(id => q(id)).join(',')})`
  );

  const userMap = new Map(users.map(u => [u.id, u]));

  return Response.json({
    deposits: deposits.map((d) => {
      const user = userMap.get(d.user_id) || { user_id: 'N/A', first_name: 'Unknown', last_name: 'User', email: 'N/A' };
      return {
        id: d.id,
        name: `${user.first_name} ${user.last_name}`,
        username: user.email,
        userId: user.user_id,
        coin: d.coin,
        amount: parseFloat(d.amount),
        network: d.network_code,
        hash: d.transaction_hash || "",
        date: d.created_at.split("T")[0],
        reason: d.rejection_reason || "",
        status: d.status,
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
  const depositId = String(body?.depositId || "").trim();
  const action = String(body?.action || "").trim();
  const reason = String(body?.reason || "").trim();

  if (!depositId) return bad("depositId required");
  if (!["approve", "reject"].includes(action)) return bad("Invalid action");

  if (userRoles[0].role !== "owner") {
    const rows = await supabase<{ user_id: string }[]>(`deposits?select=user_id&id=eq.${q(depositId)}&limit=1`);
    const visibleIds = await visibleUserIdsFor(session.user.role);
    if (!rows[0] || !visibleIds.includes(rows[0].user_id)) return bad("Not found", 404);
  }

  if (action === "approve") {
    // Call approve_deposit function
    await supabase("rpc/approve_deposit", {
      method: "POST",
      body: JSON.stringify({
        p_deposit_id: depositId,
        p_admin_id: session.user.id,
      }),
    });
  } else {
    // Reject
    if (!reason || reason.length < 5) return bad("Rejection reason required (min 5 chars)");
    
    await supabase("rpc/reject_deposit", {
      method: "POST",
      body: JSON.stringify({
        p_deposit_id: depositId,
        p_admin_id: session.user.id,
        p_reason: reason,
      }),
    });
  }

  return Response.json({ success: true });
}

// Owner can update deposit details
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
  const depositId = String(body?.depositId || "").trim();
  const coin = String(body?.coin || "").trim();
  const network = String(body?.network || "").trim();
  const amount = parseFloat(body?.amount) || 0;
  const transactionHash = String(body?.transactionHash || "").trim();

  if (!depositId) return bad("depositId required");
  if (!coin || !["USDT", "USDC"].includes(coin)) return bad("Invalid coin");
  if (!network) return bad("Invalid network");
  if (amount <= 0) return bad("Amount must be greater than 0");
  if (!transactionHash) return bad("Transaction hash required");

  await supabase(`deposits?id=eq.${q(depositId)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      coin,
      network_code: network,
      amount,
      transaction_hash: transactionHash,
      updated_at: new Date().toISOString(),
    }),
  });

  return Response.json({ success: true });
}
