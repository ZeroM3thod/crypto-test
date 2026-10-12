// app/(superadmin)/_components/deposits-view.tsx
"use client";

import {
  ArrowDownToLine,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  ListChecks,
  Pencil,
  Wallet,
  X,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/motion/button";
import { Table, type TableColumn } from "@/components/motion/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/motion/tabs";
import type { Coin, Deposit, ReviewStatus } from "@/lib/admin-review-data";
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

/* ---------- deposit address config ---------- */

const ADDRESS_COINS = ["USDT", "USDC"] as const;
// NOTE: keep these labels identical to the `network` values used in your deposit data.
const NETWORKS = ["BEP20", "ERC20", "Aptos", "Polygon POS", "Solana"] as const;

/** key = `${coin}:${network}` -> deposit address */
export type DepositAddresses = Record<string, string>;
const addrKey = (coin: string, network: string) => `${coin}:${network}`;

const inputCls =
  "h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/40";

export function DepositsView({
  initial,
  initialAddresses = {},
}: {
  initial: Deposit[];
  initialAddresses?: DepositAddresses;
}) {
  const { toast, showToast } = useToast();
  const [rows, setRows] = useState(initial);
  const [chip, setChip] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [mode, setMode] = useState<ModalMode>(null);
  const [modalId, setModalId] = useState("");

  // deposit addresses (saved) + unsaved drafts
  const [addresses, setAddresses] = useState<DepositAddresses>(initialAddresses);
  const [drafts, setDrafts] = useState<DepositAddresses>({});

  // edit-deposit modal
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    coin: "",
    amount: "",
    network: "",
    hash: "",
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

  /* ---------- deposit address actions ---------- */

  const saveAddress = (coin: string, network: string) => {
    const k = addrKey(coin, network);
    const value = (drafts[k] ?? addresses[k] ?? "").trim();
    if (!value) {
      showToast("Please enter a deposit address.");
      return;
    }
    if (value.length < 20) {
      showToast("That address looks too short.");
      return;
    }
    // TODO: call your API here (save deposit address for coin + network)
    setAddresses((prev) => ({ ...prev, [k]: value }));
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[k];
      return next;
    });
    showToast(`✓ ${coin} · ${network} address saved`);
  };

  /* ---------- edit deposit actions ---------- */

  const openEdit = useCallback((d: Deposit) => {
    setEditId(d.id);
    setEditForm({
      coin: d.coin,
      amount: String(d.amount),
      network: d.network,
      hash: d.hash,
    });
  }, []);

  const closeEdit = () => setEditId(null);

  const saveEdit = async () => {
    const amount = Number(editForm.amount);
    if (!editForm.coin) return showToast("Please select a coin.");
    if (!Number.isFinite(amount) || amount <= 0)
      return showToast("Amount must be greater than 0.");
    if (!editForm.network) return showToast("Please select a network.");
    if (!editForm.hash.trim()) return showToast("Transaction hash is required.");

    try {
      const res = await fetch("/api/admin/deposits", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          depositId: editId,
          coin: editForm.coin,
          network: editForm.network,
          amount,
          transactionHash: editForm.hash.trim(),
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
                coin: editForm.coin as Deposit["coin"],
                amount,
                network: editForm.network as Deposit["network"],
                hash: editForm.hash.trim(),
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
    async (d: Deposit) => {
      try {
        const res = await fetch("/api/admin/deposits", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            depositId: d.id,
            action: "approve",
          }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Failed to approve");
        }

        setRows((prev) =>
          prev.map((r) => (r.id === d.id ? { ...r, status: "approved" } : r)),
        );
        showToast(`✓ ${d.id} confirmed — $${d.amount.toLocaleString()} ${d.coin}`);
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
      const res = await fetch("/api/admin/deposits", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          depositId: id,
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
      (d) =>
        (chip === "all" || d.status === chip) &&
        (!q ||
          [d.name, d.username, d.userId, d.id, d.coin, d.hash, d.network].some((v) =>
            v.toLowerCase().includes(q),
          )) &&
        (!dateFrom || d.date >= dateFrom) &&
        (!dateTo || d.date <= dateTo),
    );
  }, [rows, chip, query, dateFrom, dateTo]);

  const confirmAllPending = () => {
    const pendingRows = filtered.filter((d) => d.status === "pending");
    if (!pendingRows.length) {
      showToast("No pending deposits in current view.");
      return;
    }
    const byCoin = pendingRows.reduce<Partial<Record<Coin, number>>>((acc, d) => {
      acc[d.coin] = (acc[d.coin] ?? 0) + d.amount;
      return acc;
    }, {});
    const total = (Object.entries(byCoin) as [Coin, number][])
      .map(([coin, amt]) => `$${amt.toLocaleString()} ${coin}`)
      .join(" + ");
    if (
      !window.confirm(
        `Confirm all ${pendingRows.length} pending deposits? Total: ${total}`,
      )
    )
      return;
    // TODO: call your API here (bulk approve)
    const ids = new Set(pendingRows.map((d) => d.id));
    setRows((prev) =>
      prev.map((r) => (ids.has(r.id) ? { ...r, status: "approved" } : r)),
    );
    showToast(`✓ ${pendingRows.length} deposits confirmed!`);
  };

  const exportCSV = () => {
    downloadCSV(`deposits-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["ID", "User", "Username", "User ID", "Coin", "Amount", "Network", "Hash", "Date", "Status", "Reason"],
      ...filtered.map((d) => [
        d.id, d.name, d.username, d.userId, d.coin, d.amount, d.network, d.hash, d.date, d.status, d.reason,
      ]),
    ]);
    showToast(`✓ Exported ${filtered.length} records`);
  };

  /* ---------- stats ---------- */

  const stats = useMemo(() => {
    const pend = rows.filter((d) => d.status === "pending");
    const conf = rows.filter((d) => d.status === "approved");
    return {
      pendCount: pend.length,
      pendAmt: pend.reduce((s, d) => s + d.amount, 0),
      confCount: conf.length,
      confAmt: conf.reduce((s, d) => s + d.amount, 0),
    };
  }, [rows]);

  /* ---------- table ---------- */

  const columns = useMemo<TableColumn<Deposit>[]>(
    () => [
      {
        key: "name",
        header: "User",
        sortable: true,
        width: "1.3fr",
        cell: (d) => (
          <div className="flex items-center gap-2.5">
            <span className="grid size-7 shrink-0 place-items-center rounded-full border border-border bg-muted text-[10px] font-semibold text-foreground">
              {initials(d.name)}
            </span>
            <span className="truncate font-medium">{d.name}</span>
          </div>
        ),
      },
      {
        key: "userId",
        header: "User ID",
        width: "100px",
        cell: (d) => (
          <span className="text-xs font-mono text-muted-foreground">{d.userId}</span>
        ),
      },
      {
        key: "amount",
        header: "Amount",
        sortable: true,
        align: "right",
        width: "150px",
        cell: (d) => (
          <span className="flex items-center justify-end gap-2">
            <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] text-foreground">
              {d.coin}
            </span>
            <span className="font-medium tabular-nums text-(--color-success)">
              +${fmtAmt(d.amount)}
            </span>
          </span>
        ),
      },
      {
        key: "network",
        header: "Network",
        width: "110px",
        cell: (d) => (
          <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] text-foreground">
            {d.network}
          </span>
        ),
      },
      {
        key: "hash",
        header: "Transaction hash",
        width: "170px",
        cell: (d) => (
          <button
            type="button"
            title={d.hash}
            onClick={() => copyText(d.hash)}
            className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            {shortHash(d.hash)}
          </button>
        ),
      },
      { key: "date", header: "Date", sortable: true, width: "110px" },
      {
        key: "status",
        header: "Status",
        width: "120px",
        cell: (d) => <StatusBadge status={d.status} />,
      },
      {
        key: "actions" as never,
        header: "Action",
        align: "right",
        width: "310px",
        cell: (d) => (
          <div className="flex justify-end gap-1.5">
            {d.status === "pending" && (
              <>
                <Button size="sm" variant="outline" onClick={() => openReject(d.id)}>
                  Reject
                </Button>
                <Button size="sm" variant="ghost" onClick={() => openView(d.id)}>
                  View
                </Button>
                <Button size="sm" variant="primary" onClick={() => openView(d.id)}>
                  Confirm
                </Button>
              </>
            )}
            {d.status !== "pending" && (
              <Button size="sm" variant="ghost" onClick={() => openView(d.id)}>
                Details
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => openEdit(d)}>
              <Pencil className="size-3.5" />
              Edit
            </Button>
          </div>
        ),
      },
    ],
    [copyText, doConfirm, openReject, openView, openEdit],
  );

  const current = rows.find((d) => d.id === modalId);
  const editing = rows.find((d) => d.id === editId);

  // make sure a legacy network value still shows in the edit dropdown
  const editNetworks = useMemo(() => {
    const list: string[] = [...NETWORKS];
    if (editForm.network && !list.includes(editForm.network)) list.push(editForm.network);
    return list;
  }, [editForm.network]);

  return (
    <>
      <Toast toast={toast} />

      <ReviewModal
        mode={mode}
        onClose={closeModal}
        noun="Deposit"
        record={
          current && {
            id: current.id,
            status: current.status,
            reason: current.reason,
            copyValue: current.hash,
            copyLabel: "Copy hash",
          }
        }
        fields={
          current
            ? [
                { label: "User", value: current.name },
                { label: "User ID", value: current.userId },
                { label: `Amount (${current.coin})`, value: `+$${fmtAmt(current.amount)}`, strong: true },
                { label: "Coin", value: current.coin },
                { label: "Network", value: current.network },
                { label: "Date", value: current.date },
                { label: "Status", value: current.status },
                { label: "Transaction hash", value: current.hash, full: true, copy: true },
              ]
            : []
        }
        summary={
          current
            ? `You are confirming a deposit of $${fmtAmt(current.amount)} ${current.coin} via ${current.network} from ${current.name}. Verify the transaction hash before confirming.`
            : ""
        }
        rejectNote="You are about to reject this deposit. A rejection reason is required and is saved with the record."
        onSwitch={setMode}
        onConfirm={() => current && doConfirm(current)}
        onReject={(reason) => current && doReject(current.id, reason)}
        onCopy={copyText}
      />

      {/* ---------- edit deposit modal ---------- */}
      {editing && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
          onClick={closeEdit}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Edit deposit"
            className="w-full max-w-md rounded-2xl border border-border bg-background p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-foreground">Edit deposit</h3>
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
                  {Array.from(new Set<string>([...ADDRESS_COINS, editForm.coin])).map((c) => (
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
              <label className="col-span-2 flex flex-col gap-1.5">
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
              <label className="col-span-2 flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  Transaction hash
                </span>
                <input
                  type="text"
                  className={`${inputCls} font-mono text-xs`}
                  value={editForm.hash}
                  onChange={(e) => setEditForm((f) => ({ ...f, hash: e.target.value }))}
                />
              </label>
            </div>

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
              title="Deposit Management"
              description="Monitor, confirm or reject all incoming deposits."
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Pending" value={stats.pendCount} icon={Clock} hint={`$${fmtAmt(stats.pendAmt)}`} />
          <StatCard label="Approved" value={stats.confCount} icon={CheckCircle2} hint={`$${fmtAmt(stats.confAmt)}`} />
          <StatCard label="Total records" value={rows.length} icon={ListChecks} hint="All time" />
          <StatCard
            label="Total approved"
            value={stats.confAmt}
            format={(n) => `$${(n / 1000).toFixed(1)}K`}
            icon={ArrowDownToLine}
            positive
          />
        </div>

        {/* ---------- deposit address settings ---------- */}
        <section className="rounded-2xl border border-border bg-background p-5">
          <div className="mb-4 flex items-center gap-2">
            <Wallet className="size-4 text-muted-foreground" />
            <div>
              <h2 className="text-base font-semibold text-foreground">Deposit addresses</h2>
              <p className="text-xs text-muted-foreground">
                Set the address users deposit to, per coin and network.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {ADDRESS_COINS.map((coin) => (
              <div key={coin} className="rounded-xl border border-border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-semibold text-foreground">
                    {coin}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {NETWORKS.filter((n) => addresses[addrKey(coin, n)]).length}/
                    {NETWORKS.length} configured
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {NETWORKS.map((network) => {
                    const k = addrKey(coin, network);
                    const saved = addresses[k] ?? "";
                    const value = drafts[k] ?? saved;
                    const dirty = value.trim() !== saved;
                    return (
                      <div key={k} className="flex flex-col gap-1.5">
                        <span className="text-xs font-medium text-muted-foreground">
                          {network}
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            spellCheck={false}
                            placeholder={`${coin} address on ${network}`}
                            className={`${inputCls} font-mono text-xs`}
                            value={value}
                            onChange={(e) =>
                              setDrafts((prev) => ({ ...prev, [k]: e.target.value }))
                            }
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={!saved}
                            onClick={() => copyText(saved)}
                            aria-label={`Copy ${coin} ${network} address`}
                          >
                            <Copy className="size-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant={dirty ? "primary" : "outline"}
                            disabled={!dirty}
                            onClick={() => saveAddress(coin, network)}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-background p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">Deposit records</h2>
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
              <SearchInput value={query} onChange={setQuery} placeholder="Search users, IDs, hashes…" />
              <Button size="md" variant="outline" onClick={confirmAllPending}>
                Confirm all pending
              </Button>
            </div>
          </div>

          <div className="mt-4">
            <Table
              data={filtered}
              columns={columns}
              getRowId={(d) => d.id}
              height={520}
              rowHeight={60}
              className="rounded-xl"
              emptyState={
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">No deposits found</p>
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