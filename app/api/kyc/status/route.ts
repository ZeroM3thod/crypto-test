// app/api/kyc/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get latest KYC submission for user
    const { data: submission, error } = await supabase
      .from("kyc_submissions")
      .select("*")
      .eq("user_id", session.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    return NextResponse.json({
      kycStatus: session.kyc_status || "not_verified",
      submission: submission || null,
    });
  } catch (error) {
    console.error("KYC status error:", error);
    return NextResponse.json(
      { error: "Failed to fetch KYC status" },
      { status: 500 }
    );
  }
}
