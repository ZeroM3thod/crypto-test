I built the whole page on beUI's design language, with every section responsive on mobile, tablet and desktop.

beUI is a Motion + Tailwind v4 + shadcn-token library, and it uses a glass look with spring motion on a `#151515` dark base. I used its exact theme tokens and its real **Bouncy Accordion** (for the FAQ). I couldn't read the source for beUI's other components, so I wrote the button, pill tabs, tilt card, number ticker, text reveal and theme toggle myself in the same style, with the same springs, tokens and glass utilities. I haven't run this code, so test it in your project.

## 1. Install

```bash
npm i motion lucide-react clsx tailwind-merge
npx shadcn@latest add @beui/bouncy-accordion
```

If the `@beui` namespace isn't configured in your project, copy the accordion source from the Manual tab on beui.dev/components/motion/bouncy-accordion instead. It needs `lib/utils.ts` and `lib/ease.ts` below.

Your root `<html>` must keep the `dark` class (you already do this). Delete `icon.tsx` because lucide icons replace it.

## 2. `app/globals.css`

Put this right under `@import "tailwindcss";`. It is the beUI theme plus a rule for the theme-toggle animation. If other parts of your app still use the old `qx` tokens (`bg-surface`, `text-on-surface`, etc.), keep those definitions and check that the new `--color-primary` doesn't clash with theirs.

```css
@custom-variant dark (&:where(.dark, .dark *));

:root {
  --background: oklch(99% 0 0);
  --foreground: oklch(15% 0 0);
  --card: oklch(97% 0 0);
  --muted-foreground: oklch(50% 0 0);
  --border: oklch(15% 0 0 / 0.06);
  --border-strong: oklch(15% 0 0 / 0.12);
  --accent-fg: oklch(15% 0 0);
  --neon: oklch(80% 0.22 145);
  --violet: oklch(68% 0.22 295);
  --danger: oklch(62% 0.22 25);
  --success: oklch(70% 0.18 155);
  --warning: oklch(78% 0.18 75);
  --glass-bg: oklch(99% 0 0 / 0.55);
  --glass-border: oklch(15% 0 0 / 0.08);
  --glass-strong-bg: rgb(255 255 255 / 0.7);
  --glass-thin-bg: rgb(255 255 255 / 0.45);
  --card-foreground: var(--foreground);
  --popover: var(--card);
  --popover-foreground: var(--foreground);
  --primary: #0285f7;
  --primary-foreground: #ffffff;
  --secondary: var(--card);
  --secondary-foreground: var(--foreground);
  --muted: var(--card);
  --accent: oklch(72% 0.18 195);
  --accent-foreground: var(--accent-fg);
  --destructive: var(--danger);
  --input: var(--border);
  --ring: var(--border-strong);
}

.dark {
  --background: #151515;
  --foreground: oklch(96% 0 0);
  --card: #1c1c1c;
  --muted-foreground: oklch(62% 0 0);
  --border: rgb(255 255 255 / 0.05);
  --border-strong: rgb(255 255 255 / 0.1);
  --accent: oklch(80% 0.18 195);
  --accent-fg: #151515;
  --glass-bg: rgb(28 28 28 / 0.55);
  --glass-border: rgb(255 255 255 / 0.08);
  --glass-strong-bg: rgb(28 28 28 / 0.6);
  --glass-thin-bg: rgb(21 21 21 / 0.45);
}

@theme inline {
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);

  --color-border: var(--border);
  --color-border-strong: var(--border-strong);
  --color-neon: var(--neon);
  --color-violet: var(--violet);
  --color-success: var(--success);
  --color-warning: var(--warning);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-input: var(--input);
  --color-ring: var(--ring);
}

@theme {
  --animate-marquee: marquee 30s linear infinite;
  --animate-shimmer: shimmer 2.5s linear infinite;

  @keyframes marquee {
    from { transform: translateX(0); }
    to { transform: translateX(calc(-100% - var(--gap, 1rem))); }
  }
  @keyframes shimmer {
    from { background-position: 200% 0; }
    to { background-position: -200% 0; }
  }
}

@layer utilities {
  .scrollbar-hide::-webkit-scrollbar { display: none; }
  .scrollbar-hide { scrollbar-width: none; }

  .mask-radial-fade {
    mask-image: radial-gradient(ellipse at center, black 40%, transparent 75%);
  }
  .glass {
    background: var(--glass-bg);
    backdrop-filter: blur(20px) saturate(160%);
    border: 1px solid var(--glass-border);
    box-shadow:
      0 1px 0 0 rgb(255 255 255 / 0.06) inset,
      0 24px 60px -24px rgb(0 0 0 / 0.45);
  }
}

/* Theme toggle: circular reveal via View Transition API */
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}
```

## 3. `lib/utils.ts`

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## 4. `lib/ease.ts`

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

## 5. `app/(public)/_components/data.ts`

