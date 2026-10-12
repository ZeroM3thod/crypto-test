"use client";

import { useId } from "react";
import { ChevronDown, Wallet } from "lucide-react";
import type { Account, AccountSide } from "./types";
import { AccountDot } from "./account-badges";
import { sanitizeAmount, formatAmount } from "./utils";

export function Field({
  side,
  account,
  amount,
  onAmount,
  editable,
  onOpenPicker,
}: {
  side: AccountSide;
  account: Account;
  amount: string;
  onAmount?: (v: string) => void;
  editable: boolean;
  onOpenPicker: () => void;
}) {
  const id = useId();

  return (
    <div className="relative rounded-xl border border-border/50 bg-background/40 p-3 sm:rounded-2xl sm:p-3.5 md:p-4">
      <label
        htmlFor={id}
        className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:mb-2 sm:text-[11px] md:text-xs"
      >
        {side === "from" ? "From" : "To"}
      </label>

      <div className="flex items-center justify-between gap-2 sm:gap-3">
        <div className="min-w-0 flex-1">
          {editable ? (
            <input
              id={id}
              inputMode="decimal"
              value={amount}
              onChange={(e) => onAmount?.(sanitizeAmount(e.target.value))}
              placeholder="0"
              className="w-full min-w-0 bg-transparent text-xl font-semibold tracking-tight text-foreground tabular-nums outline-none placeholder:text-muted-foreground/60 sm:text-2xl md:text-3xl"
            />
          ) : (
            <div className="flex h-7 items-center gap-2 truncate text-xl font-semibold tracking-tight tabular-nums text-foreground sm:h-8 sm:text-2xl md:h-9 md:text-3xl">
              {amount || "0"}
            </div>
          )}
          <p className="mt-1 text-[10px] text-muted-foreground tabular-nums sm:text-[11px] md:text-xs">
            {account.currency}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenPicker}
          className="group inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-border bg-card pl-1 pr-2 text-xs font-semibold text-foreground transition-transform hover:border-border active:scale-[0.97] sm:h-10 sm:gap-2 sm:pr-2.5 sm:text-sm md:h-11 md:text-base"
        >
          <AccountDot account={account} />
          <span className="max-w-[72px] truncate min-[380px]:max-w-[92px] sm:max-w-[110px] md:max-w-[140px]">
            {account.name}
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-muted-foreground sm:text-[11px] md:text-xs">
        <span className="inline-flex min-w-0 items-center gap-1">
          <Wallet className="h-3 w-3 shrink-0" />
          <span className="truncate tabular-nums">{formatAmount(account.balance)}</span>
          <span className="shrink-0">available</span>
        </span>
        {side === "from" ? (
          <button
            type="button"
            onClick={() => onAmount?.(String(account.balance))}
            className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:bg-muted/60 hover:text-foreground md:text-[11px]"
          >
            Max
          </button>
        ) : null}
      </div>
    </div>
  );
}
