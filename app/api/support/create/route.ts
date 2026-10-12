import { NextRequest } from "next/server";
import { getSession, bad } from "@/lib/auth/backend";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return bad("Unauthorized", 401);

  const body = await req.json().catch(() => null);
  const category = String(body?.category || "").trim();
  const priority = String(body?.priority || "low").trim();
  const subject = String(body?.subject || "").trim();
  const message = String(body?.message || "").trim();

  console.log('Support ticket create:', { category, priority, subject: subject.substring(0, 30), messageLength: message.length });

  if (!["Billing", "Investment", "Referral", "Account", "Technical", "Other"].includes(category)) {
    console.log('Category validation failed:', category);
    return bad("Invalid category");
  }
  if (!["low", "medium", "high", "urgent"].includes(priority)) {
    console.log('Priority validation failed:', priority);
    return bad("Invalid priority");
  }
  if (!subject || subject.length < 3) {
    console.log('Subject validation failed:', subject);
    return bad("Subject required");
  }
  if (!message || message.length < 20) {
    console.log('Message validation failed. Length:', message.length);
    return bad("Message must be at least 20 characters");
  }

  console.log('Validation passed, generating ticket ID...');
  const ticketId = await db.rpc('generate_ticket_id');
  console.log('Ticket ID result:', ticketId);
  if (!ticketId.data) return bad("Failed to generate ticket ID");

  const { data: ticket, error: ticketError } = await db
    .from('support_tickets')
    .insert({
      ticket_id: ticketId.data,
      user_id: session.user.id,
      category,
      priority,
      subject,
      status: 'pending'
    })
    .select('id, ticket_id')
    .single();

  if (ticketError || !ticket) {
    console.error('Ticket creation error:', ticketError);
    return bad("Failed to create ticket");
  }

  const { error: msgError } = await db
    .from('support_messages')
    .insert({
      ticket_id: ticket.id,
      sender_id: session.user.id,
      message
    });

  if (msgError) {
    console.error('Message creation error:', msgError);
  }

  await db
    .from('support_logs')
    .insert({
      ticket_id: ticket.id,
      action: 'ticket_created',
      description: 'Ticket created',
      performer_id: session.user.id
    });

  return Response.json({ success: true, ticketId: ticket.ticket_id });
}
