// app/(admin)/_components/impersonation-banner.tsx
"use client";
import { useRouter } from "next/navigation";
import { api } from "@/app/(superadmin)/_components/finance-ui";

export function ImpersonationBanner({ adminName }: { adminName: string }) {
  const router = useRouter();
  return (
    <div className="flex items-center justify-between gap-3 bg-amber-500/15 px-4 py-2 text-sm text-amber-700 dark:text-amber-400">
      <span>Viewing as {adminName}</span>
      <button
        type="button"
        className="rounded-lg border border-current px-3 py-1 text-xs font-medium"
        onClick={async () => {
          await api("/api/owner/impersonation", "DELETE");
          router.push("/owner/admin-management");
          router.refresh();
        }}
      >
        Exit
      </button>
    </div>
  );
}
