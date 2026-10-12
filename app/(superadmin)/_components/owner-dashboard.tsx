// app/(superadmin)/_components/owner-dashboard.tsx
"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Banknote,
  CandlestickChart,
  ChevronRight,
  HeadsetIcon,
  Info,
  Landmark,
  Percent,
  Send,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import {
  AnimatedBadge,
  type AnimatedBadgeStatus,
} from "@/components/motion/animated-badge";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { NumberTicker } from "@/components/motion/number-ticker";
import { Tabs, TabsList, TabsTrigger } from "@/components/motion/tabs";
import { Tooltip } from "@/components/motion/tooltip";
import {
  CompositionChart,
  CompositionChartLegend,
  CompositionChartPlot,
  type CompositionChartSeries,
} from "@/components/charts/composition-chart";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Formatting (fixed "en-US" so server and browser render the same text)      */
/* -------------------------------------------------------------------------- */

const CURRENCY = "USD";
const SYMBOL = "$";

const moneyFmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: CURRENCY,
  maximumFractionDigits: 0,
});
const money2Fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: CURRENCY,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const money = (n: number) => moneyFmt.format(n);
const money2 = (n: number) => money2Fmt.format(n);
const int = (n: number) => n.toLocaleString("en-US");

/* -------------------------------------------------------------------------- */
/*  MOCK DATA: replace with real data from your API / database                 */
/* -------------------------------------------------------------------------- */

type Period = "today" | "7d" | "30d" | "all";

const PERIODS: { value: Period; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "all", label: "All Time" },
];

type FlowKey =
  | "deposit"
  | "withdraw"
  | "manualTradingProfit"
  | "sendFeeProfit"
  | "withdrawFeeProfit"
  | "aiTradingProfit"
  | "cloudMiningProfit";

type Flow = Record<FlowKey, number>;

interface PeriodData {
  newUsers: number;
  flow: Flow;
  /** % change versus the previous period of the same length. Omit for all-time. */
  change?: Partial<Record<FlowKey | "totalProfit", number>>;
}

const PERIOD_DATA: Record<Period, PeriodData> = {
  today: {
    newUsers: 42,
    flow: {
      deposit: 14200,
      withdraw: 9350,
      manualTradingProfit: 1020,
      sendFeeProfit: 142,
      withdrawFeeProfit: 231,
      aiTradingProfit: 540,
      cloudMiningProfit: 210,
    },
    change: {
      deposit: 6.4,
      withdraw: 3.1,
      manualTradingProfit: 9.8,
      sendFeeProfit: 2.2,
      withdrawFeeProfit: 3.4,
      aiTradingProfit: 4.7,
      cloudMiningProfit: 1.1,
      totalProfit: 6.2,
    },
  },
  "7d": {
    newUsers: 296,
    flow: {
      deposit: 98400,
      withdraw: 64900,
      manualTradingProfit: 7310,
      sendFeeProfit: 980,
      withdrawFeeProfit: 1650,
      aiTradingProfit: 3700,
      cloudMiningProfit: 1450,
    },
    change: {
      deposit: 8.9,
      withdraw: 5.2,
      manualTradingProfit: 12.4,
      sendFeeProfit: 4.8,
      withdrawFeeProfit: 5.6,
      aiTradingProfit: 7.3,
      cloudMiningProfit: 2.4,
      totalProfit: 9.1,
    },
  },
  "30d": {
    newUsers: 1240,
    flow: {
      deposit: 412800,
      withdraw: 286300,
      manualTradingProfit: 31240,
      sendFeeProfit: 4120,
      withdrawFeeProfit: 7340,
      aiTradingProfit: 15900,
      cloudMiningProfit: 6200,
    },
    change: {
      deposit: 1.9,
      withdraw: 2.6,
      manualTradingProfit: 2.7,
      sendFeeProfit: 3.0,
      withdrawFeeProfit: 3.4,
      aiTradingProfit: 4.6,
      cloudMiningProfit: 3.4,
      totalProfit: 3.3,
    },
  },
  all: {
    newUsers: 12480,
    flow: {
      deposit: 2845300,
      withdraw: 1912450,
      manualTradingProfit: 184620,
      sendFeeProfit: 26840,
      withdrawFeeProfit: 47910,
      aiTradingProfit: 92300,
      cloudMiningProfit: 38150,
    },
  },
};

