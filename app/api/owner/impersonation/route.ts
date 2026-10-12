// app/api/owner/impersonation/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function DELETE() {
  (await cookies()).delete("impersonating_admin_id");
  return NextResponse.json({ ok: true });
}
