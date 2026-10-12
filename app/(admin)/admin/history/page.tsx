// app/(admin)/admin/history/page.tsx
// Access route: /admin/history
// Add your admin auth guard here later.
import { AdminShell } from "../../_components/admin-shell";
import { HistoryView } from "../../_components/history-view";
import { getHistory } from "@/lib/admin-finance-data";

export default async function AdminHistoryPage() {
  const items = getHistory(); // swap for your DB / API call

  return (
    <AdminShell active="Fund History">
      <HistoryView items={items} />
    </AdminShell>
  );
}
