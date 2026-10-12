// app/api/owner/users/[id]/impersonate/route.ts
import { requireOwner } from "@/lib/auth/require-owner";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  // 1. verify owner, 2. write an audit log (who impersonated whom, when)
  await requireOwner();
  // 3. create a short-lived (e.g. 5 min) one-time token, return { url: `/impersonate?token=...` }
  // 4. that page swaps the session cookie and marks the session as "impersonating"
  return Response.json({ url: "/impersonate?token=..." });
}
