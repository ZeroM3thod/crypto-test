// app/(admin)/layout.tsx
// Admin panel: admin-only pages, no dock.

import { getEffectiveAdminId } from "@/lib/auth/session";
import { getAdminById } from "@/lib/admin-data";
import { ImpersonationBanner } from "./_components/impersonation-banner";

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const effective = await getEffectiveAdminId();
  const adminName = effective.impersonating
    ? (await getAdminById(effective.id ?? ""))?.name ?? "admin"
    : "";

  return (
    <>
      {effective.impersonating ? <ImpersonationBanner adminName={adminName} /> : null}
      {children}
    </>
  );
}