```ts
// app/(public)/_components/data.ts
import {
  ArrowLeftRight,
  BadgeCheck,
  Banknote,
  Bot,
  CandlestickChart,
  Download,
  Fingerprint,
  Headset,
  KeyRound,
  Landmark,
  PiggyBank,
  SlidersHorizontal,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

/* ---------- Shared class strings ---------- */
export const SECTION =
  "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 mb-24 md:mb-32 lg:mb-40";
export const CARD = "rounded-3xl border border-border bg-card";
export const H2 =
  "text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-balance text-foreground";

export type IconItem = { icon: LucideIcon; title: string; desc: string };

/* ---------- Hero preview card ---------- */
export const WALLET_TABS = ["Main", "Investment", "Trading"] as const;
export type WalletTab = (typeof WALLET_TABS)[number];

export const PNL = [
  { label: "Today", value: "+1.8%" },
  { label: "7-Day", value: "+9.4%" },
  { label: "30-Day", value: "+31.2%" },
  { label: "All-Time", value: "+86.7%" },
];

// Demo numbers for the preview card. Edit freely.
export const WALLET_PREVIEW: Record<
  WalletTab,
  { value: string; pnl: { label: string; value: string }[] }
> = {
  Main: {
    value: "$3,240.00",
    pnl: PNL.map((p) => ({ label: p.label, value: "—" })),
  },
  Investment: { value: "$12,480.55", pnl: PNL },
  Trading: {
    value: "$5,120.30",
    pnl: [
      { label: "Today", value: "+0.9%" },
      { label: "7-Day", value: "+4.1%" },
      { label: "30-Day", value: "+12.6%" },
      { label: "All-Time", value: "+38.2%" },
    ],
  },
};

/* ---------- Trust strip ---------- */
export const METRICS = [
  { value: "$10M+", label: "Total assets managed" },
  { value: "2.5%", label: "Max daily plan return" },
  { value: "68.4%", label: "AI trading win rate" },
  { value: "99.98%", label: "Platform uptime" },
  { value: "50,000+", label: "Active traders" },
];

/* ---------- Features ---------- */
export const FEATURES: (IconItem & { cta: string; href: string })[] = [
  {
    icon: TrendingUp,
    title: "Automated Daily Profits",
    desc: "Plans from 1.7% to 2.5% per day, credited every 24 hours to your Investment Wallet.",
    cta: "Explore plans",
    href: "#plans",
  },
  {
    icon: Bot,
    title: "Quantitative AI Trading",
    desc: "Momentum, EMA and grid-scalping strategies with automated risk controls.",
    cta: "Explore AI trading",
    href: "#trading",
  },
  {
    icon: Wallet,
    title: "3-Wallet Smart Partitioning",
    desc: "Separate trading capital and investment principal into distinct vaults.",
    cta: "Explore wallets",
    href: "#wallets",
  },
  {
    icon: Users,
    title: "5% Lifetime Affiliate Program",
    desc: "Earn 5% on referral profits, milestone cash bonuses and up to $1,000 monthly leaderboard prizes.",
    cta: "Explore referrals",
    href: "#referral",
  },
  {
    icon: ArrowLeftRight,
    title: "Instant Peer-to-Peer Transfers",
    desc: "Send funds by Email or User ID with instant settlement and a flat $0.10 fee.",
    cta: "Explore transfers",
    href: "#wallets",
  },
];

/* ---------- Referral ---------- */
export const REFERRAL_POINTS = [
  "Claim at 5 referrals for $5.00, or keep going and skip to a bigger payout.",
  "Counter resets to 0 after every claim, so you can earn unlimited bonuses.",
  "Targets run from 5 referrals ($5) up to 150 referrals ($180).",
];

export const REFERRAL_TIERS = [
  { referrals: 5, bonus: 5 },
  { referrals: 10, bonus: 10 },
  { referrals: 15, bonus: 18 },
  { referrals: 20, bonus: 25 },
  { referrals: 30, bonus: 40 },
  { referrals: 50, bonus: 65 },
  { referrals: 100, bonus: 120 },
  { referrals: 150, bonus: 180 },
];

/* ---------- How it works ---------- */
export const STEPS: IconItem[] = [
  {
    icon: UserPlus,
    title: "Create account",
    desc: "Sign up in under 60 seconds and enable 2FA.",
  },
  {
    icon: Download,
    title: "Deposit crypto",
    desc: "Fund your Main Wallet with USDT or USDC via TRC-20, BEP-20 or ERC-20.",
  },
  {
    icon: SlidersHorizontal,
    title: "Pick a strategy",
    desc: "Activate a daily profit plan or AI trading package.",
  },
  {
    icon: Banknote,
    title: "Collect & withdraw",
    desc: "Profits credit every 24 hours. Withdraw to your Main Wallet when cycles end.",
  },
];

/* ---------- Wallets ---------- */
export const WALLETS: IconItem[] = [
  {
    icon: Landmark,
    title: "Main Wallet",
    desc: "Central hub for deposits and withdrawals.",
  },
  {
    icon: PiggyBank,
    title: "Investment Wallet",
    desc: "Daily profit growth and reinvestment.",
  },
  {
    icon: CandlestickChart,
    title: "Trading Wallet",
    desc: "Dedicated margin for AI strategies and manual orders.",
  },
  {
    icon: ArrowLeftRight,
    title: "Zero-Fee Transfers",
    desc: "Move funds between your wallets instantly.",
  },
];

/* ---------- Pricing ---------- */
export type Plan = {
  name: string;
  price: string;
  unit: string;
  desc: string;
  cta: string;
  popular?: boolean;
};

export const PLANS: Plan[] = [
  {
    name: "Starter",
    price: "1.7%",
    unit: "/day",
    desc: "Daily profit plan from $30, credited every 24 hours.",
    cta: "Start Plan",
  },
  {
    name: "Growth",
    price: "2.1%",
    unit: "/day",
    desc: "Higher daily rate with automatic crediting to your Investment Wallet.",
    cta: "Start Plan",
  },
  {
    name: "AI Trading",
    price: "$100",
    unit: "min",
    desc: "Algorithmic trading with a 15-day lock and daily P&L updates.",
    cta: "Activate",
  },
  {
    name: "Elite",
    price: "2.5%",
    unit: "/day",
    desc: "Our top daily profit tier with a live dividend countdown.",
    cta: "Go Elite",
    popular: true,
  },
];

/* ---------- Security ---------- */
export const SECURITY: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: KeyRound, title: "2FA", desc: "Google Authenticator" },
  { icon: BadgeCheck, title: "KYC", desc: "4-step verification" },
  { icon: Fingerprint, title: "IP Tracking", desc: "Login audit trail" },
  { icon: Headset, title: "24/7", desc: "Ticket support" },
];

/* ---------- FAQ ---------- */
export const FAQ = [
  {
    q: "Can I claim multiple referral targets simultaneously?",
    a: "No. Once you claim a target, your counter resets to 0. Claim smaller targets along the way or hold out for higher tier rewards.",
  },
  {
    q: "When are AI trading results credited?",
    a: "Results are recorded and credited every 24 hours inside your strategy dashboard.",
  },
  {
    q: "Can I cancel my AI Trading Package before 15 days?",
    a: "No. Funds are deployed in open positions, so capital stays locked for the full 15-day cycle.",
  },
  {
    q: "What is the minimum withdrawal amount?",
    a: "Once a cycle completes or a bonus is claimed, funds can be withdrawn according to standard platform wallet limits.",
  },
];

/* ---------- Footer ---------- */
export const FOOTER_COLUMNS: Record<string, string[]> = {
  Products: ["Daily Profit", "AI Trading", "Manual Trading"],
  Wallets: ["Deposit", "Withdraw", "Transfer", "History"],
  Community: ["Live Chat", "Announcements", "Referral Leaderboard", "Support"],
  Legal: ["Privacy", "Terms", "Security"],
};
```

