"use client";

import { Check, ChevronDown, Phone, Search } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { COUNTRIES } from "@/lib/countries";
import { DIAL_CODES } from "@/lib/dial-codes";
import { EASE_OUT } from "@/lib/ease";
import { cn } from "@/lib/utils";

type Props = {
  label?: string;
  country: string;
  onCountryChange: (value: string) => void;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string | boolean;
  reserveErrorLine?: boolean;
  success?: boolean;
};

export function PhoneInput({ label = "Mobile number", country, onCountryChange, value, onChange, onBlur, error, reserveErrorLine, success }: Props) {
  const id = useId();
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = COUNTRIES.find((c) => c.name === country) || COUNTRIES.find((c) => c.code === "US")!;
  const dial = DIAL_CODES[selected.code] || "+1";
  const hasError = Boolean(error);
  const errorMessage = typeof error === "string" ? error : null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return COUNTRIES.filter((c) => !q || c.name.toLowerCase().includes(q) || (DIAL_CODES[c.code] || "").includes(q));
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => rootRef.current && !rootRef.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    requestAnimationFrame(() => searchRef.current?.focus());
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="px-1 text-sm font-medium text-foreground">{label}</label>
      <div ref={rootRef} className="relative">
        <div className={cn(
          "relative flex h-11 overflow-hidden rounded-full border border-border transition-colors duration-200",
          hasError && "border-destructive ring-2 ring-destructive/25",
          success && !hasError && "border-(--color-success)/60",
        )}>
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={open}
            onClick={() => { setQuery(""); setOpen((o) => !o); }}
            className="flex h-full items-center gap-1.5 border-r border-border px-3 text-sm text-foreground outline-none hover:bg-muted/40"
          >
            <span className="text-base leading-none">{selected.flag}</span>
            <span className="tabular-nums">{dial}</span>
            <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
          </button>
          <span className="pointer-events-none flex h-full items-center pl-3 text-muted-foreground [&_svg]:h-4 [&_svg]:w-4"><Phone /></span>
          <input
            id={id}
            type="tel"
            inputMode="tel"
            value={value.startsWith(dial) ? value.slice(dial.length).trimStart() : value.replace(/^\+\d+\s*/, "")}
            onChange={(e) => onChange(`${dial} ${e.target.value.replace(/^\+\d+\s*/, "")}`.trim())}
            onBlur={onBlur}
            placeholder="555 000 1234"
            aria-invalid={hasError || undefined}
            className="h-full min-w-0 flex-1 bg-transparent px-3 text-base leading-6 text-foreground caret-foreground outline-none placeholder:text-muted-foreground/60"
          />
        </div>

        <AnimatePresence>
          {open ? (
            <motion.div
              role="listbox"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.15, ease: EASE_OUT }}
              className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 flex max-h-72 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-lg"
            >
              <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search countries..." className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60" />
              </div>
              <ul className="overflow-y-auto py-1">
                {filtered.map((c) => {
                  const isSelected = c.name === selected.name;
                  return (
                    <li key={c.code}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => { onCountryChange(c.name); onChange(`${DIAL_CODES[c.code] || "+1"} ${value.replace(/^\+\d+\s*/, "")}`.trim()); setOpen(false); }}
                        className={cn("flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm hover:bg-muted/60", isSelected && "bg-muted/40")}
                      >
                        <span className="text-base leading-none">{c.flag}</span>
                        <span className="flex-1 truncate text-foreground">{c.name}</span>
                        <span className="tabular-nums text-muted-foreground">{DIAL_CODES[c.code] || "+1"}</span>
                        {isSelected ? <Check className="h-4 w-4 shrink-0 text-foreground" /> : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
      <div className={reserveErrorLine ? "min-h-4" : "contents"}>
        <AnimatePresence initial={false}>{errorMessage ? <motion.p role="alert" className="px-1 text-xs text-destructive">{errorMessage}</motion.p> : null}</AnimatePresence>
      </div>
    </div>
  );
}
