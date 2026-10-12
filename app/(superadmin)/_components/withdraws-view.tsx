// app/(superadmin)/_components/withdraws-view.tsx
"use client";

import {
  ArrowUpFromLine,
  CheckCircle2,
  Clock,
  Coins,
  Download,
  Pencil,
  X,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/motion/button";
import { Table, type TableColumn } from "@/components/motion/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/motion/tabs";
import type { Coin, ReviewStatus, Withdraw } from "@/lib/admin-review-data";
import {
  PageHeader,
  SearchInput,
  StatCard,
  StatusBadge,
} from "./finance-ui";
import {
  DateRange,
  downloadCSV,
  fmtAmt,
  initials,
  type ModalMode,
  ReviewModal,
  shortHash,
  Toast,
  useToast,
} from "./review-ui";

type Filter = "all" | ReviewStatus;

const FEE_RATE = 0.1;
const feeOf = (w: Withdraw) => w.amount * FEE_RATE;
const netOf = (w: Withdraw) => w.amount - feeOf(w);

const EDIT_COINS = ["USDT", "USDC"] as const;
// NOTE: keep these labels identical to the `network` values used in your withdrawal data.
const EDIT_NETWORKS = ["BEP20", "Aptos"] as const;

const inputCls =
  "h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/40";

export function WithdrawsView({ initial }: { initial: Withdraw[] }) {
  const { toast, showToast } = useToast();
  const [rows, setRows] = useState(initial);
  const [chip, setChip] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [mode, setMode] = useState<ModalMode>(null);
  const [modalId, setModalId] = useState("");

  // edit-withdrawal modal
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    coin: "",
    network: "",
    amount: "",
    address: "",
    date: "",
  });

  const copyText = useCallback(
    (t: string) => {
      navigator.clipboard?.writeText(t).catch(() => {});
      showToast("📋 Copied to clipboard!");
    },
    [showToast],
  );

  const closeModal = () => setMode(null);
  const openView = useCallback((id: string) => {
    setModalId(id);
    setMode("view");
  }, []);
  const openReject = useCallback((id: string) => {
    setModalId(id);
    setMode("reject");
  }, []);

  /* ---------- edit withdrawal ---------- */

  const openEdit = useCallback((w: Withdraw) => {
    setEditId(w.id);
    setEditForm({
      coin: w.coin,
      network: w.network,
      amount: String(w.amount),
      address: w.address,
      date: w.date,
    });
  }, []);

  const closeEdit = () => setEditId(null);

  const saveEdit = async () => {
    const amount = Number(editForm.amount);
    if (!editForm.coin) return showToast("Please select a coin.");
    if (!editForm.network) return showToast("Please select a network.");
    if (!Number.isFinite(amount) || amount <= 0)
      return showToast("Amount must be greater than 0.");
    if (!editForm.address.trim()) return showToast("Wallet address is required.");
    if (!editForm.date) return showToast("Please select a date.");

    try {
      const res = await fetch("/api/admin/withdrawals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          withdrawalId: editId,
          coin: editForm.coin,
          network: editForm.network,
          amount,
          walletAddress: editForm.address.trim(),
          date: editForm.date,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update");
      }

      setRows((prev) =>
        prev.map((r) =>
          r.id === editId
            ? {
                ...r,
                coin: editForm.coin as Withdraw["coin"],
                network: editForm.network as Withdraw["network"],
                amount,
                address: editForm.address.trim(),
                date: editForm.date,
              }
            : r,
        ),
      );
      showToast(`✓ ${editId} updated`);
      closeEdit();
    } catch (err: any) {
      showToast(`Error: ${err.message || "Failed to update"}`);
    }
  };

  /* ---------- actions ---------- */

  const doConfirm = useCallback(
    async (w: Withdraw) => {
      try {
        const res = await fetch("/api/admin/withdrawals", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            withdrawalId: w.id,
            action: "approve",
          }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Failed to approve");
        }

        setRows((prev) =>
          prev.map((r) => (r.id === w.id ? { ...r, status: "approved" } : r)),
        );
        showToast(`✓ ${w.id} approved — $${netOf(w).toLocaleString()} ${w.coin} payout`);
        closeModal();
      } catch (err: any) {
        showToast(`Error: ${err.message || "Failed to approve"}`);
      }
    },
    [showToast],
  );

  const doReject = async (id: string, reason: string) => {
    if (reason.trim().length < 5) {
      showToast("Please enter a rejection reason.");
      return;
    }

    try {
      const res = await fetch("/api/admin/withdrawals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          withdrawalId: id,
          action: "reject",
          reason: reason.trim(),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to reject");
      }

      setRows((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: "rejected", reason: reason.trim() } : r,
        ),
      );
      showToast(`✕ ${id} rejected`);
      closeModal();
    } catch (err: any) {
      showToast(`Error: ${err.message || "Failed to reject"}`);
    }
  };

  /* ---------- filtering ---------- */

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (w) =>
        (chip === "all" || w.status === chip) &&
        (!q ||
          [w.name, w.username, w.userId, w.id, w.coin, w.address, w.network].some((v) =>
            v.toLowerCase().includes(q),
          )) &&
        (!dateFrom || w.date >= dateFrom) &&
        (!dateTo || w.date <= dateTo),
    );
  }, [rows, chip, query, dateFrom, dateTo]);

  const confirmAllPending = () => {
    const pendingRows = filtered.filter((w) => w.status === "pending");
    if (!pendingRows.length) {
      showToast("No pending withdrawals in current view.");
      return;
    }
    const byCoin = pendingRows.reduce<Partial<Record<Coin, number>>>((acc, w) => {
      acc[w.coin] = (acc[w.coin] ?? 0) + netOf(w);
      return acc;
    }, {});
    const total = (Object.entries(byCoin) as [Coin, number][])
      .map(([coin, amt]) => `$${amt.toLocaleString()} ${coin}`)
      .join(" + ");
    if (
      !window.confirm(
        `Approve all ${pendingRows.length} pending withdrawals? Total payout: ${total}`,
      )
    )
      return;
    // TODO: call your API here (bulk approve)
    const ids = new Set(pendingRows.map((w) => w.id));
    setRows((prev) =>
      prev.map((r) => (ids.has(r.id) ? { ...r, status: "approved" } : r)),
    );
    showToast(`✓ ${pendingRows.length} withdrawals approved!`);
  };

  const exportCSV = () => {
    downloadCSV(`withdrawals-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["ID", "User", "Username", "User ID", "Coin", "Amount", "Fee", "Net", "Network", "Address", "Date", "Status", "Reason"],
      ...filtered.map((w) => [
        w.id, w.name, w.username, w.userId, w.coin, w.amount, feeOf(w), netOf(w),
        w.network, w.address, w.date, w.status, w.reason,
      ]),
    ]);
    showToast(`✓ Exported ${filtered.length} records`);
  };

  /* ---------- stats ---------- */

  const stats = useMemo(() => {
    const pend = rows.filter((w) => w.status === "pending");
    const conf = rows.filter((w) => w.status === "approved");
    return {
      pendCount: pend.length,
      pendAmt: pend.reduce((s, w) => s + w.amount, 0),
      confCount: conf.length,
      paidOut: conf.reduce((s, w) => s + netOf(w), 0),
      feeProfit: conf.reduce((s, w) => s + feeOf(w), 0),
    };
  }, [rows]);

  /* ---------- table ---------- */

  const columns = useMemo<TableColumn<Withdraw>[]>(
    () => [
      {
        key: "name",
        header: "User",
        sortable: true,
        width: "1.3fr",
        cell: (w) => (
          <div className="flex items-center gap-2.5">
            <span className="grid size-7 shrink-0 place-items-center rounded-full border border-border bg-muted text-[10px] font-semibold text-foreground">
              {initials(w.name)}
            </span>
            <span className="truncate font-medium">{w.name}</span>
          </div>
        ),
      },
      {
        key: "userId",
        header: "User ID",
        width: "100px",
        cell: (w) => (
          <span className="text-xs font-mono text-muted-foreground">{w.userId}</span>
        ),
      },
      {
        key: "amount",
        header: "Amount",
        sortable: true,
        align: "right",
        width: "150px",
        cell: (w) => (
          <span className="flex items-center justify-end gap-2">
            <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] text-foreground">
              {w.coin}
            </span>
            <span className="tabular-nums">−${fmtAmt(w.amount)}</span>
          </span>
        ),
      },
      {
        key: "fee",
        header: "Fee",
        sortable: true,
        align: "right",
        width: "90px",
        cell: (w) => (
          <span className="tabular-nums text-(--color-success)">${fmtAmt(feeOf(w))}</span>
        ),
      },
      {
        key: "net" as never,
        header: "Net payout",
        align: "right",
        width: "120px",
        cell: (w) => (
          <span className="font-medium tabular-nums">${fmtAmt(netOf(w))}</span>
        ),
      },
      {
        key: "network",
        header: "Network",
        width: "90px",
        cell: (w) => (
          <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] text-foreground">
            {w.network}
          </span>
        ),
      },
      {
        key: "address",
        header: "Wallet address",
        width: "170px",
        cell: (w) => (
          <button
            type="button"
            title={w.address}
            onClick={() => copyText(w.address)}
            className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            {shortHash(w.address)}
          </button>
        ),
      },
      { key: "date", header: "Date", sortable: true, width: "110px" },
      {
        key: "status",
        header: "Status",
        width: "120px",
        cell: (w) => <StatusBadge status={w.status} />,
      },
      {
        key: "actions" as never,
        header: "Action",
        align: "right",
        width: "310px",
        cell: (w) => (
          <div className="flex justify-end gap-1.5">
            {w.status === "pending" && (
              <>
                <Button size="sm" variant="outline" onClick={() => openReject(w.id)}>
                  Reject
                </Button>
                <Button size="sm" variant="ghost" onClick={() => openView(w.id)}>
                  View
                </Button>
                <Button size="sm" variant="primary" onClick={() => openView(w.id)}>
                  Approve
                </Button>
              </>
            )}
            {w.status !== "pending" && (
              <Button size="sm" variant="ghost" onClick={() => openView(w.id)}>
                Details
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => openEdit(w)}>
              <Pencil className="size-3.5" />
              Edit
            </Button>
          </div>
        ),
      },
    ],
    [copyText, doConfirm, openReject, openView, openEdit],
  );

  const current = rows.find((w) => w.id === modalId);
  const editing = rows.find((w) => w.id === editId);

  // keep a legacy coin/network value selectable in the edit dropdowns
  const editCoins = Array.from(new Set<string>([...EDIT_COINS, editForm.coin].filter(Boolean)));
  const editNetworks = Array.from(
    new Set<string>([...EDIT_NETWORKS, editForm.network].filter(Boolean)),
  );
  const editAmount = Number(editForm.amount);
  const editFee = Number.isFinite(editAmount) ? editAmount * FEE_RATE : 0;

  return (
    <>
      <Toast toast={toast} />

      <ReviewModal
        mode={mode}
        onClose={closeModal}
        noun="Withdrawal"
        record={
          current && {
            id: current.id,
            status: current.status,
            reason: current.reason,
            copyValue: current.address,
            copyLabel: "Copy address",
          }
        }
        fields={
          current
            ? [
                { label: "User", value: current.name },
                { label: "User ID", value: current.userId },
                { label: `Amount (${current.coin})`, value: `−$${fmtAmt(current.amount)}`, strong: true },
                { label: "Fee (10%)", value: `$${fmtAmt(feeOf(current))}` },
                { label: "Net payout", value: `$${fmtAmt(netOf(current))}`, strong: true },
                { label: "Coin", value: current.coin },
                { label: "Network", value: current.network },
                { label: "Date", value: current.date },
                { label: "Status", value: current.status },
                { label: "Wallet address", value: current.address, full: true, copy: true },
              ]
            : []
        }
        summary={
          current
            ? `You are approving a withdrawal of $${fmtAmt(current.amount)} ${current.coin} (net payout $${fmtAmt(netOf(current))} after the $${fmtAmt(feeOf(current))} fee) to ${current.name} on ${current.network}. Make sure the payout has been sent to the address below.`
            : ""
        }
        rejectNote="You are about to reject this withdrawal. A rejection reason is required and is saved with the record."
        onSwitch={setMode}
        onConfirm={() => current && doConfirm(current)}
        onReject={(reason) => current && doReject(current.id, reason)}
        onCopy={copyText}
      />

      {/* ---------- edit withdrawal modal ---------- */}
      {editing && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
          onClick={closeEdit}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Edit withdrawal"
            className="w-full max-w-md rounded-2xl border border-border bg-background p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-foreground">Edit withdrawal</h3>
                <p className="text-xs text-muted-foreground">
                  {editing.id} · {editing.name}
                </p>
              </div>
              <button
                type="button"
                onClick={closeEdit}
                aria-label="Close"
                className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">Coin</span>
                <select
                  className={inputCls}
                  value={editForm.coin}
                  onChange={(e) => setEditForm((f) => ({ ...f, coin: e.target.value }))}
                >
                  {editCoins.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">Network</span>
                <select
                  className={inputCls}
                  value={editForm.network}
                  onChange={(e) => setEditForm((f) => ({ ...f, network: e.target.value }))}
                >
                  {editNetworks.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">Amount</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  className={inputCls}
                  value={editForm.amount}
                  onChange={(e) => setEditForm((f) => ({ ...f, amount: e.target.value }))}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">Date</span>
                <input
                  type="date"
                  className={inputCls}
                  value={editForm.date}
                  onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))}
                />
              </label>
              <label className="col-span-2 flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  Wallet address
                </span>
                <input
                  type="text"
                  spellCheck={false}
                  className={`${inputCls} font-mono text-xs`}
                  value={editForm.address}
                  onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
                />
              </label>
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              Fee (10%): ${fmtAmt(editFee)} · Net payout: $
              {fmtAmt(Number.isFinite(editAmount) ? editAmount - editFee : 0)}
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <Button size="md" variant="outline" onClick={closeEdit}>
                Cancel
              </Button>
              <Button size="md" variant="primary" onClick={saveEdit}>
                Save changes
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span className="size-1.5 animate-pulse rounded-full bg-(--color-success)" />
              Admin · Finance · Live
            </span>
            <PageHeader
              title="Withdrawal Management"
              description="Monitor, approve or reject all withdrawal requests."
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DateRange from={dateFrom} to={dateTo} onFrom={setDateFrom} onTo={setDateTo} />
            <Button size="md" variant="primary" onClick={exportCSV}>
              <Download className="size-4" />
              Export CSV
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard label="Pending" value={stats.pendCount} icon={Clock} hint={`$${fmtAmt(stats.pendAmt)}`} />
          <StatCard label="Approved" value={stats.confCount} icon={CheckCircle2} hint="Paid out" />
          <StatCard
            label="Total paid out"
            value={stats.paidOut}
            format={(n) => `$${(n / 1000).toFixed(1)}K`}
            icon={ArrowUpFromLine}
          />
        </div>

        <section className="rounded-2xl border border-border bg-background p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">Withdrawal records</h2>
              <p className="text-xs text-muted-foreground">
                {filtered.length} record{filtered.length !== 1 ? "s" : ""} · filtered
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Tabs value={chip} onValueChange={(v) => setChip(v as Filter)} variant="segment">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="approved">Approved</TabsTrigger>
                  <TabsTrigger value="rejected">Rejected</TabsTrigger>
                </TabsList>
              </Tabs>
              <SearchInput value={query} onChange={setQuery} placeholder="Search users, IDs, addresses…" />
              <Button size="md" variant="outline" onClick={confirmAllPending}>
                Approve all pending
              </Button>
            </div>
          </div>

          <div className="mt-4">
            <Table
              data={filtered}
              columns={columns}
              getRowId={(w) => w.id}
              height={520}
              rowHeight={60}
              className="rounded-xl"
              emptyState={
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">No withdrawals found</p>
                  <p className="text-xs text-muted-foreground">Try adjusting your search or filter.</p>
                </div>
              }
            />
          </div>
        </section>
      </div>
    </>
  );
}