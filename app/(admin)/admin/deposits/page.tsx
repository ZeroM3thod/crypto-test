// app/(admin)/admin/deposits/page.tsx
"use client";

import { AdminShell } from "../../_components/admin-shell";
import { DepositsView } from "../../_components/deposits-view";
import { useEffect, useState } from "react";

export default function AdminDepositsPage() {
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
      <AdminShell active="Deposits">
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Loading deposits...</p>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell active="Deposits">
      <DepositsView initial={deposits} />
    </AdminShell>
  );
}
