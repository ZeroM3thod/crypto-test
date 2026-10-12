// lib/admin-support-data.ts
export type TicketStatus = "pending" | "open" | "resolved" | "closed";
export type TicketPriority = "high" | "medium" | "low";

export type TicketMessage = {
  id: string;
  from: "user" | "staff";
  staffName?: string;
  message: string;
  created_at: string;
};

export type TicketLog = {
  id: string;
  action: "ticket_created" | "status_changed" | "reply_sent";
  text: string;
  performer?: string;
  created_at: string;
};

export type Ticket = {
  id: string;
  ticket_id: string;
  user_id: string;
  subject: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  created_at: string;
  profile: {
    first_name: string;
    last_name: string;
    username: string;
    email: string;
    phone_number: string;
  };
  messages: TicketMessage[];
  logs: TicketLog[];
};

const created = (id: string, at: string): TicketLog => ({
  id: `${id}-l0`,
  action: "ticket_created",
  text: "Ticket created",
  created_at: at,
});

export function getTickets(): Ticket[] {
  return [
    {
      id: "t1", ticket_id: "TKT-1042", user_id: "u1-4f2a9c71",
      subject: "Deposit not credited after 2 hours", category: "Deposit",
      priority: "high", status: "pending", created_at: "2026-10-03T09:12:00Z",
      profile: { first_name: "Rahim", last_name: "Uddin", username: "rahim", email: "rahim@example.com", phone_number: "+880 1711-000111" },
      messages: [
        { id: "m1", from: "user", message: "I sent 1,200 USDT on TRC20 two hours ago and it still isn't showing in my balance.", created_at: "2026-10-03T09:12:00Z" },
        { id: "m2", from: "user", message: "Here is my hash: a91f3c77d20b84e1. Please check.", created_at: "2026-10-03T09:14:00Z" },
      ],
      logs: [created("t1", "2026-10-03T09:12:00Z")],
    },
    {
      id: "t2", ticket_id: "TKT-1041", user_id: "u3-8b1d5e02",
      subject: "Withdrawal stuck in pending", category: "Withdrawal",
      priority: "high", status: "open", created_at: "2026-10-03T07:40:00Z",
      profile: { first_name: "Sadia", last_name: "Akter", username: "sadia", email: "sadia@example.com", phone_number: "+880 1811-222333" },
      messages: [
        { id: "m1", from: "user", message: "My withdrawal request from yesterday is still pending.", created_at: "2026-10-03T07:40:00Z" },
        { id: "m2", from: "staff", staffName: "Admin User", message: "Hi Sadia, we're reviewing it now and will update you shortly.", created_at: "2026-10-03T08:05:00Z" },
      ],
      logs: [
        { id: "t2-l2", action: "reply_sent", text: "Reply sent to user", performer: "Admin User", created_at: "2026-10-03T08:05:00Z" },
        { id: "t2-l1", action: "status_changed", text: "Status changed to open", performer: "Admin User", created_at: "2026-10-03T08:04:00Z" },
        created("t2", "2026-10-03T07:40:00Z"),
      ],
    },
    {
      id: "t3", ticket_id: "TKT-1040", user_id: "u6-1c9e7a44",
      subject: "Cannot verify my account (KYC)", category: "Account",
      priority: "medium", status: "open", created_at: "2026-10-02T16:25:00Z",
      profile: { first_name: "Nusrat", last_name: "Jahan", username: "nusrat", email: "nusrat@example.com", phone_number: "+880 1611-444555" },
      messages: [
        { id: "m1", from: "user", message: "The KYC page keeps saying my document is unreadable.", created_at: "2026-10-02T16:25:00Z" },
      ],
      logs: [created("t3", "2026-10-02T16:25:00Z")],
    },
    {
      id: "t4", ticket_id: "TKT-1039", user_id: "u4-6d3f0b18",
      subject: "Wrong fee charged on transfer", category: "Billing",
      priority: "medium", status: "resolved", created_at: "2026-10-02T11:10:00Z",
      profile: { first_name: "Tanvir", last_name: "Hasan", username: "tanvir", email: "tanvir@example.com", phone_number: "+880 1911-666777" },
      messages: [
        { id: "m1", from: "user", message: "I was charged 3 USDT instead of 1 on my send money transfer.", created_at: "2026-10-02T11:10:00Z" },
        { id: "m2", from: "staff", staffName: "Admin User", message: "Thanks for flagging this. We've refunded the difference to your balance.", created_at: "2026-10-02T12:30:00Z" },
        { id: "m3", from: "user", message: "Received it, thank you!", created_at: "2026-10-02T12:41:00Z" },
      ],
      logs: [
        { id: "t4-l2", action: "status_changed", text: "Status changed to resolved", performer: "Admin User", created_at: "2026-10-02T12:45:00Z" },
        { id: "t4-l1", action: "reply_sent", text: "Reply sent to user", performer: "Admin User", created_at: "2026-10-02T12:30:00Z" },
        created("t4", "2026-10-02T11:10:00Z"),
      ],
    },
    {
      id: "t5", ticket_id: "TKT-1038", user_id: "u5-92ab34cd",
      subject: "App crashes when opening trade history", category: "Technical",
      priority: "low", status: "closed", created_at: "2026-10-01T18:00:00Z",
      profile: { first_name: "Imran", last_name: "Khan", username: "imran", email: "imran@example.com", phone_number: "+880 1511-888999" },
      messages: [
        { id: "m1", from: "user", message: "The trade history page freezes on my phone.", created_at: "2026-10-01T18:00:00Z" },
        { id: "m2", from: "staff", staffName: "Admin User", message: "Please update to the latest version and try again.", created_at: "2026-10-01T19:10:00Z" },
      ],
      logs: [
        { id: "t5-l2", action: "status_changed", text: "Status changed to closed", performer: "Admin User", created_at: "2026-10-02T09:00:00Z" },
        { id: "t5-l1", action: "reply_sent", text: "Reply sent to user", performer: "Admin User", created_at: "2026-10-01T19:10:00Z" },
        created("t5", "2026-10-01T18:00:00Z"),
      ],
    },
    {
      id: "t6", ticket_id: "TKT-1037", user_id: "u2-5e8c1f90",
      subject: "How do I change my withdrawal wallet?", category: "Account",
      priority: "low", status: "pending", created_at: "2026-10-01T10:30:00Z",
      profile: { first_name: "Mim", last_name: "Chowdhury", username: "mim", email: "mim@example.com", phone_number: "+880 1311-123123" },
      messages: [
        { id: "m1", from: "user", message: "I want to update the wallet address I use for withdrawals. Where can I do that?", created_at: "2026-10-01T10:30:00Z" },
      ],
      logs: [created("t6", "2026-10-01T10:30:00Z")],
    },
  ];
}
