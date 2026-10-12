"use client";

import { useState } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { ACCOUNTS } from "./account-transfer/data";
import { ActionButton, FlipButton } from "./account-transfer/controls";
import { Field } from "./account-transfer/field";
import { SummaryRow } from "./account-transfer/summary-row";
import { AccountPicker } from "./account-transfer/account-picker";
import type { Account, AccountSide } from "./account-transfer/types";

export type { Account } from "./account-transfer/types";

export interface AccountTransferProps {
  accounts?: Account[];
  defaultFromId?: string;
  defaultToId?: string;
  className?: string;
  onConfirm?: (params: { fromId: string; toId: string; amount: number }) => void;
}

export function AccountTransfer({
  accounts = ACCOUNTS,
  defaultFromId = "main",
  defaultToId = "investment",
  className,
  onConfirm,
}: AccountTransferProps) {
  const reduce = useReducedMotion();
  const [fromId, setFromId] = useState(defaultFromId);
  const [toId, setToId] = useState(defaultToId);
  const [amount, setAmount] = useState("");
  const [flipRot, setFlipRot] = useState(0);
  const [picking, setPicking] = useState<AccountSide | null>(null);

  if (!accounts.length) return null;

  const from = findAccount(accounts, fromId);
  const to = findAccount(accounts, toId);
  const numericAmount = Number(amount) || 0;

  const flip = () => {
    setFlipRot((r) => r + 180);
    setFromId(toId);
    setToId(fromId);
  };

  const pickAccount = (id: string) => {
    if (!picking) return;
    if (picking === "from") {
      if (id === toId) setToId(fromId);
      setFromId(id);
    } else {
      if (id === fromId) setFromId(toId);
      setToId(id);
    }
    setPicking(null);
  };

  return (
    <div
      className={cn(
        // Fluid width: full on phones, grows gently on larger screens.
        "relative isolate mx-auto w-full overflow-hidden rounded-2xl sm:rounded-3xl",
        "max-w-full sm:max-w-[460px] md:max-w-[520px] lg:max-w-[560px]",
        "border border-border/20 bg-card",
        className,
      )}
    >
      <div className="flex flex-col gap-1.5 rounded-xl border border-border/40 p-3 sm:gap-2 sm:rounded-2xl sm:p-4 md:p-5">
        <Field
          side="from"
          account={from}
          amount={amount}
          onAmount={setAmount}
          editable
          onOpenPicker={() => setPicking("from")}
        />

        <FlipButton rotation={flipRot} reduce={!!reduce} onClick={flip} />

        <Field
          side="to"
          account={to}
          amount={amount}
          editable={false}
          onOpenPicker={() => setPicking("to")}
        />

        <SummaryRow fee={0} eta="Instant" />

        <ActionButton
          from={from}
          to={to}
          amount={numericAmount}
          onClick={() => onConfirm?.({ fromId, toId, amount: numericAmount })}
        />
      </div>

      <AccountPicker
        open={picking !== null}
        side={picking}
        accounts={accounts}
        selectedId={picking === "from" ? fromId : toId}
        onPick={pickAccount}
        onClose={() => setPicking(null)}
        reduce={!!reduce}
      />
    </div>
  );
}

function findAccount(accounts: Account[], id: string) {
  return accounts.find((a) => a.id === id) ?? accounts[0];
}
