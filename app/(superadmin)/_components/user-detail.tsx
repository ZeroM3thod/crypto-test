// app/(superadmin)/_components/user-detail.tsx
// Admin user detail: admins can edit profile/KYC data AND wallet balances
// (Main + Investment only), manage referrals, view daily-profit / AI trading history,
// and send rewards to the user.
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Table, type TableColumn } from "@/components/motion/table";
import { Checkbox } from "@/components/motion/checkbox";
import { cn } from "@/lib/utils";
import type {
  AiStrategy,
  AiTrade,
  DailyProfit,
  Investment,
  LoginRecord,
  ManualTrade,
  ReferralMember,
  Reward,
  RewardType,
  RewardWallet,
  Tx,
  User,
} from "@/lib/users-data";
import { Badge, Btn, Card, Field, SelectField, StatCard } from "./ui";

const TABS = [
  "Profile",
  "Wallets",
  "Referrals",
  "Investments",
  "Trading",
  "Rewards",
  "Security & Logins",
] as const;
type Tab = (typeof TABS)[number];

// Only these two wallets exist now (mining / trading / referral removed)
type WalletKey = "main" | "investment";
const WALLET_LABELS: Record<WalletKey, string> = {
  main: "Main Wallet",
  investment: "Investment Wallet",
};

