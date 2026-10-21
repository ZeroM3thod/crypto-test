"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { Button, ButtonLink } from "@/components/motion/button";
import { ThemeToggle } from "@/components/motion/theme-toggle";
import { SPRING_PANEL } from "@/lib/ease";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";

const LINKS = [
  { label: "Features", href: "#features" },
  { label: "Trading", href: "#trading" },
  { label: "Referral", href: "#referral" },
  { label: "Plans", href: "#plans" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!mounted) return null;
  return createPortal(
    <nav className="pointer-events-none fixed inset-x-0 top-3 z-[100] px-3 sm:top-4 sm:px-6">
      <div className="relative mx-auto max-w-3xl">
        <div className={cn("glass pointer-events-auto flex items-center justify-between rounded-full py-2 pl-5 pr-2 transition-all duration-300", scrolled && "bg-background/85! border-border-strong! shadow-lg shadow-black/20")}>
          <Logo />
          <div className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => <a key={l.href} href={l.href} className="rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground">{l.label}</a>)}
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle variant="circle" start="top-right" className="h-10 w-10 rounded-full text-foreground transition-colors hover:bg-foreground/5" iconClassName="h-[18px] w-[18px]" />
            <ButtonLink href="/signup" className="hidden sm:inline-flex">Get Started</ButtonLink>
            <Button variant="ghost" size="icon" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((o) => !o)} className="h-10 w-10 rounded-full md:hidden">{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</Button>
          </div>
        </div>
        <AnimatePresence>
          {open && <motion.div initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }} transition={SPRING_PANEL} style={{ transformOrigin: "top center" }} className="glass pointer-events-auto absolute inset-x-0 top-full mt-2 rounded-3xl bg-background/90! p-2 md:hidden">
            {LINKS.map((l) => <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block rounded-2xl px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5">{l.label}</a>)}
            <div className="p-2 sm:hidden"><ButtonLink href="/signup" className="w-full">Get Started</ButtonLink></div>
          </motion.div>}
        </AnimatePresence>
      </div>
    </nav>,
    document.body,
  );
}
