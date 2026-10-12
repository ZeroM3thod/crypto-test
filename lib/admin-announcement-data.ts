import { db } from "@/lib/db";

export type AnnouncementCategory = "Platform Update" | "Maintenance" | "New Feature" | "Important";
export type AnnouncementStatus = "published" | "draft";

export type Announcement = {
  id: string;
  title: string;
  category: AnnouncementCategory;
  date: string;
  content: string;
  pinned: boolean;
  status: AnnouncementStatus;
  views: number;
};

export const ANNOUNCEMENT_CATEGORIES: AnnouncementCategory[] = ["Platform Update", "Maintenance", "New Feature", "Important"];

function toAnnouncement(row: any): Announcement {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    date: String(row.published_at || row.created_at).slice(0, 10),
    content: row.content,
    pinned: Boolean(row.pinned),
    status: row.status,
    views: Number(row.views || 0),
  };
}

export async function getAnnouncements(includeDrafts = true): Promise<Announcement[]> {
  let query = db.from("announcements").select("*").order("pinned", { ascending: false }).order("published_at", { ascending: false });
  if (!includeDrafts) query = query.eq("status", "published");
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(toAnnouncement);
}

export async function createAnnouncement(announcement: Omit<Announcement, "id" | "views">, authorId: string): Promise<Announcement> {
  const { data, error } = await db
    .from("announcements")
    .insert({
      title: announcement.title,
      category: announcement.category!,
      content: announcement.content,
      pinned: announcement.pinned,
      status: announcement.status!,
      published_at: announcement.date,
      created_by: authorId,
      updated_by: authorId,
    })
    .select("*")
    .single();
  if (error) throw error;
  return toAnnouncement(data);
}

export async function updateAnnouncement(id: string, input: Omit<Announcement, "id" | "views">, authorId: string): Promise<Announcement> {
  const { data, error } = await db
    .from("announcements")
    .update({
      title: input.title,
      category: input.category as string,
      content: input.content,
      pinned: input.pinned,
      status: input.status as string,
      published_at: input.date,
      updated_by: authorId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return toAnnouncement(data);
}

export async function patchAnnouncement(id: string, input: Partial<Pick<Announcement, "pinned" | "status">>, authorId: string): Promise<Announcement> {
  const { data, error } = await db
    .from("announcements")
    .update({ ...input, updated_by: authorId, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return toAnnouncement(data);
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const { error } = await db.from("announcements").delete().eq("id", id);
  if (error) throw error;
}

export async function incrementAnnouncementViews(id: string): Promise<void> {
  await db.rpc("increment_announcement_views", { p_announcement_id: id });
}
