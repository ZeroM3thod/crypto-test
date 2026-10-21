"use client";
import { Card } from "@/components/motion/card";
import { NumberTicker } from "@/components/motion/number-ticker";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { cn } from "@/lib/utils";
import { METRICS,SECTION } from "./data";
export function Metrics(){return <section className={SECTION}><ScrollReveal><p className="mb-6 text-center text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">The platform at a glance</p></ScrollReveal><div className="grid grid-cols-2 gap-3 sm:grid-cols-6 lg:grid-cols-10">{METRICS.map((m,i)=><ScrollReveal key={m.label} delay={i*.06} amount={.2} className={cn("lg:col-span-2",i<3?"sm:col-span-2":"sm:col-span-3",i===METRICS.length-1&&"col-span-2")}><Card className="h-full items-center justify-center gap-1.5 bg-card px-4 py-6 text-center"><NumberTicker value={m.value} decimals={m.decimals} prefix={m.prefix} suffix={m.suffix} format={n=>n.toLocaleString("en-US",{minimumFractionDigits:m.decimals,maximumFractionDigits:m.decimals})} className="text-3xl font-semibold sm:text-4xl"/><div className="text-xs text-muted-foreground sm:text-sm">{m.label}</div></Card></ScrollReveal>)}</div></section>}