const usd = (n: number) =>
  `${n < 0 ? "-" : ""}$${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

/** Keep numbers as numbers when a text cell is edited. */
const coerce = (sample: unknown, value: string) =>
  typeof sample === "number" ? Number(value) || 0 : value;

/** Column helper: every cell is editable + sortable by default. */
function col<T>(
  key: keyof T & string,
  header: string,
  extra: Partial<TableColumn<T>> = {},
): TableColumn<T> {
  return { key, header, editable: true, sortable: true, width: "140px", ...extra };
}

/** Read-only column helper (history / log tables). */
function ro<T>(
  key: keyof T & string,
  header: string,
  extra: Partial<TableColumn<T>> = {},
): TableColumn<T> {
  return col<T>(key, header, { editable: false, ...extra });
}

/** Editable data table used by every section. */
function Grid<T extends { id: string }>({
  data,
  columns,
  onCellEdit,
  onDeleteRow,
  height = 340,
}: {
  data: T[];
  columns: TableColumn<T>[];
  onCellEdit?: (rowId: string, key: string, value: string) => void;
  onDeleteRow?: (rowId: string) => void;
  height?: number;
}) {
  return (
    <Table
      data={data}
      columns={columns}
      getRowId={(r) => r.id}
      resizable
      onCellEdit={onCellEdit}
      onDeleteRow={onDeleteRow ? (id) => onDeleteRow(id) : undefined}
      height={height}
      rowHeight={48}
      className="rounded-xl"
      emptyState="No records"
    />
  );
}

/** Daily-profit packages (same tiers the user sees on their Daily Profit page). */
const PACKAGES = [
  { name: "Starter Plan", rate: 1.7, minimum: 10 },
  { name: "Growth Plan", rate: 2.1, minimum: 30 },
  { name: "Elite Plan", rate: 2.5, minimum: 50 },
] as const;

/** Daily profit row + running total for that investment. */
type ProfitRow = DailyProfit & { cumulative: number };

/** AI strategy / trade shapes shown on the user's AI Trading page.
 *  The extra fields are optional so this compiles against your current types —
 *  add them to AiStrategy / AiTrade in lib/users-data when your API returns them. */
type AiStrategyView = AiStrategy & {
  minStake?: number;
  roiPct?: number;
  daysRunning?: number;
  lockDays?: number;
  daysElapsed?: number;
};
type AiTradeView = AiTrade & { duration?: string };

const DEFAULT_LOCK_DAYS = 15;

const referralInitial = {
  id: "",
  name: "",
  email: "",
  level: "1",
  totalDeposit: "",
  balance: "",
};

const rewardInitial = {
  title: "",
  description: "",
  wallet: "main" as RewardWallet,
  type: "non_withdrawable" as RewardType,
  amount: "",
};

export function UserDetail({ initialUser }: { initialUser: User }) {
  const router = useRouter();
  const [user, setUser] = useState<User>(initialUser);
  const [saved, setSaved] = useState<User>(initialUser);
  const [tab, setTab] = useState<Tab>("Profile");
  const [walletKey, setWalletKey] = useState<WalletKey>("main");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [invFilter, setInvFilter] = useState("all");
  const [rf, setRf] = useState(rewardInitial);
  const [rewardBusy, setRewardBusy] = useState(false);
  const [refForm, setRefForm] = useState(referralInitial);
  const [loginBusy, setLoginBusy] = useState(false);

  const dirty = JSON.stringify(user) !== JSON.stringify(saved);
  const set = <K extends keyof User>(key: K, value: User[K]) =>
    setUser((u) => ({ ...u, [key]: value }));

  const flash = (message: string) => {
    setNote(message);
    setTimeout(() => setNote(null), 3000);
  };

  /** Admin can edit wallet balances. */
  const setBalance = (k: WalletKey, value: number) =>
    setUser((u) => ({
      ...u,
      wallets: { ...u.wallets, [k]: { ...u.wallets[k], balance: value } },
    }));

  /** Generic cell-edit handler for the editable top-level arrays. */
  const editList =
    (list: "referrals" | "investments" | "aiStrategies" | "manualTrades" | "logins") =>
    (rowId: string, key: string, value: string) =>
      setUser((u) => ({
        ...u,
        [list]: (u[list] as unknown as Record<string, unknown>[]).map((r) =>
          r.id === rowId ? { ...r, [key]: coerce(r[key], value) } : r,
        ),
      }));

  /** Persist to your backend (PATCH). Rewards are NOT sent here — they are
   *  created only through the rewards endpoint so they can't be double-credited. */
  async function persist(next: User, message: string) {
    setBusy(true);
    try {
      const { rewards: _rewards, ...payload } = next;
      void _rewards;
      const res = await fetch(`/api/owner/users/${next.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(String(res.status));
      setUser(next);
      setSaved(next);
      flash(message);
    } catch {
      flash("Save failed. Check your API route.");
    } finally {
      setBusy(false);
    }
  }

  const toggleSuspend = () => {
    const suspending = user.status === "active";
    if (!confirm(`${suspending ? "Suspend" : "Activate"} ${user.firstName} ${user.lastName}?`)) return;
    void persist(
      { ...user, status: suspending ? "suspended" : "active" },
      suspending ? "User suspended" : "User activated",
    );
  };

  /** Owner logs in as this user: the server creates an impersonation session
   *  and returns the URL to open (new tab, so the admin session stays intact). */
  async function loginAsUser() {
    if (!confirm(`Login as ${user.firstName} ${user.lastName}? This action may be logged.`)) return;
    // open the tab synchronously so popup blockers don't stop it
    const win = window.open("", "_blank");
    setLoginBusy(true);
    try {
      const res = await fetch(`/api/owner/users/${user.id}/impersonate`, { method: "POST" });
      if (!res.ok) throw new Error(String(res.status));
      const { url } = (await res.json()) as { url: string };
      if (win) win.location.href = url;
      else window.open(url, "_blank");
    } catch {
      win?.close();
      flash("Login as user failed. Check your API route.");
    } finally {
      setLoginBusy(false);
    }
  }

  /** Owner adds a referral to this user (saved with "Save changes"). */
  const addReferral = () => {
    const id = refForm.id.trim();
    const name = refForm.name.trim();
    if (!id || !name) {
      flash("Add the referral's User ID and name");
      return;
    }
    if (user.referrals.some((r) => r.id.toLowerCase() === id.toLowerCase())) {
      flash("That user is already in the referral list");
      return;
    }
    if (id.toLowerCase() === user.id.toLowerCase()) {
      flash("A user can't refer themselves");
      return;
    }
    const member: ReferralMember = {
      id,
      name,
      email: refForm.email.trim(),
      joinedAt: new Date().toISOString().slice(0, 10),
      level: Number(refForm.level) || 1,
      totalDeposit: Number(refForm.totalDeposit) || 0,
      balance: Number(refForm.balance) || 0,
    };
    setUser((u) => ({ ...u, referrals: [member, ...u.referrals] }));
    setRefForm(referralInitial);
    flash("Referral added. Press “Save changes” to apply.");
  };

  /** Owner removes a referral from this user (saved with "Save changes"). */
  const removeReferral = (rowId: string) => {
    const r = user.referrals.find((x) => x.id === rowId);
    if (!r || !confirm(`Remove ${r.name} (${r.id}) from ${user.firstName}'s referrals?`)) return;
    setUser((u) => ({ ...u, referrals: u.referrals.filter((x) => x.id !== rowId) }));
    flash("Referral removed. Press “Save changes” to apply.");
  };

  /** Send a reward: credits the chosen wallet on the server, then mirrors it locally. */
  async function sendReward() {
    const amount = Number(rf.amount);
    if (!rf.title.trim() || !rf.description.trim() || !(amount > 0)) {
      flash("Add a title, short description and a valid amount");
      return;
    }
    const lockText = rf.type === "withdrawable" ? "withdrawable" : "non-withdrawable (invest only)";
    if (
      !confirm(
        `Send ${usd(amount)} reward "${rf.title.trim()}" to ${user.firstName} ${user.lastName}'s ${WALLET_LABELS[rf.wallet]} as ${lockText}?`,
      )
    )
      return;

    setRewardBusy(true);
    try {
      const res = await fetch(`/api/owner/users/${user.id}/rewards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: rf.title.trim(),
          description: rf.description.trim(),
          wallet: rf.wallet,
          type: rf.type,
          amount,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const { reward } = (await res.json()) as { reward: Reward };

      // apply the same change to both current + saved copies (keeps "dirty" correct)
      const apply = (u: User): User => ({
        ...u,
        rewards: [reward, ...u.rewards],
        wallets: {
          ...u.wallets,
          [reward.wallet]: {
            ...u.wallets[reward.wallet],
            balance: u.wallets[reward.wallet].balance + reward.amount,
            lockedBalance:
              u.wallets[reward.wallet].lockedBalance +
              (reward.type === "non_withdrawable" ? reward.amount : 0),
          },
        },
      });
      setUser(apply);
      setSaved(apply);
      setRf(rewardInitial);
      flash("Reward sent");
    } catch {
      flash("Reward failed. Check your API route.");
    } finally {
      setRewardBusy(false);
    }
  }

  // ---------- derived numbers ----------
  const wallet = user.wallets[walletKey];
  const totalWallets = user.wallets.main.balance + user.wallets.investment.balance;

  const refTotals = useMemo(
    () => ({
      count: user.referrals.length,
      deposit: user.referrals.reduce((s, r) => s + r.totalDeposit, 0),
      balance: user.referrals.reduce((s, r) => s + r.balance, 0),
    }),
    [user.referrals],
  );

  const invTotals = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      active: user.investments.filter((i) => i.status === "running").length,
      invested: user.investments.reduce((s, i) => s + i.amount, 0),
      earned: user.investments.reduce((s, i) => s + i.earned, 0),
      today: user.dailyProfits
        .filter((p) => p.date.startsWith(today))
        .reduce((s, p) => s + p.profit, 0),
    };
  }, [user.investments, user.dailyProfits]);

  /** Every profit credit with a running total per investment. */
  const profitRows = useMemo<ProfitRow[]>(() => {
    const totals: Record<string, number> = {};
    const cumById = new Map<string, number>();
    [...user.dailyProfits]
      .sort((a, b) => a.date.localeCompare(b.date))
      .forEach((p) => {
        totals[p.investmentId] = (totals[p.investmentId] ?? 0) + p.profit;
        cumById.set(p.id, totals[p.investmentId]);
      });
    return user.dailyProfits.map((p) => ({ ...p, cumulative: cumById.get(p.id) ?? 0 }));
  }, [user.dailyProfits]);

  const filteredProfits = useMemo(
    () => (invFilter === "all" ? profitRows : profitRows.filter((p) => p.investmentId === invFilter)),
    [profitRows, invFilter],
  );
  const filteredProfitTotal = useMemo(
    () => filteredProfits.reduce((s, p) => s + p.profit, 0),
    [filteredProfits],
  );

  const ai = useMemo(() => {
    const st = user.aiStrategies;
    const tr = user.aiTrades;
    const wins = tr.filter((t) => t.pnl >= 0).length;
    return {
      invested: st.reduce((a, x) => a + x.allocated, 0),
      profit: st.reduce((a, x) => a + x.pnl, 0),
      active: st.filter((x) => x.status === "active" || x.status === "running").length,
      trades: tr.length,
      winRate: tr.length ? (wins / tr.length) * 100 : 0,
      netPnl: tr.reduce((a, x) => a + x.pnl, 0),
    };
  }, [user.aiStrategies, user.aiTrades]);

  const trade = useMemo(() => {
    const t = user.manualTrades;
    return {
      total: t.length,
      long: t.filter((x) => x.direction === "long").length,
      short: t.filter((x) => x.direction === "short").length,
      wins: t.filter((x) => x.pnl > 0).length,
      losses: t.filter((x) => x.pnl < 0).length,
      net: t.reduce((s, x) => s + x.pnl, 0),
    };
  }, [user.manualTrades]);

  const rewardTotals = useMemo(
    () => ({
      count: user.rewards.length,
      total: user.rewards.reduce((s, r) => s + r.amount, 0),
      locked: user.rewards.filter((r) => r.type === "non_withdrawable").reduce((s, r) => s + r.amount, 0),
      free: user.rewards.filter((r) => r.type === "withdrawable").reduce((s, r) => s + r.amount, 0),
    }),
    [user.rewards],
  );

  // ---------- columns ----------
  const txCols = useMemo<TableColumn<Tx>[]>(
    () => [
      ro<Tx>("date", "Date", { width: "170px" }),
      ro<Tx>("type", "Type", { width: "120px" }),
      ro<Tx>("amount", "Amount", { width: "120px", align: "right" }),
      ro<Tx>("status", "Status", { width: "120px" }),
      ro<Tx>("hash", "Tx Hash / Ref", { width: "1fr" }),
    ],
    [],
  );
  const refCols = useMemo<TableColumn<ReferralMember>[]>(
    () => [
      col<ReferralMember>("id", "User ID", { width: "120px" }),
      col<ReferralMember>("name", "Name", { width: "1fr" }),
      col<ReferralMember>("email", "Email", { width: "1.4fr" }),
      col<ReferralMember>("joinedAt", "Joined", { width: "120px" }),
      col<ReferralMember>("level", "Level", { width: "90px", align: "right" }),
      col<ReferralMember>("totalDeposit", "Total Deposit", { width: "140px", align: "right" }),
      col<ReferralMember>("balance", "Balance", { width: "120px", align: "right" }),
    ],
    [],
  );
  const invCols = useMemo<TableColumn<Investment>[]>(
    () => [
      col<Investment>("id", "ID", { width: "120px" }),
      col<Investment>("plan", "Plan", { width: "130px" }),
      col<Investment>("amount", "Invested", { width: "120px", align: "right" }),
      col<Investment>("dailyRoi", "Daily Rate %", { width: "130px", align: "right" }),
      col<Investment>("startDate", "Started", { width: "120px" }),
      col<Investment>("earned", "Total Earned", { width: "130px", align: "right" }),
      col<Investment>("status", "Status", { width: "120px" }),
    ],
    [],
  );
  const profitCols = useMemo<TableColumn<ProfitRow>[]>(
    () => [
      ro<ProfitRow>("date", "Date", { width: "130px" }),
      ro<ProfitRow>("plan", "Plan", { width: "130px" }),
      ro<ProfitRow>("invested", "Invested", {
        width: "120px",
        align: "right",
        cell: (r) => <span className="tabular-nums">{usd(r.invested)}</span>,
      }),
      ro<ProfitRow>("roi", "Rate", {
        width: "90px",
        align: "right",
        cell: (r) => <span className="tabular-nums">{r.roi}%</span>,
      }),
      ro<ProfitRow>("profit", "Profit Credited", {
        width: "140px",
        align: "right",
        cell: (r) => <span className="tabular-nums text-emerald-500">+{usd(r.profit)}</span>,
      }),
      ro<ProfitRow>("wallet", "Wallet", { width: "140px" }),
      ro<ProfitRow>("cumulative", "Cumulative", {
        width: "130px",
        align: "right",
        cell: (r) => <span className="tabular-nums text-emerald-500">+{usd(r.cumulative)}</span>,
      }),
      ro<ProfitRow>("status", "Status", {
        width: "120px",
        cell: (r) => <Badge tone={r.status === "credited" ? "green" : "amber"}>{r.status}</Badge>,
      }),
    ],
    [],
  );
  const aiCols = useMemo<TableColumn<AiStrategyView>[]>(
    () => [
      col<AiStrategyView>("name", "Strategy", { width: "1fr" }),
      ro<AiStrategyView>("minStake", "Min Stake", {
        width: "110px",
        align: "right",
        cell: (r) => (r.minStake != null ? usd(r.minStake) : "—"),
      }),
      ro<AiStrategyView>("roiPct", "Total ROI", {
        width: "110px",
        align: "right",
        cell: (r) =>
          r.roiPct != null ? <span className="tabular-nums text-emerald-500">+{r.roiPct.toFixed(1)}%</span> : "—",
      }),
      ro<AiStrategyView>("daysRunning", "Days Running", {
        width: "120px",
        align: "right",
        cell: (r) => r.daysRunning ?? "—",
      }),
      ro<AiStrategyView>("lockDays", "Lock Period", {
        width: "110px",
        cell: (r) => `${r.lockDays ?? DEFAULT_LOCK_DAYS} days`,
      }),
      col<AiStrategyView>("allocated", "Invested", { width: "120px", align: "right" }),
      col<AiStrategyView>("pnl", "Current Profit", { width: "130px", align: "right" }),
      ro<AiStrategyView>("daysElapsed", "Withdrawal", {
        width: "140px",
        cell: (r) => {
          const left = Math.max(0, (r.lockDays ?? DEFAULT_LOCK_DAYS) - (r.daysElapsed ?? 0));
          return left === 0 ? (
            <Badge tone="green">Available now</Badge>
          ) : (
            <Badge tone="red">Unlocks in {left}d</Badge>
          );
        },
      }),
      col<AiStrategyView>("status", "Status", { width: "110px" }),
    ],
    [],
  );
  const aiTradeCols = useMemo<TableColumn<AiTradeView>[]>(
    () => [
      ro<AiTradeView>("date", "Date", { width: "160px" }),
      ro<AiTradeView>("strategy", "Strategy", { width: "1fr" }),
      ro<AiTradeView>("status", "Result", {
        width: "100px",
        cell: (r) => <Badge tone={r.pnl >= 0 ? "green" : "red"}>{r.pnl >= 0 ? "Win" : "Loss"}</Badge>,
      }),
      ro<AiTradeView>("duration", "Duration", { width: "110px", cell: (r) => r.duration ?? "—" }),
      ro<AiTradeView>("size", "Trade Size", {
        width: "120px",
        align: "right",
        cell: (r) => <span className="tabular-nums">{usd(r.size)}</span>,
      }),
      ro<AiTradeView>("pnl", "P&L", {
        width: "110px",
        align: "right",
        cell: (r) => (
          <span className={cn("tabular-nums font-semibold", r.pnl >= 0 ? "text-emerald-500" : "text-rose-500")}>
            {r.pnl >= 0 ? "+" : "-"}
            {usd(Math.abs(r.pnl))}
          </span>
        ),
      }),
    ],
    [],
  );
  const tradeCols = useMemo<TableColumn<ManualTrade>[]>(
    () => [
      col<ManualTrade>("id", "ID", { width: "110px" }),
      col<ManualTrade>("date", "Date", { width: "160px" }),
      col<ManualTrade>("pair", "Pair", { width: "110px" }),
      col<ManualTrade>("direction", "Direction", { width: "110px" }),
      col<ManualTrade>("size", "Size", { width: "100px", align: "right" }),
      col<ManualTrade>("entry", "Entry", { width: "100px", align: "right" }),
      col<ManualTrade>("exit", "Exit", { width: "100px", align: "right" }),
      col<ManualTrade>("pnl", "PnL", { width: "100px", align: "right" }),
      col<ManualTrade>("status", "Status", { width: "100px" }),
    ],
    [],
  );
  const rewardCols = useMemo<TableColumn<Reward>[]>(
    () => [
      ro<Reward>("sentAt", "Sent On", { width: "160px" }),
      ro<Reward>("title", "Title", { width: "1fr" }),
      ro<Reward>("description", "Description", { width: "1.6fr" }),
      ro<Reward>("amount", "Amount", {
        width: "120px",
        align: "right",
        cell: (r) => <span className="tabular-nums">{usd(r.amount)}</span>,
      }),
      ro<Reward>("wallet", "Wallet", { width: "140px", cell: (r) => WALLET_LABELS[r.wallet] }),
      ro<Reward>("type", "Type", {
        width: "170px",
        cell: (r) => (
          <Badge tone={r.type === "withdrawable" ? "green" : "amber"}>
            {r.type === "withdrawable" ? "Withdrawable" : "Invest only"}
          </Badge>
        ),
      }),
      ro<Reward>("sentBy", "Sent By", { width: "130px" }),
    ],
    [],
  );
  const loginCols = useMemo<TableColumn<LoginRecord>[]>(
    () => [
      col<LoginRecord>("at", "Date & Time", { width: "160px" }),
      col<LoginRecord>("ip", "IP Address", { width: "140px" }),
      col<LoginRecord>("device", "Device", { width: "140px" }),
      col<LoginRecord>("browser", "Browser", { width: "130px" }),
      col<LoginRecord>("app", "Application", { width: "160px" }),
      col<LoginRecord>("location", "Location", { width: "130px" }),
      col<LoginRecord>("status", "Result", { width: "100px" }),
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* ---------- header + account actions ---------- */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-full bg-foreground text-sm font-semibold text-background">
            {user.firstName[0]}
            {user.lastName[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-foreground">
                {user.firstName} {user.lastName}
              </h1>
              <Badge tone={user.status === "active" ? "green" : "red"}>{user.status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {user.id} · {user.email}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {note ? <span className="text-xs text-muted-foreground">{note}</span> : null}
          <Btn onClick={() => router.push("/owner/users")}>Back</Btn>
          <Btn onClick={loginAsUser} disabled={loginBusy || user.status !== "active"}>
            {loginBusy ? "Opening..." : "Login as user"}
          </Btn>
          <Btn tone={user.status === "active" ? "danger" : "default"} onClick={toggleSuspend} disabled={busy}>
            {user.status === "active" ? "Suspend user" : "Activate user"}
          </Btn>
          <Btn tone="primary" onClick={() => persist(user, "Saved")} disabled={!dirty || busy}>
            {busy ? "Saving..." : dirty ? "Save changes" : "Saved"}
          </Btn>
        </div>
      </div>

      {/* ---------- tabs ---------- */}
      <div className="flex gap-1 overflow-x-auto rounded-xl bg-muted p-1">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              tab === t
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ---------- PROFILE ---------- */}
      {tab === "Profile" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Personal Information">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First Name" value={user.firstName} onChange={(v) => set("firstName", v)} />
              <Field label="Last Name" value={user.lastName} onChange={(v) => set("lastName", v)} />
              <Field label="User ID" value={user.id} onChange={(v) => set("id", v)} />
              <Field label="First Join Date" type="date" value={user.joinedAt} onChange={(v) => set("joinedAt", v)} />
              <Field label="Email ID" type="email" value={user.email} onChange={(v) => set("email", v)} />
              <Field label="Date of Birth" type="date" value={user.dob} onChange={(v) => set("dob", v)} />
              <Field label="Country" value={user.country} onChange={(v) => set("country", v)} />
              <Field
                label="Referred By (User ID or OWNER)"
                value={user.referredBy}
                onChange={(v) => set("referredBy", v)}
              />
            </div>
            <div className="mt-4">
              <Field label="Main Wallet Address" value={user.walletAddress} readOnly />
            </div>
          </Card>

          <div className="flex flex-col gap-6">
            <Card title="KYC Details">
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  label="KYC Status"
                  value={user.kyc.status}
                  onChange={(v) => set("kyc", { ...user.kyc, status: v as User["kyc"]["status"] })}
                  options={[
                    { value: "verified", label: "Verified" },
                    { value: "pending", label: "Pending" },
                    { value: "rejected", label: "Rejected" },
                    { value: "not_submitted", label: "Not submitted" },
                  ]}
                />
                <Field
                  label="Document Type"
                  value={user.kyc.documentType}
                  onChange={(v) => set("kyc", { ...user.kyc, documentType: v })}
                />
                <Field
                  label="Document Number"
                  value={user.kyc.documentNumber}
                  onChange={(v) => set("kyc", { ...user.kyc, documentNumber: v })}
                />
                <Field
                  label="Submitted On"
                  type="date"
                  value={user.kyc.submittedAt}
                  onChange={(v) => set("kyc", { ...user.kyc, submittedAt: v })}
                />
              </div>
            </Card>

            <Card title="Two-Factor Authentication">
              <Checkbox
                checked={user.twoFA}
                onCheckedChange={(v) => set("twoFA", v)}
                label={user.twoFA ? "2FA is enabled" : "2FA is disabled"}
              />
            </Card>
          </div>
        </div>
      )}

      {/* ---------- WALLETS (Main + Investment only, balances editable) ---------- */}
      {tab === "Wallets" && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(Object.keys(WALLET_LABELS) as WalletKey[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setWalletKey(k)}
                className={cn(
                  "rounded-2xl border p-4 text-left transition-colors",
                  walletKey === k ? "border-foreground bg-muted" : "border-border hover:bg-muted/50",
                )}
              >
                <p className="text-xs text-muted-foreground">{WALLET_LABELS[k]}</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">{usd(user.wallets[k].balance)}</p>
              </button>
            ))}
            <StatCard label="Total Balance" value={usd(totalWallets)} />
          </div>

          <Card title={WALLET_LABELS[walletKey]}>
            <div
              className={cn(
                "grid gap-4",
                walletKey === "main" ? "md:grid-cols-[1fr_200px]" : "md:grid-cols-[200px]",
              )}
            >
              {/* Investment wallet has no address, so only Main shows one */}
              {walletKey === "main" ? (
                <Field label="Wallet Address" value={wallet.address} readOnly />
              ) : null}
              <Field
                label="Balance (USD)"
                type="number"
                value={wallet.balance}
                onChange={(v) => setBalance(walletKey, Number(v) || 0)}
              />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Edit the balance, then press “Save changes” at the top to apply it.
            </p>
          </Card>

          <Card title={`Transactions (${wallet.transactions.length})`}>
            <Grid data={wallet.transactions} columns={txCols} />
          </Card>
        </div>
      )}

      {/* ---------- REFERRALS ---------- */}
      {tab === "Referrals" && (
        <div className="flex flex-col gap-4">
          <Card title="Referred By">
            <div className="max-w-sm">
              <Field
                label="Referrer (User ID or OWNER)"
                value={user.referredBy}
                onChange={(v) => set("referredBy", v)}
              />
            </div>
          </Card>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label="Members Referred" value={refTotals.count} />
            <StatCard label="Total Deposit (Team)" value={usd(refTotals.deposit)} />
            <StatCard label="Total Balance (Team)" value={usd(refTotals.balance)} />
          </div>
          <Card title="Add Referral">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="User ID" value={refForm.id} onChange={(v) => setRefForm((f) => ({ ...f, id: v }))} />
              <Field label="Name" value={refForm.name} onChange={(v) => setRefForm((f) => ({ ...f, name: v }))} />
              <Field
                label="Email"
                type="email"
                value={refForm.email}
                onChange={(v) => setRefForm((f) => ({ ...f, email: v }))}
              />
              <Field
                label="Level"
                type="number"
                value={refForm.level}
                onChange={(v) => setRefForm((f) => ({ ...f, level: v }))}
              />
              <Field
                label="Total Deposit (USD)"
                type="number"
                value={refForm.totalDeposit}
                onChange={(v) => setRefForm((f) => ({ ...f, totalDeposit: v }))}
              />
              <Field
                label="Balance (USD)"
                type="number"
                value={refForm.balance}
                onChange={(v) => setRefForm((f) => ({ ...f, balance: v }))}
              />
            </div>
            <div className="mt-4 flex justify-end">
              <Btn tone="primary" onClick={addReferral}>
                Add referral
              </Btn>
            </div>
          </Card>
          <Card title={`Referred Members (${user.referrals.length})`}>
            <Grid
              data={user.referrals}
              columns={refCols}
              onCellEdit={editList("referrals")}
              onDeleteRow={removeReferral}
            />
          </Card>
        </div>
      )}

      {/* ---------- INVESTMENTS (daily profit details only) ---------- */}
      {tab === "Investments" && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Total Invested" value={usd(invTotals.invested)} hint={`${invTotals.active} active plans`} />
            <StatCard label="Total Profit Earned" value={usd(invTotals.earned)} hint="All time" />
            <StatCard label="Today's Profit" value={usd(invTotals.today)} hint="Credited today" />
            <StatCard label="Active Plans" value={invTotals.active} hint={invTotals.active > 0 ? "Earning daily" : "No active plan"} />
          </div>

          <Card title="Daily Profit Packages">
            <div className="grid gap-3 sm:grid-cols-3">
              {PACKAGES.map((p) => (
                <div key={p.name} className="rounded-2xl border border-border p-4">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-semibold">{p.name}</p>
                    <div className="text-right">
                      <p className="text-lg font-bold tabular-nums">{p.rate}%</p>
                      <p className="text-[10px] text-muted-foreground">per day</p>
                    </div>
                  </div>
                  <dl className="mt-3 space-y-1.5 text-xs">
                    {[
                      ["Minimum", usd(p.minimum)],
                      ["Cancel policy", "After 24 hours"],
                      ["Payout", "Principal + profits"],
                      ["Return type", "Simple interest"],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <dt className="text-muted-foreground">{k}</dt>
                        <dd className="font-medium">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </Card>

          <Card title={`Active Plans (${user.investments.length})`}>
            <Grid data={user.investments} columns={invCols} onCellEdit={editList("investments")} />
          </Card>

          <Card title={`Profit History (${filteredProfits.length})`}>
            <div className="mb-3 grid gap-3 sm:grid-cols-[240px_1fr] sm:items-end">
              <SelectField
                label="Plan"
                value={invFilter}
                onChange={setInvFilter}
                options={[
                  { value: "all", label: "All plans" },
                  ...user.investments.map((i) => ({ value: i.id, label: `${i.id} · ${i.plan}` })),
                ]}
              />
              <p className="text-sm text-muted-foreground sm:text-right">
                Total profit shown:{" "}
                <span className="font-semibold tabular-nums text-emerald-500">{usd(filteredProfitTotal)}</span>
              </p>
            </div>
            <Grid data={filteredProfits} columns={profitCols} height={380} />
          </Card>
        </div>
      )}

      {/* ---------- TRADING (AI strategy details + manual) ---------- */}
      {tab === "Trading" && (
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold">AI Trading</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <StatCard label="Total Invested" value={usd(ai.invested)} />
              <StatCard
                label="Total AI Profit"
                value={<span className={ai.profit >= 0 ? "text-emerald-500" : "text-rose-500"}>{usd(ai.profit)}</span>}
                hint="All time"
              />
              <StatCard label="Active Strategies" value={ai.active} />
            </div>
            <Card title={`Strategies (${user.aiStrategies.length})`}>
              <Grid data={user.aiStrategies} columns={aiCols} onCellEdit={editList("aiStrategies")} height={260} />
              <p className="mt-3 text-xs text-muted-foreground">
                Every plan locks the stake for {DEFAULT_LOCK_DAYS} days from the day it is invested.
              </p>
            </Card>

            <Card title={`AI Trade History (${user.aiTrades.length})`}>
              <div className="mb-3 grid grid-cols-3 gap-3">
                <StatCard label="Total Trades" value={ai.trades} />
                <StatCard label="Win Rate" value={`${ai.winRate.toFixed(0)}%`} />
                <StatCard
                  label="Net P&L"
                  value={
                    <span className={ai.netPnl >= 0 ? "text-emerald-500" : "text-rose-500"}>
                      {ai.netPnl >= 0 ? "+" : "-"}
                      {usd(Math.abs(ai.netPnl))}
                    </span>
                  }
                />
              </div>
              <Grid data={user.aiTrades} columns={aiTradeCols} height={360} />
            </Card>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold">Manual Trading</h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <StatCard label="Total Trades" value={trade.total} />
              <StatCard label="Long / Short" value={`${trade.long} / ${trade.short}`} />
              <StatCard label="Wins / Losses" value={`${trade.wins} / ${trade.losses}`} />
              <StatCard
                label="Overall Result"
                value={<span className={trade.net >= 0 ? "text-emerald-500" : "text-rose-500"}>{usd(trade.net)}</span>}
                hint={trade.net >= 0 ? "In profit" : "In loss"}
              />
              <StatCard
                label="Win Rate"
                value={`${trade.total ? Math.round((trade.wins / trade.total) * 100) : 0}%`}
              />
            </div>
            <Card title="All Trades">
              <Grid data={user.manualTrades} columns={tradeCols} onCellEdit={editList("manualTrades")} />
            </Card>
          </section>
        </div>
      )}

      {/* ---------- REWARDS ---------- */}
      {tab === "Rewards" && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Rewards Sent" value={rewardTotals.count} />
            <StatCard label="Total Rewarded" value={usd(rewardTotals.total)} />
            <StatCard label="Withdrawable" value={usd(rewardTotals.free)} />
            <StatCard label="Invest Only" value={usd(rewardTotals.locked)} />
          </div>

          <Card title="Send Reward">
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Reward Title"
                value={rf.title}
                onChange={(v) => setRf((s) => ({ ...s, title: v }))}
              />
              <Field
                label="Amount (USD)"
                type="number"
                value={rf.amount}
                onChange={(v) => setRf((s) => ({ ...s, amount: v }))}
              />
              <SelectField
                label="Wallet"
                value={rf.wallet}
                onChange={(v) => setRf((s) => ({ ...s, wallet: v as RewardWallet }))}
                options={[
                  { value: "main", label: "Main Wallet" },
                  { value: "investment", label: "Investment Wallet" },
                ]}
              />
              <SelectField
                label="Reward Use"
                value={rf.type}
                onChange={(v) => setRf((s) => ({ ...s, type: v as RewardType }))}
                options={[
                  { value: "non_withdrawable", label: "Non-withdrawable (invest only, profit withdrawable)" },
                  { value: "withdrawable", label: "Withdrawable (user can withdraw)" },
                ]}
              />
            </div>

            <label className="mt-4 flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground">Short Description</span>
              <textarea
                value={rf.description}
                onChange={(e) => setRf((s) => ({ ...s, description: e.target.value }))}
                rows={3}
                maxLength={200}
                placeholder="Shown to the user with the reward"
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </label>

            <p className="mt-3 text-xs text-muted-foreground">
              {rf.type === "withdrawable"
                ? "The user can withdraw this reward like normal balance."
                : "The user can only invest this reward. Profit earned from it can be withdrawn."}
            </p>

            <div className="mt-4 flex justify-end">
              <Btn tone="primary" onClick={sendReward} disabled={rewardBusy}>
                {rewardBusy ? "Sending..." : "Send reward"}
              </Btn>
            </div>
          </Card>

          <Card title={`Reward History (${user.rewards.length})`}>
            <Grid data={user.rewards} columns={rewardCols} />
          </Card>
        </div>
      )}

      {/* ---------- SECURITY & LOGINS ---------- */}
      {tab === "Security & Logins" && (
        <div className="flex flex-col gap-4">
          <Card title="Two-Factor Authentication">
            <Checkbox
              checked={user.twoFA}
              onCheckedChange={(v) => set("twoFA", v)}
              label={user.twoFA ? "2FA is enabled" : "2FA is disabled"}
            />
          </Card>
          <Card title="Login History (IP, device, app, time)">
            <Grid data={user.logins} columns={loginCols} onCellEdit={editList("logins")} />
          </Card>
        </div>
      )}
    </div>
  );
}