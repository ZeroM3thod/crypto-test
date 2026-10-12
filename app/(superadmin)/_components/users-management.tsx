// app/(superadmin)/_components/users-management.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Table, type TableColumn } from "@/components/motion/table";
import type { UserRow } from "@/lib/users-data";
import { Badge, SelectField, StatCard } from "./ui";

const kycTone = { verified: "green", pending: "amber", rejected: "red", not_submitted: "gray" } as const;
const usd = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export function UsersManagement({ rows }: { rows: UserRow[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [kyc, setKyc] = useState("all");

  const stats = useMemo(
    () => ({
      total: rows.length,
      active: rows.filter((r) => r.status === "active").length,
      suspended: rows.filter((r) => r.status === "suspended").length,
      byOwner: rows.filter((r) => r.referredBy === "OWNER").length,
      kycVerified: rows.filter((r) => r.kyc === "verified").length,
      kycPending: rows.filter((r) => r.kyc === "pending").length,
      twoFA: rows.filter((r) => r.twoFA).length,
      balance: rows.reduce((s, r) => s + r.totalBalance, 0),
    }),
    [rows],
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (status === "all" || r.status === status) &&
        (kyc === "all" || r.kyc === kyc) &&
        (!term ||
          r.name.toLowerCase().includes(term) ||
          r.email.toLowerCase().includes(term) ||
          r.id.toLowerCase().includes(term)),
    );
  }, [rows, q, status, kyc]);

  const columns = useMemo<TableColumn<UserRow>[]>(
    () => [
      { key: "id", header: "User ID", sortable: true, width: "120px" },
      {
        key: "name",
        header: "Name",
        sortable: true,
        width: "1.2fr",
        cell: (r) => <span className="font-medium">{r.name}</span>,
      },
      { key: "email", header: "Email", sortable: true, width: "1.6fr" },
      { key: "country", header: "Country", sortable: true, width: "140px" },
      { key: "joinedAt", header: "Joined", sortable: true, width: "120px" },
      {
        key: "kyc",
        header: "KYC",
        sortable: true,
        width: "130px",
        cell: (r) => <Badge tone={kycTone[r.kyc]}>{r.kyc.replace("_", " ")}</Badge>,
      },
      {
        key: "twoFA",
        header: "2FA",
        width: "90px",
        sortValue: (r) => Number(r.twoFA),
        sortable: true,
        cell: (r) => <Badge tone={r.twoFA ? "green" : "gray"}>{r.twoFA ? "On" : "Off"}</Badge>,
      },
      {
        key: "referredBy",
        header: "Referred By",
        sortable: true,
        width: "130px",
        cell: (r) => (r.referredBy === "OWNER" ? <Badge tone="amber">Owner</Badge> : r.referredBy),
      },
      {
        key: "totalBalance",
        header: "Balance",
        sortable: true,
        align: "right",
        width: "120px",
        cell: (r) => <span className="tabular-nums">{usd(r.totalBalance)}</span>,
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        width: "120px",
        cell: (r) => <Badge tone={r.status === "active" ? "green" : "red"}>{r.status}</Badge>,
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">User Management</h1>
        <p className="text-sm text-muted-foreground">Click any row to open and edit the user.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total Users" value={stats.total.toLocaleString()} />
        <StatCard label="Referred By Owner" value={stats.byOwner.toLocaleString()} hint="Direct owner referrals" />
        <StatCard label="Active / Suspended" value={`${stats.active} / ${stats.suspended}`} />
        <StatCard label="Total User Balance" value={usd(stats.balance)} />
        <StatCard label="KYC Verified" value={stats.kycVerified} />
        <StatCard label="KYC Pending" value={stats.kycPending} />
        <StatCard label="2FA Enabled" value={stats.twoFA} />
        <StatCard label="2FA Disabled" value={stats.total - stats.twoFA} />
      </div>

      <div className="flex flex-col gap-3">
        <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Search</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Name, email or user ID"
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <SelectField
            label="Status"
            value={status}
            onChange={setStatus}
            options={[
              { value: "all", label: "All" },
              { value: "active", label: "Active" },
              { value: "suspended", label: "Suspended" },
            ]}
          />
          <SelectField
            label="KYC"
            value={kyc}
            onChange={setKyc}
            options={[
              { value: "all", label: "All" },
              { value: "verified", label: "Verified" },
              { value: "pending", label: "Pending" },
              { value: "rejected", label: "Rejected" },
              { value: "not_submitted", label: "Not submitted" },
            ]}
          />
        </div>

        <p className="px-1 text-xs text-muted-foreground">{filtered.length.toLocaleString()} users</p>

        <Table
          data={filtered}
          columns={columns}
          getRowId={(r) => r.id}
          resizable
          reorderable
          defaultSort={{ key: "joinedAt", direction: "desc" }}
          onRowClick={(r) => router.push(`/owner/users/${r.id}`)}
          height={560}
          rowHeight={52}
          className="rounded-2xl"
        />
      </div>
    </div>
  );
}
