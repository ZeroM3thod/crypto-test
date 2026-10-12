// app/(admin)/admin/investment/daily-profit/page.tsx
// Access route: /admin/investment/daily-profit
import { AdminShell } from "../../../_components/admin-shell";
import { DailyProfitManagement } from "../../../_components/daily-profit-management";
import { requireAdmin } from "@/lib/auth/require-admin";

export default async function AdminInvestmentDailyProfitPage() {
  await requireAdmin();

  return (
    <AdminShell active="Daily Profit">
      <DailyProfitManagement />
    </AdminShell>
  );
}