/** Numbers that are not tied to the period selector. */
const SNAPSHOT = {
  totalUsers: 12480,
  activeUsers: 3920,
  /** Liquid money the platform can pay out right now. */
  availableFunding: 486250,
  activeInvestments: 731400,
  referralPaid: 58200,
};

const WALLETS = [
  { label: "Main Wallets", amount: 214500, color: "#6366f1" },
  { label: "Investment Wallets", amount: 731400, color: "#10b981" },
  { label: "Trading Wallets", amount: 158900, color: "#f59e0b" },
  { label: "Mining Wallets", amount: 64300, color: "#06b6d4" },
  { label: "Referral Wallets", amount: 23750, color: "#ec4899" },
];

const QUEUE: {
  label: string;
  count: number;
  detail: string;
  href: string;
  icon: LucideIcon;
  status: AnimatedBadgeStatus;
}[] = [
  {
    label: "Pending deposits",
    count: 18,
    detail: money(12450),
    href: "/owner/finance/deposits",
    icon: ArrowDownToLine,
    status: "warning",
  },
  {
    label: "Pending withdrawals",
    count: 26,
    detail: money(31820),
    href: "/owner/finance/withdrawals",
    icon: ArrowUpFromLine,
    status: "warning",
  },
  {
    label: "Open tickets",
    count: 14,
    detail: "Need a reply",
    href: "/owner/support/tickets",
    icon: HeadsetIcon,
    status: "danger",
  },
];

/* Six months of profit by source (bar/area composition chart). */
const CHART_MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep"];

const PROFIT_SERIES: CompositionChartSeries[] = [
  { id: "manual", name: "Manual trading", color: "#6366f1", values: [21400, 24800, 26100, 28900, 30400, 31240] },
  { id: "send", name: "Send fee", color: "#10b981", values: [2900, 3300, 3600, 3900, 4000, 4120] },
  { id: "withdraw", name: "Withdrawal fee", color: "#f59e0b", values: [5200, 5800, 6300, 6900, 7100, 7340] },
  { id: "ai", name: "AI trading", color: "#ec4899", values: [11200, 12800, 13500, 14700, 15200, 15900] },
  { id: "mining", name: "Cloud mining", color: "#06b6d4", values: [4100, 4600, 5100, 5600, 6000, 6200] },
];

const FLOW_SERIES: CompositionChartSeries[] = [
  { id: "deposits", name: "Deposits", color: "#10b981", values: [301000, 338000, 365000, 391000, 405000, 412800] },
  { id: "withdrawals", name: "Withdrawals", color: "#f59e0b", values: [204000, 229000, 251000, 268000, 279000, 286300] },
  { id: "sends", name: "Send money", color: "#6366f1", values: [118000, 131000, 142000, 150000, 157000, 162500] },
];

type TxType = "deposit" | "withdraw" | "send";
type TxStatus = "completed" | "pending" | "processing" | "failed";
type TxFilter = "all" | TxType;

interface Transaction {
  id: string;
  user: string;
  type: TxType;
  amount: number;
  fee: number;
  status: TxStatus;
  time: string;
}

const TRANSACTIONS: Transaction[] = [
  { id: "TX-90412", user: "Imran Khan", type: "deposit", amount: 1500, fee: 0, status: "completed", time: "2 min ago" },
  { id: "TX-90411", user: "Sadia Rahman", type: "withdraw", amount: 800, fee: 16, status: "pending", time: "9 min ago" },
  { id: "TX-90410", user: "Tanvir Ahmed", type: "send", amount: 250, fee: 2.5, status: "completed", time: "14 min ago" },
  { id: "TX-90409", user: "Nusrat Jahan", type: "withdraw", amount: 2200, fee: 44, status: "processing", time: "21 min ago" },
  { id: "TX-90408", user: "Rafi Hossain", type: "deposit", amount: 500, fee: 0, status: "failed", time: "33 min ago" },
  { id: "TX-90407", user: "Mim Akter", type: "send", amount: 120, fee: 1.2, status: "completed", time: "48 min ago" },
  { id: "TX-90406", user: "Kamal Uddin", type: "deposit", amount: 3200, fee: 0, status: "completed", time: "1 hr ago" },
  { id: "TX-90405", user: "Farhana Islam", type: "withdraw", amount: 950, fee: 19, status: "completed", time: "1 hr ago" },
];

