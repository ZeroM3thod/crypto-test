// app/(superadmin)/owner/admin-management/page.tsx
// Owner-only area.
import { AdminManagement } from "../../_components/admin-management";
import { SuperAdminShell } from "../../_components/super-admin-shell";
import { requireOwner } from "@/lib/auth/require-owner";
import { getAdmins, getManagedUsers, getRestrictedMode, getRestrictedPeople } from "@/lib/admin-data";

export default async function AdminManagementPage() {
  await requireOwner();
  const [admins, users, restrictedMode, restrictedPeople] = await Promise.all([
    getAdmins(),
    getManagedUsers(),
    getRestrictedMode(),
    getRestrictedPeople(),
  ]);

  return (
    <SuperAdminShell active="Admin Management">
      <AdminManagement admins={admins} users={users} restrictedMode={restrictedMode} restrictedPeople={restrictedPeople} />
    </SuperAdminShell>
  );
}
