Here's how to add the Dither loader to your dashboard page. You need **one new file** (`loader.tsx`) plus its `lib/ease.ts` and `lib/utils.ts` helpers if you don't already have them, then **three small edits** in `page.tsx`.

## Step 1: Install dependencies

```bash
npm i clsx motion tailwind-merge
```

(Skip any you already have. If you already ran `shadcn init`, `clsx` and `tailwind-merge` are most likely installed.)

## Step 2: Add the helper files (only if missing)

**`lib/utils.ts`**

```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**`lib/ease.ts`**

```ts
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
export const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;
export const EASE_DRAWER = [0.32, 0.72, 0, 1] as const;
export const EASE_OUT_CSS = "cubic-bezier(0.16, 1, 0.3, 1)";

export const SPRING_PRESS = { type: "spring", stiffness: 500, damping: 30, mass: 0.6 } as const;
export const SPRING_SWAP = { type: "spring", stiffness: 460, damping: 30, mass: 0.55 } as const;
export const SPRING_PANEL = { type: "spring", stiffness: 420, damping: 40, mass: 0.5 } as const;
export const SPRING_LAYOUT = { type: "spring", stiffness: 360, damping: 32, mass: 0.6 } as const;
export const SPRING_MOUSE = { stiffness: 200, damping: 15, mass: 0.3 } as const;
export const SPRING_GLIDE = { stiffness: 700, damping: 50, mass: 0.5 } as const;
```

If `lib/ease.ts` already exists in your project, just make sure `EASE_IN_OUT` is exported from it.

## Step 3: Create `components/motion/loader.tsx`

You only need the Dither variant, so here is a trimmed version (smaller than the full 17-variant file):

```tsx
"use client";

import { motion, useReducedMotion } from "motion/react";
import { EASE_IN_OUT } from "@/lib/ease";
import { cn } from "@/lib/utils";

// Ordered Bayer 4x4 matrix: cells light in this order for a halftone shimmer.
const BAYER_4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

export interface DitherLoaderProps {
  /** Base square size in px. */
  size?: number;
  /** Seconds per animation cycle. */
  speed?: number;
  /** Accessible label for screen readers. */
  label?: string;
  className?: string;
}

export function DitherLoader({
  size = 36,
  speed = 1,
  label = "Loading",
  className,
}: DitherLoaderProps) {
  const reduce = useReducedMotion() ?? false;
  const n = 4;
  const gap = Math.max(1, size * 0.05);
  const cell = (size - gap * (n - 1)) / n;

  return (
    <span
      role="status"
      aria-label={label}
      className={cn("inline-flex items-center justify-center text-foreground", className)}
    >
      <span
        className="grid"
        style={{ gap, gridTemplateColumns: `repeat(${n}, ${cell}px)` }}
      >
        {BAYER_4.map((order, idx) => (
          <motion.span
            key={idx}
            className="bg-current"
            style={{ width: cell, height: cell }}
            animate={reduce ? { opacity: [0.3, 1, 0.3] } : { opacity: [0.1, 1, 0.1] }}
            transition={{
              duration: speed,
              ease: EASE_IN_OUT,
              repeat: Infinity,
              delay: (order / BAYER_4.length) * speed,
            }}
          />
        ))}
      </span>
      <span className="sr-only">{label}</span>
    </span>
  );
}
```

> Prefer the full component with all variants? Paste the entire `loader.tsx` from the docs instead and use `<Loader variant="dither" size={36} />` in the steps below.

## Step 4: Edit `app/(user)/dashboard/page.tsx`

### 4a. Add the import

Put this with your other imports:

```tsx
import { DitherLoader } from "@/components/motion/loader";
```

### 4b. Add a full-page loading state

Inside `DashboardPage`, right before the main `return (`, add:

```tsx
if (loading) {
  return (
    <UserShell active="Dashboard">
      <div className="grid min-h-[70vh] place-items-center">
        <DitherLoader size={44} label="Loading dashboard" />
      </div>
    </UserShell>
  );
}
```

This keeps the sidebar/shell visible and shows the loader in the center of the content area while `/api/dashboard` is fetching.

### 4c. Simplify the leftover "Loading..." text (optional cleanup)

Since the page now returns early while `loading` is true, the per-section placeholders will never show. You can safely clean these up:

- Greeting: change
  ```tsx
  {loading ? 'Loading...' : `${getGreeting()}, ${userData?.firstName || 'User'}.`}
  ```
  to
  ```tsx
  {`${getGreeting()}, ${userData?.firstName || 'User'}.`}
  ```
- The `{!loading && userData ? (...) : (<p>Loading...</p>)}` blocks still work as-is, so leaving them alone is fine. They also act as a fallback if the fetch fails and `userData` stays `null`.

## Optional: keep the loader inside a card instead of full page

If you'd rather load only the sections and keep the greeting and wallet card visible, replace the `<p className="text-xs text-muted-foreground">Loading ...</p>` fallbacks with:

```tsx
<div className="grid place-items-center py-10">
  <DitherLoader size={32} />
</div>
```

and skip step 4b.

## Notes

- `useReducedMotion` is built in, so users with reduced-motion enabled get a gentle opacity pulse.
- The loader uses `currentColor` (`text-foreground`), so it follows your light/dark theme automatically. Add a class like `className="text-primary"` to tint it.
- `speed` controls the cycle length in seconds (try `speed={1.4}` for a calmer shimmer).
- One thing in your page worth a look while you're there: if `/api/dashboard` fails, `userData` stays `null` and the page will show empty sections forever. Adding a small error state would be a good follow-up.