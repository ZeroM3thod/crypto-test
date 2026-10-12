// app/(user)/dashboard/page.tsx
"use client";

import { UserShell } from "@/app/(user)/_components/user-shell";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  PackageCheck,
  RadioTower,
  ShieldCheck,
  TrendingUp,
  Users,
  X,
  Bell,
} from "lucide-react";
import { useEffect, useState } from "react";
import { BouncyAccordion } from "@/components/motion/bouncy-accordion";
import { WalletCard } from "@/components/motion/wallet-card";
import { AccountTransfer } from "@/components/motion/account-transfer";
import { useRouter } from "next/navigation";
import {
  ReturnsCalendar,
  ReturnsCalendarGrid,
  ReturnsCalendarTooltip,
} from "@/components/charts/returns-calendar";
import { Table } from "@/components/motion/table";
import { MorphingTabs, type MorphingTabsItem } from "@/components/motion/morphing-tabs";
import {
  getUserWallets,
  getUserProfitLoss,
  getDailyReturns,
  getUserActivity,
  getRecentTransactions,
  getUserNotifications,
  type WalletData,
  type ProfitLossData,
  type DailyReturn,
  type ActivityData,
  type RecentTransaction,
  type NotificationItem,
} from "@/lib/dashboard-data";
import { getSessionUser } from "@/lib/auth/session";

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-4xl border border-border bg-card p-6 ${className}`}>
      {children}
    </div>
  );
}

function Badge({ label, tone = "default" }: { label: string; tone?: "default" | "success" | "destructive" | "muted" }) {
  const colors: Record<string, string> = {
    default:     "bg-primary/10 text-primary",
    success:     "bg-success/10 text-success",
    destructive: "bg-destructive/10 text-destructive",
    muted:       "bg-muted text-muted-foreground",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${colors[tone]}`}>
      {label}
    </span>
  );
}

