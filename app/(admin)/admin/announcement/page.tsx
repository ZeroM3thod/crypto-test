// app/(admin)/admin/announcement/page.tsx
// Access route: /admin/announcement
import { AdminShell } from "../../_components/admin-shell";
import { AnnouncementView } from "../../_components/announcement-view";
import { getAnnouncements } from "@/lib/admin-announcement-data";
import { requireAdmin } from "@/lib/auth/require-admin";

export default async function AdminAnnouncementPage() {
  await requireAdmin();
  const announcements = await getAnnouncements(true);

  return (
    <AdminShell active="Announcements">
      <AnnouncementView initial={announcements} />
    </AdminShell>
  );
}
