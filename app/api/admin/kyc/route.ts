// app/api/admin/kyc/route.ts
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
    if (!session || (session.role !== "admin" && session.role !== "owner")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get all KYC submissions with user info
    const { data: submissions, error } = await supabase
      .from("kyc_submissions")
      .select(`
        *,
        user:auth_users!kyc_submissions_user_id_fkey (
          user_id,
          email,
            phone,
            first_name,
            last_name,
            hidden_from_admins
        ),
        reviewer:auth_users!kyc_submissions_reviewed_by_fkey (
          user_id,
          first_name,
          last_name
        )
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Get history for each submission
    const visibleSubmissions = session.role === "owner"
      ? (submissions || [])
      : (submissions || []).filter((sub) => !sub.user?.hidden_from_admins);

    const submissionsWithHistory = await Promise.all(
      visibleSubmissions.map(async (sub) => {
        const { data: history } = await supabase
          .from("kyc_history")
          .select(`
            *,
            performer:auth_users!kyc_history_performed_by_fkey (
              user_id,
              first_name,
              last_name
            )
          `)
          .eq("submission_id", sub.id)
          .order("created_at", { ascending: true });

        return { ...sub, history: history || [] };
      })
    );

    return NextResponse.json({ submissions: submissionsWithHistory });
  } catch (error) {
    console.error("KYC list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch KYC submissions" },
      { status: 500 }
    );
  }
}
