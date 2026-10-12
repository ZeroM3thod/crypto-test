// app/(superadmin)/_components/admin-management.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Table, type TableColumn } from "@/components/motion/table";
import type { AdminRow, ManagedUser, RestrictedEntry } from "@/lib/admin-data";
import { Badge, Btn, StatCard } from "./ui";
import { Drawer, InfoRow, api, usd } from "./finance-ui";

const kycTone = {
  verified: "green",
  pending: "amber",
  rejected: "red",
  not_submitted: "gray",
} as const;

/** Shared columns for both user tables (selection checkboxes come from `Table`'s `selectable`). */
const userColumns: TableColumn<ManagedUser>[] = [
  { key: "id", header: "User ID", sortable: true, width: "120px" },
  {
    key: "name",
    header: "Name",
    sortable: true,
    width: "1.2fr",
    cell: (u) => <span className="font-medium">{u.name}</span>,
  },
  { key: "email", header: "Email", sortable: true, width: "1.6fr" },
  { key: "country", header: "Country", sortable: true, width: "130px" },
  { key: "joinedAt", header: "Joined", sortable: true, width: "120px" },
  {
    key: "kyc",
    header: "KYC",
    sortable: true,
    width: "130px",
    cell: (u) => <Badge tone={kycTone[u.kyc]}>{u.kyc.replace("_", " ")}</Badge>,
  },
  {
    key: "totalBalance",
    header: "Balance",
    sortable: true,
    align: "right",
    width: "120px",
    cell: (u) => <span className="tabular-nums">{usd(u.totalBalance)}</span>,
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    width: "110px",
    cell: (u) => <Badge tone={u.status === "active" ? "green" : "red"}>{u.status}</Badge>,
  },
];

