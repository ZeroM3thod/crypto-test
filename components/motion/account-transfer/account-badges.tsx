import { cn } from "@/lib/utils";
import type { Account } from "./types";

function diceBearGlassUrl(seed: string) {
  return `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(seed)}`;
}

export function AccountDot({
  account,
  size = 28,
  className,
}: {
  account: Account;
  size?: number;
  className?: string;
}) {
  return (
    <img
      src={diceBearGlassUrl(account.id)}
      alt={account.name}
      style={{ width: size, height: size }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-muted object-cover",
        className,
      )}
    />
  );
}