## 6. `app/(public)/_components/ui.tsx` (new, beUI-style primitives)

```tsx
// app/(public)/_components/ui.tsx
"use client";

import Link from "next/link";
import { Fragment, useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { cn } from "@/lib/utils";
import { EASE_OUT, SPRING_LAYOUT, SPRING_MOUSE, SPRING_PRESS } from "@/lib/ease";

/* ------------------------------------------------------------------ */
/* Reveal: fade + rise when scrolled into view                         */
/* ------------------------------------------------------------------ */
export function Reveal({
  children,
  delay = 0,
  y = 24,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* ButtonLink: spring-pressed pill button                              */
/* ------------------------------------------------------------------ */
const MotionLink = motion.create(Link);

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: {
  href: string;
  variant?: "primary" | "ghost";
  size?: "md" | "lg";
  className?: string;
  children: ReactNode;
}) {
  return (
    <MotionLink
      href={href}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      transition={SPRING_PRESS}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium outline-none transition-colors",
        "focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        size === "md" ? "h-11 px-6 text-sm" : "h-12 px-8 text-base",
        variant === "primary"
          ? "bg-primary text-primary-foreground shadow-[0_8px_30px_-10px_var(--primary)] hover:brightness-110"
          : "border border-border-strong text-foreground hover:bg-foreground/5",
        className,
      )}
    >
      {children}
    </MotionLink>
  );
}

/* ------------------------------------------------------------------ */
/* TiltCard: 3D tilt + cursor glare (mouse only, skipped on touch)     */
/* ------------------------------------------------------------------ */
export function TiltCard({
  children,
  className,
  max = 6,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const sx = useSpring(px, SPRING_MOUSE);
  const sy = useSpring(py, SPRING_MOUSE);
  const rotateY = useTransform(sx, [0, 1], [-max, max]);
  const rotateX = useTransform(sy, [0, 1], [max, -max]);
  const gx = useTransform(sx, (v) => `${v * 100}%`);
  const gy = useTransform(sy, (v) => `${v * 100}%`);
  const glare = useMotionTemplate`radial-gradient(360px circle at ${gx} ${gy}, rgb(255 255 255 / 0.09), transparent 60%)`;
  const glareOpacity = useSpring(0, { stiffness: 200, damping: 25 });

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
    glareOpacity.set(1);
  };
  const onLeave = () => {
    px.set(0.5);
    py.set(0.5);
    glareOpacity.set(0);
  };

  return (
    <div className="h-full [perspective:1000px]">
      <motion.div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        style={reduce ? undefined : { rotateX, rotateY, transformStyle: "preserve-3d" }}
        className={cn("relative h-full", className)}
      >
        {children}
        {!reduce && (
          <motion.div
            aria-hidden
            style={{ background: glare, opacity: glareOpacity }}
            className="pointer-events-none absolute inset-0 rounded-[inherit]"
          />
        )}
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* NumberTicker: count-up for values like "$10M+", "99.98%", "50,000+" */
/* ------------------------------------------------------------------ */
function parseNumber(value: string) {
  const m = value.match(/^([^\d]*)(\d[\d,]*\.?\d*)(.*)$/);
  if (!m) return null;
  const [, prefix, num, suffix] = m;
  return {
    prefix,
    suffix,
    target: parseFloat(num.replace(/,/g, "")),
    decimals: num.includes(".") ? num.split(".")[1].length : 0,
    grouped: num.includes(","),
  };
}

export function NumberTicker({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const [text, setText] = useState(value);

  useEffect(() => {
    const p = parseNumber(value);
    if (!p || !inView || reduce) return;
    const controls = animate(0, p.target, {
      duration: 1.6,
      ease: EASE_OUT,
      onUpdate: (v) =>
        setText(
          p.prefix +
            v.toLocaleString("en-US", {
              minimumFractionDigits: p.decimals,
              maximumFractionDigits: p.decimals,
              useGrouping: p.grouped,
            }) +
            p.suffix,
        ),
      onComplete: () => setText(value),
    });
    return () => controls.stop();
  }, [inView, reduce, value]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {text}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* PillTabs: spring layoutId indicator                                 */
/* ------------------------------------------------------------------ */
export function PillTabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: readonly T[];
  value: T;
  onChange: (t: T) => void;
  className?: string;
}) {
  const id = useId();
  return (
    <div
      role="tablist"
      className={cn(
        "relative inline-flex rounded-full border border-border bg-background/60 p-1",
        className,
      )}
    >
      {tabs.map((t) => {
        const active = t === value;
        return (
          <button
            key={t}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(t)}
            className="relative rounded-full px-3 py-1.5 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-primary/60 sm:px-4"
          >
            {active && (
              <motion.span
                layoutId={id}
                transition={SPRING_LAYOUT}
                className="absolute inset-0 rounded-full bg-primary"
              />
            )}
            <span
              className={cn(
                "relative z-10 transition-colors",
                active ? "text-primary-foreground" : "text-muted-foreground",
              )}
            >
              {t}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* TextReveal: word-by-word spring reveal for the hero heading         */
/* ------------------------------------------------------------------ */
export function TextReveal({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const words = text.split(" ");
  return (
    <h1 aria-label={text} className={className}>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span
            aria-hidden
            className="-mb-[0.12em] inline-block overflow-hidden pb-[0.12em] align-bottom"
          >
            <motion.span
              className="inline-block"
              initial={reduce ? false : { y: "110%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", duration: 0.8, bounce: 0.2, delay: 0.05 * i }}
            >
              {w}
            </motion.span>
          </span>{" "}
        </Fragment>
      ))}
    </h1>
  );
}
```

## 7. Small shared files

**`logo.tsx`**

