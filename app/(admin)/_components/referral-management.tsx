// app/(admin)/_components/referral-management.tsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Bot,
  Check,
  ChevronRight,
  Cloud,
  DollarSign,
  Eye,
  EyeOff,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  Trophy,
  Wallet,
  X,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────
   Types
──────────────────────────────────────────────────────────── */

type ProfitSource = "daily" | "aiTrading" | "cloudMining" | "manualTrading";
type BasicTabId = "overview" | "milestones" | "commission" | "referrals";
type Period = "week" | "month" | "all";
type StatusFilter = "all" | "active" | "inactive";

interface ReferralRecord {
  id: string;
  referrerId: string;
  referrerName: string;
  name: string;
  email: string;
  joined: string;
  active: boolean;
  totalDeposited: number;
  commissionEarned: number;
}

interface Referrer {
  id: string;
  name: string;
  email: string;
  code: string;
  joined: string;
  totalReferred: number;
  visible: boolean;
  activeReferred: Record<Period, number>;
  commission: Record<Period, number>;
}

interface MilestoneTier {
  requiredActive: number;
  reward: number;
}

interface DraftTier {
  requiredActive: string;
  reward: string;
}

/* Placeholder data — wire these to your real API/backend later */
const INITIAL_TIERS: MilestoneTier[] = [
  { requiredActive: 5, reward: 5 },
  { requiredActive: 10, reward: 12 },
  { requiredActive: 15, reward: 35 },
  { requiredActive: 20, reward: 30 },
  { requiredActive: 30, reward: 40 },
  { requiredActive: 50, reward: 75 },
  { requiredActive: 100, reward: 170 },
  { requiredActive: 150, reward: 250 },
];

const SOURCE_META: Record<ProfitSource, { label: string; icon: typeof TrendingUp; basisOf: string }> = {
  daily: { label: "Daily Profit", icon: TrendingUp, basisOf: "of profit" },
  aiTrading: { label: "AI Trading", icon: Bot, basisOf: "of profit" },
  cloudMining: { label: "Cloud Mining", icon: Cloud, basisOf: "of profit" },
  manualTrading: { label: "Manual Trading", icon: Wallet, basisOf: "of total turnover" },
};

const INITIAL_RATES: Record<ProfitSource, number> = {
  daily: 5,
  aiTrading: 5,
  cloudMining: 5,
  manualTrading: 5,
};

const PAID_BY_SOURCE: Record<ProfitSource, number> = {
  daily: 4215.15,
  aiTrading: 2890.9,
  cloudMining: 1540.4,
  manualTrading: 975.75,
};

const REFERRERS: Referrer[] = [
  {
    id: "USR10021",
    name: "Hasan Rahman",
    email: "hasan@mail.com",
    code: "HASAN2026",
    joined: "Jan 14, 2025",
    totalReferred: 48,
    visible: true,
    activeReferred: { week: 3, month: 11, all: 36 },
    commission: { week: 62.4, month: 318.2, all: 2140.5 },
  },
  {
    id: "USR10087",
    name: "Priya Nair",
    email: "priya.n@mail.com",
    code: "PRIYA77",
    joined: "Feb 3, 2025",
    totalReferred: 31,
    visible: true,
    activeReferred: { week: 2, month: 8, all: 24 },
    commission: { week: 48.1, month: 244.9, all: 1612.3 },
  },
  {
    id: "USR10133",
    name: "Carlos Mendes",
    email: "carlos.m@mail.com",
    code: "CARLOS10",
    joined: "Mar 22, 2025",
    totalReferred: 22,
    visible: true,
    activeReferred: { week: 1, month: 5, all: 15 },
    commission: { week: 20.75, month: 131.6, all: 904.2 },
  },
  {
    id: "USR10190",
    name: "Aisha Khan",
    email: "aisha.k@mail.com",
    code: "AISHA55",
    joined: "Apr 9, 2025",
    totalReferred: 14,
    visible: false,
    activeReferred: { week: 0, month: 3, all: 9 },
    commission: { week: 0, month: 70.4, all: 488.0 },
  },
  {
    id: "USR10244",
    name: "Tom Becker",
    email: "tom.b@mail.com",
    code: "TOMB2025",
    joined: "May 30, 2025",
    totalReferred: 9,
    visible: true,
    activeReferred: { week: 1, month: 2, all: 6 },
    commission: { week: 9.9, month: 44.0, all: 266.7 },
  },
  {
    id: "USR10301",
    name: "Lena Fischer",
    email: "lena.f@mail.com",
    code: "LENA88",
    joined: "Jun 18, 2025",
    totalReferred: 5,
    visible: true,
    activeReferred: { week: 0, month: 1, all: 3 },
    commission: { week: 0, month: 12.5, all: 91.4 },
  },
];

