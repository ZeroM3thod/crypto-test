// components/rewards-popup.tsx
"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Reward = {
  id: string;
  title: string;
  description: string;
  amount: number;
  wallet: string;
  reward_type: string;
  created_at: string;
};

export function RewardsPopup({ userId }: { userId: string }) {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    async function fetchUnviewedRewards() {
      try {
        const res = await fetch(`/api/user/rewards/unviewed`);
        if (res.ok) {
          const data = await res.json();
          if (data.rewards && data.rewards.length > 0) {
            setRewards(data.rewards);
            setShow(true);
          }
        }
      } catch (err) {
        console.error('Failed to fetch rewards:', err);
      }
    }

    fetchUnviewedRewards();
  }, [userId]);

  const markAsViewed = async (rewardId: string) => {
    try {
      await fetch(`/api/user/rewards/${rewardId}/view`, { method: 'POST' });
    } catch (err) {
      console.error('Failed to mark reward as viewed:', err);
    }
  };

  const handleClose = async () => {
    if (rewards[currentIndex]) {
      await markAsViewed(rewards[currentIndex].id);
    }

    if (currentIndex < rewards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShow(false);
    }
  };

  if (!show || rewards.length === 0) return null;

  const reward = rewards[currentIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-background border border-border shadow-xl">
        <div className="p-6">
          <div className="mb-4 flex items-center justify-center">
            <div className="grid size-16 place-items-center rounded-full bg-emerald-500/10">
              <svg className="size-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <h2 className="text-center text-2xl font-bold text-foreground mb-2">
            {reward.title}
          </h2>

          <div className="mb-4 text-center">
            <p className="text-4xl font-bold text-emerald-500">
              ${reward.amount.toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Credited to your {reward.wallet} wallet
            </p>
          </div>

          <div className="mb-6 rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground text-center">
              {reward.description}
            </p>
          </div>

          <div className="mb-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            {reward.reward_type === 'withdrawable' ? (
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-600">
                Withdrawable
              </span>
            ) : (
              <span className="rounded-full bg-amber-500/10 px-3 py-1 text-amber-600">
                Investment only (profit withdrawable)
              </span>
            )}
          </div>

          {rewards.length > 1 && (
            <p className="text-center text-xs text-muted-foreground mb-4">
              Reward {currentIndex + 1} of {rewards.length}
            </p>
          )}

          <button
            onClick={handleClose}
            className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {currentIndex < rewards.length - 1 ? 'Next' : 'Got it!'}
          </button>
        </div>
      </div>
    </div>
  );
}
