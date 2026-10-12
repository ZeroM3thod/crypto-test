import type { ReactNode } from "react";

export type WalletAccount = {
  id: string;
  name: string;
  address: string;
  avatar?: ReactNode;
};

export interface WalletCardProps {
  accounts: WalletAccount[];
  accountId?: string;
  defaultAccountId?: string;
  onAccountChange?: (id: string) => void;
  balance: number;
  balancePrefix?: string;
  defaultChange?: number;
  defaultBalanceHidden?: boolean;
  onDeposit?: () => void;
  onWithdraw?: () => void;
  onTransfer?: () => void;
  onInvest?: () => void;
  hasNotifications?: boolean;
  onNotifications?: () => void;
  className?: string;
}
