// app/(superadmin)/owner/finance/withdrawals/page.tsx
"use client";

import { SuperAdminShell } from "../../../_components/super-admin-shell";
import { WithdrawsView } from "@/app/(superadmin)/_components/withdraws-view";
import { useEffect, useState } from "react";

export default function OwnerWithdrawalsPage() {
  const [withdraws, setWithdraws] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/withdrawals")
      .then((res) => res.json())
      .then((data) => {
        setWithdraws(data.withdrawals || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch withdrawals:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <SuperAdminShell active="Withdrawals">
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Loading withdrawals...</p>
        </div>
      </SuperAdminShell>
    );
  }

  return (
    <SuperAdminShell active="Withdrawals">
      <WithdrawsView initial={withdraws} />
    </SuperAdminShell>
  );
}
