import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { TiltCard } from "@/components/motion/tilt-card";
import { Icon } from "./icon";
import type { IconItem } from "./data";

export function IconCard({ icon, title, desc, index = 0, number }: IconItem & { index?: number; number?: string }) {
  return <ScrollReveal delay={index * 0.08} className="h-full"><TiltCard max={6} className="group h-full rounded-3xl border border-border bg-card p-6">
    {number && <span className="absolute right-5 top-4 text-5xl font-semibold tracking-tighter text-foreground/[0.06]">{number}</span>}
    <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl border border-border bg-background/60 text-muted-foreground transition-colors duration-300 group-hover:border-primary/40 group-hover:text-primary"><Icon name={icon} className="text-xl" /></div>
    <h3 className="mb-2 text-lg font-semibold tracking-tight text-foreground">{title}</h3><p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
  </TiltCard></ScrollReveal>;
}
