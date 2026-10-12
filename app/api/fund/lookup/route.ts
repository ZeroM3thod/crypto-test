import { NextRequest } from "next/server";
import { bad, getSession, supabase, q } from "@/lib/auth/backend";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") as "email" | "userId" | "wallet" | null;
  const query = searchParams.get("q")?.trim();

  if (!type || !query) return bad("type and q parameters required");

  let users: any[] = [];

  if (type === "email") {
    users = await supabase<any[]>(
      `auth_users?select=id,user_id,first_name,last_name,email,wallet_address&email=eq.${q(query)}&status=eq.active&limit=1`
    );
  } else if (type === "userId") {
    users = await supabase<any[]>(
      `auth_users?select=id,user_id,first_name,last_name,email,wallet_address&user_id=eq.${q(query)}&status=eq.active&limit=1`
    );
  } else if (type === "wallet") {
    users = await supabase<any[]>(
      `auth_users?select=id,user_id,first_name,last_name,email,wallet_address&wallet_address=eq.${q(query)}&status=eq.active&limit=1`
    );
  } else {
    return bad("Invalid type. Must be email, userId, or wallet");
  }

  const user = users[0];
  if (!user) {
    return Response.json({ found: false });
  }

  // Don't allow sending to self
  if (user.id === session.user.id) {
    return bad("You cannot send money to yourself");
  }

  return Response.json({
    found: true,
    recipient: {
      id: user.id,
      name: `${user.first_name} ${user.last_name}`.trim(),
      email: user.email,
      userId: user.user_id,
      walletAddress: user.wallet_address,
      handle: type === "email" ? user.email : type === "userId" ? user.user_id : user.wallet_address,
      lookupType: type,
    },
  });
}
