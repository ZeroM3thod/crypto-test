// app/(admin)/admin/referral/page.tsx
// Access route: /admin/referral
import { AdminShell } from "../../_components/admin-shell";
import { ReferralBasicManagement } from "../../_components/referral-basic-management";
import { requireAdmin } from "@/lib/auth/require-admin";

export default async function AdminReferralPage() {
  await requireAdmin();

  return (
    <AdminShell active="Basic Management">
      <ReferralBasicManagement />
    </AdminShell>
  );
}
