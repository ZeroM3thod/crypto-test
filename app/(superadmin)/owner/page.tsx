// app/(superadmin)/owner/page.tsx
// Owner dashboard: same view + same data source as the admin dashboard.
import { SuperAdminShell } from "../_components/super-admin-shell";
import { DashboardView } from "@/app/(superadmin)/_components/dashboard-view";
import { getDashboardData } from "@/lib/admin-dashboard-data";
import { requireOwner } from "@/lib/auth/require-owner";

export default async function OwnerDashboardPage() {
  await requireOwner();
  const data = await getDashboardData(true);

  return (
    <SuperAdminShell active="Dashboard">
      <DashboardView data={data} />
    </SuperAdminShell>
  );
}
