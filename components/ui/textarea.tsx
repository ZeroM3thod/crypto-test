// components/ui/textarea.tsx
import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-28 w-full resize-y rounded-md border border-border bg-transparent px-3 py-2 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring",
        "aria-invalid:border-destructive aria-invalid:border-dashed",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