const REFERRAL_RECORDS: ReferralRecord[] = [
  {
    id: "USR20441",
    referrerId: "USR10021",
    referrerName: "Hasan Rahman",
    name: "Jane Doe",
    email: "jane@doe.com",
    joined: "Jun 2, 2025",
    active: true,
    totalDeposited: 1200,
    commissionEarned: 34.5,
  },
  {
    id: "USR20512",
    referrerId: "USR10021",
    referrerName: "Hasan Rahman",
    name: "Michael Chen",
    email: "m.chen@mail.com",
    joined: "Jun 10, 2025",
    active: true,
    totalDeposited: 800,
    commissionEarned: 21.2,
  },
  {
    id: "USR20588",
    referrerId: "USR10087",
    referrerName: "Priya Nair",
    name: "Amara Okafor",
    email: "amara.o@mail.com",
    joined: "Jun 21, 2025",
    active: true,
    totalDeposited: 500,
    commissionEarned: 12.8,
  },
  {
    id: "USR20604",
    referrerId: "USR10133",
    referrerName: "Carlos Mendes",
    name: "Liam Park",
    email: "liam.park@mail.com",
    joined: "Jun 29, 2025",
    active: false,
    totalDeposited: 150,
    commissionEarned: 3.4,
  },
  {
    id: "USR20699",
    referrerId: "USR10087",
    referrerName: "Priya Nair",
    name: "Sofia Reyes",
    email: "sofia.reyes@mail.com",
    joined: "Jul 5, 2025",
    active: true,
    totalDeposited: 950,
    commissionEarned: 18.6,
  },
  {
    id: "USR20733",
    referrerId: "USR10244",
    referrerName: "Tom Becker",
    name: "Daniel Osei",
    email: "d.osei@mail.com",
    joined: "Jul 12, 2025",
    active: false,
    totalDeposited: 60,
    commissionEarned: 1.1,
  },
];

const BASIC_TABS: { id: BasicTabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "milestones", label: "Milestones" },
  { id: "commission", label: "Commission" },
  { id: "referrals", label: "Referrals" },
];

const PERIODS: { id: Period; label: string }[] = [
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
  { id: "all", label: "All time" },
];

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" },
];

/* ────────────────────────────────────────────────────────────
   Helpers + small UI primitives
──────────────────────────────────────────────────────────── */

const money = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground";

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-4xl border border-border bg-card p-6 ${className}`}>{children}</div>;
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={[
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        active ? "bg-foreground/10 text-foreground" : "bg-muted text-muted-foreground",
      ].join(" ")}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function Pills<T extends string>({
  items,
  value,
  onChange,
}: {
  items: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {items.map((item) => {
        const isActive = value === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={[
              "shrink-0 rounded-full border px-4 py-2 text-xs font-medium transition-colors",
              isActive
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground",
            ].join(" ")}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${inputClass} pl-9`}
      />
    </div>
  );
}

