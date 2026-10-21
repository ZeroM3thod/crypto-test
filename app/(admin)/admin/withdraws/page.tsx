// app/(admin)/admin/withdraws/page.tsx
"use client";

import { AdminShell } from "../../_components/admin-shell";
import { DitherLoader } from "@/components/motion/loader";
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
        <div className="grid min-h-[70vh] place-items-center">
          <DitherLoader size={44} label="Loading withdrawals" />
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
