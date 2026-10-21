
## 1. Install

```bash
npm i motion lucide-react clsx tailwind-merge next-themes shiki

npx shadcn@latest add @beui/button @beui/card @beui/tabs @beui/tilt-card @beui/number @beui/text-animation @beui/scroll-animation @beui/theme-toggle @beui/bouncy-accordion @beui/code-block
```

This installs the real files at `@/components/motion/{button,card,tabs,tilt-card,number-ticker,text-reveal,text-shimmer,scroll-reveal,theme-toggle,bouncy-accordion,action-swap}`, `@/components/agents/code-block` (plus `agent-code`), and `@/lib/hooks/use-hover-capable`. The registry slugs `number` and `text-animation` come from the repo's registry list. If the CLI doesn't resolve one, copy the file from `github.com/starc007/ui-components/tree/main/components/motion`.

Use the `lib/utils.ts` and `lib/ease.ts` from my previous message. They match the repo exactly.

**Delete** `_components/ui.tsx` and `_components/theme-toggle.tsx`. The beUI versions replace them.

**Remove** the `::view-transition-*` block at the bottom of `globals.css`, since beUI's ThemeToggle injects its own. The rest of the theme CSS stays.

## 2. Theme provider

beUI's ThemeToggle uses `next-themes`, so add this file at `app/theme-provider.tsx`:

```tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

export function ThemeProvider(props: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      enableColorScheme={false}
      storageKey="crypto_invest_theme"
      {...props}
    />
  );
}
```

