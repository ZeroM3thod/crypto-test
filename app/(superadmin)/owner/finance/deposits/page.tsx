// app/(superadmin)/owner/finance/deposits/page.tsx
"use client";

import { SuperAdminShell } from "../../../_components/super-admin-shell";
import { DepositsView } from "@/app/(superadmin)/_components/deposits-view";
import { useEffect, useState } from "react";

export default function OwnerDepositsPage() {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/deposits")
      .then((res) => res.json())
      .then((data) => {
        setDeposits(data.deposits || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch deposits:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <SuperAdminShell active="Deposits">
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Loading deposits...</p>
        </div>
      </SuperAdminShell>
    );
  }

  return (
    <SuperAdminShell active="Deposits">
      <DepositsView initial={deposits} />
    </SuperAdminShell>
  );
}
