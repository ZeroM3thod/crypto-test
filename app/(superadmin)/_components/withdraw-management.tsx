// app/(superadmin)/_components/withdraw-management.tsx
"use client";

import { useMemo, useState } from "react";
import { Table, type TableColumn } from "@/components/motion/table";
import type { ReqStatus, Withdrawal } from "@/lib/finance-data";
import { Badge, Btn, Field, SelectField, StatCard } from "./ui";
import { Drawer, FilterTabs, InfoRow, TextArea, api, nowStamp, statusTone, usd } from "./finance-ui";

type Tab = "all" | ReqStatus;
type Action = "save" | "approve" | "reject";

const WALLETS = ["Main Wallet", "Referral Wallet", "Mining Wallet", "Trading Wallet", "Investment Wallet"];

export function WithdrawManagement({ initial }: { initial: Withdrawal[] }) {
  const [items, setItems] = useState<Withdrawal[]>(initial);
  const [tab, setTab] = useState<Tab>("pending");
  const [q, setQ] = useState("");

  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Withdrawal | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const flash = (m: string) => {
    setNote(m);
    setTimeout(() => setNote(null), 3500);
  };

  const stats = useMemo(() => {
    const sum = (s: ReqStatus) => items.filter((w) => w.status === s).reduce((a, w) => a + w.amount, 0);
    const count = (s: ReqStatus) => items.filter((w) => w.status === s).length;
    return {
      pending: count("pending"),
      pendingAmt: sum("pending"),
      approved: count("approved"),
      approvedAmt: sum("approved"),
      rejected: count("rejected"),
    };
  }, [items]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return items.filter(
      (w) =>
        (tab === "all" || w.status === tab) &&
        (!term ||
          w.id.toLowerCase().includes(term) ||
          w.userName.toLowerCase().includes(term) ||
          w.userId.toLowerCase().includes(term) ||
          w.email.toLowerCase().includes(term) ||
          w.address.toLowerCase().includes(term)),
    );
  }, [items, tab, q]);

  const columns = useMemo<TableColumn<Withdrawal>[]>(
    () => [
      { key: "id", header: "Withdrawal ID", sortable: true, width: "140px" },
      {
        key: "userName",
        header: "User",
        sortable: true,
        width: "1.2fr",
        cell: (w) => (
          <div className="flex flex-col leading-tight">
            <span className="font-medium">{w.userName}</span>
            <span className="text-xs text-muted-foreground">{w.userId}</span>
          </div>
        ),
      },
      {
        key: "amount",
        header: "Amount",
        sortable: true,
        align: "right",
        width: "130px",
        cell: (w) => <span className="tabular-nums">{usd(w.amount)}</span>,
      },
      {
        key: "fee",
        header: "Fee",
        sortable: true,
        align: "right",
        width: "90px",
        cell: (w) => <span className="tabular-nums text-muted-foreground">{usd(w.fee)}</span>,
      },
      { key: "network", header: "Network", sortable: true, width: "100px" },
      { key: "address", header: "Destination Address", width: "1.4fr" },
      { key: "requestedAt", header: "Requested", sortable: true, width: "160px" },
      {
        key: "status",
        header: "Status",
        sortable: true,
        width: "120px",
        cell: (w) => <Badge tone={statusTone[w.status]}>{w.status}</Badge>,
      },
    ],
    [],
  );

  // ---------- drawer helpers ----------
  const original = items.find((w) => w.id === openId) ?? null;

  const openRow = (w: Withdrawal) => {
    setOpenId(w.id);
    setDraft({ ...w });
    setRejecting(false);
    setReason("");
  };
  const closeDrawer = () => {
    setOpenId(null);
    setDraft(null);
    setRejecting(false);
    setReason("");
  };
  const edit = <K extends keyof Withdrawal>(key: K, value: Withdrawal[K]) =>
    setDraft((w) => (w ? { ...w, [key]: value } : w));

  async function run(action: Action) {
    if (!draft) return;
    if (action === "reject" && !reason.trim()) {
      flash("Please write a rejection reason.");
      return;
    }
    if (
      action === "approve" &&
      !confirm(
        `Approve withdrawal of ${usd(draft.amount)} to ${draft.address}?\nUser receives ${usd(draft.amount - draft.fee)} after the ${usd(draft.fee)} fee.`,
      )
    )
      return;

    setBusy(true);
    try {
      await api(`/api/owner/withdrawals/${draft.id}`, "PATCH", {
        action,
        withdrawal: draft,
        reason: reason.trim(),
      });

      const reviewed = action === "approve" || action === "reject";
      const next: Withdrawal = {
        ...draft,
        status: action === "approve" ? "approved" : action === "reject" ? "rejected" : draft.status,
        rejectReason: action === "reject" ? reason.trim() : draft.rejectReason,
        reviewedAt: reviewed ? nowStamp() : draft.reviewedAt,
      };
      setItems((l) => l.map((x) => (x.id === next.id ? next : x)));
      setDraft(next);
      setRejecting(false);
      setReason("");
      flash(action === "approve" ? "Withdrawal approved" : action === "reject" ? "Withdrawal rejected" : "Changes saved");
    } catch {
      flash("Request failed. Check your API route.");
    } finally {
      setBusy(false);
    }
  }

  const dirty = !!draft && !!original && JSON.stringify(draft) !== JSON.stringify(original);
  const pending = draft?.status === "pending";
  const addressChanged = !!draft && !!original && draft.address !== original.address;
  const amountChanged = !!draft && !!original && draft.amount !== original.amount;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Withdraw Management</h1>
        <p className="text-sm text-muted-foreground">Click any row to review, edit, approve or reject a withdrawal.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Pending Requests" value={stats.pending} hint={`${usd(stats.pendingAmt)} waiting`} />
        <StatCard label="Approved" value={stats.approved} hint={`${usd(stats.approvedAmt)} paid out`} />
        <StatCard label="Rejected" value={stats.rejected} />
        <StatCard label="All Withdrawals" value={items.length} />
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
            placeholder="Search ID, user, email or address"
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring md:w-80"
          />
        </div>

        <Table
          data={filtered}
          columns={columns}
          getRowId={(w) => w.id}
          resizable
          defaultSort={{ key: "requestedAt", direction: "desc" }}
          onRowClick={openRow}
          height={560}
          rowHeight={56}
          className="rounded-2xl"
          emptyState="No withdrawals found"
        />
      </div>

      {/* ---------- details drawer ---------- */}
      <Drawer
        open={!!draft}
        onClose={closeDrawer}
        title={draft ? `Withdrawal ${draft.id}` : ""}
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
              <div className="flex flex-wrap justify-end gap-2">
                <Btn onClick={() => run("save")} disabled={!dirty || busy}>Save edits</Btn>
                {pending ? (
                  <>
                    <Btn tone="danger" onClick={() => setRejecting(true)} disabled={busy}>Reject</Btn>
                    <Btn tone="primary" onClick={() => run("approve")} disabled={busy}>Approve</Btn>
                  </>
                ) : null}
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
              <InfoRow label="Requested at" value={draft.requestedAt} />
              <InfoRow label="Reviewed at" value={draft.reviewedAt} />
              <InfoRow label="User receives" value={usd(Math.max(0, draft.amount - draft.fee))} />
            </div>

            {draft.status === "rejected" && draft.rejectReason ? (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm">
                <p className="text-xs font-medium text-rose-600 dark:text-rose-400">Rejection reason</p>
                <p className="mt-1 text-foreground">{draft.rejectReason}</p>
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Amount" type="number" value={draft.amount} onChange={(v) => edit("amount", Number(v) || 0)} />
              <Field label="Fee" type="number" value={draft.fee} onChange={(v) => edit("fee", Number(v) || 0)} />
              <Field label="Currency" value={draft.currency} onChange={(v) => edit("currency", v)} />
              <Field label="Network" value={draft.network} onChange={(v) => edit("network", v)} />
            </div>
            <SelectField
              label="Source Wallet"
              value={draft.sourceWallet}
              onChange={(v) => edit("sourceWallet", v)}
              options={WALLETS.map((w) => ({ value: w, label: w }))}
            />
            <Field label="Destination Address" value={draft.address} onChange={(v) => edit("address", v)} />
            <Field
              label="Payout Transaction Hash (fill after sending)"
              value={draft.txHash}
              onChange={(v) => edit("txHash", v)}
            />
            <TextArea
              label="Internal admin note"
              value={draft.note}
              onChange={(v) => edit("note", v)}
              placeholder="Visible to admins only"
            />

            {addressChanged ? (
              <p className="rounded-lg bg-amber-500/10 p-2 text-xs text-amber-600 dark:text-amber-400">
                Destination address differs from what the user requested. Funds will go to the new address.
              </p>
            ) : null}
            {amountChanged && original ? (
              <p className="rounded-lg bg-amber-500/10 p-2 text-xs text-amber-600 dark:text-amber-400">
                Amount changed from {usd(original.amount)} to {usd(draft.amount)}. The user&apos;s held balance must be adjusted by the difference.
              </p>
            ) : null}

            {rejecting ? (
              <TextArea
                label="Rejection reason (required, shown to the user)"
                value={reason}
                onChange={setReason}
                placeholder="e.g. KYC not verified"
                invalid={!reason.trim()}
              />
            ) : null}
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
