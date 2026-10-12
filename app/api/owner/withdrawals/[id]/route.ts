// app/api/owner/withdrawals/[id]/route.ts
import { NextResponse } from "next/server";
import { isImpersonating } from "@/lib/auth/session";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  // Never let an impersonating session approve/reject money: the audit trail
  // must never show an admin approving something the owner did.
  if (await isImpersonating()) {
    return NextResponse.json({ error: "Forbidden while impersonating" }, { status: 403 });
  }
  const { id } = await params;
  const { action, withdrawal, reason } = await req.json();
  // 1. verify owner
  // 2. in ONE DB transaction:
  //    - "save":    update amount/fee/address/network/sourceWallet/txHash/note
  //                 (if amount changed while pending, adjust the held funds by the difference)
  //    - "approve": only if status === "pending"; mark approved, store txHash,
  //                 (send the payout or queue it), finalize the held balance
  //    - "reject":  only if pending; store reason, RELEASE the held funds back to the user's wallet
  // 3. audit-log every change, especially address and amount edits
  return Response.json({ ok: true });
}
