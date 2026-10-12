import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/require-owner";
import { setRestrictedMode } from "@/lib/admin-data";

export async function PATCH(req: Request) {
  await requireOwner();
  const body = await req.json().catch(() => null);
  if (typeof body?.enabled !== "boolean") return NextResponse.json({ error: "Bad request" }, { status: 400 });
  await setRestrictedMode(body.enabled);
  return NextResponse.json({ ok: true });
}
