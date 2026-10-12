import { NextResponse } from "next/server";
import { getAdminOrNull } from "@/lib/auth/require-admin";
import { deleteAnnouncement, patchAnnouncement, updateAnnouncement } from "@/lib/admin-announcement-data";

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

function clean(body: any) {
  const title = String(body?.title || "").trim();
  const content = String(body?.content || "").trim();
  const category = body?.category;
  const status = body?.status;
  const date = String(body?.date || "").trim();
  if (title.length < 3) return { error: "Title must be at least 3 characters." } as const;
  if (content.length < 10) return { error: "Content must be at least 10 characters." } as const;
  if (!category || !["Platform Update", "Maintenance", "New Feature", "Important"].includes(category)) return { error: "Invalid category." } as const;
  if (!status || !["published", "draft"].includes(status)) return { error: "Invalid status." } as const;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Invalid date." } as const;
  return { title, content, category, status, date, pinned: Boolean(body?.pinned) } as const;
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminOrNull();
  if (!admin) return bad("Unauthorized", 401);
  const parsed: any = clean(await req.json().catch(() => null));
  if ("error" in parsed) return bad(parsed.error);
  const { id } = await params;
  return NextResponse.json({ announcement: await updateAnnouncement(id, parsed, admin.id) });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminOrNull();
  if (!admin) return bad("Unauthorized", 401);
  const body = await req.json().catch(() => null);
  const patch: any = {};
  if (typeof body?.pinned === "boolean") patch.pinned = body.pinned;
  if (["published", "draft"].includes(body?.status)) patch.status = body.status;
  if (!Object.keys(patch).length) return bad("No changes.");
  const { id } = await params;
  return NextResponse.json({ announcement: await patchAnnouncement(id, patch, admin.id) });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminOrNull();
  if (!admin) return bad("Unauthorized", 401);
  const { id } = await params;
  await deleteAnnouncement(id);
  return NextResponse.json({ ok: true });
}
