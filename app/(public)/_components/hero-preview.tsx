"use client";
import { useState } from "react";
import { motion } from "motion/react";
import { Clock } from "lucide-react";
import { Tabs,TabsList,TabsTrigger } from "@/components/motion/tabs";
import { NumberTicker } from "@/components/motion/number-ticker";
import { TiltCard } from "@/components/motion/tilt-card";
import { cn } from "@/lib/utils";
import { DividendCountdown } from "./dividend-countdown";
import { WALLET_PREVIEW,WALLET_TABS,type WalletTab } from "./data";
const money=(n:number)=>n.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
export function HeroPreview(){const [tab,setTab]=useState<WalletTab>("Investment");const data=WALLET_PREVIEW[tab];return <TiltCard max={4} className="rounded-[28px] border border-border bg-card/70 p-2 shadow-2xl sm:p-3"><div className="rounded-3xl border border-border bg-background/60 p-4 text-left sm:p-6 lg:p-8"><div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">Portfolio Value</div><NumberTicker value={data.value} decimals={2} prefix="$" format={money} className="text-3xl font-semibold sm:text-4xl"/></div><Tabs variant="pill" value={tab} onValueChange={v=>setTab(v as WalletTab)}><TabsList>{WALLET_TABS.map(t=><TabsTrigger key={t} value={t}>{t}</TabsTrigger>)}</TabsList></Tabs></div><motion.div key={tab} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:.3}} className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">{data.pnl.map(p=><div key={p.label} className="rounded-2xl border border-border bg-card p-3 sm:p-4"><div className="mb-1 text-xs text-muted-foreground">{p.label} P&amp;L</div><div className={cn("text-base font-semibold sm:text-lg",p.value.startsWith("+")?"text-success":"text-muted-foreground")}>{p.value}</div></div>)}</motion.div><div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 sm:p-4"><div className="flex items-center gap-3"><Clock className="h-5 w-5 text-primary"/><div><div className="text-sm font-medium">Next dividend credit</div><DividendCountdown/></div></div></div></div></TiltCard>}
