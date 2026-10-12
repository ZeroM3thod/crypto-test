import { NextRequest } from "next/server";
import { getSession, bad } from "@/lib/auth/backend";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);

  const { data: tickets, error } = await db
    .from('support_tickets')
    .select('id, ticket_id, subject, category, priority, status, created_at')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Tickets fetch error:', error);
    return bad("Failed to fetch tickets");
  }

  return Response.json({ tickets });
}
