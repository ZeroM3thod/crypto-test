"use client";
// beui.dev/components/motion/dob-field
// Renders like Input (label + h-11 pill), but the field itself is a button.
// Clicking it opens a centered dialog containing the exact three-WheelPicker
// month/day/year layout from wheel-picker.preview.tsx.

import { Calendar } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useState } from "react";
import { WheelPicker } from "@/components/motion/wheel-picker";
import { EASE_OUT } from "@/lib/ease";
import { cn } from "@/lib/utils";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function daysIn(month: number, year: number) {
  return new Date(year, month + 1, 0).getDate();
}

export interface DobValue {
  month: string;
  day: string;
  year: string;
}

export interface DobFieldProps {
  label?: string;
  value: DobValue;
  onValueChange: (value: DobValue) => void;
  disabled?: boolean;
  sound?: boolean;
  error?: string | boolean;
  reserveErrorLine?: boolean;
  success?: boolean;
  minYear?: number;
  maxYear?: number;
  className?: string;
}

function formatDob(v: DobValue) {
  if (!v.month || !v.day || !v.year) return "";
  return `${v.month} ${v.day}, ${v.year}`;
}

export function DobField({
  label = "Date of birth",
  value,
  onValueChange,
  disabled,
  sound = false,
  error,
  reserveErrorLine = false,
  success,
  minYear = 1920,
  maxYear = new Date().getFullYear(),
  className,
}: DobFieldProps) {
  const reduce = useReducedMotion();
  const id = useId();
  const [open, setOpen] = useState(false);
  // Draft lets Cancel discard in-dialog changes; Done commits them.
  const [draft, setDraft] = useState<DobValue>(value);

  const hasError = Boolean(error);
  const errorMessage = typeof error === "string" ? error : null;

  // Keep the day valid whenever the month or year changes — same guard as the
  // old inline picker, but applied in the change handlers rather than an effect.
  const dayCapFor = (month: string, year: string) =>
    daysIn(Math.max(0, MONTHS.indexOf(month)), Number(year) || minYear);

  const applyMonth = (month: string) =>
    setDraft((d) => {
      const cap = dayCapFor(month, d.year);
      return {
        ...d,
        month,
        day: Number(d.day) > cap ? String(cap) : d.day,
      };
    });

  const applyYear = (year: string) =>
    setDraft((d) => {
      const cap = dayCapFor(d.month, year);
      return {
        ...d,
        year,
        day: Number(d.day) > cap ? String(cap) : d.day,
      };
    });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => String(minYear + i));
  const dayCount = daysIn(Math.max(0, MONTHS.indexOf(draft.month)), Number(draft.year) || minYear);
  const days = Array.from({ length: dayCount }, (_, i) => String(i + 1));

  const display = formatDob(value);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? (
        <label htmlFor={id} className="px-1 text-sm font-medium text-foreground">
          {label}
        </label>
      ) : null}

      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => {
          setDraft(value);
          setOpen(true);
        }}
        data-state={hasError ? "error" : success ? "success" : "idle"}
        className={cn(
          "relative flex h-11 w-full items-center gap-2.5 rounded-full border pl-3.5 pr-3.5 text-left transition-colors duration-200",
          "border-border",
          hasError && "border-destructive ring-2 ring-destructive/25",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <span className="text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">
          <Calendar />
        </span>
        <span
          className={cn(
            "flex-1 truncate text-base",
            display ? "text-foreground" : "text-muted-foreground/60",
          )}
        >
          {display || "Select your date of birth"}
        </span>
      </button>

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

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/40"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Dialog panel */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={label}
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 12 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
              className="relative z-10 flex w-full max-w-sm flex-col gap-5 rounded-3xl border border-border bg-background p-6"
            >
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-semibold text-foreground">{label}</h3>
                <p className="text-sm text-muted-foreground">
                  Scroll or drag each wheel to set your birthday.
                </p>
              </div>

              {/* Exact same 3-wheel layout as wheel-picker.preview.tsx */}
              <div className="flex items-stretch gap-1 self-center rounded-3xl border border-border bg-background p-2">
                <WheelPicker
                  options={MONTHS}
                  value={draft.month}
                  onValueChange={applyMonth}
                  className="w-32 border-0 bg-transparent"
                  visibleCount={7}
                  itemHeight={42}
                  sound={sound}
                  aria-label="Month"
                />
                <WheelPicker
                  options={days}
                  value={draft.day}
                  onValueChange={(d2) => setDraft((d) => ({ ...d, day: d2 }))}
                  className="w-14 border-0 bg-transparent"
                  visibleCount={7}
                  itemHeight={42}
                  sound={sound}
                  aria-label="Day"
                />
                <WheelPicker
                  options={years}
                  value={draft.year}
                  onValueChange={applyYear}
                  className="w-20 border-0 bg-transparent"
                  visibleCount={7}
                  itemHeight={42}
                  sound={sound}
                  aria-label="Year"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="h-10 flex-1 rounded-full border border-border text-sm font-medium text-foreground hover:bg-muted/60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onValueChange(draft);
                    setOpen(false);
                  }}
                  className="h-10 flex-1 rounded-full bg-black border border-border text-sm font-medium text-white hover:bg-black/90"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
