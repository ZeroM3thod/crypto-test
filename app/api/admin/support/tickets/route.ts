import { NextRequest } from "next/server";
import { getSession, bad } from "@/lib/auth/backend";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);
  if (!['admin', 'owner'].includes(session.user.role as string)) {
    return bad("Unauthorized", 403);
  }

  const { data: tickets, error } = await db
    .from('support_tickets')
    .select(`
      id,
      ticket_id,
      user_id,
      subject,
      category,
      priority,
      status,
      created_at,
      user:user_id (
        id,
        user_id,
        first_name,
        last_name,
        email,
        phone,
        hidden_from_admins
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Admin tickets fetch error:', error);
    return bad("Failed to fetch tickets");
  }

  return Response.json({ tickets: session.user.role === 'owner' ? tickets : (tickets || []).filter((t: any) => !t.user?.hidden_from_admins) });
}
