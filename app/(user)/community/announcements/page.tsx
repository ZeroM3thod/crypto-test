import { requireUser } from "@/lib/auth/require-user";
import { getAnnouncements } from "@/lib/admin-announcement-data";
import { AnnouncementsClient } from "./announcements-client";

export default async function CommunityAnnouncements() {
  await requireUser();
  const announcements = await getAnnouncements(false);
  return <AnnouncementsClient initial={announcements} />;
}
