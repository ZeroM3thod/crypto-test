// app/(admin)/_components/deposits-view.tsx
"use client";

import {
  ArrowDownToLine,
  CheckCircle2,
  Clock,
  Download,
  ListChecks,
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

export function DepositsView({ initial }: { initial: Deposit[] }) {
  const { toast, showToast } = useToast();
  const [rows, setRows] = useState(initial);
  const [chip, setChip] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [mode, setMode] = useState<ModalMode>(null);
  const [modalId, setModalId] = useState("");

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
        width: "90px",
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
        width: "230px",
        cell: (d) =>
          d.status === "pending" ? (
            <div className="flex justify-end gap-1.5">
              <Button size="sm" variant="outline" onClick={() => openReject(d.id)}>
                Reject
              </Button>
              <Button size="sm" variant="ghost" onClick={() => openView(d.id)}>
                View
              </Button>
              <Button size="sm" variant="primary" onClick={() => openView(d.id)}>
                Confirm
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => openView(d.id)}>
              Details
            </Button>
          ),
      },
    ],
    [copyText, doConfirm, openReject, openView],
  );

  const current = rows.find((d) => d.id === modalId);

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
