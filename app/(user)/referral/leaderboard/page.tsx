// app/(user)/referral/leaderboard/page.tsx
"use client";

import { UserShell } from "@/app/(user)/_components/user-shell";
import { useMemo, useState, useEffect } from "react";
import { Trophy, Medal, Crown } from "lucide-react";

/* ────────────────────────────────────────────────────────────
   Types
──────────────────────────────────────────────────────────── */

type BoardType = "monthly" | "weekly";

interface LeaderEntry {
  rank: number;
  userId: string;
  name: string;
  referrals: number;
  prize: number;
  isCurrentUser?: boolean;
}

interface LeaderboardData {
  period: string;
  periodStart: string;
  leaderboard: Array<{
    rank: number;
    userId: string;
    name: string;
    referrals: number;
    prize: number;
  }>;
  prizes: Array<{ rank: number; amount: number }>;
}

/* ────────────────────────────────────────────────────────────
   Shared UI primitives (matches dashboard/page.tsx — black & white only)
──────────────────────────────────────────────────────────── */

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-4xl border border-border bg-card p-6 ${className}`}>
      {children}
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
        <Crown className="size-4" />
      </div>
    );
  if (rank === 2 || rank === 3)
    return (
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-foreground text-foreground">
        <Medal className="size-4" />
      </div>
    );
  return (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-sm font-semibold text-muted-foreground">
      {rank}
    </div>
  );
}

function PrizeTag({ amount }: { amount: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-foreground/10 px-2.5 py-1 text-[11px] font-semibold text-foreground">
      <Trophy className="size-3" /> ${amount.toLocaleString()}
    </span>
  );
}

/* ────────────────────────────────────────────────────────────
   Board content
──────────────────────────────────────────────────────────── */

function BoardPanel({ board, data }: { board: BoardType; data: LeaderboardData | null }) {
  if (!data) {
    return (
      <div className="p-6">
        <div className="text-center text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const prizes = data.prizes.slice(0, 3).map((p) => p.amount);
  const top20 = data.leaderboard.slice(0, 20);

  return (
    <div className="space-y-6 p-6">
      {/* PRIZE CARD */}
      <div className="rounded-3xl border border-border bg-background p-6 text-foreground">
        <div className="mb-4 flex items-center gap-2">
          <Trophy className="size-4 text-foreground/70" />
          <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-foreground/60">
            {board === "monthly" ? "This Month's Rewards" : "This Week's Rewards"}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {prizes.map((amt, i) => (
            <div key={i} className="rounded-2xl border border-foreground/15 bg-foreground/5 p-3 text-center">
              <div className="text-[10px] font-medium uppercase tracking-wide text-foreground/50">
                {i === 0 ? "1st Place" : i === 1 ? "2nd Place" : "3rd Place"}
              </div>
              <div className="mt-1 text-lg font-semibold text-foreground sm:text-xl">${amt.toLocaleString()}</div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-foreground/50">
          {board === "monthly"
            ? "Top 3 by total active referrals this month — resets on the 1st of each month."
            : "Top 3 by active referrals gained this week — resets every Monday."}
        </p>
      </div>

      {/* TOP 20 LIST */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Top 20 Referrers
        </h3>
        <div className="flex flex-col gap-2">
          {top20.map((entry) => {
            const avatarInitials = entry.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();
            return (
              <div
                key={entry.userId}
                className={[
                  "flex items-center justify-between rounded-2xl border p-3.5 transition-colors",
                  entry.rank <= 3 ? "border-foreground/30 bg-muted/20" : "border-border",
                ].join(" ")}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <RankBadge rank={entry.rank} />
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground">
                    {avatarInitials}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="truncate text-sm font-medium text-foreground">{entry.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{entry.referrals} active referrals</div>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  {entry.prize > 0 ? (
                    <PrizeTag amount={entry.prize} />
                  ) : (
                    <span className="text-xs text-muted-foreground">#{entry.rank}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {top20.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
            No leaderboard data yet.
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Page
──────────────────────────────────────────────────────────── */

export default function LeaderboardPage() {
  const [board, setBoard] = useState<BoardType>("monthly");
  const [data, setData] = useState<LeaderboardData | null>(null);

  useEffect(() => {
    fetch(`/api/referral/leaderboard?period=${board}`)
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch(() => setData(null));
  }, [board]);

  return (
    <UserShell active="Leaderboard">
      <div className="space-y-8 overflow-y-auto px-5 py-6 sm:px-7 sm:py-8">
        {/* ── Header ────────────────────────────────────── */}
        <div>
          <p className="text-xs font-medium text-muted-foreground">Referrals</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">Leaderboard</h1>
        </div>

        {/* ── Board tabs (exact 50/50 split) + content ──── */}
        <section aria-label="Leaderboard">
          <SectionHeader title="Rankings" />

          <div className="flex w-full items-center gap-2">
            {([
              { id: "monthly", label: "Monthly", icon: Trophy },
              { id: "weekly", label: "Weekly", icon: Medal },
            ] as { id: BoardType; label: string; icon: typeof Trophy }[]).map((tab) => {
              const isActive = board === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setBoard(tab.id)}
                  className={[
                    "flex basis-1/2 items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isActive
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-card text-muted-foreground hover:border-foreground/40 hover:text-foreground",
                  ].join(" ")}
                >
                  <Icon className="size-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <Card className="mt-4 p-0">
            <BoardPanel board={board} data={data} />
          </Card>
        </section>

        <div className="h-20" />
      </div>
    </UserShell>
  );
}