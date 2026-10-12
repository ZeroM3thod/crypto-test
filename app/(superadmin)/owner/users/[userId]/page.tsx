// app/(superadmin)/owner/users/[userId]/page.tsx
import { notFound } from "next/navigation";
import { SuperAdminShell } from "../../../_components/super-admin-shell";
import { UserDetail } from "../../../_components/user-detail";
import { getUser } from "@/lib/users-data";
import { requireOwner } from "@/lib/auth/require-owner";

export default async function OwnerUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  await requireOwner();
  const { userId } = await params;
  const user = getUser(userId);
  if (!user) notFound();

  return (
    <SuperAdminShell active="All Users">
      <UserDetail initialUser={user} />
    </SuperAdminShell>
  );
}
