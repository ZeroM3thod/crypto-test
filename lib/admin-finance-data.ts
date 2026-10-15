// lib/admin-finance-data.ts
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type HistoryStatus = "completed" | "pending" | "failed" | "approved" | "rejected";
export type HistoryType = "Deposit" | "Withdraw" | "Send Money";

export type HistoryItem = {
  id: string;
  user: string;
  email: string;
  type: HistoryType;
  amount: number;
  fee: number;
  status: HistoryStatus;
  date: string;
};

export async function getHistory(userRole: string): Promise<HistoryItem[]> {
  const items: HistoryItem[] = [];

  // Fetch deposits
  const depositsQuery = supabase
    .from("deposits")
    .select(`
      id,
      amount,
      status,
      created_at,
      auth_users!deposits_user_id_fkey (
        first_name,
        last_name,
        email,
        hidden_from_admins
      )
    `)
    .order("created_at", { ascending: false });

  const { data: deposits } = await depositsQuery;

  if (deposits) {
    for (const d of deposits) {
      const user = d.auth_users as any;
      if (!user) continue;
      
      // Filter by role visibility
      if (userRole === "admin" && user.hidden_from_admins) continue;

      items.push({
        id: `DEP-${d.id.slice(0, 8)}`,
        user: `${user.first_name} ${user.last_name}`,
        email: user.email,
        type: "Deposit",
        amount: Number(d.amount),
        fee: 0,
        status: d.status as HistoryStatus,
        date: new Date(d.created_at).toLocaleString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
    }
  }

  // Fetch withdrawals
  const withdrawalsQuery = supabase
    .from("withdrawals")
    .select(`
      id,
      amount,
      fee_amount,
      status,
      created_at,
      auth_users!withdrawals_user_id_fkey (
        first_name,
        last_name,
        email,
        hidden_from_admins
      )
    `)
    .order("created_at", { ascending: false });

  const { data: withdrawals } = await withdrawalsQuery;

  if (withdrawals) {
    for (const w of withdrawals) {
      const user = w.auth_users as any;
      if (!user) continue;
      
      // Filter by role visibility
      if (userRole === "admin" && user.hidden_from_admins) continue;

      items.push({
        id: `WTH-${w.id.slice(0, 8)}`,
        user: `${user.first_name} ${user.last_name}`,
        email: user.email,
        type: "Withdraw",
        amount: Number(w.amount),
        fee: Number(w.fee_amount),
        status: w.status as HistoryStatus,
        date: new Date(w.created_at).toLocaleString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
    }
  }

  // Fetch send transactions
  const sendQuery = supabase
    .from("send_transactions")
    .select(`
      id,
      amount,
      fee,
      status,
      created_at,
      sender:auth_users!send_transactions_sender_id_fkey (
        first_name,
        last_name,
        email,
        hidden_from_admins
      )
    `)
    .order("created_at", { ascending: false });

  const { data: sends } = await sendQuery;

  if (sends) {
    for (const s of sends) {
      const user = s.sender as any;
      if (!user) continue;
      
      // Filter by role visibility
      if (userRole === "admin" && user.hidden_from_admins) continue;

      items.push({
        id: `SND-${s.id.slice(0, 8)}`,
        user: `${user.first_name} ${user.last_name}`,
        email: user.email,
        type: "Send Money",
        amount: Number(s.amount),
        fee: Number(s.fee),
        status: s.status === "completed" ? "completed" : s.status === "pending" ? "pending" : "failed",
        date: new Date(s.created_at).toLocaleString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
    }
  }

  // Sort by date descending
  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return items;
}