```tsx
// app/(public)/_components/logo.tsx
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground",
        className,
      )}
    >
      <span className="grid h-6 w-6 place-items-center rounded-lg bg-primary text-[13px] font-bold text-primary-foreground">
        Q
      </span>
      Qouantex
    </Link>
  );
}
```

**`section-heading.tsx`**

```tsx
// app/(public)/_components/section-heading.tsx
import { H2 } from "./data";
import { Reveal } from "./ui";

export function SectionHeading({
  title,
  subtitle,
  eyebrow,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
}) {
  return (
    <Reveal className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
      {eyebrow && (
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {eyebrow}
        </p>
      )}
      <h2 className={H2}>{title}</h2>
      {subtitle && (
        <p className="mt-4 text-base text-muted-foreground text-pretty sm:text-lg">
          {subtitle}
        </p>
      )}
    </Reveal>
  );
}
```

**`icon-card.tsx`**

```tsx
// app/(public)/_components/icon-card.tsx
import { CARD, type IconItem } from "./data";
import { Reveal, TiltCard } from "./ui";

export function IconCard({
  icon: Icon,
  title,
  desc,
  index = 0,
  number,
}: IconItem & { index?: number; number?: string }) {
  return (
    <Reveal delay={index * 0.08} className="h-full">
      <TiltCard className={`${CARD} group flex flex-col p-6`} max={5}>
        {number && (
          <span className="absolute right-5 top-4 text-5xl font-semibold tracking-tighter text-foreground/[0.06]">
            {number}
          </span>
        )}
        <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl border border-border bg-background/60 text-muted-foreground transition-colors duration-300 group-hover:border-primary/40 group-hover:text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="mb-2 text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
      </TiltCard>
    </Reveal>
  );
}
```

## 8. `page.tsx`

```tsx
// app/(public)/page.tsx
import type { Metadata } from "next";
import { Navbar } from "./_components/navbar";
import { Hero } from "./_components/hero";
import { Metrics } from "./_components/metrics";
import { Features } from "./_components/features";
import { Referral } from "./_components/referral";
import { AiTrading } from "./_components/ai-trading";
import { HowItWorks } from "./_components/how-it-works";
import { Wallets } from "./_components/wallets";
import { Pricing } from "./_components/pricing";
import { Security } from "./_components/security";
import { Faq } from "./_components/faq";
import { Footer } from "./_components/footer";

export const metadata: Metadata = {
  title: "Qouantex - Crypto Wealth & Trading Ecosystem",
};

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-background font-sans text-foreground antialiased">
      <Navbar />
      <main className="pt-24 sm:pt-32">
        <Hero />
        <Metrics />
        <Features />
        <Referral />
        <AiTrading />
        <HowItWorks />
        <Wallets />
        <Pricing />
        <Security />
        <Faq />
      </main>
      <Footer />
    </div>
  );
}
```

## 9. Navbar and theme toggle

**`navbar.tsx`**

```tsx
// app/(public)/_components/navbar.tsx
"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { ButtonLink } from "./ui";
import { SPRING_PANEL } from "@/lib/ease";

const LINKS = [
  { label: "Features", href: "#features" },
  { label: "Trading", href: "#trading" },
  { label: "Referral", href: "#referral" },
  { label: "Plans", href: "#plans" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <nav className="pointer-events-none fixed inset-x-0 top-3 z-50 px-3 sm:top-4 sm:px-6">
      <div className="relative mx-auto max-w-3xl">
        <div className="glass pointer-events-auto flex items-center justify-between rounded-full py-2 pl-5 pr-2">
          <Logo />

          <div className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <ButtonLink href="/signup" className="hidden sm:inline-flex">
              Get Started
            </ButtonLink>
            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
              className="grid h-10 w-10 place-items-center rounded-full text-foreground transition-colors hover:bg-foreground/5 md:hidden"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={SPRING_PANEL}
              style={{ transformOrigin: "top center" }}
              className="glass pointer-events-auto absolute inset-x-0 top-full mt-2 rounded-3xl p-2 md:hidden"
            >
              {LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-2xl px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5"
                >
                  {l.label}
                </a>
              ))}
              <div className="p-2 sm:hidden">
                <ButtonLink href="/signup" className="w-full">
                  Get Started
                </ButtonLink>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
```

**`theme-toggle.tsx`**

```tsx
// app/(public)/_components/theme-toggle.tsx
"use client";

import { useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "crypto_invest_theme";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

const getSnapshot = () => document.documentElement.classList.contains("dark");
const getServerSnapshot = () => true; // app defaults to dark

type StartVT = (cb: () => void) => { ready: Promise<void> };

export function ThemeToggle() {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const apply = (next: "light" | "dark") => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(next);
    root.setAttribute("data-theme", next);
    root.style.colorScheme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable */
    }
  };

  const toggle = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const next = isDark ? "light" : "dark";
    const start = (
      document as unknown as { startViewTransition?: StartVT }
    ).startViewTransition?.bind(document);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!start || reduce) {
      apply(next);
      return;
    }

    const r = e.currentTarget.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    const transition = start(() => apply(next));
    await transition.ready;
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${radius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 600,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        pseudoElement: "::view-transition-new(root)",
      },
    );
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle light/dark mode"
      className="grid h-10 w-10 place-items-center rounded-full text-foreground transition-colors hover:bg-foreground/5"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isDark ? "sun" : "moon"}
          initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.2 }}
          className="grid place-items-center"
        >
          {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
```

## 10. Hero

**`hero.tsx`**

