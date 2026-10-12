// app/api/kyc/submit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      country,
      docType,
      firstName,
      lastName,
      dob,
      docNumber,
      address1,
      address2,
      city,
      state,
      postal,
      frontImageUrl,
      backImageUrl,
      selfieImageUrl,
    } = body;

    // Validate required fields
    if (!country || !docType || !firstName || !lastName || !dob || !docNumber || 
        !address1 || !city || !postal || !frontImageUrl || !selfieImageUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get user's actual UUID from database using session info
    // For now, if session.id is not a valid UUID, we'll create a test user or use a workaround
    let userId = session.id;
    
    // Check if session.id is a valid UUID, if not, try to find user by other means
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(session.id)) {
      // Try to find user by user_id or email
      const { data: user, error: userError } = await supabase
        .from("auth_users")
        .select("id")
        .eq("user_id", session.user_id || "")
        .single();
      
      if (userError || !user) {
        return NextResponse.json({ 
          error: "User not found. Please ensure you are properly authenticated." 
        }, { status: 400 });
      }
      
      userId = user.id;
    }

    // Generate submission ID
    const { data: submissionIdData, error: idError } = await supabase.rpc(
      "generate_kyc_submission_id"
    );
    if (idError) throw idError;

    // Insert KYC submission
    const { data: submission, error: insertError } = await supabase
      .from("kyc_submissions")
      .insert({
        user_id: userId,
        submission_id: submissionIdData,
        country_code: country.code,
        country_name: country.name,
        document_type: docType,
        first_name: firstName,
        last_name: lastName,
        dob,
        document_number: docNumber,
        address_line_1: address1,
        address_line_2: address2 || null,
        city,
        state: state || null,
        postal_code: postal,
        front_image_url: frontImageUrl,
        back_image_url: backImageUrl || null,
        selfie_image_url: selfieImageUrl,
        status: "pending",
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Log submission in history
    await supabase.from("kyc_history").insert({
      submission_id: submission.id,
      action: "submitted",
      performed_by: userId,
    });

    // Update user kyc_status
    await supabase
      .from("auth_users")
      .update({ kyc_status: "pending", updated_at: new Date().toISOString() })
      .eq("id", userId);

    return NextResponse.json({
      success: true,
      submissionId: submissionIdData,
      data: submission,
    });
  } catch (error) {
    console.error("KYC submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit KYC" },
      { status: 500 }
    );
  }
}
