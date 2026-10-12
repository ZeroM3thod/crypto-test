"use client";

import {  ArrowLeftRight,  SendIcon, DownloadIcon, UploadIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { ComponentType } from "react";
import { SPRING_PRESS } from "@/lib/ease";

type WalletAction = {
  key: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  onClick?: () => void;
};

/**
 * Row of primary wallet actions rendered icon-over-label, with a spring press.
 */
export function WalletActions({
  onDeposit,
  onWithdraw,
  onTransfer,
  onInvest,
}: {
  onDeposit?: () => void;
  onWithdraw?: () => void;
  onTransfer?: () => void;
  onInvest?: () => void;
}) {
  const reduce = useReducedMotion();

  const actions: WalletAction[] = [
    { key: "deposit",  label: "Deposit",  icon: DownloadIcon,  onClick: onDeposit  },
    { key: "withdraw", label: "Withdraw", icon: UploadIcon,   onClick: onWithdraw },
    { key: "transfer", label: "Transfer", icon: ArrowLeftRight,    onClick: onTransfer },
    { key: "send",   label: "Send",   icon: SendIcon,        onClick: onInvest   },
  ];

  return (
    <div className="flex items-start justify-between gap-2">
      {actions.map(({ key, label, icon: Icon, onClick }) => (
        <motion.button
          key={key}
          type="button"
          onClick={onClick}
          whileTap={reduce ? undefined : { scale: 0.94 }}
          transition={SPRING_PRESS}
          className="flex flex-1 flex-col items-center gap-2 outline-none"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-foreground">
            <Icon className="h-5 w-5" />
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            {label}
          </span>
        </motion.button>
      ))}
    </div>
  );
}