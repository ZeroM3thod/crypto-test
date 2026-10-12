// app/(admin)/admin/support/page.tsx
import { AdminShell } from "../../_components/admin-shell";
import { SupportView } from "../../_components/support-view";

export default async function AdminSupportPage() {
  return (
    <AdminShell active="Support">
      <SupportView />
    </AdminShell>
  );
}