const TX_TYPE_META: Record<TxType, { label: string; icon: LucideIcon }> = {
  deposit: { label: "Deposit", icon: ArrowDownToLine },
  withdraw: { label: "Withdraw", icon: ArrowUpFromLine },
  send: { label: "Send", icon: Send },
};

const TX_STATUS_META: Record<TxStatus, { label: string; status: AnimatedBadgeStatus }> = {
  completed: { label: "Completed", status: "success" },
  pending: { label: "Pending", status: "warning" },
  processing: { label: "Processing", status: "loading" },
  failed: { label: "Failed", status: "danger" },
};

/* -------------------------------------------------------------------------- */
/*  Small building blocks                                                      */
/* -------------------------------------------------------------------------- */

function Card({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "min-w-0 rounded-xl border border-border bg-card p-4 md:p-5",
        className,
      )}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

interface StatCardProps {
  label: string;
  icon: LucideIcon;
  value: number;
  /** Shown in the (i) tooltip. Explain how the number is calculated. */
  hint: string;
  prefix?: string;
  /** % change vs previous period. Leave undefined to hide the badge. */
  delta?: number;
  /** false = an increase is shown as a warning (e.g. withdrawals). */
  upIsGood?: boolean;
  footnote?: string;
  emphasis?: boolean;
}

