"use client";

import { useState } from "react";
import {
  Trophy,
  DollarSign,
  Users,
  Plus,
  Trash2,
  Check,
  Save,
  Bot,
  Cloud,
  TrendingUp,
  Wallet,
} from "lucide-react";

/* ───────── Types ───────── */

type TabId = "milestones" | "commission" | "top";
type ProfitSource = "daily" | "aiTrading" | "cloudMining" | "manualTrading";

interface MilestoneDraft {
  id: number;
  requiredActive: string;
  reward: string;
}

/* ───────── Placeholder data (wire to API) ───────── */

const INITIAL_MILESTONES = [
  { requiredActive: 5, reward: 5 },
  { requiredActive: 10, reward: 12 },
  { requiredActive: 15, reward: 35 },
  { requiredActive: 20, reward: 30 },
  { requiredActive: 30, reward: 40 },
  { requiredActive: 50, reward: 75 },
  { requiredActive: 100, reward: 170 },
  { requiredActive: 150, reward: 250 },
];

const SOURCE_META: Record<
  ProfitSource,
  { label: string; icon: typeof TrendingUp; basis: string }
> = {
  daily: { label: "Daily Profit", icon: TrendingUp, basis: "% of profit · lifetime" },
  aiTrading: { label: "AI Trading", icon: Bot, basis: "% of profit · lifetime" },
  cloudMining: { label: "Cloud Mining", icon: Cloud, basis: "% of profit · lifetime" },
  manualTrading: { label: "Manual Trading", icon: Wallet, basis: "% of total turnover · lifetime" },
};

const INITIAL_RATES: Record<ProfitSource, string> = {
  daily: "5",
  aiTrading: "5",
  cloudMining: "5",
  manualTrading: "5",
};

const TOP_REFERRERS = [
  { userId: "USR90011", name: "Rahim Uddin", email: "rahim@mail.com", totalReferred: 260, active: 214, commission: 4820.5 },
  { userId: "USR90022", name: "Fatima Islam", email: "fatima@mail.com", totalReferred: 221, active: 187, commission: 3914.2 },
  { userId: "USR90033", name: "Arjun Patel", email: "arjun@mail.com", totalReferred: 190, active: 165, commission: 3120.75 },
  { userId: "USR90044", name: "Ling Wei", email: "ling@mail.com", totalReferred: 170, active: 142, commission: 2650.0 },
  { userId: "USR90055", name: "Carlos Mendez", email: "carlos@mail.com", totalReferred: 150, active: 129, commission: 2210.4 },
  { userId: "USR90066", name: "Aisha Rahman", email: "aisha@mail.com", totalReferred: 140, active: 118, commission: 1985.9 },
];

const TABS: { id: TabId; label: string }[] = [
  { id: "milestones", label: "Milestones" },
  { id: "commission", label: "Commission" },
  { id: "top", label: "Top Referrers" },
];

const inputCls =
  "h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring";

