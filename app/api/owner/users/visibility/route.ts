// app/api/owner/users/visibility/route.ts
import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/require-owner";
import { setUserHidden } from "@/lib/admin-data";

export async function PATCH(req: Request) {
  await requireOwner();

  const { userIds, hidden } = await req.json();
  if (
    !Array.isArray(userIds) ||
    userIds.length === 0 ||
    userIds.length > 500 ||
    !userIds.every((id) => typeof id === "string") ||
    typeof hidden !== "boolean"
  ) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  await setUserHidden(userIds, hidden);

  return NextResponse.json({ ok: true });
}
