// app/api/owner/deposits/[id]/route.ts
import { NextResponse } from "next/server";
import { isImpersonating } from "@/lib/auth/session";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  // Never let an impersonating session approve/reject money: the audit trail
  // must never show an admin approving something the owner did.
  if (await isImpersonating()) {
    return NextResponse.json({ error: "Forbidden while impersonating" }, { status: 403 });
  }
  const { id } = await params;
  const { action, deposit, reason } = await req.json();
  // 1. verify the caller is the owner
  // 2. validate the body (zod); recompute nothing from the client except editable fields
  // 3. run in ONE DB transaction:
  //    - "save":    update address/amount/network/txHash/note
  //    - "approve": only if current DB status === "pending" (prevents double-credit);
  //                 set approved, credit the user's main wallet by deposit.amount,
  //                 insert a wallet transaction row
  //    - "reject":  only if pending; store reason, notify the user
  // 4. write an audit-log row (admin, action, before/after)
  return Response.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  // verify owner. Prefer a soft delete (deletedAt) so the ledger stays auditable.
  // Also hide it from the user's own deposit page.
  // If it was already approved, decide whether to reverse the credit. Don't leave balances inconsistent.
  return Response.json({ ok: true });
}