/* ───────── UI primitives ───────── */

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-4xl border border-border bg-card p-6 ${className}`}>{children}</div>;
}

/* ───────── Page ───────── */

export function ReferralBasicManagement() {
  const [tab, setTab] = useState<TabId>("milestones");
  const [toast, setToast] = useState({ msg: "", show: false });

  // Milestones
  const [nextId, setNextId] = useState(INITIAL_MILESTONES.length + 1);
  const [milestones, setMilestones] = useState<MilestoneDraft[]>(
    INITIAL_MILESTONES.map((m, i) => ({
      id: i + 1,
      requiredActive: String(m.requiredActive),
      reward: String(m.reward),
    }))
  );
  const [milestoneError, setMilestoneError] = useState("");

  // Commission
  const [rates, setRates] = useState<Record<ProfitSource, string>>(INITIAL_RATES);
  const [rateError, setRateError] = useState("");

  const showToast = (msg: string) => {
    setToast({ msg, show: true });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3000);
  };

  /* ---- Milestone actions ---- */
  const updateMilestone = (id: number, field: "requiredActive" | "reward", value: string) =>
    setMilestones((list) => list.map((m) => (m.id === id ? { ...m, [field]: value } : m)));

  const addMilestone = () => {
    setMilestones((list) => [...list, { id: nextId, requiredActive: "", reward: "" }]);
    setNextId((n) => n + 1);
  };

  const removeMilestone = (id: number) => setMilestones((list) => list.filter((m) => m.id !== id));

  const saveMilestones = () => {
    const parsed = milestones.map((m) => ({
      requiredActive: Number(m.requiredActive),
      reward: Number(m.reward),
    }));

    if (parsed.some((m) => !Number.isInteger(m.requiredActive) || m.requiredActive <= 0)) {
      return setMilestoneError("Every milestone needs a whole number of active users greater than 0.");
    }
    if (parsed.some((m) => Number.isNaN(m.reward) || m.reward < 0)) {
      return setMilestoneError("Every milestone needs a valid reward amount.");
    }
    if (new Set(parsed.map((m) => m.requiredActive)).size !== parsed.length) {
      return setMilestoneError("Two milestones can't have the same user number.");
    }

    const sorted = [...parsed].sort((a, b) => a.requiredActive - b.requiredActive);
    setMilestoneError("");
    setMilestones(
      sorted.map((m, i) => ({ id: i + 1, requiredActive: String(m.requiredActive), reward: String(m.reward) }))
    );
    setNextId(sorted.length + 1);

    // TODO: await fetch("/api/admin/referral/milestones", { method: "PUT", body: JSON.stringify(sorted) })
    showToast("Milestones saved");
  };

  /* ---- Commission actions ---- */
  const saveRates = () => {
    const invalid = (Object.keys(rates) as ProfitSource[]).some((k) => {
      const n = Number(rates[k]);
      return rates[k].trim() === "" || Number.isNaN(n) || n < 0 || n > 100;
    });
    if (invalid) return setRateError("Each rate must be a number between 0 and 100.");

    setRateError("");
    // TODO: await fetch("/api/admin/referral/commission", { method: "PUT", body: JSON.stringify(rates) })
    showToast("Commission rates saved");
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
            Basic Management
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {TABS.map((t) => {
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={[
                  "shrink-0 rounded-full border px-4 py-2 text-xs font-medium transition-colors",
                  isActive
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground",
                ].join(" ")}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ── MILESTONES ── */}
        {tab === "milestones" && (
          <Card>
            <div className="mb-1 flex items-center gap-2">
              <Trophy className="size-4 text-foreground" />
              <h2 className="text-lg font-semibold text-foreground">Referral Milestones</h2>
            </div>
            <p className="mb-5 text-sm text-muted-foreground">
              Edit the required active users and reward for each tier, or add a new milestone.
            </p>

            <div className="mb-2 grid grid-cols-[1fr_1fr_40px] gap-2 px-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              <span>Active Users</span>
              <span>Reward ($)</span>
              <span />
            </div>

            <div className="flex flex-col gap-2">
              {milestones.map((m) => (
                <div key={m.id} className="grid grid-cols-[1fr_1fr_40px] items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    inputMode="numeric"
                    value={m.requiredActive}
                    onChange={(e) => updateMilestone(m.id, "requiredActive", e.target.value)}
                    placeholder="e.g. 200"
                    className={inputCls}
                  />
                  <input
                    type="number"
                    min={0}
                    inputMode="decimal"
                    value={m.reward}
                    onChange={(e) => updateMilestone(m.id, "reward", e.target.value)}
                    placeholder="e.g. 300"
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={() => removeMilestone(m.id)}
                    aria-label="Remove milestone"
                    className="flex size-10 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}

              {milestones.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                  No milestones yet — add one below.
                </div>
              )}
            </div>

            {milestoneError && <p className="mt-3 text-xs font-medium text-destructive">{milestoneError}</p>}

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={addMilestone}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-border py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
              >
                <Plus className="size-4" /> Add Milestone
              </button>
              <button
                type="button"
                onClick={saveMilestones}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-foreground py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
              >
                <Save className="size-4" /> Save Changes
              </button>
            </div>
          </Card>
        )}

        {/* ── COMMISSION ── */}
        {tab === "commission" && (
          <Card>
            <div className="mb-1 flex items-center gap-2">
              <DollarSign className="size-4 text-foreground" />
              <h2 className="text-lg font-semibold text-foreground">Lifetime Commission</h2>
            </div>
            <p className="mb-5 text-sm text-muted-foreground">
              Set the lifetime commission percentage for each source. Manual Trading is calculated on total turnover.
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
                      <div className="text-xs text-muted-foreground">{meta.basis}</div>
                    </div>
                    <div className="relative w-24 shrink-0">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="0.1"
                        value={rates[key]}
                        onChange={(e) => setRates((r) => ({ ...r, [key]: e.target.value }))}
                        className={`${inputCls} pr-7 text-right`}
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        %
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {rateError && <p className="mt-3 text-xs font-medium text-destructive">{rateError}</p>}

            <button
              type="button"
              onClick={saveRates}
              className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-foreground py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
            >
              <Save className="size-4" /> Save Commission Rates
            </button>
          </Card>
        )}

        {/* ── TOP REFERRERS ── */}
        {tab === "top" && (
          <Card>
            <div className="mb-1 flex items-center gap-2">
              <Users className="size-4 text-foreground" />
              <h2 className="text-lg font-semibold text-foreground">Top Referrers</h2>
            </div>
            <p className="mb-5 text-sm text-muted-foreground">Users ranked by active referrals.</p>

            <div className="flex flex-col gap-2">
              {[...TOP_REFERRERS]
                .sort((a, b) => b.active - a.active)
                .map((u, i) => (
                  <div
                    key={u.userId}
                    className="flex items-center justify-between rounded-2xl border border-border p-3.5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={[
                          "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                          i === 0
                            ? "bg-foreground text-background"
                            : "border border-border text-muted-foreground",
                        ].join(" ")}
                      >
                        {i + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-foreground">{u.name}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {u.email} · {u.totalReferred} referred
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-sm font-semibold text-foreground">{u.active} active</div>
                      <div className="text-[11px] text-muted-foreground">
                        ${u.commission.toLocaleString(undefined, { minimumFractionDigits: 2 })} earned
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
