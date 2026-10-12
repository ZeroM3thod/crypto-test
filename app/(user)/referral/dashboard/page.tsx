// app/(user)/referral/page.tsx
"use client";

import { UserShell } from "@/app/(user)/_components/user-shell";
import { useState, useEffect } from "react";
import {
  Users,
  DollarSign,
  Copy,
  Check,
  Trophy,
  Bot,
  TrendingUp,
  X,
  ChevronRight,
} from "lucide-react";

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

const SOURCE_META: Record<ProfitSource, { label: string; icon: typeof TrendingUp; basis: string }> = {
  daily: { label: "Daily Profit", icon: TrendingUp, basis: "5% of profit · lifetime" },
  aiTrading: { label: "AI Trading", icon: Bot, basis: "5% of profit · lifetime" },
};

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "milestones", label: "Milestones" },
  { id: "commission", label: "Commission" },
  { id: "users", label: "Users" },
];

/* ────────────────────────────────────────────────────────────
   Small UI primitives
──────────────────────────────────────────────────────────── */

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-4xl border border-border bg-card p-6 ${className}`}>{children}</div>;
}

/* ────────────────────────────────────────────────────────────
   Page
──────────────────────────────────────────────────────────── */

export default function ReferralDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
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

  return (
    <UserShell active="Referral">
      <div className="relative overflow-y-auto px-5 py-6 sm:px-7 sm:py-8">
        {/* Toast */}
        {toast.show && (
          <div className="fixed right-6 top-6 z-[999] flex items-center gap-2 rounded-2xl border border-border bg-foreground px-4 py-3 text-sm font-medium text-background shadow-lg">
            <Check className="size-4" />
            {toast.msg}
          </div>
        )}

        <div className="mx-auto max-w-3xl space-y-6">
          {/* Header */}
          <div>
            <p className="text-xs font-medium text-muted-foreground">Earnings</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Referral Dashboard
            </h1>
          </div>

          {/* SUMMARY CARD */}
          <div className="rounded-4xl border border-border bg-card p-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Total Referred</div>
                <div className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  {totalReferred}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Active Referred</div>
                <div className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  {totalActive}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Total Profit</div>
                <div className="mt-1.5 text-2xl font-semibold tracking-tight text-success sm:text-3xl">
                  ${totalCommission.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>

          {/* TABS */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={[
                    "shrink-0 rounded-full border px-4 py-2 text-xs font-medium transition-colors",
                    isActive
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground",
                  ].join(" ")}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ── TAB: OVERVIEW ── */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <Card>
                <div className="mb-4">
                  <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    Your Referral Link
                  </span>
                </div>
                <div className="mb-4 flex items-center gap-2 rounded-2xl border border-border bg-muted/30 p-3">
                  <span className="flex-1 truncate font-mono text-xs text-foreground">{data.referralLink}</span>
                  <button
                    onClick={() => copyText(data.referralLink, "link")}
                    className={[
                      "flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors",
                      copiedLink ? "bg-foreground text-background" : "bg-muted text-foreground hover:bg-muted/70",
                    ].join(" ")}
                  >
                    {copiedLink ? <Check className="size-3" /> : <Copy className="size-3" />}
                    {copiedLink ? "Copied" : "Copy"}
                  </button>
                </div>

                <div className="mb-2">
                  <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    Your Referral Code
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-border bg-muted/30 p-3">
                  <span className="flex-1 font-mono text-sm font-semibold tracking-wide text-foreground">
                    {data.referralCode}
                  </span>
                  <button
                    onClick={() => copyText(data.referralCode, "code")}
                    className={[
                      "flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors",
                      copiedCode ? "bg-foreground text-background" : "bg-muted text-foreground hover:bg-muted/70",
                    ].join(" ")}
                  >
                    {copiedCode ? <Check className="size-3" /> : <Copy className="size-3" />}
                    {copiedCode ? "Copied" : "Copy"}
                  </button>
                </div>
              </Card>

              {/* Quick-glance current tier */}
              <Card>
                <div className="mb-1 flex items-center gap-2">
                  <Trophy className="size-4 text-foreground" />
                  <h2 className="text-lg font-semibold text-foreground">Current Standing</h2>
                </div>
                <p className="mb-5 text-sm text-muted-foreground">
                  Your milestone tier and lifetime commission at a glance.
                </p>

                {nextTier && (
                  <div className="mb-5">
                    <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {totalActive} / {nextTier.requiredActive} active referrals to next tier
                      </span>
                      <span>Next: ${nextTier.reward}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-foreground transition-all"
                        style={{ width: `${progressToNext}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-border p-4">
                    <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Current Tier Reward
                    </div>
                    <div className="mt-1.5 text-xl font-semibold text-foreground">
                      {currentTier ? `$${currentTier.reward}` : "—"}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {currentTier ? `${currentTier.requiredActive}+ active referrals` : "No tier reached yet"}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border p-4">
                    <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Total Commission
                    </div>
                    <div className="mt-1.5 text-xl font-semibold text-foreground">
                      ${totalCommission.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">Across all 2 sources</div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab("milestones")}
                  className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-border py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/50"
                >
                  View All Milestones <ChevronRight className="size-3.5" />
                </button>
              </Card>
            </div>
          )}

          {/* ── TAB: MILESTONES ── */}
          {activeTab === "milestones" && (
            <Card>
              <div className="mb-1 flex items-center gap-2">
                <Trophy className="size-4 text-foreground" />
                <h2 className="text-lg font-semibold text-foreground">Referral Milestones</h2>
              </div>
              <p className="mb-5 text-sm text-muted-foreground">
                Recurring rewards based on your currently active referrals — paid each period the tier is met.
              </p>

              {nextTier && (
                <div className="mb-5">
                  <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {totalActive} / {nextTier.requiredActive} active referrals
                    </span>
                    <span>Next: ${nextTier.reward}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-foreground transition-all"
                      style={{ width: `${progressToNext}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {data.milestones.map((tier) => {
                  const reached = totalActive >= tier.requiredActive;
                  const isCurrent = currentTier?.requiredActive === tier.requiredActive;
                  return (
                    <div
                      key={tier.id}
                      className={[
                        "rounded-2xl border p-3.5 text-center transition-colors",
                        reached ? "border-foreground bg-foreground/5" : "border-border",
                      ].join(" ")}
                    >
                      <div className="mx-auto mb-2 flex size-8 items-center justify-center rounded-full bg-muted">
                        {reached ? (
                          <Check className="size-3.5 text-foreground" />
                        ) : (
                          <Users className="size-3.5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="text-xs font-semibold text-foreground">{tier.requiredActive} Active</div>
                      <div className="mt-0.5 text-base font-semibold text-foreground">${tier.reward}</div>
                      {isCurrent && (
                        <span className="mt-2 inline-block rounded-full bg-foreground px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-background">
                          Current
                        </span>
                      )}
                      {!reached && (
                        <div className="mt-2 text-[10px] text-muted-foreground">
                          {tier.requiredActive - totalActive} more
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {currentTier && (
                <div className="mt-4 flex items-start gap-2 rounded-2xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                  <Trophy className="mt-0.5 size-3.5 shrink-0" />
                  <span>
                    You're currently earning <strong className="text-foreground">${currentTier.reward}</strong> per
                    period for maintaining <strong className="text-foreground">{currentTier.requiredActive}+</strong>{" "}
                    active referrals.
                  </span>
                </div>
              )}
            </Card>
          )}

          {/* ── TAB: COMMISSION ── */}
          {activeTab === "commission" && (
            <Card>
              <div className="mb-1 flex items-center gap-2">
                <DollarSign className="size-4 text-foreground" />
                <h2 className="text-lg font-semibold text-foreground">Lifetime Commission (5%)</h2>
              </div>
              <p className="mb-5 text-sm text-muted-foreground">
                You earn 5% of every referred user's earnings, for life, tracked separately per source.
              </p>

              <div className="flex flex-col gap-2.5">
                {(Object.keys(SOURCE_META) as ProfitSource[]).map((key) => {
                  const meta = SOURCE_META[key];
                  const Icon = meta.icon;
                  const amount = key === "daily" ? data.stats.commissionBySource.daily : data.stats.commissionBySource.aiTrading;
                  return (
                    <div key={key} className="flex items-center gap-3 rounded-2xl border border-border p-3.5">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                        <Icon className="size-4 text-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-foreground">{meta.label}</div>
                        <div className="text-xs text-muted-foreground">{meta.basis}</div>
                      </div>
                      <div className="shrink-0 text-sm font-semibold text-foreground">
                        ${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center justify-between rounded-2xl border border-foreground bg-foreground/5 p-4">
                <span className="text-sm font-medium text-foreground">Total Commission Earned</span>
                <span className="text-lg font-semibold text-foreground">
                  ${totalCommission.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </Card>
          )}

          {/* ── TAB: USERS ── */}
          {activeTab === "users" && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">Referred Users</h2>
                <span className="text-xs text-muted-foreground">
                  {totalActive} active · {totalReferred - totalActive} inactive
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {data.referredUsers.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
                    No referrals yet — share your link to get started.
                  </div>
                ) : (
                  data.referredUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        setModalUser(u);
                        setModalOpen(true);
                      }}
                      className="flex w-full items-center justify-between rounded-2xl border border-border p-3.5 text-left transition-colors hover:border-foreground/40"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground">
                          {u.name
                            .split(" ")
                            .map((p) => p[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{u.name}</span>
                            <span
                              className={[
                                "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                                u.active ? "bg-foreground/10 text-foreground" : "bg-muted text-muted-foreground",
                              ].join(" ")}
                            >
                              {u.active ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <div className="mt-0.5 truncate text-xs text-muted-foreground">
                            {u.email} · Joined {u.joined}
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 text-right">
                        <div>
                          <div className="text-sm font-semibold text-foreground">
                            +${u.commissionEarned.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-[11px] text-muted-foreground">commission</div>
                        </div>
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* USER DETAIL MODAL */}
        {modalOpen && modalUser && (
          <div
            className="fixed inset-0 z-[900] flex items-end justify-center bg-foreground/30 backdrop-blur-sm sm:items-center"
            onClick={(e) => {
              if (e.target === e.currentTarget) setModalOpen(false);
            }}
          >
            <div className="w-full max-w-md rounded-t-4xl border border-border bg-card p-6 sm:rounded-4xl">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Referral</p>
                  <h3 className="text-lg font-semibold text-foreground">Referred User Details</h3>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/70"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="mb-4 flex items-center gap-3 rounded-2xl border border-border bg-muted/30 p-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background">
                  {modalUser.name
                    .split(" ")
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-foreground">{modalUser.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{modalUser.email}</div>
                </div>
                <span
                  className={[
                    "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    modalUser.active ? "bg-foreground/10 text-foreground" : "bg-muted text-muted-foreground",
                  ].join(" ")}
                >
                  {modalUser.active ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="mb-4 rounded-2xl border border-border p-4">
                <div className="flex items-center justify-between border-b border-border py-2 first:pt-0">
                  <span className="text-xs text-muted-foreground">User ID</span>
                  <span className="font-mono text-sm font-medium text-foreground">{modalUser.id}</span>
                </div>
                <div className="flex items-center justify-between border-b border-border py-2">
                  <span className="text-xs text-muted-foreground">Joined</span>
                  <span className="text-sm font-medium text-foreground">{modalUser.joined}</span>
                </div>
                <div className="flex items-center justify-between border-b border-border py-2">
                  <span className="text-xs text-muted-foreground">Total Deposited</span>
                  <span className="text-sm font-medium text-foreground">
                    ${modalUser.totalDeposited.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground">Commission Earned (5%)</span>
                  <span className="text-sm font-semibold text-foreground">
                    ${modalUser.commissionEarned.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
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

              <button
                onClick={() => setModalOpen(false)}
                className="w-full rounded-2xl border border-border py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted/50"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </UserShell>
  );
}