// Helper to record login attempts in login_history table
// Call this from signin API

import { supabase } from "@/lib/auth/backend";
import { NextRequest } from "next/server";

// Simple user-agent parsing
function parseUserAgent(ua: string) {
  const lower = ua.toLowerCase();
  
  // Browser detection
  let browser = "Unknown";
  if (lower.includes("edg/")) browser = "Edge";
  else if (lower.includes("chrome/")) browser = "Chrome";
  else if (lower.includes("firefox/")) browser = "Firefox";
  else if (lower.includes("safari/") && !lower.includes("chrome")) browser = "Safari";

  // Extract version
  const match = ua.match(/(chrome|firefox|safari|edg)\/(\d+)/i);
  if (match) browser = `${browser} ${match[2]}`;

  // Device type
  let deviceType = "desktop";
  let deviceName = "Unknown";
  
  if (lower.includes("mobile")) {
    deviceType = "mobile";
    if (lower.includes("iphone")) deviceName = "iPhone";
    else if (lower.includes("android")) deviceName = "Android";
    else deviceName = "Mobile";
  } else if (lower.includes("tablet") || lower.includes("ipad")) {
    deviceType = "tablet";
    deviceName = lower.includes("ipad") ? "iPad" : "Tablet";
  } else {
    if (lower.includes("windows")) deviceName = "Windows";
    else if (lower.includes("mac os")) deviceName = "macOS";
    else if (lower.includes("linux")) deviceName = "Linux";
    else deviceName = "Desktop";
  }

  return { browser, deviceType, deviceName };
}

// Check if login is suspicious (different country/unusual IP pattern)
async function isSuspicious(userId: string, ipAddress: string, country: string): Promise<boolean> {
  // Get user's recent successful logins
  const recent = await supabase<{ ip_address: string; country: string }[]>(
    `login_history?select=ip_address,country&user_id=eq.${userId}&status=eq.success&order=created_at.desc&limit=10`
  );

  if (recent.length === 0) return false; // First login, not suspicious

  // Check if this IP or country has been seen before
  const seenIp = recent.some((r) => r.ip_address === ipAddress);
  const seenCountry = recent.some((r) => r.country === country);

  // Suspicious if both IP and country are new
  return !seenIp && !seenCountry;
}

export async function recordLoginAttempt(params: {
  userId?: string;
  email: string;
  status: "success" | "failed" | "blocked";
  ipAddress: string;
  ipHash: string;
  deviceHash: string;
  userAgent: string;
  location?: string;
  country?: string;
  failureReason?: string;
}) {
  const { browser, deviceType, deviceName } = parseUserAgent(params.userAgent);

  const suspicious = params.userId
    ? await isSuspicious(params.userId, params.ipAddress, params.country || "Unknown")
    : false;

  await supabase("login_history", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      user_id: params.userId || null,
      email: params.email,
      status: params.status,
      ip_address: params.ipAddress,
      ip_hash: params.ipHash,
      device_hash: params.deviceHash,
      user_agent: params.userAgent,
      browser,
      device_type: deviceType,
      device_name: deviceName,
      location: params.location || "Unknown",
      country: params.country || "Unknown",
      failure_reason: params.failureReason || null,
      is_suspicious: suspicious,
    }),
  });
}