function Modal({
  eyebrow,
  title,
  onClose,
  children,
}: {
  eyebrow: string;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[900] flex items-end justify-center bg-foreground/30 backdrop-blur-sm sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[90svh] w-full max-w-md overflow-y-auto rounded-t-4xl border border-border bg-card p-6 sm:rounded-4xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{eyebrow}</p>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/70"
          >
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function DetailRows({ rows }: { rows: { label: string; value: React.ReactNode; mono?: boolean; strong?: boolean }[] }) {
  return (
    <div className="mb-4 rounded-2xl border border-border p-4">
      {rows.map((row, i) => (
        <div
          key={row.label}
          className={[
            "flex items-center justify-between py-2",
            i < rows.length - 1 ? "border-b border-border" : "",
            i === 0 ? "pt-0" : "",
            i === rows.length - 1 ? "pb-0" : "",
          ].join(" ")}
        >
          <span className="text-xs text-muted-foreground">{row.label}</span>
          <span
            className={[
              "text-sm text-foreground",
              row.mono ? "font-mono font-medium" : row.strong ? "font-semibold" : "font-medium",
            ].join(" ")}
          >
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Basic management (overview / milestones / commission / referrals)
──────────────────────────────────────────────────────────── */

function BasicManagement({ showToast }: { showToast: (msg: string) => void }) {
  const [tab, setTab] = useState<BasicTabId>("overview");

  const [tiers, setTiers] = useState<MilestoneTier[]>(INITIAL_TIERS);
  const [draftTiers, setDraftTiers] = useState<DraftTier[]>(
    INITIAL_TIERS.map((t) => ({ requiredActive: String(t.requiredActive), reward: String(t.reward) }))
  );

  const [rates, setRates] = useState<Record<ProfitSource, number>>(INITIAL_RATES);
  const [draftRates, setDraftRates] = useState<Record<ProfitSource, string>>({
    daily: String(INITIAL_RATES.daily),
    aiTrading: String(INITIAL_RATES.aiTrading),
    cloudMining: String(INITIAL_RATES.cloudMining),
    manualTrading: String(INITIAL_RATES.manualTrading),
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [modalRecord, setModalRecord] = useState<ReferralRecord | null>(null);

  const totalReferrers = REFERRERS.length;
  const totalReferred = REFERRAL_RECORDS.length;
  const totalActive = REFERRAL_RECORDS.filter((r) => r.active).length;
  const totalPaid = Object.values(PAID_BY_SOURCE).reduce((a, b) => a + b, 0);
  const highestReward = tiers.length ? Math.max(...tiers.map((t) => t.reward)) : 0;

  const filteredRecords = useMemo(() => {
    const q = search.trim().toLowerCase();
    return REFERRAL_RECORDS.filter((r) => {
      if (statusFilter === "active" && !r.active) return false;
      if (statusFilter === "inactive" && r.active) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.referrerName.toLowerCase().includes(q)
      );
    });
  }, [search, statusFilter]);

  const updateDraftTier = (index: number, field: keyof DraftTier, value: string) =>
    setDraftTiers((prev) => prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)));

  const saveTiers = () => {
    const parsed = draftTiers.map((t) => ({
      requiredActive: Number(t.requiredActive),
      reward: Number(t.reward),
    }));
    const invalid = parsed.some(
      (t) =>
        !Number.isInteger(t.requiredActive) ||
        t.requiredActive <= 0 ||
        !Number.isFinite(t.reward) ||
        t.reward <= 0
    );
    if (invalid) {
      showToast("Enter a whole number of referrals and a reward above 0");
      return;
    }
    if (new Set(parsed.map((t) => t.requiredActive)).size !== parsed.length) {
      showToast("Each tier needs a different referral count");
      return;
    }
    const sorted = [...parsed].sort((a, b) => a.requiredActive - b.requiredActive);
    setTiers(sorted);
    setDraftTiers(sorted.map((t) => ({ requiredActive: String(t.requiredActive), reward: String(t.reward) })));
    showToast("Milestones saved");
  };

  const saveRates = () => {
    const next = { ...rates };
    for (const key of Object.keys(draftRates) as ProfitSource[]) {
      const value = Number(draftRates[key]);
      if (!Number.isFinite(value) || value < 0 || value > 100) {
        showToast("Commission rates must be between 0 and 100");
        return;
      }
      next[key] = value;
    }
    setRates(next);
    showToast("Commission rates saved");
  };

  return (
    <>
      {/* SUMMARY CARD */}
      <div className="rounded-4xl border border-border bg-card p-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Total Referrers
            </div>
            <div className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {totalReferrers}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Total Referred
            </div>
            <div className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {totalReferred}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Active Referred
            </div>
            <div className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {totalActive}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Commission Paid
            </div>
            <div className="mt-1.5 text-2xl font-semibold tracking-tight text-success sm:text-3xl">
              {money(totalPaid)}
            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <Pills items={BASIC_TABS} value={tab} onChange={setTab} />

      {/* ── TAB: OVERVIEW ── */}
      {tab === "overview" && (
        <div className="space-y-6">
          <Card>
            <div className="mb-1 flex items-center gap-2">
              <Trophy className="size-4 text-foreground" />
              <h2 className="text-lg font-semibold text-foreground">Program Settings</h2>
            </div>
            <p className="mb-5 text-sm text-muted-foreground">
              The rules users see on their referral dashboard right now.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border p-4">
                <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Commission Rate
                </div>
                <div className="mt-1.5 text-xl font-semibold text-foreground">
                  {Object.values(rates).every((r) => r === rates.daily) ? `${rates.daily}%` : "Mixed"}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">Lifetime, per source</div>
              </div>
              <div className="rounded-2xl border border-border p-4">
                <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Milestone Tiers
                </div>
                <div className="mt-1.5 text-xl font-semibold text-foreground">{tiers.length}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">Top reward ${highestReward}</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={() => setTab("milestones")}
                className="flex items-center justify-center gap-1.5 rounded-2xl border border-border py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/50"
              >
                Edit Milestones <ChevronRight className="size-3.5" />
              </button>
              <button
                onClick={() => setTab("commission")}
                className="flex items-center justify-center gap-1.5 rounded-2xl border border-border py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/50"
              >
                Edit Commission <ChevronRight className="size-3.5" />
              </button>
            </div>
          </Card>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Recent Referrals</h2>
              <button
                onClick={() => setTab("referrals")}
                className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                View all <ChevronRight className="size-3.5" />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {[...REFERRAL_RECORDS].reverse().slice(0, 3).map((r) => (
                <button
                  key={r.id}
                  onClick={() => setModalRecord(r)}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border p-3.5 text-left transition-colors hover:border-foreground/40"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground">
                      {initials(r.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground">{r.name}</div>
                      <div className="truncate text-xs text-muted-foreground">Referred by {r.referrerName}</div>
                    </div>
                  </div>
                  <StatusBadge active={r.active} />
                </button>
              ))}
            </div>
          </Card>

          <Link
            href="/admin/referral/leaderboard"
            className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-border py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted/50"
          >
            Manage Leaderboard <ChevronRight className="size-4" />
          </Link>
        </div>
      )}

      {/* ── TAB: MILESTONES ── */}
      {tab === "milestones" && (
        <Card>
          <div className="mb-1 flex items-center gap-2">
            <Trophy className="size-4 text-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Referral Milestones</h2>
          </div>
          <p className="mb-5 text-sm text-muted-foreground">
            Recurring rewards paid each period a user keeps this many active referrals. Tiers are sorted by referral
            count when you save.
          </p>

          <div className="mb-2 grid grid-cols-[1fr_1fr_2.25rem] gap-2.5 px-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            <span>Active referrals</span>
            <span>Reward ($)</span>
            <span />
          </div>

          <div className="flex flex-col gap-2.5">
            {draftTiers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
                No tiers yet. Add the first tier to start rewarding referrers.
              </div>
            ) : (
              draftTiers.map((tier, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_2.25rem] items-center gap-2.5">
                  <input
                    type="number"
                    min={1}
                    inputMode="numeric"
                    value={tier.requiredActive}
                    onChange={(e) => updateDraftTier(i, "requiredActive", e.target.value)}
                    aria-label={`Tier ${i + 1} active referrals`}
                    className={inputClass}
                  />
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    inputMode="decimal"
                    value={tier.reward}
                    onChange={(e) => updateDraftTier(i, "reward", e.target.value)}
                    aria-label={`Tier ${i + 1} reward`}
                    className={inputClass}
                  />
                  <button
                    onClick={() => setDraftTiers((prev) => prev.filter((_, idx) => idx !== i))}
                    aria-label={`Remove tier ${i + 1}`}
                    className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => setDraftTiers((prev) => [...prev, { requiredActive: "", reward: "" }])}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-border py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
          >
            <Plus className="size-3.5" /> Add tier
          </button>

          <div className="mt-4 flex gap-3">
            <button
              onClick={() =>
                setDraftTiers(tiers.map((t) => ({ requiredActive: String(t.requiredActive), reward: String(t.reward) })))
              }
              className="flex-1 rounded-2xl border border-border py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted/50"
            >
              Discard changes
            </button>
            <button
              onClick={saveTiers}
              className="flex-1 rounded-2xl border border-foreground bg-foreground py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
            >
              Save milestones
            </button>
          </div>
        </Card>
      )}

      {/* ── TAB: COMMISSION ── */}
      {tab === "commission" && (
        <Card>
          <div className="mb-1 flex items-center gap-2">
            <DollarSign className="size-4 text-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Lifetime Commission</h2>
          </div>
          <p className="mb-5 text-sm text-muted-foreground">
            Set the percentage referrers earn from each source, for life. Manual Trading is based on total trade
            turnover rather than profit. Changes apply to new earnings only.
          </p>

          <div className="flex flex-col gap-2.5">
            {(Object.keys(SOURCE_META) as ProfitSource[]).map((key) => {
              const meta = SOURCE_META[key];
              const Icon = meta.icon;
              return (
                <div key={key} className="flex items-center gap-3 rounded-2xl border border-border p-3.5">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <Icon className="size-4 text-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground">{meta.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {rates[key]}% {meta.basisOf} · {money(PAID_BY_SOURCE[key])} paid
                    </div>
                  </div>
                  <div className="relative w-24 shrink-0">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step="0.1"
                      inputMode="decimal"
                      value={draftRates[key]}
                      onChange={(e) => setDraftRates((prev) => ({ ...prev, [key]: e.target.value }))}
                      aria-label={`${meta.label} commission rate`}
                      className={`${inputClass} pr-7 text-right`}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      %
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between rounded-2xl border border-foreground bg-foreground/5 p-4">
            <span className="text-sm font-medium text-foreground">Total Commission Paid</span>
            <span className="text-lg font-semibold text-foreground">{money(totalPaid)}</span>
          </div>

          <button
            onClick={saveRates}
            className="mt-4 w-full rounded-2xl border border-foreground bg-foreground py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            Save commission rates
          </button>
        </Card>
      )}

      {/* ── TAB: REFERRALS ── */}
      {tab === "referrals" && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">All Referrals</h2>
            <span className="text-xs text-muted-foreground">
              {totalActive} active · {totalReferred - totalActive} inactive
            </span>
          </div>

          <div className="mb-4 space-y-3">
            <SearchBox value={search} onChange={setSearch} placeholder="Search by name, email, ID or referrer" />
            <Pills items={STATUS_FILTERS} value={statusFilter} onChange={setStatusFilter} />
          </div>

          <div className="flex flex-col gap-2">
            {filteredRecords.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
                No referrals match your search. Try a different name or clear the filter.
              </div>
            ) : (
              filteredRecords.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setModalRecord(r)}
                  className="flex w-full items-center justify-between rounded-2xl border border-border p-3.5 text-left transition-colors hover:border-foreground/40"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground">
                      {initials(r.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{r.name}</span>
                        <StatusBadge active={r.active} />
                      </div>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">
                        {r.email} · Referred by {r.referrerName}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 text-right">
                    <div>
                      <div className="text-sm font-semibold text-foreground">+{money(r.commissionEarned)}</div>
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

      {/* REFERRAL DETAIL MODAL */}
      {modalRecord && (
        <Modal eyebrow="Referral" title="Referral Details" onClose={() => setModalRecord(null)}>
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-border bg-muted/30 p-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background">
              {initials(modalRecord.name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-foreground">{modalRecord.name}</div>
              <div className="truncate text-xs text-muted-foreground">{modalRecord.email}</div>
            </div>
            <StatusBadge active={modalRecord.active} />
          </div>

          <DetailRows
            rows={[
              { label: "User ID", value: modalRecord.id, mono: true },
              { label: "Referred by", value: modalRecord.referrerName },
              { label: "Referrer ID", value: modalRecord.referrerId, mono: true },
              { label: "Joined", value: modalRecord.joined },
              { label: "Total Deposited", value: money(modalRecord.totalDeposited) },
              { label: "Commission Earned", value: money(modalRecord.commissionEarned), strong: true },
            ]}
          />

          <div className="mb-5 flex items-start gap-2 rounded-2xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            <Trophy className="mt-0.5 size-3.5 shrink-0" />
            <span>
              {modalRecord.active
                ? "This referral counts toward the referrer's milestone tier."
                : "This referral is inactive and does not count toward milestone tiers."}
            </span>
          </div>

          <button
            onClick={() => setModalRecord(null)}
            className="w-full rounded-2xl border border-border py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted/50"
          >
            Close
          </button>
        </Modal>
      )}
    </>
  );
}

/* ────────────────────────────────────────────────────────────
   Leaderboard management
──────────────────────────────────────────────────────────── */

function LeaderboardManagement({ showToast }: { showToast: (msg: string) => void }) {
  const [period, setPeriod] = useState<Period>("month");
  const [search, setSearch] = useState("");
  const [referrers, setReferrers] = useState<Referrer[]>(REFERRERS);
  const [modalId, setModalId] = useState<string | null>(null);

  const ranked = useMemo(
    () => [...referrers].sort((a, b) => b.commission[period] - a.commission[period]),
    [referrers, period]
  );

  const visibleCount = referrers.filter((r) => r.visible).length;
  const totalCommission = referrers.reduce((sum, r) => sum + r.commission[period], 0);
  const totalActive = referrers.reduce((sum, r) => sum + r.activeReferred[period], 0);

  const q = search.trim().toLowerCase();
  const rows = ranked
    .map((r, i) => ({ referrer: r, rank: i + 1 }))
    .filter(
      ({ referrer }) =>
        !q ||
        referrer.name.toLowerCase().includes(q) ||
        referrer.email.toLowerCase().includes(q) ||
        referrer.code.toLowerCase().includes(q) ||
        referrer.id.toLowerCase().includes(q)
    );

  const modalReferrer = referrers.find((r) => r.id === modalId) ?? null;
  const modalRank = modalReferrer ? ranked.findIndex((r) => r.id === modalReferrer.id) + 1 : 0;
  const modalReferred = modalReferrer ? REFERRAL_RECORDS.filter((r) => r.referrerId === modalReferrer.id) : [];

  const toggleVisibility = (id: string) => {
    const target = referrers.find((r) => r.id === id);
    if (!target) return;
    setReferrers((prev) => prev.map((r) => (r.id === id ? { ...r, visible: !r.visible } : r)));
    showToast(target.visible ? `${target.name} hidden from leaderboard` : `${target.name} shown on leaderboard`);
  };

  return (
    <>
      {/* SUMMARY CARD */}
      <div className="rounded-4xl border border-border bg-card p-6">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              On Leaderboard
            </div>
            <div className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {visibleCount}
              <span className="text-base font-medium text-muted-foreground"> / {referrers.length}</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Active Referred
            </div>
            <div className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {totalActive}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Commission
            </div>
            <div className="mt-1.5 text-2xl font-semibold tracking-tight text-success sm:text-3xl">
              {money(totalCommission)}
            </div>
          </div>
        </div>
      </div>

      {/* PERIOD */}
      <Pills items={PERIODS} value={period} onChange={setPeriod} />

      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="size-4 text-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Top Referrers</h2>
          </div>
          <span className="text-xs text-muted-foreground">Ranked by commission earned</span>
        </div>

        <div className="mb-4">
          <SearchBox value={search} onChange={setSearch} placeholder="Search by name, email, code or ID" />
        </div>

        <div className="flex flex-col gap-2">
          {rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
              No referrers match your search. Try a different name or code.
            </div>
          ) : (
            rows.map(({ referrer: r, rank }) => (
              <div
                key={r.id}
                className={[
                  "flex items-center gap-2 rounded-2xl border border-border p-3.5 transition-colors hover:border-foreground/40",
                  r.visible ? "" : "opacity-60",
                ].join(" ")}
              >
                <button
                  onClick={() => setModalId(r.id)}
                  className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={[
                        "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                        rank <= 3 ? "bg-foreground text-background" : "bg-muted text-foreground",
                      ].join(" ")}
                    >
                      {rank}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{r.name}</span>
                        {!r.visible && (
                          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Hidden
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">
                        {r.activeReferred[period]} active · {r.totalReferred} total referred
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-semibold text-foreground">{money(r.commission[period])}</div>
                    <div className="text-[11px] text-muted-foreground">commission</div>
                  </div>
                </button>
                <button
                  onClick={() => toggleVisibility(r.id)}
                  aria-label={r.visible ? `Hide ${r.name} from leaderboard` : `Show ${r.name} on leaderboard`}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
                >
                  {r.visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* REFERRER DETAIL MODAL */}
      {modalReferrer && (
        <Modal eyebrow="Leaderboard" title="Referrer Details" onClose={() => setModalId(null)}>
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-border bg-muted/30 p-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background">
              {initials(modalReferrer.name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-foreground">{modalReferrer.name}</div>
              <div className="truncate text-xs text-muted-foreground">{modalReferrer.email}</div>
            </div>
            <span className="inline-flex shrink-0 items-center rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground">
              Rank {modalRank}
            </span>
          </div>

          <DetailRows
            rows={[
              { label: "User ID", value: modalReferrer.id, mono: true },
              { label: "Referral Code", value: modalReferrer.code, mono: true },
              { label: "Joined", value: modalReferrer.joined },
              { label: "Total Referred", value: modalReferrer.totalReferred },
              { label: "Active Referred", value: modalReferrer.activeReferred[period] },
              { label: "Commission", value: money(modalReferrer.commission[period]), strong: true },
            ]}
          />

          {modalReferred.length > 0 && (
            <div className="mb-4">
              <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Recent referrals
              </div>
              <div className="flex flex-col gap-2">
                {modalReferred.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border p-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-foreground">
                        {initials(r.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-foreground">{r.name}</div>
                        <div className="text-[11px] text-muted-foreground">Joined {r.joined}</div>
                      </div>
                    </div>
                    <StatusBadge active={r.active} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-5 flex items-start gap-2 rounded-2xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            {modalReferrer.visible ? <Eye className="mt-0.5 size-3.5 shrink-0" /> : <EyeOff className="mt-0.5 size-3.5 shrink-0" />}
            <span>
              {modalReferrer.visible
                ? "This referrer is shown on the public leaderboard."
                : "This referrer is hidden from the public leaderboard. Their earnings are unaffected."}
            </span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setModalId(null)}
              className="flex-1 rounded-2xl border border-border py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted/50"
            >
              Close
            </button>
            <button
              onClick={() => toggleVisibility(modalReferrer.id)}
              className="flex-1 rounded-2xl border border-foreground bg-foreground py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
            >
              {modalReferrer.visible ? "Hide from leaderboard" : "Show on leaderboard"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

/* ────────────────────────────────────────────────────────────
   Exported page body
──────────────────────────────────────────────────────────── */

export function ReferralManagement({ view }: { view: "basic" | "leaderboard" }) {
  const [toast, setToast] = useState<{ msg: string; show: boolean }>({ msg: "", show: false });

  const showToast = (msg: string) => {
    setToast({ msg, show: true });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3000);
  };

  return (
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
          <p className="text-xs font-medium text-muted-foreground">Referral</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {view === "basic" ? "Referral Management" : "Leaderboard Management"}
          </h1>
        </div>

        {view === "basic" ? (
          <BasicManagement showToast={showToast} />
        ) : (
          <LeaderboardManagement showToast={showToast} />
        )}
      </div>
    </div>
  );
}
