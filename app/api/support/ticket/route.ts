import { NextRequest } from "next/server";
import { getSession, bad } from "@/lib/auth/backend";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const ticketId = searchParams.get('ticketId');

  if (!ticketId) return bad("Ticket ID required");

  const { data: ticket, error: ticketError } = await db
    .from('support_tickets')
    .select('id, ticket_id, subject, category, priority, status, created_at, user_id')
    .eq('id', ticketId)
    .eq('user_id', session.user.id)
    .single();

  if (ticketError || !ticket) {
    return bad("Ticket not found");
  }

  const { data: messages, error: msgError } = await db
    .from('support_messages')
    .select(`
      id,
      message,
      created_at,
      sender:sender_id (
        id,
        first_name,
        last_name,
        role
      )
    `)
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });

  if (msgError) {
    console.error('Messages fetch error:', msgError);
    return Response.json({ ticket, messages: [] });
  }

  return Response.json({ ticket, messages });
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);

  const body = await req.json().catch(() => null);
  const ticketId = String(body?.ticketId || "").trim();
  const message = String(body?.message || "").trim();

  if (!ticketId) return bad("Ticket ID required");
  if (!message || message.length < 1) return bad("Message required");

  const { data: ticket } = await db
    .from('support_tickets')
    .select('id, status, user_id')
    .eq('id', ticketId)
    .eq('user_id', session.user.id)
    .single();

  if (!ticket) return bad("Ticket not found");
  if (ticket.status === 'closed') return bad("Ticket is closed");

  const { data: newMessage, error } = await db
    .from('support_messages')
    .insert({
      ticket_id: ticketId,
      sender_id: session.user.id,
      message
    })
    .select(`
      id,
      message,
      created_at,
      sender:sender_id (
        id,
        first_name,
        last_name,
        role
      )
    `)
    .single();

  if (error || !newMessage) {
    console.error('Message creation error:', error);
    return bad("Failed to send message");
  }

  await db
    .from('support_tickets')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', ticketId);

  return Response.json({ success: true, message: newMessage });
}
