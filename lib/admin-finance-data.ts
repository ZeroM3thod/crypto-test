// lib/admin-finance-data.ts
// Only the History page uses this file now — deposits and withdrawals moved
// to lib/admin-review-data.ts.
export type HistoryStatus = "completed" | "pending" | "failed";

export type HistoryType = "Deposit" | "Withdraw" | "Send Money" | "Manual Trade";

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

export function getHistory(): HistoryItem[] {
  return [
    { id: "TX-10492", user: "Rahim Uddin", email: "rahim@example.com", type: "Deposit", amount: 1200, fee: 0, status: "completed", date: "2026-10-03 14:22" },
    { id: "TX-10491", user: "Sadia Akter", email: "sadia@example.com", type: "Withdraw", amount: 450, fee: 9, status: "pending", date: "2026-10-03 13:50" },
    { id: "TX-10490", user: "Tanvir Hasan", email: "tanvir@example.com", type: "Send Money", amount: 300, fee: 3, status: "completed", date: "2026-10-03 12:41" },
    { id: "TX-10489", user: "Nusrat Jahan", email: "nusrat@example.com", type: "Manual Trade", amount: 2100, fee: 0, status: "completed", date: "2026-10-02 22:10" },
    { id: "TX-10488", user: "Imran Khan", email: "imran@example.com", type: "Withdraw", amount: 800, fee: 16, status: "failed", date: "2026-10-02 16:44" },
    { id: "TX-10487", user: "Mim Chowdhury", email: "mim@example.com", type: "Deposit", amount: 5000, fee: 0, status: "completed", date: "2026-10-02 11:05" },
    { id: "TX-10486", user: "Arif Hossain", email: "arif@example.com", type: "Send Money", amount: 150, fee: 1.5, status: "completed", date: "2026-10-01 18:20" },
    { id: "TX-10485", user: "Farhana Islam", email: "farhana@example.com", type: "Withdraw", amount: 620, fee: 12.4, status: "completed", date: "2026-10-01 16:02" },
    { id: "TX-10484", user: "Rahim Uddin", email: "rahim@example.com", type: "Manual Trade", amount: 640, fee: 0, status: "completed", date: "2026-10-01 10:33" },
    { id: "TX-10483", user: "Sadia Akter", email: "sadia@example.com", type: "Send Money", amount: 90, fee: 0.9, status: "failed", date: "2026-09-30 19:47" },
  ];
}
