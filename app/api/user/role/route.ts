import { bad, getSession } from "@/lib/auth/backend";

export async function GET(req: Request) {
  const session = await getSession(req as any);
  if (!session) return bad("Unauthorized", 401);
  
  const hiddenFromAdmins = session.user?.hidden_from_admins || false;
  
  return Response.json({ 
    role: session.user?.role || "user",
    hiddenFromAdmins 
  });
}
