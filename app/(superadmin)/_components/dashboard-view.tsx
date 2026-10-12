// app/(superadmin)/_components/dashboard-view.tsx
"use client";

import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Clock,
  Coins,
  Percent,
  Send,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { AnimatedBadge } from "@/components/motion/animated-badge";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { Table, type TableColumn } from "@/components/motion/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/motion/tabs";
import type {
  AdminUser,
  DashboardData,
  Period,
  Txn,
} from "@/lib/admin-dashboard-data";

const usd = (n: number) =>
  `$${n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const PERIOD_LABEL: Record<Period, string> = {
  today: "Today",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  all: "All time",
};

/* ---------- Stat card ---------- */

function StatCard({
  label,
  value,
  format,
  icon: Icon,
  hint,
  positive,
}: {
  label: string;
  value: number;
  format?: (n: number) => string;
  icon: LucideIcon;
  hint?: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <span className="grid size-8 place-items-center rounded-lg bg-muted text-foreground">
          <Icon aria-hidden="true" className="size-4" />
        </span>
      </div>
      <div
        className={
          positive
            ? "mt-3 text-2xl font-semibold tracking-tight tabular-nums text-(--color-success)"
            : "mt-3 text-2xl font-semibold tracking-tight tabular-nums text-foreground"
        }
      >
        <AnimatedNumber
          value={value}
          format={format ?? ((n) => Math.round(n).toLocaleString())}
        />
      </div>
      {hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

/* ---------- Profit bar row ---------- */

function ProfitRow({
  label,
  value,
  total,
  meta,
}: {
  label: string;
  value: number;
  total: number;
  meta: string;
}) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="tabular-nums text-foreground">
          {usd(value)}{" "}
          <span className="text-xs text-muted-foreground">
            ({pct.toFixed(1)}%)
          </span>
        </span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-foreground transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{meta}</p>
    </div>
  );
}

/* ---------- Table columns ---------- */

const TXN_STATUS = {
  completed: "success",
  pending: "warning",
  failed: "danger",
} as const;

const USER_STATUS = {
  verified: "success",
  pending: "warning",
  blocked: "danger",
} as const;

const txnColumns: TableColumn<Txn>[] = [
  { key: "id", header: "ID", width: "110px" },
  {
    key: "user",
    header: "User",
    width: "1.2fr",
    cell: (r) => <span className="font-medium">{r.user}</span>,
  },
  { key: "type", header: "Type", sortable: true, width: "130px" },
  {
    key: "amount",
    header: "Amount",
    sortable: true,
    align: "right",
    width: "120px",
    cell: (r) => <span className="tabular-nums">{usd(r.amount)}</span>,
  },
  {
    key: "fee",
    header: "Fee",
    align: "right",
    width: "90px",
    cell: (r) => <span className="tabular-nums">{usd(r.fee)}</span>,
  },
  {
    key: "status",
    header: "Status",
    width: "130px",
    cell: (r) => (
      <AnimatedBadge status={TXN_STATUS[r.status]} size="sm">
        <span className="capitalize">{r.status}</span>
      </AnimatedBadge>
    ),
  },
  { key: "date", header: "Date", width: "130px" },
];

const userColumns: TableColumn<AdminUser>[] = [
  { key: "id", header: "ID", width: "100px" },
  {
    key: "name",
    header: "Name",
    sortable: true,
    width: "1fr",
    cell: (r) => <span className="font-medium">{r.name}</span>,
  },
  { key: "email", header: "Email", width: "1.3fr" },
  {
    key: "balance",
    header: "Balance",
    sortable: true,
    align: "right",
    width: "120px",
    cell: (r) => <span className="tabular-nums">{usd(r.balance)}</span>,
  },
  {
    key: "status",
    header: "KYC",
    width: "130px",
    cell: (r) => (
      <AnimatedBadge status={USER_STATUS[r.status]} size="sm">
        <span className="capitalize">{r.status}</span>
      </AnimatedBadge>
    ),
  },
  { key: "joined", header: "Joined", width: "130px" },
];

/* ---------- Main view ---------- */

export function DashboardView({ data }: { data: DashboardData }) {
  const [period, setPeriod] = useState<Period>("30d");
  const p = data.periods[period];

  const totalProfit = useMemo(
    () =>
      p.manualTradingProfit + p.sendMoneyFeeProfit + p.withdrawalFeeProfit,
    [p],
  );

  return (
    <div className="flex flex-1 flex-col gap-8 p-4 sm:p-6">
      {/* Header + period filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Admin Panel
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Platform overview · {PERIOD_LABEL[period]}
          </p>
        </div>
        <Tabs
          value={period}
          onValueChange={(v) => setPeriod(v as Period)}
          variant="segment"
        >
          <TabsList>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="7d">7 days</TabsTrigger>
            <TabsTrigger value="30d">30 days</TabsTrigger>
            <TabsTrigger value="all">All time</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Platform totals (always all-time) */}
      <section className="flex flex-col gap-3">
        <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Platform totals
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total users"
            value={data.totalUsers}
            icon={Users}
            hint={`${data.activeUsers.toLocaleString()} active now`}
          />
          <StatCard
            label="Total deposit"
            value={data.totalDeposit}
            format={(n) => usd(Math.round(n))}
            icon={ArrowDownToLine}
            hint="All time"
          />
          <StatCard
            label="Total withdraw"
            value={data.totalWithdraw}
            format={(n) => usd(Math.round(n))}
            icon={ArrowUpFromLine}
            hint="All time"
          />
          <StatCard
            label="Current funding available"
            value={data.fundingAvailable}
            format={(n) => usd(Math.round(n))}
            icon={Wallet}
            hint="Total deposit − total withdraw"
          />
        </div>
      </section>

      {/* Period activity */}
      <section className="flex flex-col gap-3">
        <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Activity · {PERIOD_LABEL[period]}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="New users"
            value={p.newUsers}
            icon={Users}
          />
          <StatCard
            label="Deposits"
            value={p.deposit}
            format={(n) => usd(Math.round(n))}
            icon={ArrowDownToLine}
          />
          <StatCard
            label="Withdrawals"
            value={p.withdraw}
            format={(n) => usd(Math.round(n))}
            icon={ArrowUpFromLine}
            hint={`${p.withdrawCount.toLocaleString()} requests`}
          />
          <StatCard
            label="Pending withdrawals"
            value={data.pendingWithdrawals}
            icon={Clock}
            hint={`${data.pendingKyc} KYC reviews waiting`}
          />
        </div>
      </section>

      {/* Profit */}
      <section className="flex flex-col gap-3">
        <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Profit · {PERIOD_LABEL[period]}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Profit from manual trading"
            value={p.manualTradingProfit}
            format={(n) => usd(Math.round(n))}
            icon={TrendingUp}
            hint={`${p.tradesCount.toLocaleString()} trades`}
            positive
          />
          <StatCard
            label="Profit from send money fee"
            value={p.sendMoneyFeeProfit}
            format={usd}
            icon={Send}
            hint={`${p.sendCount.toLocaleString()} transfers`}
            positive
          />
          <StatCard
            label="Profit from withdrawal fee"
            value={p.withdrawalFeeProfit}
            format={usd}
            icon={Percent}
            hint={`${p.withdrawCount.toLocaleString()} withdrawals`}
            positive
          />
          <StatCard
            label="Total profit"
            value={totalProfit}
            format={usd}
            icon={Coins}
            hint="All three sources combined"
            positive
          />
        </div>

        <div className="rounded-2xl border border-border bg-background p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck
              aria-hidden="true"
              className="size-4 text-muted-foreground"
            />
            <h3 className="text-sm font-semibold text-foreground">
              Profit breakdown
            </h3>
          </div>
          <div className="mt-5 grid gap-6 md:grid-cols-3">
            <ProfitRow
              label="Manual trading"
              value={p.manualTradingProfit}
              total={totalProfit}
              meta={`${p.tradesCount.toLocaleString()} trades`}
            />
            <ProfitRow
              label="Send money fee"
              value={p.sendMoneyFeeProfit}
              total={totalProfit}
              meta={`${p.sendCount.toLocaleString()} transfers`}
            />
            <ProfitRow
              label="Withdrawal fee"
              value={p.withdrawalFeeProfit}
              total={totalProfit}
              meta={`${p.withdrawCount.toLocaleString()} withdrawals`}
            />
          </div>
        </div>
      </section>

      {/* Tables */}
      <section className="rounded-2xl border border-border bg-background p-5">
        <Tabs defaultValue="transactions" variant="underline">
          <TabsList>
            <TabsTrigger value="transactions">Recent transactions</TabsTrigger>
            <TabsTrigger value="users">Newest users</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="mt-4">
            <Table
              data={data.transactions}
              columns={txnColumns}
              getRowId={(r) => r.id}
              height={420}
              rowHeight={52}
              className="rounded-xl"
            />
          </TabsContent>

          <TabsContent value="users" className="mt-4">
            <Table
              data={data.users}
              columns={userColumns}
              getRowId={(r) => r.id}
              height={360}
              rowHeight={52}
              className="rounded-xl"
            />
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
