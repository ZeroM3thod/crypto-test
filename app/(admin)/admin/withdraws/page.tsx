// app/(admin)/admin/withdraws/page.tsx
"use client";

import { AdminShell } from "../../_components/admin-shell";
import { WithdrawsView } from "../../_components/withdraws-view";
import { useEffect, useState } from "react";

export default function AdminWithdrawsPage() {
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
      <AdminShell active="Withdrawals">
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Loading withdrawals...</p>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell active="Withdrawals">
      <WithdrawsView initial={withdraws} />
    </AdminShell>
  );
}