```tsx
// app/(public)/_components/hero.tsx
import { ArrowRight } from "lucide-react";
import { SECTION } from "./data";
import { HeroPreview } from "./hero-preview";
import { ButtonLink, Reveal, TextReveal } from "./ui";
import { cn } from "@/lib/utils";

export function Hero() {
  return (
    <section
      className={cn(SECTION, "relative flex flex-col items-center text-center")}
    >
      {/* ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[420px] w-[min(900px,100%)] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px] mask-radial-fade"
      />

      {/* Announcement pill with shimmer text */}
      <Reveal className="mb-6 sm:mb-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 py-1.5 pl-1.5 pr-3 backdrop-blur sm:pr-4">
          <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
            New
          </span>
          <span className="animate-shimmer bg-[linear-gradient(110deg,var(--muted-foreground)_35%,var(--foreground)_50%,var(--muted-foreground)_65%)] bg-[length:200%_100%] bg-clip-text text-xs font-medium text-transparent sm:text-sm">
            Referral Milestone Bonuses are live
          </span>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
        </span>
      </Reveal>

      <TextReveal
        text="The all-in-one crypto wealth & trading ecosystem"
        className="mb-5 max-w-4xl text-4xl font-semibold leading-[1.05] tracking-tight text-balance text-foreground sm:mb-6 sm:text-5xl md:text-6xl lg:text-7xl"
      />

      <Reveal delay={0.25}>
        <p className="mx-auto mb-8 max-w-xl text-base text-muted-foreground text-pretty sm:mb-10 sm:text-lg">
          Automated daily profit plans and professional AI trading, organized in
          a segregated 3-wallet system with 2FA, KYC and login tracking built
          in.
        </p>
      </Reveal>

      <Reveal delay={0.35} className="w-full sm:w-auto">
        <div className="mb-14 flex w-full flex-col gap-3 sm:mb-20 sm:w-auto sm:flex-row">
          <ButtonLink href="/signin" size="lg" className="w-full sm:w-auto">
            Dashboard
          </ButtonLink>
          <ButtonLink
            href="/signup"
            variant="ghost"
            size="lg"
            className="w-full sm:w-auto"
          >
            Get Started
          </ButtonLink>
        </div>
      </Reveal>

      <Reveal delay={0.45} y={40} className="w-full max-w-5xl">
        <HeroPreview />
      </Reveal>
    </section>
  );
}
```

**`hero-preview.tsx`** (new)

```tsx
// app/(public)/_components/hero-preview.tsx
"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Clock } from "lucide-react";
import { DividendCountdown } from "./dividend-countdown";
import { WALLET_PREVIEW, WALLET_TABS, type WalletTab } from "./data";
import { NumberTicker, PillTabs, TiltCard } from "./ui";
import { cn } from "@/lib/utils";

export function HeroPreview() {
  const [tab, setTab] = useState<WalletTab>("Investment");
  const data = WALLET_PREVIEW[tab];

  return (
    <TiltCard
      max={2.5}
      className="rounded-[28px] border border-border bg-card/70 p-2 shadow-2xl shadow-black/20 sm:p-3"
    >
      <div className="rounded-3xl border border-border bg-background/60 p-4 text-left sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Portfolio Value
            </div>
            <NumberTicker
              key={tab}
              value={data.value}
              className="block text-3xl font-semibold tracking-tight sm:text-4xl"
            />
          </div>
          <PillTabs tabs={WALLET_TABS} value={tab} onChange={setTab} />
        </div>

        {/* P&L */}
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4"
        >
          {data.pnl.map((p) => (
            <div
              key={p.label}
              className="rounded-2xl border border-border bg-card p-3 sm:p-4"
            >
              <div className="mb-1 text-xs text-muted-foreground">
                {p.label} P&amp;L
              </div>
              <div
                className={cn(
                  "text-base font-semibold sm:text-lg",
                  p.value.startsWith("+") ? "text-success" : "text-muted-foreground",
                )}
              >
                {p.value}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Countdown */}
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 sm:p-4">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
              <Clock className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">Next dividend credit</div>
              <DividendCountdown />
            </div>
          </div>
          <div className="flex items-end gap-1" aria-hidden>
            {[24, 32, 16, 28].map((h, i) => (
              <div
                key={i}
                style={{ height: h, animationDelay: `${i * 120}ms` }}
                className="w-1 animate-pulse rounded-full bg-primary"
              />
            ))}
            <div className="h-5 w-1 rounded-full bg-border-strong" />
            <div className="h-3 w-1 rounded-full bg-border-strong" />
          </div>
        </div>
      </div>
    </TiltCard>
  );
}
```

**`dividend-countdown.tsx`**

```tsx
// app/(public)/_components/dividend-countdown.tsx
"use client";

import { useEffect, useState } from "react";

const pad = (n: number) => String(n).padStart(2, "0");
const secondsLeft = () => 86400 - (Math.floor(Date.now() / 1000) % 86400);

export function DividendCountdown() {
  const [s, setS] = useState<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => setS(secondsLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  const label =
    s === null
      ? "--:--:--"
      : [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60]
          .map(pad)
          .join(":");

  return (
    <div className="font-mono text-xs tabular-nums text-muted-foreground">
      {label}
    </div>
  );
}
```

## 11. Metrics

```tsx
// app/(public)/_components/metrics.tsx
import { METRICS, SECTION } from "./data";
import { NumberTicker, Reveal } from "./ui";
import { cn } from "@/lib/utils";

export function Metrics() {
  return (
    <section className={SECTION}>
      <Reveal>
        <p className="mb-6 text-center text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground sm:mb-8">
          The platform at a glance
        </p>
      </Reveal>
      {/* 2 cols mobile, 3+2 tablet, 5 desktop */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-6 sm:gap-4 lg:grid-cols-10">
        {METRICS.map((m, i) => (
          <Reveal
            key={m.label}
            delay={i * 0.06}
            className={cn(
              "lg:col-span-2",
              i < 3 ? "sm:col-span-2" : "sm:col-span-3",
              i === METRICS.length - 1 && "col-span-2",
            )}
          >
            <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-border bg-card px-4 py-6 text-center sm:py-8">
              <NumberTicker
                value={m.value}
                className="text-3xl font-semibold tracking-tight sm:text-4xl"
              />
              <div className="mt-1.5 text-xs text-muted-foreground sm:text-sm">
                {m.label}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
```

## 12. Features

