// app/(user)/referral/page.tsx
"use client";

import { UserShell } from "@/app/(user)/_components/user-shell";
import { useState, useEffect } from "react";
import { AnimatePresence, motion, type HTMLMotionProps } from "motion/react";
import {
  Users,
  DollarSign,
  Copy,
  Check,
  Gift,
  Trophy,
  Bot,
  TrendingUp,
  X,
  ChevronRight,
} from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/motion/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/motion/card";
import { NumberTicker } from "@/components/motion/number-ticker";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { SPRING_PANEL, SPRING_PRESS } from "@/lib/ease";
import { cn } from "@/lib/utils";

/* ────────────────────────────────────────────────────────────
   Types
──────────────────────────────────────────────────────────── */

type ProfitSource = "daily" | "aiTrading";
type TabId = "overview" | "milestones" | "commission" | "users";

interface ReferredUser {
  id: string;
  name: string;
  email: string;
  joined: string;
  active: boolean;
  totalDeposited: number;
  commissionEarned: number;
}

interface MilestoneTier {
  id: string;
  requiredActive: number;
  reward: number;
}

interface ReferralData {
  referralCode: string;
  referralLink: string;
  stats: {
    totalReferred: number;
    activeReferred: number;
    totalCommission: number;
    commissionBySource: {
      daily: number;
      aiTrading: number;
    };
  };
  referredUsers: ReferredUser[];
  milestones: MilestoneTier[];
}

const SOURCE_META: Record<
  ProfitSource,
  { label: string; icon: typeof TrendingUp; basis: string; barClass: string; dotClass: string }
> = {
  daily: {
    label: "Daily Profit",
    icon: TrendingUp,
    basis: "5% of profit · lifetime",
    barClass: "bg-foreground",
    dotClass: "bg-foreground",
  },
  aiTrading: {
    label: "AI Trading",
    icon: Bot,
    basis: "5% of profit · lifetime",
    barClass: "bg-foreground/40",
    dotClass: "bg-foreground/40",
  },
};

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "milestones", label: "Milestones" },
  { id: "commission", label: "Commission" },
  { id: "users", label: "Users" },
];

/* ────────────────────────────────────────────────────────────
   Helpers / small UI pieces
──────────────────────────────────────────────────────────── */

const SURFACE = "rounded-4xl border-border bg-card";

/* Local spring-press button */
type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const BUTTON_VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "border border-border bg-card text-foreground hover:border-border",
  ghost: "text-muted-foreground hover:text-foreground hover:bg-muted/60",
  outline: "border border-border bg-transparent text-foreground hover:bg-muted/60",
};

const BUTTON_SIZE: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-full",
  md: "h-10 px-5 text-sm gap-2 rounded-full",
  lg: "h-12 px-6 text-base gap-2 rounded-full",
  icon: "h-8 w-8 rounded-lg",
};

function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: Omit<HTMLMotionProps<"button">, "children"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.95 }}
      transition={SPRING_PRESS}
      className={cn(
        "inline-flex select-none items-center justify-center font-medium transition-colors",
        "disabled:pointer-events-none disabled:opacity-50",
        BUTTON_VARIANT[variant],
        BUTTON_SIZE[size],
        className,
      )}
      {...rest}
    >
      {children}
    </motion.button>
  );
}

const money = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
      {children}
    </span>
  );
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        active ? "bg-foreground/10 text-foreground" : "bg-muted text-muted-foreground",
      )}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <motion.div
        className="h-full rounded-full bg-foreground"
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ type: "spring", stiffness: 120, damping: 22 }}
      />
    </div>
  );
}

