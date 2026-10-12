// app/(admin)/_components/history-view.tsx
"use client";

import { ArrowDownToLine, ArrowUpFromLine, Coins, ListChecks } from "lucide-react";
import { useMemo, useState } from "react";
import { Table, type TableColumn } from "@/components/motion/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/motion/tabs";
import type { HistoryItem } from "@/lib/admin-finance-data";
import {
  PageHeader,
  SearchInput,
  StatCard,
  StatusBadge,
  usd,
} from "./finance-ui";

type Filter = "all" | "Deposit" | "Withdraw" | "Send Money";

const columns: TableColumn<HistoryItem>[] = [
  { key: "id", header: "ID", width: "110px" },
  {
    key: "user",
    header: "User",
    sortable: true,
    width: "1.4fr",
    cell: (r) => (
      <div className="min-w-0">
        <p className="truncate font-medium">{r.user}</p>
        <p className="truncate text-xs text-muted-foreground">{r.email}</p>
      </div>
    ),
  },
  { key: "type", header: "Type", sortable: true, width: "130px" },
  {
    key: "amount",
    header: "Amount",
    sortable: true,
    align: "right",
    width: "110px",
    cell: (r) => <span className="tabular-nums">{usd(r.amount)}</span>,
  },
  {
    key: "fee",
    header: "Fee",
    sortable: true,
    align: "right",
    width: "90px",
    cell: (r) => <span className="tabular-nums">{usd(r.fee)}</span>,
  },
  {
    key: "status",
    header: "Status",
    width: "130px",
    cell: (r) => <StatusBadge status={r.status} />,
  },
  { key: "date", header: "Date", sortable: true, width: "150px" },
];

export function HistoryView({ items }: { items: HistoryItem[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const stats = useMemo(() => {
    const done = items.filter((i) => i.status === "completed");
    const sum = (t: string) =>
      done.filter((i) => i.type === t).reduce((a, i) => a + i.amount, 0);
    return {
      total: items.length,
      moneyIn: sum("Deposit"),
      moneyOut: sum("Withdraw"),
      fees: done.filter((i) => i.type === "Send Money").reduce((a, i) => a + i.fee, 0),
    };
  }, [items]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (i) =>
        (filter === "all" || i.type === filter) &&
        (!q ||
          [i.id, i.user, i.email, i.type].some((v) =>
            v.toLowerCase().includes(q),
          )),
    );
  }, [items, filter, query]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title="History"
        description="Every deposit, withdrawal and transfer on the platform."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total transactions"
          value={stats.total}
          icon={ListChecks}
        />
        <StatCard
          label="Money in (completed)"
          value={stats.moneyIn}
          format={(n) => usd(Math.round(n))}
          icon={ArrowDownToLine}
        />
        <StatCard
          label="Money out (completed)"
          value={stats.moneyOut}
          format={(n) => usd(Math.round(n))}
          icon={ArrowUpFromLine}
        />
        <StatCard
          label="Fees collected"
          value={stats.fees}
          format={usd}
          icon={Coins}
          positive
        />
      </div>

      <section className="rounded-2xl border border-border bg-background p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <Tabs
            value={filter}
            onValueChange={(v) => setFilter(v as Filter)}
            variant="segment"
          >
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="Deposit">Deposits</TabsTrigger>
              <TabsTrigger value="Withdraw">Withdraws</TabsTrigger>
              <TabsTrigger value="Send Money">Send Money</TabsTrigger>
            </TabsList>
          </Tabs>
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search user, ID, email…"
          />
        </div>

        <div className="mt-4">
          <Table
            data={visible}
            columns={columns}
            getRowId={(r) => r.id}
            defaultSort={{ key: "date", direction: "desc" }}
            height={520}
            rowHeight={60}
            className="rounded-xl"
            emptyState={
              <span className="text-sm text-muted-foreground">
                No transactions found
              </span>
            }
          />
        </div>
      </section>
    </div>
  );
}
