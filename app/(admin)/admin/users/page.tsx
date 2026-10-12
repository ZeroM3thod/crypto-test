// app/(admin)/admin/users/page.tsx
// Access route: /admin/users
import { AdminShell } from "../../_components/admin-shell";
import { UsersManagement } from "../../_components/users-management";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAllUsers } from "@/lib/admin/users-service";

export default async function AdminUsersPage() {
  await requireAdmin();
  const rows = await getAllUsers();

  return (
    <AdminShell active="All Users">
      <UsersManagement rows={rows} />
    </AdminShell>
  );
}
