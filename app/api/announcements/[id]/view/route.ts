import { NextResponse } from "next/server";
import { getUserOrNull } from "@/lib/auth/require-user";
import { incrementAnnouncementViews } from "@/lib/admin-announcement-data";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserOrNull();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await incrementAnnouncementViews(id);
  return NextResponse.json({ ok: true });
}
