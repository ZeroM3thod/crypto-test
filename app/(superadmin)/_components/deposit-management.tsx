// app/(superadmin)/_components/deposit-management.tsx
"use client";

import { useMemo, useState } from "react";
import { Table, type TableColumn } from "@/components/motion/table";
import type { Deposit, ReqStatus } from "@/lib/finance-data";
import { Badge, Btn, Field, StatCard } from "./ui";
import { Drawer, FilterTabs, InfoRow, TextArea, api, nowStamp, statusTone, usd } from "./finance-ui";

type Tab = "all" | ReqStatus;
type Action = "save" | "approve" | "reject" | "delete";

export function DepositManagement({ initial }: { initial: Deposit[] }) {
  const [items, setItems] = useState<Deposit[]>(initial);
  const [tab, setTab] = useState<Tab>("pending");
  const [q, setQ] = useState("");

  // drawer state
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Deposit | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const flash = (m: string) => {
    setNote(m);
    setTimeout(() => setNote(null), 3500);
  };

  const stats = useMemo(() => {
    const sum = (s: ReqStatus) => items.filter((d) => d.status === s).reduce((a, d) => a + d.amount, 0);
    const count = (s: ReqStatus) => items.filter((d) => d.status === s).length;
    return {
      pending: count("pending"),
      pendingAmt: sum("pending"),
      approvedAmt: sum("approved"),
      approved: count("approved"),
      rejected: count("rejected"),
    };
  }, [items]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return items.filter(
      (d) =>
        (tab === "all" || d.status === tab) &&
        (!term ||
          d.id.toLowerCase().includes(term) ||
          d.userName.toLowerCase().includes(term) ||
          d.userId.toLowerCase().includes(term) ||
          d.email.toLowerCase().includes(term) ||
          d.txHash.toLowerCase().includes(term)),
    );
  }, [items, tab, q]);

  const columns = useMemo<TableColumn<Deposit>[]>(
    () => [
      { key: "id", header: "Deposit ID", sortable: true, width: "130px" },
      {
        key: "userName",
        header: "User",
        sortable: true,
        width: "1.2fr",
        cell: (d) => (
          <div className="flex flex-col leading-tight">
            <span className="font-medium">{d.userName}</span>
            <span className="text-xs text-muted-foreground">{d.userId}</span>
          </div>
        ),
      },
      {
        key: "amount",
        header: "Amount",
        sortable: true,
        align: "right",
        width: "130px",
        cell: (d) => (
          <span className="tabular-nums">
            {usd(d.amount)} <span className="text-xs text-muted-foreground">{d.currency}</span>
          </span>
        ),
      },
      { key: "network", header: "Network", sortable: true, width: "100px" },
      { key: "address", header: "Deposit Address", width: "1.4fr" },
      { key: "requestedAt", header: "Requested", sortable: true, width: "160px" },
      {
        key: "status",
        header: "Status",
        sortable: true,
        width: "120px",
        cell: (d) => <Badge tone={statusTone[d.status]}>{d.status}</Badge>,
      },
    ],
    [],
  );

  // ---------- drawer helpers ----------
  const original = items.find((d) => d.id === openId) ?? null;

  const openRow = (d: Deposit) => {
    setOpenId(d.id);
    setDraft({ ...d });
    setRejecting(false);
    setReason("");
  };
  const closeDrawer = () => {
    setOpenId(null);
    setDraft(null);
    setRejecting(false);
    setReason("");
  };
  const edit = <K extends keyof Deposit>(key: K, value: Deposit[K]) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d));

  async function run(action: Action) {
    if (!draft) return;
    if (action === "reject" && !reason.trim()) {
      flash("Please write a rejection reason.");
      return;
    }
    if (action === "delete" && !confirm(`Remove deposit ${draft.id} permanently? It will also disappear from the user's deposit page.`)) return;
    if (action === "approve" && !confirm(`Approve ${usd(draft.amount)} ${draft.currency} for ${draft.userName}? The amount will be credited to their wallet.`)) return;

    setBusy(true);
    try {
      if (action === "delete") {
        await api(`/api/owner/deposits/${draft.id}`, "DELETE");
        setItems((l) => l.filter((x) => x.id !== draft.id));
        closeDrawer();
        flash("Deposit removed");
        return;
      }

      await api(`/api/owner/deposits/${draft.id}`, "PATCH", {
        action,
        deposit: draft,
        reason: reason.trim(),
      });

      const reviewed = action === "approve" || action === "reject";
      const next: Deposit = {
        ...draft,
        status: action === "approve" ? "approved" : action === "reject" ? "rejected" : draft.status,
        rejectReason: action === "reject" ? reason.trim() : draft.rejectReason,
        reviewedAt: reviewed ? nowStamp() : draft.reviewedAt,
      };
      setItems((l) => l.map((x) => (x.id === next.id ? next : x)));
      setDraft(next);
      setRejecting(false);
      setReason("");
      flash(action === "approve" ? "Deposit approved" : action === "reject" ? "Deposit rejected" : "Changes saved");
    } catch {
      flash("Request failed. Check your API route.");
    } finally {
      setBusy(false);
    }
  }

  const dirty = !!draft && !!original && JSON.stringify(draft) !== JSON.stringify(original);
  const pending = draft?.status === "pending";

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Deposit Management</h1>
        <p className="text-sm text-muted-foreground">Click any row to review, edit, approve, reject or remove a deposit.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Pending Requests" value={stats.pending} hint={`${usd(stats.pendingAmt)} waiting`} />
        <StatCard label="Approved" value={stats.approved} hint={`${usd(stats.approvedAmt)} total`} />
        <StatCard label="Rejected" value={stats.rejected} />
        <StatCard label="All Deposits" value={items.length} />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <FilterTabs<Tab>
            value={tab}
            onChange={setTab}
            tabs={[
              { value: "pending", label: "Pending", count: stats.pending },
              { value: "approved", label: "Approved", count: stats.approved },
              { value: "rejected", label: "Rejected", count: stats.rejected },
              { value: "all", label: "All", count: items.length },
            ]}
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search ID, user, email or tx hash"
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring md:w-80"
          />
        </div>

        <Table
          data={filtered}
          columns={columns}
          getRowId={(d) => d.id}
          resizable
          defaultSort={{ key: "requestedAt", direction: "desc" }}
          onRowClick={openRow}
          height={560}
          rowHeight={56}
          className="rounded-2xl"
          emptyState="No deposits found"
        />
      </div>

      {/* ---------- details drawer ---------- */}
      <Drawer
        open={!!draft}
        onClose={closeDrawer}
        title={draft ? `Deposit ${draft.id}` : ""}
        subtitle={draft ? `${draft.userName} · ${draft.userId}` : undefined}
        footer={
          draft ? (
            rejecting ? (
              <div className="flex justify-end gap-2">
                <Btn onClick={() => setRejecting(false)} disabled={busy}>Cancel</Btn>
                <Btn tone="danger" onClick={() => run("reject")} disabled={busy}>
                  {busy ? "Rejecting..." : "Confirm reject"}
                </Btn>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Btn tone="danger" onClick={() => run("delete")} disabled={busy}>Remove deposit</Btn>
                <div className="flex flex-wrap gap-2">
                  <Btn onClick={() => run("save")} disabled={!dirty || busy}>Save edits</Btn>
                  {pending ? (
                    <>
                      <Btn tone="danger" onClick={() => setRejecting(true)} disabled={busy}>Reject</Btn>
                      <Btn tone="primary" onClick={() => run("approve")} disabled={busy}>Approve</Btn>
                    </>
                  ) : null}
                </div>
              </div>
            )
          ) : null
        }
      >
        {draft ? (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <Badge tone={statusTone[draft.status]}>{draft.status}</Badge>
              {note ? <span className="text-xs text-muted-foreground">{note}</span> : null}
            </div>

            <div className="divide-y divide-border rounded-xl border border-border px-3">
              <InfoRow label="User" value={draft.userName} />
              <InfoRow label="User ID" value={draft.userId} />
              <InfoRow label="Email" value={draft.email} />
              <InfoRow label="Method" value={draft.method} />
              <InfoRow label="Requested at" value={draft.requestedAt} />
              <InfoRow label="Reviewed at" value={draft.reviewedAt} />
            </div>

            {draft.status === "rejected" && draft.rejectReason ? (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm">
                <p className="text-xs font-medium text-rose-600 dark:text-rose-400">Rejection reason</p>
                <p className="mt-1 text-foreground">{draft.rejectReason}</p>
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Amount" type="number" value={draft.amount} onChange={(v) => edit("amount", Number(v) || 0)} />
              <Field label="Currency" value={draft.currency} onChange={(v) => edit("currency", v)} />
              <Field label="Network" value={draft.network} onChange={(v) => edit("network", v)} />
              <Field label="Method" value={draft.method} onChange={(v) => edit("method", v)} />
            </div>
            <Field label="Deposit Address" value={draft.address} onChange={(v) => edit("address", v)} />
            <Field label="Transaction Hash" value={draft.txHash} onChange={(v) => edit("txHash", v)} />
            <TextArea
              label="Internal admin note"
              value={draft.note}
              onChange={(v) => edit("note", v)}
              placeholder="Visible to admins only"
            />

            {original && draft.amount !== original.amount ? (
              <p className="rounded-lg bg-amber-500/10 p-2 text-xs text-amber-600 dark:text-amber-400">
                Amount changed from {usd(original.amount)} to {usd(draft.amount)}. The edited amount is what gets credited on approval.
              </p>
            ) : null}

            {rejecting ? (
              <TextArea
                label="Rejection reason (required, shown to the user)"
                value={reason}
                onChange={setReason}
                placeholder="e.g. Transaction hash not found on the network"
                invalid={!reason.trim()}
              />
            ) : null}
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