Then wrap your root `app/layout.tsx` (I haven't seen it, so adapt this to yours):

```tsx
<html lang="en" suppressHydrationWarning>
  <body>
    <ThemeProvider>{children}</ThemeProvider>
  </body>
</html>
```

I kept your `crypto_invest_theme` storage key, so existing visitors keep their saved theme. If you have an inline script that sets the theme class, remove it. Also, `data-theme` is no longer set. If other CSS depends on it, switch it to the `.dark` class.

## 3. Files that stay as in my previous message

These are unchanged: `page.tsx`, `logo.tsx`, `dividend-countdown.tsx`, `how-it-works.tsx` and `wallets.tsx`.

In `data.ts`, replace only these three blocks. Everything else there stays the same.

```ts
// data.ts — replace WALLET_PREVIEW
export const WALLET_PREVIEW: Record<
  WalletTab,
  { value: number; pnl: { label: string; value: string }[] }
> = {
  Main: {
    value: 3240,
    pnl: PNL.map((p) => ({ label: p.label, value: "—" })),
  },
  Investment: { value: 12480.55, pnl: PNL },
  Trading: {
    value: 5120.3,
    pnl: [
      { label: "Today", value: "+0.9%" },
      { label: "7-Day", value: "+4.1%" },
      { label: "30-Day", value: "+12.6%" },
      { label: "All-Time", value: "+38.2%" },
    ],
  },
};

// data.ts — replace METRICS (beUI's NumberTicker takes a real number)
export const METRICS = [
  { value: 10, prefix: "$", suffix: "M+", decimals: 0, label: "Total assets managed" },
  { value: 2.5, prefix: "", suffix: "%", decimals: 1, label: "Max daily plan return" },
  { value: 68.4, prefix: "", suffix: "%", decimals: 1, label: "AI trading win rate" },
  { value: 99.98, prefix: "", suffix: "%", decimals: 2, label: "Platform uptime" },
  { value: 50000, prefix: "", suffix: "+", decimals: 0, label: "Active traders" },
];
```

The Main and Trading preview numbers are demo values I made up, so edit them.

## 4. Rewritten files

**`section-heading.tsx`**

```tsx
// app/(public)/_components/section-heading.tsx
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { H2 } from "./data";

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
    <ScrollReveal
      amount={0.2}
      className="mx-auto mb-10 max-w-2xl text-center md:mb-14"
    >
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
    </ScrollReveal>
  );
}
```

**`icon-card.tsx`**

```tsx
// app/(public)/_components/icon-card.tsx
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { TiltCard } from "@/components/motion/tilt-card";
import type { IconItem } from "./data";

export function IconCard({
  icon: Icon,
  title,
  desc,
  index = 0,
  number,
}: IconItem & { index?: number; number?: string }) {
  return (
    <ScrollReveal delay={index * 0.08} className="h-full">
      <TiltCard
        max={6}
        className="group h-full rounded-3xl border border-border bg-card p-6"
      >
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
    </ScrollReveal>
  );
}
```

**`navbar.tsx`**

```tsx
// app/(public)/_components/navbar.tsx
"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { Button, ButtonLink } from "@/components/motion/button";
import { ThemeToggle } from "@/components/motion/theme-toggle";
import { SPRING_PANEL } from "@/lib/ease";
import { Logo } from "./logo";

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
            <ThemeToggle
              variant="circle"
              start="top-right"
              className="h-10 w-10 rounded-full text-foreground transition-colors hover:bg-foreground/5"
              iconClassName="h-[18px] w-[18px]"
            />
            <ButtonLink href="/signup" className="hidden sm:inline-flex">
              Get Started
            </ButtonLink>
            <Button
              variant="ghost"
              size="icon"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
              className="h-10 w-10 rounded-full md:hidden"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
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

Add `useState` to the React import in that file, like this: `import { useEffect, useState } from "react";`.

**`hero.tsx`**

```tsx
// app/(public)/_components/hero.tsx
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/motion/button";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { TextReveal } from "@/components/motion/text-reveal";
import { TextShimmer } from "@/components/motion/text-shimmer";
import { cn } from "@/lib/utils";
import { SECTION } from "./data";
import { HeroPreview } from "./hero-preview";

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

      <ScrollReveal className="mb-6 sm:mb-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 py-1.5 pl-1.5 pr-3 backdrop-blur sm:pr-4">
          <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
            New
          </span>
          <TextShimmer className="text-xs font-medium sm:text-sm">
            Referral Milestone Bonuses are live
          </TextShimmer>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
        </span>
      </ScrollReveal>

      <TextReveal
        as="h1"
        text="The all-in-one crypto wealth & trading ecosystem"
        stagger={0.06}
        blur={8}
        className="mx-auto mb-5 max-w-4xl text-4xl font-semibold leading-[1.05] tracking-tight text-balance text-foreground sm:mb-6 sm:text-5xl md:text-6xl lg:text-7xl"
      />

      <ScrollReveal delay={0.25}>
        <p className="mx-auto mb-8 max-w-xl text-base text-muted-foreground text-pretty sm:mb-10 sm:text-lg">
          Automated daily profit plans and professional AI trading, organized in
          a segregated 3-wallet system with 2FA, KYC and login tracking built
          in.
        </p>
      </ScrollReveal>

      <ScrollReveal delay={0.35} className="w-full sm:w-auto">
        <div className="mb-14 flex w-full flex-col gap-3 sm:mb-20 sm:w-auto sm:flex-row">
          <ButtonLink href="/signin" size="lg" className="w-full sm:w-auto sm:px-8">
            Dashboard
          </ButtonLink>
          <ButtonLink
            href="/signup"
            variant="outline"
            size="lg"
            className="w-full sm:w-auto sm:px-8"
          >
            Get Started
          </ButtonLink>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={0.45} y={40} amount={0.1} className="w-full max-w-5xl">
        <HeroPreview />
      </ScrollReveal>
    </section>
  );
}
```

**`hero-preview.tsx`**

```tsx
// app/(public)/_components/hero-preview.tsx
"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Clock } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/motion/tabs";
import { NumberTicker } from "@/components/motion/number-ticker";
import { TiltCard } from "@/components/motion/tilt-card";
import { cn } from "@/lib/utils";
import { DividendCountdown } from "./dividend-countdown";
import { WALLET_PREVIEW, WALLET_TABS, type WalletTab } from "./data";

