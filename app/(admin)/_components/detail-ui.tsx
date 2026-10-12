// app/(admin)/_components/detail-ui.tsx
"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

export function Dialog({
  open,
  onClose,
  maxWidth = "max-w-3xl",
  children,
}: {
  open: boolean;
  onClose: () => void;
  maxWidth?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[9000] flex items-end justify-center bg-foreground/60 backdrop-blur-sm sm:items-center sm:p-5"
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`flex max-h-[92svh] w-full ${maxWidth} flex-col overflow-hidden rounded-t-2xl border border-border bg-background shadow-xl sm:rounded-2xl`}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}

export function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1 break-all text-sm text-foreground ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        {value || "—"}
      </p>
    </div>
  );
}

export function Avatar({ text, dark }: { text: string; dark?: boolean }) {
  return (
    <span
      className={`grid size-7 shrink-0 place-items-center rounded-full border border-border text-[10px] font-semibold ${
        dark ? "bg-foreground text-background" : "bg-muted text-foreground"
      }`}
    >
      {text}
    </span>
  );
}