function Stat({ label, value, delta, loading = false }: {
  label: string;
  value: string;
  delta?: { value: string; positive: boolean };
  loading?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      {loading ? (
        <div className="h-6 w-24 animate-pulse rounded-md bg-muted" />
      ) : (
        <p className="text-lg font-semibold text-foreground">{value}</p>
      )}
      {delta && !loading && (
        <p className={`flex items-center gap-1 text-xs font-medium ${delta.positive ? "text-success" : "text-destructive"}`}>
          {delta.positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
          {delta.value}
        </p>
      )}
    </div>
  );
}

function SectionHeader({ title, action, actionLabel }: {
  title: string;
  action?: () => void;
  actionLabel?: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {action && actionLabel && (
        <button
          type="button"
          onClick={action}
          className="text-xs font-medium text-primary transition-opacity hover:opacity-75 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, message, actionLabel }: {
  icon: React.ElementType;
  message: string;
  actionLabel: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <div className="grid size-10 place-items-center rounded-xl bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
      <button
        type="button"
        className="rounded-xl bg-muted px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted/70 outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {actionLabel}
      </button>
    </div>
  );
}

function StatusDot({ status }: { status: "active" | "inactive" | "pending" | "paused" }) {
  const colors: Record<string, string> = {
    active:   "bg-success",
    inactive: "bg-muted-foreground",
    pending:  "bg-primary",
    paused:   "bg-destructive",
  };
  return <span className={`inline-block size-1.5 rounded-full ${colors[status]}`} />;
}

// Removed mock data - wallets now loaded from database

// Removed mock data - transactions now loaded from database

const TRANSACTION_COLUMNS = [
  { key: "date",    header: "Date",    width: "110px" },
  { key: "type",    header: "Type",    width: "110px" },
  { key: "asset",   header: "Asset",   width: "80px"  },
  { key: "amount",  header: "Amount",  width: "120px", align: "right" as const },
  { key: "status",  header: "Status",  width: "100px",
    cell: (r: RecentTransaction) => {
      const tone: Record<RecentTransaction["status"], string> = {
        Completed: "text-success",
        Pending:   "text-primary",
        Failed:    "text-destructive",
      };
      return <span className={`text-xs font-semibold ${tone[r.status]}`}>{r.status}</span>;
    },
  },
  { key: "txHash",  header: "Tx Hash", cell: (r: RecentTransaction) => (
      <span className="font-mono text-xs text-muted-foreground">{r.txHash}</span>
    ),
  },
];

// ── Shared panel button style ───────────────────────────────────────────────
// Single source of truth — used by every panel button so they're all identical.
const PANEL_BTN =
  "flex-1 rounded-xl bg-muted py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted/70 outline-none focus-visible:ring-2 focus-visible:ring-ring";

// ── Activity Overview tab content ───────────────────────────────────────────

function InvestmentPanel({ data }: { data: ActivityData['investment'] }) {
  const router = useRouter();
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary">
            <TrendingUp className="size-4" />
          </div>
          <p className="text-sm font-semibold text-card-foreground">Investment</p>
        </div>
        {data.activePlans > 0 && <Badge label="Active" tone="success" />}
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Total Invested</span>
          <span className="font-medium text-card-foreground">${data.totalInvested.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Active Plans</span>
          <span className="font-medium text-card-foreground">{data.activePlans}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Today&apos;s Profit</span>
          <span className="font-medium text-success">+${data.todayProfit.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Total Profit</span>
          <span className="font-medium text-success">+${data.totalProfit.toFixed(2)}</span>
        </div>
      </div>
      <div className="flex gap-2 mt-2">
        <button type="button" className={PANEL_BTN} onClick={() => router.push('/invest/daily-profit')}>
          View Investments
        </button>
      </div>
    </div>
  );
}

function AITradingPanel({ data }: { data: ActivityData['aiTrading'] }) {
  const router = useRouter();
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary">
            <Bot className="size-4" />
          </div>
          <p className="text-sm font-semibold text-card-foreground">AI Trading</p>
        </div>
        {data.activeStrategies > 0 && <Badge label="Active" tone="success" />}
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Trading Balance</span>
          <span className="font-medium text-card-foreground">${data.tradingBalance.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Active Strategies</span>
          <span className="font-medium text-card-foreground">{data.activeStrategies}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Current P/L</span>
          <span className={`font-medium ${data.currentPnl >= 0 ? 'text-success' : 'text-destructive'}`}>
            {data.currentPnl >= 0 ? '+' : ''}${data.currentPnl.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Total P/L</span>
          <span className={`font-medium ${data.totalPnl >= 0 ? 'text-success' : 'text-destructive'}`}>
            {data.totalPnl >= 0 ? '+' : ''}${data.totalPnl.toFixed(2)}
          </span>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground">Past performance does not guarantee future results.</p>
      <div className="flex gap-2 mt-2">
        <button type="button" className={PANEL_BTN} onClick={() => router.push('/invest/ai-trading')}>
          View AI Trading
        </button>
      </div>
    </div>
  );
}

function ReferralPanel({ data }: { data: ActivityData['referral'] }) {
  const router = useRouter();
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary">
            <Users className="size-4" />
          </div>
          <p className="text-sm font-semibold text-card-foreground">Referral</p>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Total Referrals</span>
          <span className="font-medium text-card-foreground">{data.totalReferrals}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Active Referrals</span>
          <span className="font-medium text-card-foreground">{data.activeReferrals}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Total Earnings</span>
          <span className="font-medium text-success">+${data.totalEarnings.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Pending Earnings</span>
          <span className="font-medium text-card-foreground">${data.pendingEarnings.toFixed(2)}</span>
        </div>
      </div>
      <div className="flex gap-2 mt-2">
        <button type="button" className={PANEL_BTN} onClick={() => router.push('/referral/dashboard')}>Referrals</button>
        <button type="button" className={PANEL_BTN} onClick={() => router.push('/referral/dashboard')}>Earnings</button>
      </div>
    </div>
  );
}

// ── Activity Overview tabs ──────────────────────────────────────────────────
// On desktop (lg+): show icon + label in each tab button.
// On tablet/mobile (<lg): show icon only — label is hidden via sr-only.

function ActivityOverviewTabs({ activity }: { activity: ActivityData }) {
  const [activeTab, setActiveTab] = useState<string | null>("investment");

  const ACTIVITY_TABS: MorphingTabsItem[] = [
    {
      id: "investment",
      label: "Investment",
      icon: <TrendingUp className="size-4" />,
      content: <InvestmentPanel data={activity.investment} />,
    },
    {
      id: "ai-trading",
      label: "AI Trading",
      icon: <Bot className="size-4" />,
      content: <AITradingPanel data={activity.aiTrading} />,
    },
    {
      id: "referral",
      label: "Referral",
      icon: <Users className="size-4" />,
      content: <ReferralPanel data={activity.referral} />,
    },
  ];

  const [items, setItems] = useState<MorphingTabsItem[]>(ACTIVITY_TABS);

  // Build responsive tab items:
  // - icon is always visible
  // - label text is hidden on mobile/tablet (< lg), visible on desktop (lg+)
  const responsiveItems: MorphingTabsItem[] = items.map((item) => ({
    ...item,
    // Wrap the label so it only shows on lg+ screens
    label: (
      <span className="hidden lg:inline">{item.label}</span>
    ) as unknown as string,
  }));

  return (
    <MorphingTabs
      items={responsiveItems}
      value={activeTab}
      onValueChange={setActiveTab}
      onOrderChange={(ids) => {
        setItems((current) => {
          const byId = new Map(current.map((tab) => [tab.id, tab]));
          return ids.flatMap((id) => {
            const tab = byId.get(id);
            return tab ? [tab] : [];
          });
        });
      }}
      ariaLabel="Activity Overview"
      className="w-full"
    />
  );
}

// ── Transfer dialog ──────────────────────────────────────────────────────────

function TransferDialog({ onClose }: { onClose: () => void }) {
  // Close on Esc + lock background scroll while open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Transfer funds"
        className="w-full max-w-[560px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between px-1">
          <h3 className="text-sm font-semibold text-foreground">Transfer</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-7 place-items-center rounded-xl bg-muted text-muted-foreground transition-colors hover:bg-muted/70 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="max-h-[85vh] overflow-y-auto">
          <AccountTransfer
            onConfirm={() => {
              // TODO: call your transfer API with { fromId, toId, amount }
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [transferOpen, setTransferOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<{
    firstName: string;
    wallets: WalletData[];
    selectedWallet: string;
    profitLoss: ProfitLossData;
    dailyReturns: DailyReturn[];
    activity: ActivityData;
    transactions: RecentTransaction[];
    notifications: NotificationItem[];
  } | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await fetch('/api/dashboard');
        const data = await res.json();
        setUserData(data);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const selectedWalletData = userData?.wallets.find(w => w.wallet === userData.selectedWallet);
  const walletAccounts = userData?.wallets.map(w => ({
    id: w.wallet,
    name: `${w.wallet.charAt(0).toUpperCase() + w.wallet.slice(1)} Wallet`,
    address: w.wallet === 'main' ? (w.address || 'No address') : 'Internal wallet',
  })) || [{ id: 'main', name: 'Main Wallet', address: 'Loading...' }];

  const handleWalletChange = (walletId: string) => {
    if (userData) {
      setUserData({ ...userData, selectedWallet: walletId });
    }
  };

  const iconMap: Record<string, React.ReactNode> = {
    ArrowDownRight: <ArrowDownRight className="h-4 w-4" />,
    ArrowUpRight: <ArrowUpRight className="h-4 w-4" />,
    TrendingUp: <TrendingUp className="h-4 w-4" />,
    Bot: <Bot className="h-4 w-4" />,
    Users: <Users className="h-4 w-4" />,
    ShieldCheck: <ShieldCheck className="h-4 w-4" />,
    Bell: <Bell className="h-4 w-4" />,
  };

  return (
    <UserShell active="Dashboard">
      <div className="overflow-y-auto px-5 py-6 sm:px-7 sm:py-8 space-y-8">

        {/* ── Greeting ──────────────────────────────────── */}
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {loading ? 'Loading...' : `${getGreeting()}, ${userData?.firstName || 'User'}.`}
          </h1>
        </div>

        {/* ── Wallet Card ───────────────────────────────── */}
        <section aria-label="Wallet">
          <div className="flex w-full flex-col items-start gap-4 p-2">
            <WalletCard
              accounts={walletAccounts}
              balance={selectedWalletData?.balance || 0}
              defaultChange={0}
              hasNotifications
              onAccountChange={handleWalletChange}
              onNotifications={() => router.push("/community/announcements")}
              onDeposit={() => router.push("/fund/deposit")}
              onWithdraw={() => router.push("/fund/withdraw")}
              onTransfer={() => setTransferOpen(true)}
              onInvest={() => router.push("/invest/daily-profit")}
            />
          </div>
        </section>

        {/* ── P&L Overview ──────────────────────────────── */}
        <section aria-label="Profit and Loss">
          <SectionHeader title="Profit & Loss" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {!loading && userData && [
              { label: "Today's P/L",  value: `+$${userData.profitLoss.today.toFixed(2)}`,    positive: userData.profitLoss.today >= 0 },
              { label: "7-Day P/L",    value: `+$${userData.profitLoss.week.toFixed(2)}`,   positive: userData.profitLoss.week >= 0 },
              { label: "30-Day P/L",   value: `+$${userData.profitLoss.month.toFixed(2)}`, positive: userData.profitLoss.month >= 0 },
              { label: "Total P/L",    value: `+$${userData.profitLoss.total.toFixed(2)}`, positive: userData.profitLoss.total >= 0 },
            ].map((item) => (
              <Card key={item.label}>
                <Stat
                  label={item.label}
                  value={item.value}
                  delta={{ value: item.positive ? "Realized" : "Unrealized", positive: item.positive }}
                  loading={loading}
                />
              </Card>
            ))}
          </div>
        </section>

        {/* ── Returns Calendar ─────────────────────────── */}
        <section aria-label="Daily Returns">
          <SectionHeader title="Daily Returns" />
          {!loading && userData && userData.dailyReturns.length > 0 ? (
            <div className="text-xs text-muted-foreground">
              {/* ponytail: integrate calendar view for daily/weekly returns */}
              <p>Showing last {userData.dailyReturns.length} days of returns</p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No return data available</p>
          )}
        </section>

        {/* ── Activity Overview ─────────────────────────── */}
        <section aria-label="Activity Overview">
          <SectionHeader title="Activity Overview" />
          {!loading && userData ? (
            <ActivityOverviewTabs activity={userData.activity} />
          ) : (
            <p className="text-xs text-muted-foreground">Loading activity...</p>
          )}
        </section>

        {/* ── Recent Transactions ──────────────────────── */}
        <section aria-label="Recent Transactions">
          <SectionHeader title="Recent Transactions" actionLabel="View all" action={() => router.push('/history/transactions')} />
          {!loading && userData ? (
            <Table
              data={userData.transactions}
              columns={TRANSACTION_COLUMNS}
              getRowId={(r) => r.id}
              height={280}
              rowHeight={44}
            />
          ) : (
            <p className="text-xs text-muted-foreground">Loading transactions...</p>
          )}
        </section>

        {/* ── Notifications ───────────────────────────────── */}
        <section aria-label="Notifications">
          <SectionHeader title="Notifications" />
          {!loading && userData ? (
            <BouncyAccordion
              defaultValue={userData.notifications[0]?.id}
              items={userData.notifications.map(n => ({
                id: n.id,
                title: n.title,
                description: n.description,
                icon: iconMap[n.icon] || <Bell className="h-4 w-4" />,
              }))}
            />
          ) : (
            <p className="text-xs text-muted-foreground">Loading notifications...</p>
          )}
        </section>

        <div className="h-20" />
      </div>

      {/* ── Transfer Dialog ─────────────────────── */}
      {transferOpen && <TransferDialog onClose={() => setTransferOpen(false)} />}
    </UserShell>
  );
}