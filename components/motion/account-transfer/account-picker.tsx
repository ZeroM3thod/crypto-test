"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { SPRING_PANEL } from "@/lib/ease";
import { cn } from "@/lib/utils";
import { EASE } from "./constants";
import { AccountDot } from "./account-badges";
import type { Account, AccountSide } from "./types";
import { formatAmount } from "./utils";

/**
 * Mobile  (< sm): bottom sheet that slides up.
 * Desktop (>= sm): centered modal that scales/fades in.
 * Positioning is pure CSS so it adapts live on resize / rotation.
 */
export function AccountPicker({
  open,
  side,
  accounts,
  selectedId,
  onPick,
  onClose,
  reduce,
}: {
  open: boolean;
  side: AccountSide | null;
  accounts: Account[];
  selectedId: string;
  onPick: (id: string) => void;
  onClose: () => void;
  reduce: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            key="backdrop"
            type="button"
            aria-label="Close"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE }}
            className="absolute inset-0 z-10 cursor-default bg-background/40 backdrop-blur-sm"
          />

          {/* Wrapper handles layout only; the motion child handles animation. */}
          <div className="pointer-events-none absolute inset-0 z-20 flex items-end justify-center sm:items-center sm:p-4">
            <motion.div
              key="sheet"
              initial={
                reduce
                  ? { opacity: 0 }
                  : { opacity: 0, y: 40, scale: 0.98 }
              }
              animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              exit={
                reduce
                  ? { opacity: 0 }
                  : { opacity: 0, y: 40, scale: 0.98 }
              }
              transition={reduce ? { duration: 0.18, ease: EASE } : SPRING_PANEL}
              className={cn(
                "pointer-events-auto flex w-full flex-col bg-card shadow-2xl",
                // mobile: bottom sheet
                "max-h-[85%] rounded-t-3xl border-t border-border",
                // desktop: centered modal card
                "sm:max-h-[min(80%,520px)] sm:max-w-sm sm:rounded-2xl sm:border md:max-w-md",
              )}
              role="dialog"
              aria-modal="true"
              aria-label={`Select ${side === "from" ? "from" : "to"} account`}
            >
              {/* Drag handle: mobile only */}
              <div className="flex justify-center pb-1 pt-2.5 sm:hidden">
                <span className="h-1 w-9 rounded-full bg-muted" />
              </div>

              <div className="flex items-center justify-between border-b border-border px-4 pb-3 pt-1 sm:pt-3.5">
                <h2 className="text-sm font-semibold text-foreground md:text-base">
                  Select {side === "from" ? "source" : "destination"} account
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/60 hover:text-foreground md:h-8 md:w-8"
                >
                  <X className="h-3.5 w-3.5 md:h-4 md:w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain px-3 pb-4 pt-3">
                <ul className="flex flex-col gap-0.5">
                  {accounts.length === 0 ? (
                    <li className="py-8 text-center text-xs text-muted-foreground">
                      No accounts found
                    </li>
                  ) : null}
                  {accounts.map((a) => {
                    const active = a.id === selectedId;
                    return (
                      <li key={a.id}>
                        <button
                          type="button"
                          onClick={() => onPick(a.id)}
                          className={cn(
                            "flex w-full items-center justify-between gap-3 rounded-xl px-2 py-2 text-left transition-colors active:scale-[0.97] md:px-3 md:py-2.5",
                            active ? "bg-muted/60" : "hover:bg-muted/60",
                          )}
                        >
                          <span className="flex min-w-0 items-center gap-2.5">
                            <AccountDot account={a} size={32} />
                            <span className="flex min-w-0 flex-col">
                              <span className="truncate text-sm font-semibold text-foreground md:text-base">
                                {a.name}
                              </span>
                              <span className="truncate text-[11px] text-muted-foreground md:text-xs">
                                {a.currency}
                              </span>
                            </span>
                          </span>
                          <span className="shrink-0 text-right text-[11px] tabular-nums text-muted-foreground md:text-xs">
                            {formatAmount(a.balance)}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