function StatCard({
  label,
  icon: Icon,
  value,
  hint,
  prefix = SYMBOL,
  delta,
  upIsGood = true,
  footnote,
  emphasis = false,
}: StatCardProps) {
  const status: AnimatedBadgeStatus =
    delta === undefined || delta === 0
      ? "neutral"
      : delta > 0 === upIsGood
        ? "success"
        : "warning";

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4",
        emphasis ? "border-primary/40" : "border-border",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5 text-sm text-muted-foreground">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-foreground">
            <Icon aria-hidden="true" className="size-4" />
          </span>
          <span className="truncate">{label}</span>
        </div>
        <Tooltip content={hint} side="top" className="max-w-56">
          <button
            type="button"
            aria-label={`About ${label}`}
            className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Info aria-hidden="true" className="size-4" />
          </button>
        </Tooltip>
      </div>

      <div className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
        <NumberTicker value={value} prefix={prefix} format={int} />
      </div>

      <div className="mt-3 flex min-h-6 items-center gap-2 text-xs text-muted-foreground">
        {delta !== undefined ? (
          <AnimatedBadge status={status} size="sm" showIcon={false}>
            {`${delta > 0 ? "+" : ""}${delta.toFixed(1)}%`}
          </AnimatedBadge>
        ) : null}
        {footnote ? <span className="truncate">{footnote}</span> : null}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Dashboard                                                                  */
/* -------------------------------------------------------------------------- */

export function OwnerDashboard() {
  const [period, setPeriod] = useState<Period>("all");
  const [profitView, setProfitView] = useState<"bar" | "area">("bar");
  const [txFilter, setTxFilter] = useState<TxFilter>("all");

  const data = PERIOD_DATA[period];
  const { flow, change } = data;
  const vsText = period === "all" ? "Lifetime total" : "vs previous period";

  const totalProfit =
    flow.manualTradingProfit +
    flow.sendFeeProfit +
    flow.withdrawFeeProfit +
    flow.aiTradingProfit +
    flow.cloudMiningProfit;

  const walletTotal = useMemo(
    () => WALLETS.reduce((sum, wallet) => sum + wallet.amount, 0),
    [],
  );

  const visibleTx = useMemo(
    () =>
      txFilter === "all"
        ? TRANSACTIONS
        : TRANSACTIONS.filter((tx) => tx.type === txFilter),
    [txFilter],
  );

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6">
      {/* Heading + period switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Platform overview
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Users, funds and earnings across the whole platform.
          </p>
        </div>
        <Tabs
          value={period}
          onValueChange={(value) => setPeriod(value as Period)}
          variant="segment"
        >
          <TabsList>
            {PERIODS.map(({ value, label }) => (
              <TabsTrigger key={value} value={value}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Core numbers */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Users"
          icon={Users}
          value={SNAPSHOT.totalUsers}
          prefix=""
          hint="All registered accounts on the platform."
          footnote={`${int(data.newUsers)} new · ${int(SNAPSHOT.activeUsers)} active`}
        />
        <StatCard
          label="Total Deposit"
          icon={ArrowDownToLine}
          value={flow.deposit}
          delta={change?.deposit}
          footnote={vsText}
          hint="Approved deposits received in the selected period."
        />
        <StatCard
          label="Total Withdraw"
          icon={ArrowUpFromLine}
          value={flow.withdraw}
          delta={change?.withdraw}
          upIsGood={false}
          footnote={vsText}
          hint="Approved withdrawals paid out in the selected period (before fees)."
        />
        <StatCard
          label="Available Funding"
          icon={Landmark}
          value={SNAPSHOT.availableFunding}
          footnote="Ready to pay out now"
          hint="Liquid platform funds available right now, after pending withdrawals are reserved. This is a live balance, so it ignores the period selector."
        />
        <StatCard
          label="Manual Trading Profit"
          icon={CandlestickChart}
          value={flow.manualTradingProfit}
          delta={change?.manualTradingProfit}
          footnote={vsText}
          hint="Platform profit earned from users' manual trades."
        />
        <StatCard
          label="Send Money Fee Profit"
          icon={Send}
          value={flow.sendFeeProfit}
          delta={change?.sendFeeProfit}
          footnote={vsText}
          hint="Fees collected on user-to-user send money transfers."
        />
        <StatCard
          label="Withdrawal Fee Profit"
          icon={Percent}
          value={flow.withdrawFeeProfit}
          delta={change?.withdrawFeeProfit}
          footnote={vsText}
          hint="Fees collected on withdrawals."
        />
        <StatCard
          label="Total Platform Profit"
          icon={TrendingUp}
          value={totalProfit}
          delta={change?.totalProfit}
          footnote={vsText}
          emphasis
          hint="Manual trading + send fee + withdrawal fee + AI trading + cloud mining."
        />
      </div>

      {/* More numbers */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="AI Trading Profit"
          icon={CandlestickChart}
          value={flow.aiTradingProfit}
          delta={change?.aiTradingProfit}
          footnote={vsText}
          hint="Platform share of profit from AI trading."
        />
        <StatCard
          label="Cloud Mining Profit"
          icon={Banknote}
          value={flow.cloudMiningProfit}
          delta={change?.cloudMiningProfit}
          footnote={vsText}
          hint="Platform profit from cloud mining plans."
        />
        <StatCard
          label="Active Investments"
          icon={Wallet}
          value={SNAPSHOT.activeInvestments}
          footnote="Currently locked in plans"
          hint="Total user money currently invested in active plans."
        />
        <StatCard
          label="Referral Commission Paid"
          icon={Users}
          value={SNAPSHOT.referralPaid}
          footnote="Lifetime payouts"
          hint="Total referral commission credited to users."
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Card
          title="Profit by source"
          description="Share of monthly profit. Hover the chart for exact amounts."
          action={
            <Tabs
              value={profitView}
              onValueChange={(value) => setProfitView(value as "bar" | "area")}
              variant="segment"
            >
              <TabsList className="bg-muted">
                <TabsTrigger value="bar">Bars</TabsTrigger>
                <TabsTrigger value="area">Area</TabsTrigger>
              </TabsList>
            </Tabs>
          }
        >
          <CompositionChart
            series={PROFIT_SERIES}
            periods={CHART_MONTHS}
            view={profitView}
            label="Profit by source over time"
            formatValue={money}
          >
            <div className="grid gap-4">
              <CompositionChartPlot />
              <CompositionChartLegend />
            </div>
          </CompositionChart>
        </Card>

        <Card
          title="Fund flow mix"
          description="Deposits, withdrawals and send money as a share of monthly volume."
        >
          <CompositionChart
            series={FLOW_SERIES}
            periods={CHART_MONTHS}
            view="bar"
            label="Fund flow over time"
            formatValue={money}
          >
            <div className="grid gap-4">
              <CompositionChartPlot />
              <CompositionChartLegend />
            </div>
          </CompositionChart>
        </Card>
      </div>

      {/* Wallet balances + action queue */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Card
          title="User wallet balances"
          description="Money currently held in user wallets."
          action={
            <span className="text-sm font-semibold text-foreground">
              <AnimatedNumber value={walletTotal} format={(n) => money(n)} />
            </span>
          }
        >
          <ul className="space-y-4">
            {WALLETS.map((wallet) => {
              const percent = (wallet.amount / walletTotal) * 100;
              return (
                <li key={wallet.label}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span
                        aria-hidden="true"
                        className="size-2 rounded-full"
                        style={{ backgroundColor: wallet.color }}
                      />
                      {wallet.label}
                    </span>
                    <span className="font-medium tabular-nums text-foreground">
                      <AnimatedNumber
                        value={wallet.amount}
                        format={(n) => money(n)}
                      />
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        {percent.toFixed(1)}%
                      </span>
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-[width] duration-700 ease-out"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: wallet.color,
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card
          title="Needs your attention"
          description="Queues waiting on an admin."
        >
          <ul className="divide-y divide-border">
            {QUEUE.map(({ label, count, detail, href, icon: Icon, status }) => (
              <li key={label}>
                <Link
                  href={href}
                  className="flex items-center gap-3 rounded-lg py-3 outline-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-foreground">
                    <Icon aria-hidden="true" className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {label}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {detail}
                    </span>
                  </span>
                  <AnimatedBadge status={status} size="sm" showIcon={false}>
                    {count}
                  </AnimatedBadge>
                  <ChevronRight
                    aria-hidden="true"
                    className="size-4 shrink-0 text-muted-foreground"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Recent transactions */}
      <Card
        title="Recent transactions"
        description="Latest deposits, withdrawals and transfers."
      >
        <Tabs
          value={txFilter}
          onValueChange={(value) => setTxFilter(value as TxFilter)}
          variant="underline"
        >
          <TabsList wrapperClassName="mb-2">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="deposit">Deposits</TabsTrigger>
            <TabsTrigger value="withdraw">Withdrawals</TabsTrigger>
            <TabsTrigger value="send">Send</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="py-2 pr-4 font-medium">ID</th>
                <th className="py-2 pr-4 font-medium">User</th>
                <th className="py-2 pr-4 font-medium">Type</th>
                <th className="py-2 pr-4 text-right font-medium">Amount</th>
                <th className="py-2 pr-4 text-right font-medium">Fee</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {visibleTx.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-10 text-center text-muted-foreground"
                  >
                    No transactions found.
                  </td>
                </tr>
              ) : (
                visibleTx.map((tx) => {
                  const { label, icon: TypeIcon } = TX_TYPE_META[tx.type];
                  const statusMeta = TX_STATUS_META[tx.status];
                  return (
                    <tr
                      key={tx.id}
                      className="border-b border-border/60 last:border-0"
                    >
                      <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">
                        {tx.id}
                      </td>
                      <td className="py-3 pr-4 font-medium text-foreground">
                        {tx.user}
                      </td>
                      <td className="py-3 pr-4">
                        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                          <TypeIcon aria-hidden="true" className="size-3.5" />
                          {label}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums text-foreground">
                        {money2(tx.amount)}
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums text-muted-foreground">
                        {tx.fee > 0 ? money2(tx.fee) : "—"}
                      </td>
                      <td className="py-3 pr-4">
                        <AnimatedBadge status={statusMeta.status} size="sm">
                          {statusMeta.label}
                        </AnimatedBadge>
                      </td>
                      <td className="py-3 whitespace-nowrap text-muted-foreground">
                        {tx.time}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
