// app/api/admin/kyc/[id]/approve/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { createClient } from "@supabase/supabase-js";
import { canSeeUser } from "@/lib/admin/visibility";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== "admin" && session.role !== "owner")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const { data: submission } = await supabase.from("kyc_submissions").select("user_id").eq("id", id).maybeSingle();
    if (!submission || !(await canSeeUser(submission.user_id, session.role))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { data, error } = await supabase.rpc("approve_kyc", {
      p_submission_id: id,
      p_admin_id: session.id,
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("KYC approval error:", error);
    return NextResponse.json(
      { error: "Failed to approve KYC" },
      { status: 500 }
    );
  }
}