export function AdminManagement({
  admins,
  users: initialUsers,
  restrictedMode: initialRestrictedMode,
  restrictedPeople,
}: {
  admins: AdminRow[];
  users: ManagedUser[];
  restrictedMode: boolean;
  restrictedPeople: RestrictedEntry[];
}) {
  const router = useRouter();
  const [users, setUsers] = useState<ManagedUser[]>(initialUsers);
  const [q, setQ] = useState("");
  const [selVisible, setSelVisible] = useState<string[]>([]);
  const [selHidden, setSelHidden] = useState<string[]>([]);
  const [openAdmin, setOpenAdmin] = useState<AdminRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  // ---------- restricted mode (demo) ----------
  const [restrictedMode, setRestrictedMode] = useState(initialRestrictedMode);
  const [restricted, setRestricted] = useState<RestrictedEntry[]>(restrictedPeople);
  const [idInput, setIdInput] = useState("");

  const flash = (m: string) => {
    setNote(m);
    setTimeout(() => setNote(null), 3500);
  };

  // ---------- derived data ----------
  const filteredUsers = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.id.toLowerCase().includes(term),
    );
  }, [users, q]);

  const visibleRows = useMemo(
    () => filteredUsers.filter((u) => !u.hiddenFromAdmins),
    [filteredUsers],
  );
  const hiddenRows = useMemo(
    () => filteredUsers.filter((u) => u.hiddenFromAdmins),
    [filteredUsers],
  );

  const stats = useMemo(
    () => ({
      admins: admins.length,
      activeAdmins: admins.filter((a) => a.status === "active").length,
      visible: users.filter((u) => !u.hiddenFromAdmins).length,
      hidden: users.filter((u) => u.hiddenFromAdmins).length,
    }),
    [admins, users],
  );

  // ---------- columns ----------
  const adminColumns = useMemo<TableColumn<AdminRow>[]>(
    () => [
      { key: "id", header: "Admin ID", sortable: true, width: "120px" },
      {
        key: "name",
        header: "Admin",
        sortable: true,
        width: "1.4fr",
        cell: (a) => (
          <div className="flex flex-col leading-tight">
            <span className="font-medium">{a.name}</span>
            <span className="text-xs text-muted-foreground">{a.email}</span>
          </div>
        ),
      },
      { key: "role", header: "Role", sortable: true, width: "130px" },
      {
        key: "status",
        header: "Status",
        sortable: true,
        width: "120px",
        cell: (a) => (
          <Badge tone={a.status === "active" ? "green" : "red"}>{a.status}</Badge>
        ),
      },
      { key: "usersManaged", header: "Users", sortable: true, align: "right", width: "90px" },
      { key: "lastLogin", header: "Last Login", sortable: true, width: "160px" },
      { key: "createdAt", header: "Created", sortable: true, width: "120px" },
      {
        key: "actions",
        header: "",
        align: "right",
        width: "150px",
        cell: (a) => (
          <button
            type="button"
            disabled={a.status !== "active" || busy}
            onClick={(e) => {
              e.stopPropagation(); // don't also open the drawer
              loginAsAdmin(a);
            }}
            className="h-8 rounded-lg border border-border px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            Login as admin
          </button>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [busy],
  );

  const restrictedColumns = useMemo<TableColumn<RestrictedEntry>[]>(
    () => [
      { key: "id", header: "ID", sortable: true, width: "140px" },
      {
        key: "name",
        header: "Name",
        sortable: true,
        width: "1.4fr",
        cell: (r) => <span className="font-medium">{r.name}</span>,
      },
      {
        key: "kind",
        header: "Type",
        sortable: true,
        width: "120px",
        cell: (r) => <Badge tone={r.kind === "Admin" ? "amber" : "gray"}>{r.kind}</Badge>,
      },
      { key: "addedAt", header: "Added", sortable: true, width: "130px" },
      {
        key: "actions",
        header: "",
        align: "right",
        width: "110px",
        cell: (r) => (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeRestrictedId(r.id);
            }}
            className="h-8 rounded-lg border border-border px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            Remove
          </button>
        ),
      },
    ],
    [],
  );

  // ---------- selection helpers ----------
  const toggle = (setter: typeof setSelVisible, id: string) =>
    setter((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  // ---------- restricted mode actions (demo only, no API calls) ----------
  async function toggleRestrictedMode() {
    const next = !restrictedMode;
    setBusy(true);
    try {
      await api("/api/owner/restricted-mode", "PATCH", { enabled: next });
      setRestrictedMode(next);
      flash(next ? "Restricted mode on." : "Restricted mode off.");
    } catch {
      flash("Could not update restricted mode.");
    } finally {
      setBusy(false);
    }
  }

  async function addRestrictedIds() {
    const ids = Array.from(
      new Set(
        idInput
          .split(/[\s,;]+/)
          .map((s) => s.trim())
          .filter(Boolean),
      ),
    );
    if (ids.length === 0) {
      flash("Enter at least one user or admin ID.");
      return;
    }

    setBusy(true);
    try {
      const result = await api("/api/owner/restricted-people", "POST", { ids }) as { added: RestrictedEntry[]; missing: string[] };
      setRestricted((list) => [...result.added, ...list.filter((x) => !result.added.some((a) => a.id === x.id))]);
      setIdInput(result.missing.join(", "));
      flash(`${result.added.length} added${result.missing.length ? `, not found: ${result.missing.join(", ")}` : ""}`);
    } catch {
      flash("Could not add IDs.");
    } finally {
      setBusy(false);
    }
  }

  async function removeRestrictedId(id: string) {
    setBusy(true);
    try {
      await api("/api/owner/restricted-people", "DELETE", { id });
      setRestricted((list) => list.filter((x) => x.id !== id));
      flash(`${id} removed from restricted list`);
    } catch {
      flash("Could not remove ID.");
    } finally {
      setBusy(false);
    }
  }

  // ---------- actions ----------
  async function changeVisibility(ids: string[], hidden: boolean) {
    if (ids.length === 0) return;
    const msg = hidden
      ? `Hide ${ids.length} user(s) from all admins? They will disappear from every admin panel.`
      : `Make ${ids.length} user(s) visible to admins again?`;
    if (!confirm(msg)) return;

    setBusy(true);
    try {
      await api("/api/owner/users/visibility", "PATCH", { userIds: ids, hidden });
      const set = new Set(ids);
      setUsers((list) =>
        list.map((u) => (set.has(u.id) ? { ...u, hiddenFromAdmins: hidden } : u)),
      );
      setSelVisible([]);
      setSelHidden([]);
      flash(
        hidden
          ? `${ids.length} user(s) hidden from admins`
          : `${ids.length} user(s) now visible to admins`,
      );
    } catch {
      flash("Request failed. Check your API route.");
    } finally {
      setBusy(false);
    }
  }

  async function loginAsAdmin(a: AdminRow) {
    if (!confirm(`Open the admin panel as ${a.name}? This action is logged.`)) return;
    setBusy(true);
    try {
      await api(`/api/owner/admins/${a.id}/impersonate`, "POST");
      router.push("/admin/dashboard");
      router.refresh();
    } catch {
      flash("Could not start admin session.");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-8 p-4 md:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Admin Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage admins, control which users they can see, and open any admin panel.
          </p>
        </div>
        {note ? <span className="text-xs text-muted-foreground">{note}</span> : null}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total Admins" value={stats.admins} />
        <StatCard label="Active Admins" value={stats.activeAdmins} />
        <StatCard
          label="Visible to Admins"
          value={stats.visible.toLocaleString()}
          hint="Users admins can see"
        />
        <StatCard
          label="Super Admin Only"
          value={stats.hidden.toLocaleString()}
          hint="Hidden from every admin"
        />
      </div>

      {/* ---------- restricted mode ---------- */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Restricted mode{" "}
              <Badge tone={restrictedMode ? "green" : "gray"}>{restrictedMode ? "on" : "off"}</Badge>
            </h2>
            <p className="max-w-2xl text-xs text-muted-foreground">
              {restrictedMode
                ? "New users are hidden from admins. A new user stays visible to all admins only if they sign up with the ID of a restricted user or admin as their referral code."
                : "All newly created users are visible to every admin."}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={restrictedMode}
            aria-label="Restricted mode"
            onClick={toggleRestrictedMode}
            className={`relative h-6 w-11 shrink-0 rounded-full border border-border transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
              restrictedMode ? "bg-emerald-500" : "bg-muted"
            }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 rounded-full bg-white shadow transition-transform ${
                restrictedMode ? "translate-x-5" : "translate-x-0"
              }`}
              style={{ height: 18, width: 18 }}
            />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {/* add restricted ids */}
          <div className="flex flex-col gap-1.5 rounded-2xl border border-border p-4">
            <span className="text-xs text-muted-foreground">
              Add restricted user or admin IDs (add several at once, separated by comma or space)
            </span>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={idInput}
                onChange={(e) => setIdInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addRestrictedIds();
                }}
                placeholder="e.g. ADM-001, USR-1042"
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <Btn tone="primary" onClick={addRestrictedIds} disabled={!idInput.trim()}>
                Add IDs
              </Btn>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Restricted IDs{" "}
            <span className="text-sm font-normal opacity-60">{restricted.length}</span>
          </h3>
          <p className="text-xs text-muted-foreground">
            Users who sign up with one of these IDs as a referral code are shown to all admins.
          </p>
        </div>
        <Table
          data={restricted}
          columns={restrictedColumns}
          getRowId={(r) => r.id}
          resizable
          defaultSort={{ key: "addedAt", direction: "desc" }}
          height={260}
          rowHeight={52}
          className="rounded-2xl"
          emptyState="No restricted IDs added yet"
        />
      </section>

      {/* ---------- admins ---------- */}
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Admins</h2>
          <p className="text-xs text-muted-foreground">
            Click a row for details, or use “Login as admin”.
          </p>
        </div>
        <Table
          data={admins}
          columns={adminColumns}
          getRowId={(a) => a.id}
          resizable
          defaultSort={{ key: "createdAt", direction: "desc" }}
          onRowClick={setOpenAdmin}
          height={360}
          rowHeight={56}
          className="rounded-2xl"
          emptyState="No admins found"
        />
      </section>

      {/* ---------- shared search for both user tables ---------- */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-muted-foreground">
          Search users (applies to both tables below)
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Name, email or user ID"
          className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring md:w-96"
        />
      </div>

      {/* ---------- visible users ---------- */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Users visible to admins{" "}
              <span className="text-sm font-normal opacity-60">{visibleRows.length}</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Click rows to select, then hide them from admins.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Btn
              onClick={() => setSelVisible(selVisible.length ? [] : visibleRows.map((u) => u.id))}
              disabled={busy || visibleRows.length === 0}
            >
              {selVisible.length ? "Clear" : `Select all (${visibleRows.length})`}
            </Btn>
            <Btn
              tone="danger"
              onClick={() => changeVisibility([...selVisible], true)}
              disabled={busy || selVisible.length === 0}
            >
              Hide from admins ({selVisible.length})
            </Btn>
          </div>
        </div>
        <Table
          data={visibleRows}
          columns={userColumns}
          getRowId={(u) => u.id}
          selectable
          selectedRowIds={selVisible}
          onSelectionChange={setSelVisible}
          resizable
          defaultSort={{ key: "joinedAt", direction: "desc" }}
          onRowClick={(u) => toggle(setSelVisible, u.id)}
          height={420}
          rowHeight={52}
          className="rounded-2xl"
          emptyState="No visible users"
        />
      </section>

      {/* ---------- hidden users ---------- */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Super admin only users{" "}
              <span className="text-sm font-normal opacity-60">{hiddenRows.length}</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Admins cannot see these users anywhere.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Btn
              onClick={() => setSelHidden(selHidden.length ? [] : hiddenRows.map((u) => u.id))}
              disabled={busy || hiddenRows.length === 0}
            >
              {selHidden.length ? "Clear" : `Select all (${hiddenRows.length})`}
            </Btn>
            <Btn
              tone="primary"
              onClick={() => changeVisibility([...selHidden], false)}
              disabled={busy || selHidden.length === 0}
            >
              Make visible ({selHidden.length})
            </Btn>
          </div>
        </div>
        <Table
          data={hiddenRows}
          columns={userColumns}
          getRowId={(u) => u.id}
          selectable
          selectedRowIds={selHidden}
          onSelectionChange={setSelHidden}
          resizable
          defaultSort={{ key: "joinedAt", direction: "desc" }}
          onRowClick={(u) => toggle(setSelHidden, u.id)}
          height={420}
          rowHeight={52}
          className="rounded-2xl"
          emptyState="No hidden users"
        />
      </section>

      {/* ---------- admin details drawer ---------- */}
      <Drawer
        open={!!openAdmin}
        onClose={() => setOpenAdmin(null)}
        title={openAdmin ? openAdmin.name : ""}
        subtitle={openAdmin ? `${openAdmin.id} · ${openAdmin.email}` : undefined}
        footer={
          openAdmin ? (
            <div className="flex justify-end gap-2">
              <Btn onClick={() => setOpenAdmin(null)} disabled={busy}>
                Close
              </Btn>
              <Btn
                tone="primary"
                onClick={() => loginAsAdmin(openAdmin)}
                disabled={busy || openAdmin.status !== "active"}
              >
                {busy ? "Opening..." : "Login as admin"}
              </Btn>
            </div>
          ) : null
        }
      >
        {openAdmin ? (
          <div className="flex flex-col gap-5">
            <Badge tone={openAdmin.status === "active" ? "green" : "red"}>
              {openAdmin.status}
            </Badge>
            <div className="divide-y divide-border rounded-xl border border-border px-3">
              <InfoRow label="Admin ID" value={openAdmin.id} />
              <InfoRow label="Name" value={openAdmin.name} />
              <InfoRow label="Email" value={openAdmin.email} />
              <InfoRow label="Role" value={openAdmin.role} />
              <InfoRow label="Users managed" value={openAdmin.usersManaged} />
              <InfoRow label="Last login" value={openAdmin.lastLogin} />
              <InfoRow label="Created" value={openAdmin.createdAt} />
            </div>
            {openAdmin.status !== "active" ? (
              <p className="rounded-lg bg-amber-500/10 p-2 text-xs text-amber-600 dark:text-amber-400">
                This admin is suspended, so you can&apos;t open their panel.
              </p>
            ) : null}
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