const money = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function HeroPreview() {
  const [tab, setTab] = useState<WalletTab>("Investment");
  const data = WALLET_PREVIEW[tab];

  return (
    <TiltCard
      max={4}
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
              value={data.value}
              decimals={2}
              prefix="$"
              format={money}
              className="text-3xl font-semibold tracking-tight sm:text-4xl"
            />
          </div>
          <Tabs
            variant="pill"
            value={tab}
            onValueChange={(v) => setTab(v as WalletTab)}
          >
            <TabsList>
              {WALLET_TABS.map((t) => (
                <TabsTrigger key={t} value={t}>
                  {t}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
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

**`metrics.tsx`**

```tsx
// app/(public)/_components/metrics.tsx
"use client";

import { Card } from "@/components/motion/card";
import { NumberTicker } from "@/components/motion/number-ticker";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { cn } from "@/lib/utils";
import { METRICS, SECTION } from "./data";

export function Metrics() {
  return (
    <section className={SECTION}>
      <ScrollReveal>
        <p className="mb-6 text-center text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground sm:mb-8">
          The platform at a glance
        </p>
      </ScrollReveal>

      {/* 2 cols mobile, 3+2 tablet, 5 desktop */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-6 sm:gap-4 lg:grid-cols-10">
        {METRICS.map((m, i) => (
          <ScrollReveal
            key={m.label}
            delay={i * 0.06}
            amount={0.2}
            className={cn(
              "lg:col-span-2",
              i < 3 ? "sm:col-span-2" : "sm:col-span-3",
              i === METRICS.length - 1 && "col-span-2",
            )}
          >
            <Card className="h-full items-center justify-center gap-1.5 bg-card px-4 py-6 text-center sm:py-8">
              <NumberTicker
                value={m.value}
                decimals={m.decimals}
                prefix={m.prefix}
                suffix={m.suffix}
                format={(n) =>
                  n.toLocaleString("en-US", {
                    minimumFractionDigits: m.decimals,
                    maximumFractionDigits: m.decimals,
                  })
                }
                className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
              />
              <div className="text-xs text-muted-foreground sm:text-sm">
                {m.label}
              </div>
            </Card>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
```

**`features.tsx`**

```tsx
// app/(public)/_components/features.tsx
import { ArrowRight } from "lucide-react";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { TiltCard } from "@/components/motion/tilt-card";
import { cn } from "@/lib/utils";
import { FEATURES, SECTION } from "./data";
import { SectionHeading } from "./section-heading";

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
            <ScrollReveal
              key={f.title}
              delay={(i % 3) * 0.08}
              amount={0.15}
              className={cn("h-full", i === 0 && "md:col-span-2 lg:col-span-2")}
            >
              <TiltCard
                max={5}
                className="group flex h-full flex-col rounded-3xl border border-border bg-card p-5 sm:p-6"
              >
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
            </ScrollReveal>
          );
        })}
      </div>
    </section>
  );
}
```

**`referral.tsx`**

```tsx
// app/(public)/_components/referral.tsx
"use client";

import { motion } from "motion/react";
import { ArrowRight, CheckCircle2, Gift } from "lucide-react";
import { Card } from "@/components/motion/card";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { EASE_OUT } from "@/lib/ease";
import { REFERRAL_POINTS, REFERRAL_TIERS, SECTION } from "./data";

export function Referral() {
  return (
    <section
      id="referral"
      className={`${SECTION} grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12`}
    >
      {/* Copy */}
      <ScrollReveal amount={0.15} className="flex flex-col gap-5 sm:gap-6 lg:col-span-5">
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
      </ScrollReveal>

      {/* Targets card */}
      <ScrollReveal delay={0.1} amount={0.1} className="lg:col-span-7">
        <Card className="gap-0 rounded-[28px] bg-card p-3 sm:p-5">
          <div className="rounded-3xl border border-border bg-background/60 p-4 sm:p-6">
            <div className="mb-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Referral Targets &amp; Cash Rewards
            </div>

            <div className="mb-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
              {REFERRAL_TIERS.map((t) => (
                <div
                  key={t.referrals}
                  className="rounded-2xl border border-border bg-card p-3 text-center transition-colors hover:border-border-strong"
                >
                  <div className="text-xs text-muted-foreground">
                    {t.referrals} Referrals
                  </div>
                  <div className="text-lg font-semibold tabular-nums">
                    ${t.bonus}.00
                  </div>
                </div>
              ))}
            </div>

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
        </Card>
      </ScrollReveal>
    </section>
  );
}
```

**`ai-trading.tsx`** (uses beUI's real Code Block)

```tsx
// app/(public)/_components/ai-trading.tsx
import { ArrowRight } from "lucide-react";
import { CodeBlock } from "@/components/agents/code-block";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { SECTION } from "./data";

const DAYS = [
  { day: 1, text: "+$2.50 Profit" },
  { day: 2, text: "+$1.20 Profit" },
  { day: 3, text: "-$0.80 Loss" },
  { day: 4, text: "+$3.10 Profit" },
  { day: 5, text: "+$1.70 Profit" },
];

const CHIPS = ["From $100", "15-day strategy lock", "Daily P&L updates"];

const CODE = [
  'package = AI_Trading(min="$100.00", lock="15 days")',
  "",
  ...DAYS.map((d) => `Day ${d.day}:  ${d.text}`),
  "",
  "# Day 15 -> principal + net P&L unlocked",
].join("\n");

export function AiTrading() {
  return (
    <section
      id="trading"
      className={`${SECTION} grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14`}
    >
      <ScrollReveal amount={0.15} className="order-2 min-w-0 lg:order-1">
        <CodeBlock
          code={CODE}
          language="bash"
          filename="strategy"
          showLineNumbers
          copyable={false}
          wrap
          maxHeight={340}
        />
      </ScrollReveal>

      <ScrollReveal
        delay={0.1}
        amount={0.15}
        className="order-1 flex flex-col gap-5 sm:gap-6 lg:order-2"
      >
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
      </ScrollReveal>
    </section>
  );
}
```

beUI's CodeBlock highlights only `bash | diff | json | text | tsx | typescript`. I used `bash` so the string and `#` comment are colored. The profit and loss coloring from the original is gone.

**`pricing.tsx`**

```tsx
// app/(public)/_components/pricing.tsx
import { ButtonLink } from "@/components/motion/button";
import { Card } from "@/components/motion/card";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { PLANS, SECTION } from "./data";
import { SectionHeading } from "./section-heading";

export function Pricing() {
  return (
    <section id="plans" className={SECTION}>
      <SectionHeading
        eyebrow="Plans"
        title="Choose your strategy"
        subtitle="Daily profit tiers and AI trading. Start from $30."
      />
      <div className="grid grid-cols-1 items-stretch gap-5 pt-3 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((p, i) => (
          <ScrollReveal key={p.name} delay={i * 0.08} amount={0.15} className="h-full">
            <Card
              selected={p.popular}
              className="h-full gap-0 bg-card p-6 transition-transform duration-300 hover:-translate-y-1"
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
                variant={p.popular ? "primary" : "outline"}
                className="w-full"
              >
                {p.cta}
              </ButtonLink>
            </Card>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
```

**`security.tsx`**

```tsx
// app/(public)/_components/security.tsx
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/motion/card";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { H2, SECTION, SECURITY } from "./data";

export function Security() {
  return (
    <section
      id="security"
      className={`${SECTION} grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14`}
    >
      <ScrollReveal amount={0.15} className="flex flex-col gap-5 sm:gap-6">
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
      </ScrollReveal>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {SECURITY.map((s, i) => {
          const Icon = s.icon;
          return (
            <ScrollReveal key={s.title} delay={i * 0.08} amount={0.2} className="h-full">
              <Card className="group h-full items-center justify-center gap-0 bg-card p-4 text-center transition-colors hover:border-primary/40 sm:min-h-40">
                <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl border border-border bg-background/60 text-muted-foreground transition-colors group-hover:text-primary">
                  <Icon className="h-[18px] w-[18px]" />
                </div>
                <span className="text-lg font-semibold text-foreground">
                  {s.title}
                </span>
                <span className="text-xs text-muted-foreground">{s.desc}</span>
              </Card>
            </ScrollReveal>
          );
        })}
      </div>
    </section>
  );
}
```

**`faq.tsx`**

```tsx
// app/(public)/_components/faq.tsx
import { CircleHelp } from "lucide-react";
import { BouncyAccordion } from "@/components/motion/bouncy-accordion";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { FAQ, SECTION } from "./data";
import { SectionHeading } from "./section-heading";

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
      <ScrollReveal amount={0.1}>
        <BouncyAccordion
          items={items}
          defaultValue="faq-0"
          classNames={{
            // beUI's title truncates by default; let long questions wrap on phones
            title: "whitespace-normal! overflow-visible! text-clip! py-3 leading-snug",
            trigger: "items-center",
          }}
        />
      </ScrollReveal>
    </section>
  );
}
```

**`footer.tsx`**

```tsx
// app/(public)/_components/footer.tsx
import { Globe, MessageCircle } from "lucide-react";
import { ButtonLink } from "@/components/motion/button";
import { Card } from "@/components/motion/card";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { FOOTER_COLUMNS } from "./data";
import { Logo } from "./logo";
import { NewsletterForm } from "./newsletter-form";

export function Footer() {
  return (
    <footer className="w-full border-t border-border bg-card/40 px-4 pb-10 pt-16 sm:px-6 md:pt-24 lg:px-8">
      {/* Final CTA */}
      <ScrollReveal amount={0.2} className="mx-auto mb-16 max-w-7xl md:mb-20">
        <Card className="relative gap-0 overflow-hidden rounded-[32px] bg-card px-6 py-14 text-center md:py-20">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 h-64 w-[min(700px,100%)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/25 blur-[100px]"
          />
          <h2 className="relative mb-8 text-4xl font-semibold tracking-tighter text-balance text-foreground sm:text-6xl md:text-7xl">
            Ready to grow?
          </h2>
          <div className="relative">
            <ButtonLink href="/signup" size="lg" className="sm:px-8">
              Create Your Account
            </ButtonLink>
          </div>
        </Card>
      </ScrollReveal>

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

**`newsletter-form.tsx`**

```tsx
// app/(public)/_components/newsletter-form.tsx
"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/motion/button";

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
        <Button type="submit" size="md" className="h-9 px-4 text-sm">
          {done ? (
            <>
              <Check className="h-4 w-4" /> Joined
            </>
          ) : (
            "Join"
          )}
        </Button>
      </div>
    </form>
  );
}
```

## Notes

- **Real beUI components in use:** Button, Card, Tabs, Tilt Card, Number Ticker, Text Reveal, Text Shimmer, Scroll Reveal, Theme Toggle (circle reveal), Bouncy Accordion and Code Block. Each section also uses the beUI theme tokens and the `.glass` utility.
- **Links in `ButtonLink`:** beUI's `ButtonLink` renders a plain `<a>`, not Next's `<Link>`. Navigation to `/signup` and `/signin` therefore does a full page load. If you want client-side navigation, I can wrap it.
- **Scroll reveal on tall elements:** `ScrollReveal` waits until 30% of an element is visible by default. I lowered `amount` on tall blocks so they still reveal on phones.
- **Responsive behavior:**
  - Navbar: collapses to a menu button below `md`.
  - Metrics: 2 columns on mobile, 3+2 on tablet, 5 on desktop.
  - Features: the first card is wider, then 1, 2 and 3 columns.
  - AI Trading: stacks below `lg`.
  - Pricing: 1, then 2, then 4 columns.
  - FAQ: titles wrap instead of truncating.
- **Extras I added:** the navbar section links, the `id`s on sections, and the pricing buttons now linking to `/signup`.