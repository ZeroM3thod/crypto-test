// app/(admin)/admin/history/page.tsx
// Access route: /admin/history
import { AdminShell } from "../../_components/admin-shell";
import { HistoryView } from "../../_components/history-view";
import { getHistory } from "@/lib/admin-finance-data";
import { getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function AdminHistoryPage() {
  const session = await getSessionUser();
  
  if (!session || (session.role !== "admin" && session.role !== "owner")) {
    redirect("/signin");
  }

  const items = await getHistory(session.role);

  return (
    <AdminShell active="Fund History">
      <HistoryView items={items} />
    </AdminShell>
  );
}
