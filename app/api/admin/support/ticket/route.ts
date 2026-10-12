import { NextRequest } from "next/server";
import { getSession, bad } from "@/lib/auth/backend";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);
  if (!['admin', 'owner'].includes(session.user.role as string)) {
    return bad("Unauthorized", 403);
  }

  const { searchParams } = new URL(req.url);
  const ticketId = searchParams.get('ticketId');

  if (!ticketId) return bad("Ticket ID required");

  const { data: ticket, error: ticketError } = await db
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
    .eq('id', ticketId)
    .single();

  if (ticketError || !ticket) {
    return bad("Ticket not found");
  }
  if (session.user.role !== 'owner' && (ticket.user as any)?.hidden_from_admins) return bad("Ticket not found", 404);

  const { data: messages } = await db
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

  const { data: logs } = await db
    .from('support_logs')
    .select(`
      id,
      action,
      description,
      created_at,
      performer:performer_id (
        first_name,
        last_name
      )
    `)
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: false });

  return Response.json({ ticket, messages: messages || [], logs: logs || [] });
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);
  if (!['admin', 'owner'].includes(session.user.role as string)) {
    return bad("Unauthorized", 403);
  }

  const body = await req.json().catch(() => null);
  const ticketId = String(body?.ticketId || "").trim();
  const message = String(body?.message || "").trim();

  if (!ticketId) return bad("Ticket ID required");
  if (!message || message.length < 1) return bad("Message required");

  const { data: ticket } = await db
    .from('support_tickets')
    .select('id, status, user:user_id(hidden_from_admins)')
    .eq('id', ticketId)
    .single();

  if (!ticket) return bad("Ticket not found");
  if (session.user.role !== 'owner' && (ticket.user as any)?.hidden_from_admins) return bad("Ticket not found", 404);
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
    console.error('Admin message creation error:', error);
    return bad("Failed to send message");
  }

  await db
    .from('support_logs')
    .insert({
      ticket_id: ticketId,
      action: 'reply_sent',
      description: 'Reply sent to user',
      performer_id: session.user.id
    });

  await db
    .from('support_tickets')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', ticketId);

  return Response.json({ success: true, message: newMessage });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);
  if (!['admin', 'owner'].includes(session.user.role as string)) {
    return bad("Unauthorized", 403);
  }

  const body = await req.json().catch(() => null);
  const ticketId = String(body?.ticketId || "").trim();
  const status = String(body?.status || "").trim();

  if (!ticketId) return bad("Ticket ID required");
  if (!['pending', 'open', 'resolved', 'closed'].includes(status)) {
    return bad("Invalid status");
  }

  const { data: ticket } = await db
    .from('support_tickets')
    .select('id, user:user_id(hidden_from_admins)')
    .eq('id', ticketId)
    .single();
  if (!ticket) return bad("Ticket not found", 404);
  if (session.user.role !== 'owner' && (ticket.user as any)?.hidden_from_admins) return bad("Ticket not found", 404);

  const { error } = await db
    .from('support_tickets')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', ticketId);

  if (error) {
    console.error('Status update error:', error);
    return bad("Failed to update status");
  }

  await db
    .from('support_logs')
    .insert({
      ticket_id: ticketId,
      action: 'status_changed',
      description: `Status changed to ${status}`,
      performer_id: session.user.id
    });

  return Response.json({ success: true });
}
