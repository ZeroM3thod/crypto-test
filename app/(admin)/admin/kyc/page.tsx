// app/(admin)/admin/kyc/page.tsx
import { AdminShell } from "../../_components/admin-shell";
import { KycView } from "../../_components/kyc-view";
import { createClient } from "@supabase/supabase-js";
import { getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function AdminKycPage() {
  const session = await getSessionUser();
  
  if (!session || (session.role !== "admin" && session.role !== "owner")) {
    redirect("/signin");
  }

  // Fetch all KYC submissions from database
  const { data: submissions } = await supabase
    .from("kyc_submissions")
    .select(`
      *,
      user:auth_users!kyc_submissions_user_id_fkey (
        user_id,
        email,
        phone,
        first_name,
        last_name
      ),
      reviewer:auth_users!kyc_submissions_reviewed_by_fkey (
        user_id,
        first_name,
        last_name
      )
    `)
    .order("created_at", { ascending: false });

  // Get history for each submission
  const submissionsWithHistory = await Promise.all(
    (submissions || []).map(async (sub) => {
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

  return (
    <AdminShell active="KYC Requests">
      <KycView initial={submissionsWithHistory || []} />
    </AdminShell>
  );
}
