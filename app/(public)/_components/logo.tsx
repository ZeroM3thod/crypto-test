import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <Link href="/" aria-label="Qouantex home" className={cn("inline-flex items-center gap-0 text-lg font-semibold tracking-tight text-foreground", className)}>
      <Image src="/icon/dark.png" alt="Qouantex" width={96} height={96} priority className="hidden h-10 w-auto dark:block" />
      <Image src="/icon/bright.png" alt="Qouantex" width={96} height={96} priority className="block h-10 w-auto dark:hidden" />
      {showText && <span>Qouantex</span>}
    </Link>
  );
}
