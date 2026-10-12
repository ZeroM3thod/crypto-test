// app/(admin)/_components/user-detail-new.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Btn, Card, Field } from "./ui";
import { cn } from "@/lib/utils";

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

type UserDetail = {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  mobileNumber: string | null;
  country: string;
  dob: string;
  joinedAt: string;
  walletAddress: string | null;
  kycStatus: string;
  twoFAEnabled: boolean;
  status: 'active' | 'suspended' | 'pending';
  role: 'user' | 'admin' | 'owner';
  referredBy: string | null;
  wallets: {
    main: { balance: number; address: string | null };
    investment: { balance: number };
    trading: { balance: number };
  };
  referrals: {
    referrerId: string | null;
    totalReferred: number;
    activeReferred: number;
  };
  investments: any[];
  aiTradingInvestments: any[];
  rewards: any[];
  loginHistory: any[];
};

const usd = (n: number) =>
  `${n < 0 ? "-" : ""}$${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

export function UserDetail({ 
  initialUser, 
  adminRole 
}: { 
  initialUser: UserDetail;
  adminRole: string;
}) {
  const router = useRouter();
  const [user, setUser] = useState<UserDetail>(initialUser);
  const [tab, setTab] = useState<Tab>("Profile");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const isOwner = adminRole === 'owner';

  const flash = (message: string) => {
    setNote(message);
    setTimeout(() => setNote(null), 3000);
  };

  const updateField = (field: keyof UserDetail, value: any) => {
    setUser(prev => ({ ...prev, [field]: value }));
  };

  const saveChanges = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${user.userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          mobileNumber: user.mobileNumber,
          country: user.country,
          twoFA: user.twoFAEnabled,
          wallets: user.wallets,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      flash("Changes saved");
    } catch {
      flash("Save failed");
    } finally {
      setBusy(false);
    }
  };

  const toggleSuspend = async () => {
    const suspending = user.status === "active";
    if (!confirm(`${suspending ? "Suspend" : "Activate"} ${user.firstName} ${user.lastName}?`)) return;
    
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${user.userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: suspending ? "suspended" : "active" }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setUser(prev => ({ ...prev, status: suspending ? "suspended" : "active" }));
      flash(suspending ? "User suspended" : "User activated");
    } catch {
      flash("Operation failed");
    } finally {
      setBusy(false);
    }
  };

  const disable2FA = async () => {
    if (!confirm(`Disable 2FA for ${user.firstName} ${user.lastName}?`)) return;
    
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${user.userId}/disable-2fa`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(String(res.status));
      setUser(prev => ({ ...prev, twoFAEnabled: false }));
      flash("2FA disabled");
    } catch {
      flash("Failed to disable 2FA");
    } finally {
      setBusy(false);
    }
  };

  const loginAsUser = async () => {
    if (!confirm(`Login as ${user.firstName} ${user.lastName}?`)) return;
    
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${user.userId}/login-as`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(String(res.status));
      const { token } = await res.json();
      
      // Set session token and redirect to user dashboard
      document.cookie = `session_token=${token}; path=/; max-age=2592000`;
      window.location.href = '/dashboard';
    } catch (err: any) {
      flash(err.message || "Login as user failed");
    } finally {
      setBusy(false);
    }
  };

  const totalBalance = user.wallets.main.balance + user.wallets.investment.balance + user.wallets.trading.balance;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-full bg-foreground text-sm font-semibold text-background">
            {user.firstName[0]}{user.lastName[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-foreground">
                {user.firstName} {user.lastName}
              </h1>
              <Badge tone={user.status === "active" ? "green" : "red"}>{user.status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {user.userId} · {user.email}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {note ? <span className="text-xs text-muted-foreground">{note}</span> : null}
          <Btn onClick={() => router.push("/admin/users")}>Back</Btn>
          <Btn tone={user.status === "active" ? "danger" : "default"} onClick={toggleSuspend} disabled={busy}>
            {user.status === "active" ? "Suspend user" : "Activate user"}
          </Btn>
          <Btn tone="primary" onClick={saveChanges} disabled={busy}>
            {busy ? "Saving..." : "Save changes"}
          </Btn>
        </div>
      </div>

      {/* Tabs */}
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

      {/* Profile Tab */}
      {tab === "Profile" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Personal Information">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First Name" value={user.firstName} onChange={(v) => updateField("firstName", v)} />
              <Field label="Last Name" value={user.lastName} onChange={(v) => updateField("lastName", v)} />
              <Field label="User ID" value={user.userId} readOnly />
              <Field label="Email" type="email" value={user.email} onChange={(v) => updateField("email", v)} />
              <Field label="Phone" value={user.phone} readOnly />
              <Field 
                label="Mobile Number" 
                value={user.mobileNumber || ""} 
                onChange={(v) => updateField("mobileNumber", v || null)} 
                placeholder="Optional"
              />
              <Field label="Country" value={user.country} onChange={(v) => updateField("country", v)} />
              <Field label="Date of Birth" type="date" value={user.dob} readOnly />
              <Field label="Joined At" type="date" value={user.joinedAt} readOnly />
              <Field label="Referred By" value={user.referredBy || "Direct signup"} readOnly />
            </div>
          </Card>

          <div className="flex flex-col gap-6">
            <Card title="KYC Status">
              <div className="flex items-center gap-2">
                <Badge tone={user.kycStatus === 'verified' ? 'green' : user.kycStatus === 'pending' ? 'amber' : 'gray'}>
                  {user.kycStatus.replace('_', ' ')}
                </Badge>
              </div>
            </Card>

            <Card title="Two-Factor Authentication">
              <div className="flex items-center justify-between">
                <span className="text-sm">{user.twoFAEnabled ? "2FA is enabled" : "2FA is disabled"}</span>
                {user.twoFAEnabled && (
                  <Btn size="sm" tone="danger" onClick={disable2FA} disabled={busy}>
                    Disable 2FA
                  </Btn>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Wallets Tab */}
      {tab === "Wallets" && (
        <WalletsTab user={user} setUser={setUser} />
      )}

      {/* Referrals Tab */}
      {tab === "Referrals" && (
        <ReferralsTab user={user} flash={flash} />
      )}

      {/* Investments Tab */}
      {tab === "Investments" && (
        <InvestmentsTab user={user} />
      )}

      {/* Trading Tab */}
      {tab === "Trading" && (
        <TradingTab user={user} />
      )}

      {/* Rewards Tab */}
      {tab === "Rewards" && (
        <RewardsTab user={user} setUser={setUser} flash={flash} />
      )}

      {/* Security & Logins Tab */}
      {tab === "Security & Logins" && (
        <SecurityTab 
          user={user} 
          isOwner={isOwner} 
          disable2FA={disable2FA} 
          loginAsUser={loginAsUser}
          busy={busy}
        />
      )}
    </div>
  );
}

// Sub-components for each tab
function WalletsTab({ user, setUser }: { user: UserDetail; setUser: React.Dispatch<React.SetStateAction<UserDetail>> }) {
  const [selectedWallet, setSelectedWallet] = useState<'main' | 'investment' | 'trading'>('main');
  
  const walletLabels = {
    main: 'Main Wallet',
    investment: 'Investment Wallet',
    trading: 'Trading Wallet'
  };

  const totalBalance = user.wallets.main.balance + user.wallets.investment.balance + user.wallets.trading.balance;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        {(['main', 'investment', 'trading'] as const).map((w) => (
          <button
            key={w}
            type="button"
            onClick={() => setSelectedWallet(w)}
            className={cn(
              "rounded-2xl border p-4 text-left transition-colors",
              selectedWallet === w ? "border-foreground bg-muted" : "border-border hover:bg-muted/50",
            )}
          >
            <p className="text-xs text-muted-foreground">{walletLabels[w]}</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">{usd(user.wallets[w].balance)}</p>
          </button>
        ))}
        <div className="rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Total Balance</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">{usd(totalBalance)}</p>
        </div>
      </div>

      <Card title={walletLabels[selectedWallet]}>
        <div className="grid gap-4 md:grid-cols-2">
          {selectedWallet === 'main' && user.wallets.main.address && (
            <Field label="Wallet Address" value={user.wallets.main.address} readOnly />
          )}
          <Field
            label="Balance (USD)"
            type="number"
            value={user.wallets[selectedWallet].balance}
            onChange={(v) => {
              const newBalance = Number(v) || 0;
              setUser(prev => ({
                ...prev,
                wallets: {
                  ...prev.wallets,
                  [selectedWallet]: { ...prev.wallets[selectedWallet], balance: newBalance }
                }
              }));
            }}
          />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Edit the balance, then press "Save changes" at the top to apply it.
        </p>
      </Card>
    </div>
  );
}

function ReferralsTab({ user, flash }: { user: UserDetail; flash: (msg: string) => void }) {
  const [newReferralUserId, setNewReferralUserId] = useState('');
  const [busy, setBusy] = useState(false);

  const addReferral = async () => {
    if (!newReferralUserId.trim()) {
      flash('Enter a user ID');
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${user.userId}/add-referral`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referredUserId: newReferralUserId.trim() })
      });
      if (!res.ok) throw new Error(String(res.status));
      flash('Referral added');
      setNewReferralUserId('');
      window.location.reload();
    } catch {
      flash('Failed to add referral');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Card title="Referred By">
        <p className="text-sm">{user.referrals.referrerId || 'Direct signup (no referrer)'}</p>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Total Referred</p>
          <p className="mt-1 text-lg font-semibold">{user.referrals.totalReferred}</p>
        </div>
        <div className="rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Active Referred</p>
          <p className="mt-1 text-lg font-semibold">{user.referrals.activeReferred}</p>
        </div>
      </div>

      <Card title="Add Referral">
        <div className="flex gap-2">
          <Field 
            label="User ID" 
            value={newReferralUserId} 
            onChange={setNewReferralUserId}
            placeholder="Enter user ID"
          />
          <div className="flex items-end">
            <Btn onClick={addReferral} disabled={busy}>
              {busy ? 'Adding...' : 'Add'}
            </Btn>
          </div>
        </div>
      </Card>
    </div>
  );
}

