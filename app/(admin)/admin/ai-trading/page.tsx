// app/(admin)/admin/ai-trading/page.tsx
// Route: /admin/ai-trading
import { AdminShell } from "../../_components/admin-shell";
import { AiTradingManagement } from "../../_components/ai-trading-management";
import { requireAdmin } from "@/lib/auth/require-admin";

export default async function AdminAiTradingPage() {
  await requireAdmin();

  return (
    <AdminShell active="AI Trading">
      <AiTradingManagement />
    </AdminShell>
  );
}
