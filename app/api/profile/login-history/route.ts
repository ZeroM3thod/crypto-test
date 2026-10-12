import { NextRequest } from "next/server";
import { getSession, supabase, q, hash } from "@/lib/auth/backend";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return Response.json({ message: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  // Get login history for this user
  const history = await supabase<any[]>(
    `login_history?select=*&user_id=eq.${q(userId)}&order=created_at.desc&limit=100`
  );

  // Parse user agent and enrich data
  const events = history.map((h) => ({
    id: h.id,
    date: h.created_at,
    ip: h.ip_address,
    location: h.location || "Unknown",
    country: h.country || "Unknown",
    device: h.device_name || "Unknown",
    deviceType: h.device_type || "desktop",
    browser: h.browser || "Unknown",
    status: h.status,
    flagged: h.is_suspicious,
    failureReason: h.failure_reason,
  }));

  // Stats
  const total = events.length;
  const successful = events.filter((e) => e.status === "success").length;
  const failed = events.filter((e) => e.status === "failed").length;
  const blocked = events.filter((e) => e.status === "blocked").length;
  const suspicious = events.filter((e) => e.flagged).length;

  return Response.json({
    events,
    stats: {
      total,
      successful,
      failed,
      blocked,
      suspicious,
    },
  });
}