```tsx
// app/(public)/_components/features.tsx
import { ArrowRight } from "lucide-react";
import { CARD, FEATURES, SECTION } from "./data";
import { SectionHeading } from "./section-heading";
import { Reveal, TiltCard } from "./ui";
import { cn } from "@/lib/utils";

export function Features() {
  return (
    <section id="features" className={SECTION}>
      <SectionHeading
        eyebrow="Features"
        title="Everything your capital needs"
        subtitle="Five systems, one dashboard: grow, trade, transfer and earn from your network."
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {FEATURES.map((f, i) => {
          const Icon = f.icon;
          return (
            <Reveal
              key={f.title}
              delay={(i % 3) * 0.08}
              className={cn("h-full", i === 0 && "md:col-span-2 lg:col-span-2")}
            >
              <TiltCard className={cn(CARD, "group flex flex-col p-5 sm:p-6")} max={4}>
                <div className="relative mb-6 grid h-32 place-items-center overflow-hidden rounded-2xl border border-border bg-background/60 sm:h-40">
                  <div
                    aria-hidden
                    className="absolute inset-0 opacity-60 [background-image:radial-gradient(var(--border-strong)_1px,transparent_1px)] [background-size:16px_16px] mask-radial-fade"
                  />
                  <div
                    aria-hidden
                    className="absolute h-24 w-24 rounded-full bg-primary/0 blur-2xl transition-colors duration-500 group-hover:bg-primary/30"
                  />
                  <Icon className="relative h-9 w-9 text-muted-foreground transition-all duration-300 group-hover:scale-110 group-hover:text-primary sm:h-10 sm:w-10" />
                </div>
                <h3 className="mb-2 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                  {f.title}
                </h3>
                <p className="mb-5 grow text-sm leading-relaxed text-muted-foreground">
                  {f.desc}
                </p>
                <a
                  href={f.href}
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary"
                >
                  {f.cta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
              </TiltCard>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
```

## 13. Referral

```tsx
// app/(public)/_components/referral.tsx
"use client";

import { motion } from "motion/react";
import { ArrowRight, CheckCircle2, Gift } from "lucide-react";
import { REFERRAL_POINTS, REFERRAL_TIERS, SECTION } from "./data";
import { Reveal } from "./ui";
import { EASE_OUT, SPRING_PRESS } from "@/lib/ease";

export function Referral() {
  return (
    <section
      id="referral"
      className={`${SECTION} grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12`}
    >
      {/* Copy */}
      <Reveal className="flex flex-col gap-5 sm:gap-6 lg:col-span-5">
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Referral Milestone Bonus System
        </span>
        <h2 className="text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl lg:text-5xl">
          Invite friends. Claim instant cash.
        </h2>
        <p className="text-base text-muted-foreground text-pretty sm:text-lg">
          Meet your active referral target and claim a cash bonus straight to
          your account. Claim early, or skip ahead and save progress for a
          bigger payout.
        </p>
        <ul className="space-y-3 sm:space-y-4">
          {REFERRAL_POINTS.map((t) => (
            <li key={t} className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <span className="text-sm text-muted-foreground">{t}</span>
            </li>
          ))}
        </ul>
      </Reveal>

      {/* Targets card */}
      <Reveal delay={0.1} className="lg:col-span-7">
        <div className="rounded-[28px] border border-border bg-card p-3 sm:p-5">
          <div className="rounded-3xl border border-border bg-background/60 p-4 sm:p-6">
            <div className="mb-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Referral Targets &amp; Cash Rewards
            </div>

            <div className="mb-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
              {REFERRAL_TIERS.map((t) => (
                <motion.div
                  key={t.referrals}
                  whileHover={{ y: -3, scale: 1.03 }}
                  transition={SPRING_PRESS}
                  className="rounded-2xl border border-border bg-card p-3 text-center"
                >
                  <div className="text-xs text-muted-foreground">
                    {t.referrals} Referrals
                  </div>
                  <div className="text-lg font-semibold tabular-nums">
                    ${t.bonus}.00
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Flow */}
            <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3 font-mono text-xs text-muted-foreground sm:p-4">
              <span>0 Referrals</span>
              <ArrowRight className="h-3.5 w-3.5" />
              <span>Reach</span>
              <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-primary">
                10 Referrals
              </span>
              <ArrowRight className="h-3.5 w-3.5" />
              <span>Claim $10.00</span>
              <ArrowRight className="h-3.5 w-3.5" />
              <span>Counter resets to 0</span>
            </div>

            {/* Progress */}
            <div>
              <div className="mb-2 flex justify-between text-xs text-muted-foreground">
                <span>Progress to 10 referrals</span>
                <span className="tabular-nums">7 / 10</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-border-strong">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: "70%" }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.1, delay: 0.3, ease: EASE_OUT }}
                  className="h-full rounded-full bg-primary"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center gap-4 border-t border-border pt-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                <Gift className="h-5 w-5" />
              </div>
              <div className="text-sm text-muted-foreground">
                Plus <b className="text-foreground">5% lifetime commission</b>{" "}
                on referral profits.
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
```

## 14. AI Trading

