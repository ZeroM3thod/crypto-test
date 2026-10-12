"use client";
// beui.dev/components/motion/country-select
// Closed-by-default dropdown, styled to match Input's field chrome exactly
// (h-11, rounded-full, same border/focus states). Opens a floating panel
// with a search box and the full country list, each row showing its flag.

import { Check, ChevronDown, Search } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { COUNTRIES } from "@/lib/countries";
import { EASE_OUT } from "@/lib/ease";
import { cn } from "@/lib/utils";

export interface CountrySelectProps {
  label?: string;
  /** Country name (matches Country["name"]) or "" for none selected. */
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string | boolean;
  reserveErrorLine?: boolean;
  success?: boolean;
  className?: string;
}

export function CountrySelect({
  label = "Country",
  value,
  onValueChange,
  placeholder = "Select your country",
  disabled,
  error,
  reserveErrorLine = false,
  success,
  className,
}: CountrySelectProps) {
  const reduce = useReducedMotion();
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const hasError = Boolean(error);
  const errorMessage = typeof error === "string" ? error : null;
  const selected = COUNTRIES.find((c) => c.name === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter((c) => c.name.toLowerCase().includes(q));
  }, [query]);

  // Close on outside click / Escape — same pattern any dialog-lite needs.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      // Focus the search box next tick so the open animation isn't janked by focus scroll.
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? (
        <label htmlFor={id} className="px-1 text-sm font-medium text-foreground">
          {label}
        </label>
      ) : null}

      <div ref={rootRef} className="relative">
        <button
          id={id}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => {
            if (disabled) return;
            setQuery("");
            setOpen((o) => !o);
          }}
          data-state={hasError ? "error" : success ? "success" : open ? "focused" : "idle"}
          className={cn(
            "relative flex h-11 w-full items-center gap-2 rounded-full border pl-3.5 pr-3.5 text-left transition-colors duration-200",
            "border-border",
            open && !hasError && "border-foreground/40 ring-2 ring-foreground/15",
            hasError && "border-destructive ring-2 ring-destructive/25",
            disabled && "cursor-not-allowed opacity-60",
          )}
        >
          {selected ? (
            <>
              <span className="text-base leading-none">{selected.flag}</span>
              <span className="flex-1 truncate text-base text-foreground">
                {selected.name}
              </span>
            </>
          ) : (
            <span className="flex-1 truncate text-base text-muted-foreground/60">
              {placeholder}
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
              open && "rotate-180",
            )}
          />
        </button>

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
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search countries…"
                  className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
                />
              </div>

              <ul className="overflow-y-auto py-1">
                {filtered.length === 0 ? (
                  <li className="px-4 py-3 text-sm text-muted-foreground">
                    No countries match &quot;{query}&quot;.
                  </li>
                ) : (
                  filtered.map((c) => {
                    const isSelected = c.name === value;
                    return (
                      <li key={c.code}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => {
                            onValueChange?.(c.name);
                            setOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm hover:bg-muted/60",
                            isSelected && "bg-muted/40",
                          )}
                        >
                          <span className="text-base leading-none">{c.flag}</span>
                          <span className="flex-1 truncate text-foreground">{c.name}</span>
                          {isSelected ? (
                            <Check className="h-4 w-4 shrink-0 text-foreground" />
                          ) : null}
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className={reserveErrorLine ? "min-h-4" : "contents"}>
        <AnimatePresence initial={false}>
          {errorMessage ? (
            <motion.p
              role="alert"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: -4, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4, filter: "blur(4px)" }}
              transition={{ duration: 0.2 }}
              className="px-1 text-xs text-destructive"
            >
              {errorMessage}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