/* Circular progress ring (foreground + muted only) */
function Ring({ value, children }: { value: number; children: React.ReactNode }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-32 shrink-0 sm:size-36">
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="10" className="stroke-muted" />
        <motion.circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          className="stroke-foreground"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - value / 100) }}
          transition={{ type: "spring", stiffness: 70, damping: 18 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}

function CopyRow({
  label,
  value,
  copied,
  onCopy,
  compact,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
  compact?: boolean;
}) {
  return (
    <div className="min-w-0">
      <div className="mb-2">
        <Eyebrow>{label}</Eyebrow>
      </div>
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-muted/30 p-2 pl-3 sm:pl-4">
        <span
          className={cn(
            "min-w-0 flex-1 truncate font-mono text-foreground",
            compact ? "text-xs sm:text-sm" : "text-sm font-semibold tracking-wide",
          )}
        >
          {value}
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCopy}
          className={cn(
            "shrink-0",
            copied
              ? "bg-foreground text-background hover:bg-foreground hover:text-background"
              : "bg-muted text-foreground hover:bg-muted/70",
          )}
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Page
──────────────────────────────────────────────────────────── */

export default function ReferralDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [modalUser, setModalUser] = useState<ReferredUser | null>(null);
  const [toast, setToast] = useState<{ msg: string; show: boolean }>({ msg: "", show: false });
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/referral/stats")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Close the detail modal with Escape.
  useEffect(() => {
    if (!modalUser) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalUser(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalUser]);

  if (loading || !data) {
    return (
      <UserShell active="Referral">
        <div className="flex h-full items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </UserShell>
    );
  }

  const totalReferred = data.stats.totalReferred;
  const totalActive = data.stats.activeReferred;
  const totalCommission = data.stats.totalCommission;

  const currentTier = [...data.milestones].reverse().find((t) => totalActive >= t.requiredActive) || null;
  const nextTier = data.milestones.find((t) => totalActive < t.requiredActive) || null;
  const progressToNext = nextTier ? Math.min(100, (totalActive / nextTier.requiredActive) * 100) : 100;

  // Extra details for the Total Profit card
  const activeRate = totalReferred > 0 ? (totalActive / totalReferred) * 100 : 0;
  const avgPerReferral = totalReferred > 0 ? totalCommission / totalReferred : 0;
  const topUser = data.referredUsers.reduce<ReferredUser | null>(
    (best, u) => (!best || u.commissionEarned > best.commissionEarned ? u : best),
    null,
  );

  const showToast = (msg: string) => {
    setToast({ msg, show: true });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3000);
  };

  const copyText = (text: string, which: "link" | "code") => {
    navigator.clipboard?.writeText(text).then(() => {
      if (which === "link") {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } else {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      }
      showToast(which === "link" ? "Referral link copied" : "Referral code copied");
    });
  };

  const sources = (Object.keys(SOURCE_META) as ProfitSource[]).map((key) => {
    const amount = key === "daily" ? data.stats.commissionBySource.daily : data.stats.commissionBySource.aiTrading;
    return { key, amount, meta: SOURCE_META[key] };
  });
  const sourceTotal = sources.reduce((sum, s) => sum + s.amount, 0);

  return (
    <UserShell active="Referral">
      <div className="relative overflow-x-hidden overflow-y-auto px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
        {/* Toast */}
        <AnimatePresence>
          {toast.show && (
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.96 }}
              transition={SPRING_PANEL}
              className="fixed inset-x-4 top-4 z-[999] flex items-center gap-2 rounded-2xl border border-border bg-foreground px-4 py-3 text-sm font-medium text-background shadow-lg sm:inset-x-auto sm:right-6 sm:top-6"
            >
              <Check className="size-4 shrink-0" />
              <span className="truncate">{toast.msg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mx-auto w-full max-w-5xl space-y-5 sm:space-y-6">
          {/* Header */}
          <div>
            <p className="text-xs font-medium text-muted-foreground">Earnings</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Referral Dashboard
            </h1>
          </div>

          {/* ── INVITE CARD: always on top, visible on every tab ── */}
          <Card className={cn(SURFACE, "border-foreground/20")}>
            <CardContent className="space-y-4 sm:space-y-5">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-foreground text-background">
                  <Gift className="size-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-foreground sm:text-lg">Invite &amp; Earn</h2>
                  <p className="text-xs text-muted-foreground sm:text-sm">
                    Share your link or code and earn 5% of your referrals' profit, for life.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[2fr_1fr] md:gap-5">
                <CopyRow
                  label="Your Referral Link"
                  value={data.referralLink}
                  copied={copiedLink}
                  onCopy={() => copyText(data.referralLink, "link")}
                  compact
                />
                <CopyRow
                  label="Your Referral Code"
                  value={data.referralCode}
                  copied={copiedCode}
                  onCopy={() => copyText(data.referralCode, "code")}
                />
              </div>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)} variant="pill">
            <TabsList className="border border-border">
              {TABS.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  indicatorClassName="bg-foreground"
                  className="[&_[data-tabs-label]]:text-background"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ── TAB: OVERVIEW (responsive bento grid) ── */}
            <TabsContent value="overview" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* TOTAL PROFIT (detailed) */}
              <Card className={cn(SURFACE, "sm:col-span-2")}>
                <CardContent className="flex h-full flex-col gap-5">
                  {/* Top: label + lifetime badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Eyebrow>Total Profit</Eyebrow>
                      <div className="mt-2 truncate text-3xl font-semibold tracking-tight text-success sm:text-4xl lg:text-5xl">
                        <AnimatedNumber value={totalCommission} format={(n) => `$${money(n)}`} />
                      </div>
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        Lifetime commission from {totalReferred} referral{totalReferred === 1 ? "" : "s"}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full border border-border bg-muted/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-foreground">
                      5% · Lifetime
                    </span>
                  </div>

                  {/* Source split */}
                  <div>
                    <div className="flex h-2.5 w-full gap-1 overflow-hidden rounded-full bg-muted">
                      {sources.map((s) => {
                        const share = sourceTotal > 0 ? (s.amount / sourceTotal) * 100 : 0;
                        return (
                          <motion.div
                            key={s.key}
                            className={cn("h-full rounded-full", s.meta.barClass)}
                            initial={{ width: 0 }}
                            animate={{ width: `${share}%` }}
                            transition={{ type: "spring", stiffness: 90, damping: 20 }}
                          />
                        );
                      })}
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
                      {sources.map((s) => {
                        const Icon = s.meta.icon;
                        const share = sourceTotal > 0 ? (s.amount / sourceTotal) * 100 : 0;
                        return (
                          <div
                            key={s.key}
                            className="flex items-center gap-2.5 rounded-2xl border border-border p-3"
                          >
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-muted">
                              <Icon className="size-3.5 text-foreground" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                                <span className={cn("size-1.5 shrink-0 rounded-full", s.meta.dotClass)} />
                                <span className="truncate">{s.meta.label}</span>
                              </div>
                              <div className="text-[11px] text-muted-foreground">{share.toFixed(0)}% of total</div>
                            </div>
                            <div className="shrink-0 text-sm font-semibold text-foreground">
                              ${money(s.amount)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Referral counts */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-border bg-muted/30 p-3.5 sm:p-4">
                      <div className="flex items-center justify-between gap-2">
                        <Eyebrow>Total Referred</Eyebrow>
                        <Users className="size-3.5 shrink-0 text-muted-foreground" />
                      </div>
                      <div className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                        <NumberTicker value={totalReferred} />
                      </div>
                    </div>
                    <div className="rounded-2xl border border-border bg-muted/30 p-3.5 sm:p-4">
                      <div className="flex items-center justify-between gap-2">
                        <Eyebrow>Active Referred</Eyebrow>
                        <Check className="size-3.5 shrink-0 text-muted-foreground" />
                      </div>
                      <div className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                        <NumberTicker value={totalActive} />
                      </div>
                    </div>
                  </div>

                  {/* Insights */}
                  <div className="grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-3">
                    <div className="min-w-0">
                      <Eyebrow>Active Rate</Eyebrow>
                      <div className="mt-1 text-base font-semibold text-foreground">{activeRate.toFixed(0)}%</div>
                      <div className="text-[11px] text-muted-foreground">
                        {totalActive} of {totalReferred} active
                      </div>
                    </div>
                    <div className="min-w-0">
                      <Eyebrow>Avg / Referral</Eyebrow>
                      <div className="mt-1 truncate text-base font-semibold text-foreground">
                        ${money(avgPerReferral)}
                      </div>
                      <div className="text-[11px] text-muted-foreground">commission each</div>
                    </div>
                    <div className="col-span-2 min-w-0 sm:col-span-1">
                      <Eyebrow>Top Earner</Eyebrow>
                      <div className="mt-1 truncate text-base font-semibold text-foreground">
                        {topUser ? topUser.name : "—"}
                      </div>
                      <div className="truncate text-[11px] text-muted-foreground">
                        {topUser ? `+$${money(topUser.commissionEarned)}` : "No referrals yet"}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* NEXT TIER RING */}
              <Card className={cn(SURFACE, "sm:row-span-2")}>
                <CardContent className="flex h-full flex-col items-center justify-between gap-4 text-center">
                  <Eyebrow>Next Tier</Eyebrow>
                  <Ring value={progressToNext}>
                    <span className="text-2xl font-semibold text-foreground">
                      {nextTier ? `${totalActive}/${nextTier.requiredActive}` : "MAX"}
                    </span>
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">active</span>
                  </Ring>
                  <div className="text-xs text-muted-foreground">
                    {nextTier ? (
                      <>
                        Unlock <strong className="text-foreground">${nextTier.reward}</strong> per period
                      </>
                    ) : (
                      "Highest tier reached"
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab("milestones")}
                    className="w-full"
                  >
                    View All Milestones <ChevronRight className="size-3.5" />
                  </Button>
                </CardContent>
              </Card>

              {/* CURRENT TIER REWARD */}
              <Card className={SURFACE}>
                <CardContent className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Eyebrow>Current Tier Reward</Eyebrow>
                    <Trophy className="size-3.5 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-semibold text-foreground">
                    {currentTier ? `$${currentTier.reward}` : "—"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {currentTier ? `${currentTier.requiredActive}+ active referrals` : "No tier reached yet"}
                  </div>
                </CardContent>
              </Card>

              {/* TOTAL COMMISSION */}
              <Card className={SURFACE}>
                <CardContent className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Eyebrow>Total Commission</Eyebrow>
                    <DollarSign className="size-3.5 text-muted-foreground" />
                  </div>
                  <div className="truncate text-2xl font-semibold text-foreground">${money(totalCommission)}</div>
                  <div className="text-xs text-muted-foreground">Across all 2 sources</div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── TAB: MILESTONES (swipe on mobile, grid on larger) ── */}
            <TabsContent value="milestones" className="space-y-4">
              <Card className={SURFACE}>
                <CardHeader>
                  <CardTitle as="h2" className="flex items-center gap-2 text-lg">
                    <Trophy className="size-4 text-foreground" />
                    Referral Milestones
                  </CardTitle>
                  <CardDescription>
                    Recurring rewards based on your currently active referrals — paid each period the tier is met.
                  </CardDescription>
                </CardHeader>
                {nextTier && (
                  <CardContent>
                    <div className="mb-1.5 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span>
                        {totalActive} / {nextTier.requiredActive} active referrals
                      </span>
                      <span>Next: ${nextTier.reward}</span>
                    </div>
                    <ProgressBar value={progressToNext} />
                  </CardContent>
                )}
              </Card>

              <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 sm:mx-0 sm:grid sm:grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))] sm:overflow-visible sm:px-0 sm:pb-0">
                {data.milestones.map((tier, i) => {
                  const reached = totalActive >= tier.requiredActive;
                  const isCurrent = currentTier?.requiredActive === tier.requiredActive;
                  return (
                    <motion.div
                      key={tier.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...SPRING_PANEL, delay: i * 0.05 }}
                      className={cn(
                        "flex w-40 shrink-0 snap-start flex-col justify-between gap-6 rounded-3xl border p-4 sm:w-auto",
                        reached
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-card text-foreground",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            "text-[10px] font-medium uppercase tracking-[0.14em]",
                            reached ? "text-background/70" : "text-muted-foreground",
                          )}
                        >
                          Tier {i + 1}
                        </span>
                        <span
                          className={cn(
                            "flex size-7 items-center justify-center rounded-full",
                            reached ? "bg-background/15" : "bg-muted",
                          )}
                        >
                          {reached ? (
                            <Check className="size-3.5" />
                          ) : (
                            <Users className="size-3.5 text-muted-foreground" />
                          )}
                        </span>
                      </div>

                      <div>
                        <div className="text-3xl font-semibold tracking-tight">${tier.reward}</div>
                        <div
                          className={cn(
                            "mt-1 text-xs",
                            reached ? "text-background/70" : "text-muted-foreground",
                          )}
                        >
                          {tier.requiredActive} active referrals
                        </div>
                      </div>

                      <div className="text-[11px] font-semibold uppercase tracking-wide">
                        {isCurrent ? (
                          <span className="rounded-full bg-background px-2 py-0.5 text-foreground">Current</span>
                        ) : reached ? (
                          <span className="text-background/70">Unlocked</span>
                        ) : (
                          <span className="text-muted-foreground">{tier.requiredActive - totalActive} more</span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {currentTier && (
                <div className="flex items-start gap-2 rounded-2xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                  <Trophy className="mt-0.5 size-3.5 shrink-0" />
                  <span>
                    You're currently earning <strong className="text-foreground">${currentTier.reward}</strong> per
                    period for maintaining{" "}
                    <strong className="text-foreground">{currentTier.requiredActive}+</strong> active referrals.
                  </span>
                </div>
              )}
            </TabsContent>

            {/* ── TAB: COMMISSION (segmented bar) ── */}
            <TabsContent value="commission">
              <Card className={SURFACE}>
                <CardHeader>
                  <CardTitle as="h2" className="flex items-center gap-2 text-lg">
                    <DollarSign className="size-4 text-foreground" />
                    Lifetime Commission (5%)
                  </CardTitle>
                  <CardDescription>
                    You earn 5% of every referred user's earnings, for life, tracked separately per source.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div>
                    <Eyebrow>Total Commission Earned</Eyebrow>
                    <div className="mt-1.5 truncate text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                      <AnimatedNumber value={totalCommission} format={(n) => `$${money(n)}`} />
                    </div>
                  </div>

                  <div className="flex h-3 w-full gap-1 overflow-hidden rounded-full bg-muted">
                    {sources.map((s) => {
                      const share = sourceTotal > 0 ? (s.amount / sourceTotal) * 100 : 0;
                      return (
                        <motion.div
                          key={s.key}
                          className={cn("h-full rounded-full", s.meta.barClass)}
                          initial={{ width: 0 }}
                          animate={{ width: `${share}%` }}
                          transition={{ type: "spring", stiffness: 90, damping: 20 }}
                        />
                      );
                    })}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {sources.map((s) => {
                      const Icon = s.meta.icon;
                      const share = sourceTotal > 0 ? (s.amount / sourceTotal) * 100 : 0;
                      return (
                        <div key={s.key} className="rounded-2xl border border-border p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                              <Icon className="size-4 text-foreground" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                <span className={cn("size-2 shrink-0 rounded-full", s.meta.dotClass)} />
                                <span className="truncate">{s.meta.label}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">{s.meta.basis}</div>
                            </div>
                          </div>
                          <div className="mt-4 flex items-end justify-between gap-2">
                            <div className="truncate text-xl font-semibold text-foreground">${money(s.amount)}</div>
                            <div className="shrink-0 text-xs text-muted-foreground">{share.toFixed(0)}% of total</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── TAB: USERS (table-style list) ── */}
            <TabsContent value="users">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-1">
                <h2 className="text-sm font-semibold text-foreground">Referred Users</h2>
                <span className="text-xs text-muted-foreground">
                  {totalActive} active · {totalReferred - totalActive} inactive
                </span>
              </div>

              {data.referredUsers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
                  No referrals yet — share your link to get started.
                </div>
              ) : (
                <Card className={cn(SURFACE, "gap-0 overflow-hidden py-0")}>
                  <div className="hidden grid-cols-[1fr_auto] items-center border-b border-border bg-muted/30 px-5 py-2.5 sm:grid">
                    <Eyebrow>User</Eyebrow>
                    <Eyebrow>Commission</Eyebrow>
                  </div>
                  <ul className="divide-y divide-border">
                    {data.referredUsers.map((u) => (
                      <li key={u.id}>
                        <button
                          type="button"
                          onClick={() => setModalUser(u)}
                          className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/40 sm:px-5 sm:py-4"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground sm:size-10">
                              {initials(u.name)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span className="truncate text-sm font-medium text-foreground">{u.name}</span>
                                <StatusPill active={u.active} />
                              </div>
                              <div className="mt-0.5 truncate text-xs text-muted-foreground">
                                {u.email}
                                <span className="hidden sm:inline"> · Joined {u.joined}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                            <span className="text-sm font-semibold text-foreground">
                              +${money(u.commissionEarned)}
                            </span>
                            <ChevronRight className="size-4 text-muted-foreground" />
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* USER DETAIL MODAL (bottom sheet on mobile, centered on larger) */}
        <AnimatePresence>
          {modalUser && (
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-[900] flex items-end justify-center bg-foreground/30 backdrop-blur-sm sm:items-center sm:p-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) setModalUser(null);
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 40, scale: 0.97 }}
                transition={SPRING_PANEL}
                className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-4xl border border-border bg-card p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:rounded-4xl sm:p-6"
              >
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Referral</p>
                    <h3 className="text-lg font-semibold text-foreground">Referred User Details</h3>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Close"
                    onClick={() => setModalUser(null)}
                    className="size-8 rounded-full bg-muted text-muted-foreground hover:bg-muted/70"
                  >
                    <X className="size-4" />
                  </Button>
                </div>

                <div className="mb-4 flex items-center gap-3 rounded-2xl border border-border bg-muted/30 p-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background">
                    {initials(modalUser.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-foreground">{modalUser.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{modalUser.email}</div>
                  </div>
                  <StatusPill active={modalUser.active} />
                </div>

                <div className="mb-4 rounded-2xl border border-border p-4">
                  <div className="flex items-center justify-between gap-3 border-b border-border py-2 first:pt-0">
                    <span className="text-xs text-muted-foreground">User ID</span>
                    <span className="truncate font-mono text-sm font-medium text-foreground">{modalUser.id}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-b border-border py-2">
                    <span className="text-xs text-muted-foreground">Joined</span>
                    <span className="text-sm font-medium text-foreground">{modalUser.joined}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-b border-border py-2">
                    <span className="text-xs text-muted-foreground">Total Deposited</span>
                    <span className="text-sm font-medium text-foreground">${money(modalUser.totalDeposited)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 pt-2">
                    <span className="text-xs text-muted-foreground">Commission Earned (5%)</span>
                    <span className="text-sm font-semibold text-foreground">${money(modalUser.commissionEarned)}</span>
                  </div>
                </div>

                <div className="mb-5 flex items-start gap-2 rounded-2xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                  <Trophy className="mt-0.5 size-3.5 shrink-0" />
                  <span>
                    {modalUser.active
                      ? "This referral is counted toward your active milestone tier."
                      : "This referral is currently inactive and does not count toward milestone tiers."}
                  </span>
                </div>

                <Button variant="outline" size="lg" onClick={() => setModalUser(null)} className="w-full text-sm">
                  Close
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </UserShell>
  );
}