function InvestmentsTab({ user }: { user: UserDetail }) {
  const totalInvested = user.investments.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const totalProfit = user.investments.reduce((sum, inv) => sum + (inv.total_profit || 0), 0);
  const runningCount = user.investments.filter(inv => inv.status === 'active').length;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Running Plans</p>
          <p className="mt-1 text-lg font-semibold">{runningCount}</p>
        </div>
        <div className="rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Total Invested</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">{usd(totalInvested)}</p>
        </div>
        <div className="rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Total Earned</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-emerald-500">{usd(totalProfit)}</p>
        </div>
        <div className="rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Total Plans</p>
          <p className="mt-1 text-lg font-semibold">{user.investments.length}</p>
        </div>
      </div>

      <Card title="Investment Plans">
        {user.investments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No investments yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 text-left">Plan</th>
                  <th className="py-2 text-right">Amount</th>
                  <th className="py-2 text-right">Daily Rate</th>
                  <th className="py-2 text-right">Profit</th>
                  <th className="py-2 text-left">Status</th>
                  <th className="py-2 text-left">Started</th>
                </tr>
              </thead>
              <tbody>
                {user.investments.map((inv) => (
                  <tr key={inv.id} className="border-b border-border/50">
                    <td className="py-2">{inv.plan_name}</td>
                    <td className="py-2 text-right tabular-nums">{usd(inv.amount)}</td>
                    <td className="py-2 text-right">{inv.daily_rate}%</td>
                    <td className="py-2 text-right tabular-nums text-emerald-500">{usd(inv.total_profit)}</td>
                    <td className="py-2">
                      <Badge tone={inv.status === 'active' ? 'green' : 'gray'}>{inv.status}</Badge>
                    </td>
                    <td className="py-2">{new Date(inv.started_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function TradingTab({ user }: { user: UserDetail }) {
  const totalInvested = user.aiTradingInvestments.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const totalProfit = user.aiTradingInvestments.reduce((sum, inv) => sum + (inv.total_profit || 0), 0);
  const runningCount = user.aiTradingInvestments.filter(inv => inv.status === 'running').length;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Running Strategies</p>
          <p className="mt-1 text-lg font-semibold">{runningCount}</p>
        </div>
        <div className="rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Total Invested</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">{usd(totalInvested)}</p>
        </div>
        <div className="rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Net P&L</p>
          <p className={cn("mt-1 text-lg font-semibold tabular-nums", totalProfit >= 0 ? "text-emerald-500" : "text-rose-500")}>
            {usd(totalProfit)}
          </p>
        </div>
        <div className="rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Total Strategies</p>
          <p className="mt-1 text-lg font-semibold">{user.aiTradingInvestments.length}</p>
        </div>
      </div>

      <Card title="AI Trading Investments">
        {user.aiTradingInvestments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No AI trading investments yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 text-left">Strategy</th>
                  <th className="py-2 text-right">Amount</th>
                  <th className="py-2 text-right">Current Value</th>
                  <th className="py-2 text-right">P&L</th>
                  <th className="py-2 text-left">Status</th>
                  <th className="py-2 text-left">Unlock Date</th>
                </tr>
              </thead>
              <tbody>
                {user.aiTradingInvestments.map((inv) => (
                  <tr key={inv.id} className="border-b border-border/50">
                    <td className="py-2">{inv.strategy_name}</td>
                    <td className="py-2 text-right tabular-nums">{usd(inv.amount)}</td>
                    <td className="py-2 text-right tabular-nums">{usd(inv.current_value)}</td>
                    <td className={cn("py-2 text-right tabular-nums", inv.total_profit >= 0 ? "text-emerald-500" : "text-rose-500")}>
                      {usd(inv.total_profit)}
                    </td>
                    <td className="py-2">
                      <Badge tone={inv.status === 'running' ? 'green' : inv.status === 'unlocked' ? 'amber' : 'gray'}>
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="py-2">{new Date(inv.unlock_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function RewardsTab({ 
  user, 
  setUser,
  flash 
}: { 
  user: UserDetail;
  setUser: React.Dispatch<React.SetStateAction<UserDetail>>;
  flash: (msg: string) => void;
}) {
  const [rewardForm, setRewardForm] = useState({
    title: '',
    description: '',
    amount: '',
    wallet: 'main' as 'main' | 'investment' | 'trading',
    type: 'non_withdrawable' as 'withdrawable' | 'non_withdrawable'
  });
  const [busy, setBusy] = useState(false);

  const sendReward = async () => {
    const amount = Number(rewardForm.amount);
    if (!rewardForm.title.trim() || !rewardForm.description.trim() || !(amount > 0)) {
      flash('Fill all fields with valid data');
      return;
    }

    if (!confirm(`Send ${usd(amount)} reward "${rewardForm.title}" to ${user.firstName} ${user.lastName}?`)) return;

    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${user.userId}/rewards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rewardForm)
      });
      if (!res.ok) throw new Error(String(res.status));
      
      const { reward } = await res.json();
      setUser(prev => ({
        ...prev,
        rewards: [reward, ...prev.rewards],
        wallets: {
          ...prev.wallets,
          [rewardForm.wallet]: {
            ...prev.wallets[rewardForm.wallet],
            balance: prev.wallets[rewardForm.wallet].balance + amount
          }
        }
      }));
      setRewardForm({
        title: '',
        description: '',
        amount: '',
        wallet: 'main',
        type: 'non_withdrawable'
      });
      flash('Reward sent');
    } catch {
      flash('Failed to send reward');
    } finally {
      setBusy(false);
    }
  };

  const totalRewarded = user.rewards.reduce((sum, r) => sum + (r.amount || 0), 0);
  const withdrawable = user.rewards.filter(r => r.reward_type === 'withdrawable').reduce((sum, r) => sum + (r.amount || 0), 0);
  const nonWithdrawable = totalRewarded - withdrawable;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Rewards Sent</p>
          <p className="mt-1 text-lg font-semibold">{user.rewards.length}</p>
        </div>
        <div className="rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Total Rewarded</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">{usd(totalRewarded)}</p>
        </div>
        <div className="rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Withdrawable</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-emerald-500">{usd(withdrawable)}</p>
        </div>
        <div className="rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Invest Only</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-amber-500">{usd(nonWithdrawable)}</p>
        </div>
      </div>

      <Card title="Send Reward">
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Reward Title"
            value={rewardForm.title}
            onChange={(v) => setRewardForm(prev => ({ ...prev, title: v }))}
          />
          <Field
            label="Amount (USD)"
            type="number"
            value={rewardForm.amount}
            onChange={(v) => setRewardForm(prev => ({ ...prev, amount: v }))}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Wallet</label>
            <select
              value={rewardForm.wallet}
              onChange={(e) => setRewardForm(prev => ({ ...prev, wallet: e.target.value as any }))}
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="main">Main Wallet</option>
              <option value="investment">Investment Wallet</option>
              <option value="trading">Trading Wallet</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Reward Type</label>
            <select
              value={rewardForm.type}
              onChange={(e) => setRewardForm(prev => ({ ...prev, type: e.target.value as any }))}
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="non_withdrawable">Non-withdrawable (invest only)</option>
              <option value="withdrawable">Withdrawable</option>
            </select>
          </div>
        </div>

        <label className="mt-4 flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">Description</span>
          <textarea
            value={rewardForm.description}
            onChange={(e) => setRewardForm(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            maxLength={200}
            placeholder="Shown to the user with the reward"
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </label>

        <div className="mt-4 flex justify-end">
          <Btn tone="primary" onClick={sendReward} disabled={busy}>
            {busy ? 'Sending...' : 'Send reward'}
          </Btn>
        </div>
      </Card>

      <Card title={`Reward History (${user.rewards.length})`}>
        {user.rewards.length === 0 ? (
          <p className="text-sm text-muted-foreground">No rewards sent yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 text-left">Title</th>
                  <th className="py-2 text-left">Description</th>
                  <th className="py-2 text-right">Amount</th>
                  <th className="py-2 text-left">Wallet</th>
                  <th className="py-2 text-left">Type</th>
                  <th className="py-2 text-left">Sent At</th>
                </tr>
              </thead>
              <tbody>
                {user.rewards.map((reward) => (
                  <tr key={reward.id} className="border-b border-border/50">
                    <td className="py-2">{reward.title}</td>
                    <td className="py-2 text-muted-foreground">{reward.description}</td>
                    <td className="py-2 text-right tabular-nums">{usd(reward.amount)}</td>
                    <td className="py-2 capitalize">{reward.wallet}</td>
                    <td className="py-2">
                      <Badge tone={reward.reward_type === 'withdrawable' ? 'green' : 'amber'}>
                        {reward.reward_type === 'withdrawable' ? 'Withdrawable' : 'Invest only'}
                      </Badge>
                    </td>
                    <td className="py-2">{new Date(reward.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function SecurityTab({ 
  user, 
  isOwner, 
  disable2FA, 
  loginAsUser,
  busy
}: { 
  user: UserDetail;
  isOwner: boolean;
  disable2FA: () => void;
  loginAsUser: () => void;
  busy: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Card title="Two-Factor Authentication">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{user.twoFAEnabled ? "2FA is enabled" : "2FA is disabled"}</p>
            <p className="text-xs text-muted-foreground">
              {user.twoFAEnabled ? "User has 2FA protection active" : "User does not have 2FA enabled"}
            </p>
          </div>
          {user.twoFAEnabled && (
            <Btn tone="danger" onClick={disable2FA} disabled={busy}>
              Disable 2FA
            </Btn>
          )}
        </div>
      </Card>

      {isOwner && (
        <Card title="Owner Actions">
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              As an owner, you can login as this user without password or 2FA verification.
            </p>
            <div className="flex justify-end">
              <Btn tone="primary" onClick={loginAsUser} disabled={busy || user.status === 'suspended'}>
                {busy ? 'Logging in...' : 'Login as this user'}
              </Btn>
            </div>
          </div>
        </Card>
      )}

      <Card title={`Login History (${user.loginHistory.length})`}>
        {user.loginHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground">No login history</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 text-left">Date & Time</th>
                  <th className="py-2 text-left">IP Address</th>
                  <th className="py-2 text-left">Device</th>
                  <th className="py-2 text-left">Browser</th>
                  <th className="py-2 text-left">Location</th>
                  <th className="py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {user.loginHistory.map((login) => (
                  <tr key={login.id} className="border-b border-border/50">
                    <td className="py-2">{new Date(login.created_at).toLocaleString()}</td>
                    <td className="py-2 font-mono text-xs">{login.ip_address}</td>
                    <td className="py-2">{login.device_type || 'Unknown'}</td>
                    <td className="py-2">{login.browser || 'Unknown'}</td>
                    <td className="py-2">{login.location || login.country || 'Unknown'}</td>
                    <td className="py-2">
                      <Badge tone={login.status === 'success' ? 'green' : 'red'}>{login.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