```tsx
// app/(public)/_components/ai-trading.tsx
"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { SECTION } from "./data";
import { Reveal } from "./ui";
import { EASE_OUT } from "@/lib/ease";

const DAYS = [
  { day: 1, text: "+$2.50 Profit", loss: false },
  { day: 2, text: "+$1.20 Profit", loss: false },
  { day: 3, text: "-$0.80 Loss", loss: true },
  { day: 4, text: "+$3.10 Profit", loss: false },
  { day: 5, text: "+$1.70 Profit", loss: false },
];

const CHIPS = ["From $100", "15-day strategy lock", "Daily P&L updates"];

const LINES: ReactNode[] = [
  <>
    <span className="text-violet">package</span>
    {" = AI_Trading(min="}
    <span className="text-success">{'"$100.00"'}</span>
    {", lock="}
    <span className="text-success">{'"15 days"'}</span>
    {")"}
  </>,
  "",
  ...DAYS.map((d) => (
    <>
      <span className="text-muted-foreground">{`Day ${d.day}:  `}</span>
      <span className={d.loss ? "text-destructive" : "text-success"}>{d.text}</span>
    </>
  )),
  "",
  <span className="text-muted-foreground">
    # Day 15 -&gt; principal + net P&amp;L unlocked
  </span>,
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } },
};
const line = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: EASE_OUT } },
};

export function AiTrading() {
  return (
    <section
      id="trading"
      className={`${SECTION} grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14`}
    >
      {/* Code window */}
      <Reveal className="order-2 lg:order-1">
        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-2xl shadow-black/10">
          <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
            <div className="flex gap-2" aria-hidden>
              <span className="h-3 w-3 rounded-full bg-border-strong" />
              <span className="h-3 w-3 rounded-full bg-border-strong" />
              <span className="h-3 w-3 rounded-full bg-border-strong" />
            </div>
            <span className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
              strategy.py
            </span>
          </div>
          <motion.pre
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="overflow-x-auto p-4 font-mono text-xs leading-7 text-foreground/85 sm:p-6 sm:text-sm"
          >
            <code className="block">
              {LINES.map((l, i) => (
                <motion.div
                  key={i}
                  variants={line}
                  className="flex whitespace-pre-wrap break-words"
                >
                  <span className="w-6 shrink-0 select-none text-muted-foreground/50">
                    {i + 1}
                  </span>
                  <span>{l || " "}</span>
                </motion.div>
              ))}
            </code>
          </motion.pre>
        </div>
      </Reveal>

      {/* Copy */}
      <Reveal delay={0.1} className="order-1 flex flex-col gap-5 sm:gap-6 lg:order-2">
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          AI Trading
        </span>
        <h2 className="text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl lg:text-5xl">
          Quantitative AI Trading
        </h2>
        <p className="text-base text-muted-foreground text-pretty sm:text-lg">
          Algorithmic execution 24/7 on top pairs. Every 24 hours your real
          daily performance is updated. Returns are never fixed or guaranteed
          and reflect genuine market movement.
        </p>
        <div className="flex flex-wrap gap-2.5">
          {CHIPS.map((c) => (
            <span
              key={c}
              className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground"
            >
              {c}
            </span>
          ))}
        </div>
        <a
          href="#plans"
          className="group inline-flex items-center gap-1 text-sm font-medium text-primary"
        >
          View AI strategies
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </a>
      </Reveal>
    </section>
  );
}
```

## 15. How it works and Wallets

**`how-it-works.tsx`**

```tsx
// app/(public)/_components/how-it-works.tsx
import { SECTION, STEPS } from "./data";
import { IconCard } from "./icon-card";
import { SectionHeading } from "./section-heading";

export function HowItWorks() {
  return (
    <section id="how-it-works" className={SECTION}>
      <SectionHeading
        eyebrow="Getting started"
        title="How it works"
        subtitle="From sign-up to withdrawal in four steps."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {STEPS.map((s, i) => (
          <IconCard key={s.title} {...s} index={i} number={`0${i + 1}`} />
        ))}
      </div>
    </section>
  );
}
```

**`wallets.tsx`**

```tsx
// app/(public)/_components/wallets.tsx
import { SECTION, WALLETS } from "./data";
import { IconCard } from "./icon-card";
import { SectionHeading } from "./section-heading";

export function Wallets() {
  return (
    <section id="wallets" className={SECTION}>
      <SectionHeading
        eyebrow="Wallets"
        title="Three wallets. Total clarity."
        subtitle="Trading risk never bleeds into your long-term investment. Internal transfers are zero-fee."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {WALLETS.map((w, i) => (
          <IconCard key={w.title} {...w} index={i} />
        ))}
      </div>
    </section>
  );
}
```

## 16. Pricing

```tsx
// app/(public)/_components/pricing.tsx
"use client";

import { motion } from "motion/react";
import { CARD, PLANS, SECTION } from "./data";
import { SectionHeading } from "./section-heading";
import { ButtonLink, Reveal } from "./ui";
import { SPRING_PRESS } from "@/lib/ease";
import { cn } from "@/lib/utils";

export function Pricing() {
  return (
    <section id="plans" className={SECTION}>
      <SectionHeading
        eyebrow="Plans"
        title="Choose your strategy"
        subtitle="Daily profit tiers and AI trading. Start from $30."
      />
      <div className="grid grid-cols-1 items-stretch gap-5 pt-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        {PLANS.map((p, i) => (
          <Reveal key={p.name} delay={i * 0.08} className="h-full">
            <motion.div
              whileHover={{ y: -4 }}
              transition={SPRING_PRESS}
              className={cn(
                "relative flex h-full flex-col p-6",
                p.popular
                  ? "rounded-3xl border border-primary/60 bg-card shadow-[0_20px_60px_-24px_var(--primary)]"
                  : CARD,
              )}
            >
              {p.popular && (
                <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary-foreground">
                  Most Popular
                </div>
              )}
              <h3 className="mb-3 text-base font-medium text-foreground">
                {p.name}
              </h3>
              <div className="mb-5 flex items-baseline text-4xl font-semibold tracking-tight text-foreground">
                {p.price}
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  {p.unit}
                </span>
              </div>
              <p className="mb-6 grow text-sm leading-relaxed text-muted-foreground">
                {p.desc}
              </p>
              <ButtonLink
                href="/signup"
                variant={p.popular ? "primary" : "ghost"}
                className="w-full"
              >
                {p.cta}
              </ButtonLink>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
```

## 17. Security

```tsx
// app/(public)/_components/security.tsx
import { ArrowRight } from "lucide-react";
import { H2, SECTION, SECURITY } from "./data";
import { Reveal } from "./ui";

export function Security() {
  return (
    <section
      id="security"
      className={`${SECTION} grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14`}
    >
      <Reveal className="flex flex-col gap-5 sm:gap-6">
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Security
        </span>
        <h2 className={H2}>Bank-grade safety &amp; compliance</h2>
        <p className="text-base text-muted-foreground text-pretty sm:text-lg">
          Google Authenticator 2FA with backup codes, a 4-step KYC flow, a full
          login audit trail with IP and device flags, and one-click session
          revocation. Withdrawals require 2FA confirmation.
        </p>
        <a
          href="#"
          className="group inline-flex items-center gap-1 text-sm font-medium text-primary"
        >
          Learn about security
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </a>
      </Reveal>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {SECURITY.map((s, i) => {
          const Icon = s.icon;
          return (
            <Reveal key={s.title} delay={i * 0.08}>
              <div className="group flex h-36 flex-col items-center justify-center rounded-3xl border border-border bg-card p-4 text-center transition-colors hover:border-primary/40 sm:h-40">
                <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl border border-border bg-background/60 text-muted-foreground transition-colors group-hover:text-primary">
                  <Icon className="h-[18px] w-[18px]" />
                </div>
                <span className="text-lg font-semibold text-foreground">
                  {s.title}
                </span>
                <span className="text-xs text-muted-foreground">{s.desc}</span>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
```

