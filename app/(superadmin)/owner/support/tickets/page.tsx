// app/(superadmin)/owner/support/tickets/page.tsx
import { SuperAdminShell } from "../../../_components/super-admin-shell";
import { SupportView } from "@/app/(superadmin)/_components/support-view";
import { requireOwner } from "@/lib/auth/require-owner";

export default async function OwnerSupportPage() {
  await requireOwner();

  return (
    <SuperAdminShell active="Support">
      <SupportView />
    </SuperAdminShell>
  );
}
