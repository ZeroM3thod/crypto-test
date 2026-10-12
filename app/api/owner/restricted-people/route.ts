import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/require-owner";
import { addRestrictedPeople, removeRestrictedPerson } from "@/lib/admin-data";

export async function POST(req: Request) {
  await requireOwner();
  const body = await req.json().catch(() => null);
  if (!Array.isArray(body?.ids) || body.ids.length > 100 || !body.ids.every((id: unknown) => typeof id === "string")) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  return NextResponse.json(await addRestrictedPeople(body.ids));
}

export async function DELETE(req: Request) {
  await requireOwner();
  const body = await req.json().catch(() => null);
  if (typeof body?.id !== "string" || !body.id.trim()) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  await removeRestrictedPerson(body.id.trim());
  return NextResponse.json({ ok: true });
}