## 18. FAQ (beUI Bouncy Accordion)

```tsx
// app/(public)/_components/faq.tsx
import { CircleHelp } from "lucide-react";
import { BouncyAccordion } from "@/components/motion/bouncy-accordion";
import { FAQ, SECTION } from "./data";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./ui";

const items = FAQ.map((f, i) => ({
  id: `faq-${i}`,
  title: f.q,
  description: f.a,
  icon: <CircleHelp className="h-4 w-4" />,
}));

export function Faq() {
  return (
    <section className={`${SECTION} max-w-3xl`}>
      <SectionHeading eyebrow="FAQ" title="Frequently asked questions" />
      <Reveal>
        <BouncyAccordion
          items={items}
          defaultValue="faq-0"
          classNames={{
            // the default title truncates; allow wrapping on small screens
            title: "whitespace-normal! overflow-visible! text-clip! py-3 leading-snug",
            trigger: "items-center",
          }}
        />
      </Reveal>
    </section>
  );
}
```

## 19. Footer

**`footer.tsx`**

```tsx
// app/(public)/_components/footer.tsx
import { Globe, MessageCircle } from "lucide-react";
import { FOOTER_COLUMNS } from "./data";
import { Logo } from "./logo";
import { NewsletterForm } from "./newsletter-form";
import { ButtonLink, Reveal } from "./ui";

export function Footer() {
  return (
    <footer className="w-full border-t border-border bg-card/40 px-4 pb-10 pt-16 sm:px-6 md:pt-24 lg:px-8">
      {/* Final CTA */}
      <Reveal className="relative mx-auto mb-16 max-w-7xl overflow-hidden rounded-[32px] border border-border bg-card px-6 py-14 text-center md:mb-20 md:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-64 w-[min(700px,100%)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/25 blur-[100px]"
        />
        <h2 className="relative mb-8 text-4xl font-semibold tracking-tighter text-balance text-foreground sm:text-6xl md:text-7xl">
          Ready to grow?
        </h2>
        <ButtonLink href="/signup" size="lg" className="relative">
          Create Your Account
        </ButtonLink>
      </Reveal>

      {/* Link grid */}
      <div className="mx-auto mb-14 grid max-w-7xl grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4 lg:grid-cols-6 lg:gap-12">
        <div className="col-span-2 md:col-span-4 lg:col-span-2">
          <Logo className="mb-5 text-xl" />
          <p className="mb-6 max-w-xs text-sm text-muted-foreground">
            The all-in-one intelligent crypto wealth and trading ecosystem.
          </p>
          <NewsletterForm />
        </div>

        {Object.entries(FOOTER_COLUMNS).map(([heading, links]) => (
          <div key={heading}>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-foreground">
              {heading}
            </h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {links.map((l) => (
                <li key={l}>
                  <a className="transition-colors hover:text-foreground" href="#">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-border pt-8 text-center md:flex-row md:text-left">
        <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">
          &copy; 2026 Qouantex. Trading and investing involve risk; past
          performance does not guarantee future results.
        </p>
        <div className="flex gap-2 text-muted-foreground">
          <a
            href="#"
            aria-label="Website"
            className="grid h-9 w-9 place-items-center rounded-full transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            <Globe className="h-[18px] w-[18px]" />
          </a>
          <a
            href="#"
            aria-label="Chat"
            className="grid h-9 w-9 place-items-center rounded-full transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            <MessageCircle className="h-[18px] w-[18px]" />
          </a>
        </div>
      </div>
    </footer>
  );
}
```

**`newsletter-form.tsx`** (new)

```tsx
// app/(public)/_components/newsletter-form.tsx
"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Check } from "lucide-react";
import { SPRING_PRESS } from "@/lib/ease";

export function NewsletterForm() {
  const [done, setDone] = useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        // TODO: send the email to your API here
        setDone(true);
      }}
      className="flex w-full max-w-sm flex-col gap-2"
    >
      <label htmlFor="newsletter-email" className="text-xs font-medium text-foreground">
        Subscribe to updates
      </label>
      <div className="flex items-center gap-2 rounded-full border border-border bg-background p-1 transition-colors focus-within:border-border-strong">
        <input
          id="newsletter-email"
          type="email"
          required
          placeholder="Email address"
          className="min-w-0 flex-1 bg-transparent px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        <motion.button
          type="submit"
          whileTap={{ scale: 0.95 }}
          transition={SPRING_PRESS}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          {done ? (
            <>
              <Check className="h-4 w-4" /> Joined
            </>
          ) : (
            "Join"
          )}
        </motion.button>
      </div>
    </form>
  );
}
```

## What changed

- **Responsive layouts:**
  - Metrics: 2 columns on mobile, 3+2 on tablet, 5 on desktop.
  - Features: a 2-wide first card, then a 1/2/3-column grid.
  - AI Trading: stacks below `lg`, so tablets don't get a cramped code window.
  - Pricing: 1, then 2, then 4 columns.
  - Navbar: collapses to a menu button on mobile.
  - Fonts and spacing scale at every breakpoint.
- **Navbar links:** I added links to the section anchors (`#features`, `#trading`, `#referral`, `#plans`). Several sections gained `id`s, and the feature-card CTAs now point at real anchors instead of `#`.
- **Pricing buttons:** they were dead `<button>`s, so they now link to `/signup`.
- **Hero tabs:** the Main, Investment and Trading tabs switch between demo numbers. I made up the Main and Trading values, so replace them in `WALLET_PREVIEW`.
- **Newsletter:** the Join button shows a "Joined" state, but nothing is sent yet. Wire it up where the `TODO` is.
- **FAQ titles:** beUI's accordion truncates long titles, so I override it with `whitespace-normal!` so they wrap on phones.