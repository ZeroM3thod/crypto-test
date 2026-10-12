// app/(admin)/admin/users/[userId]/page.tsx
// Access route: /admin/users/:userId
import { notFound } from "next/navigation";
import { AdminShell } from "../../../_components/admin-shell";
import { UserDetail } from "../../../_components/user-detail";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getUserDetail } from "@/lib/admin/users-service";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const session = await requireAdmin();
  const { userId } = await params;
  const user = await getUserDetail(userId);
  if (!user) notFound();

  return (
    <AdminShell active="All Users">
      <UserDetail initialUser={user} adminRole={session.role} />
    </AdminShell>
  );
}
