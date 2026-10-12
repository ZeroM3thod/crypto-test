// app/(superadmin)/_components/review-ui.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/motion/button";
import type { ReviewStatus } from "@/lib/admin-review-data";

export type ModalMode = "view" | "confirm" | "reject" | null;

/* ---------- helpers ---------- */

export const fmtAmt = (v: number) =>
  v.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const shortHash = (h: string) =>
  h && h.length > 18 ? `${h.slice(0, 12)}…${h.slice(-4)}` : h || "—";

export const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export function downloadCSV(filename: string, rows: (string | number)[][]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = rows.map((r) => r.map(esc).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ---------- toast ---------- */

export function useToast() {
  const [toast, setToast] = useState({ msg: "", show: false });
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showToast = useCallback((msg: string) => {
    setToast({ msg, show: true });
    clearTimeout(timer.current);
    timer.current = setTimeout(
      () => setToast((t) => ({ ...t, show: false })),
      3300,
    );
  }, []);

  return { toast, showToast };
}

export function Toast({ toast }: { toast: { msg: string; show: boolean } }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-none fixed left-1/2 top-5 z-[9500] -translate-x-1/2 whitespace-nowrap rounded-xl border border-border bg-foreground px-5 py-2.5 text-xs text-background shadow-lg transition-all duration-300 ${
        toast.show ? "translate-y-0 opacity-100" : "-translate-y-20 opacity-0"
      }`}
    >
      {toast.msg}
    </div>
  );
}

/* ---------- date range ---------- */

export function DateRange({
  from,
  to,
  onFrom,
  onTo,
}: {
  from: string;
  to: string;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
}) {
  const cls =
    "h-10 rounded-xl border border-border bg-background px-3 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring";
  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        aria-label="From date"
        value={from}
        onChange={(e) => onFrom(e.target.value)}
        className={cls}
      />
      <span className="text-xs text-muted-foreground">to</span>
      <input
        type="date"
        aria-label="To date"
        value={to}
        onChange={(e) => onTo(e.target.value)}
        className={cls}
      />
    </div>
  );
}

/* ---------- dialog shell ---------- */

function Dialog({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
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
        className="max-h-[92svh] w-full max-w-xl overflow-y-auto rounded-t-2xl border border-border bg-background p-6 shadow-xl sm:rounded-2xl"
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

/* ---------- modal content (view / confirm / reject) ---------- */

export type DetailField = {
  label: string;
  value: string;
  mono?: boolean;
  full?: boolean;
  strong?: boolean;
  copy?: boolean;
};

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-muted p-3 text-xs leading-relaxed text-muted-foreground">
      {children}
    </div>
  );
}

function RejectForm({
  initial,
  onReject,
  onCancel,
}: {
  initial: string;
  onReject: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState(initial);
  return (
    <>
      <label className="flex flex-col gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Rejection reason *{" "}
          <span className="font-normal normal-case tracking-normal">
            (saved with the record)
          </span>
        </span>
        <textarea
          autoFocus
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Enter a clear reason for rejection..."
          className="min-h-24 w-full resize-y rounded-xl border border-border bg-background p-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>
      <div className="flex gap-2 border-t border-border pt-4">
        <Button
          variant="primary"
          size="md"
          className="flex-1"
          onClick={() => onReject(reason)}
        >
          ✕ Reject
        </Button>
        <Button
          variant="outline"
          size="md"
          className="flex-1"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </>
  );
}

export function ReviewModal({
  mode,
  onClose,
  noun,
  record,
  fields,
  summary,
  rejectNote,
  onSwitch,
  onConfirm,
  onReject,
  onCopy,
}: {
  mode: ModalMode;
  onClose: () => void;
  noun: string;
  record?: {
    id: string;
    status: ReviewStatus;
    reason: string;
    copyValue: string;
    copyLabel: string;
  };
  fields: DetailField[];
  summary: string;
  rejectNote: string;
  onSwitch: (m: ModalMode) => void;
  onConfirm: () => void;
  onReject: (reason: string) => void;
  onCopy: (text: string) => void;
}) {
  const open = mode && record ? mode : null;

  return (
    <Dialog open={!!open} onClose={onClose}>
      {open && record ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              {open === "view"
                ? `${noun} · ${record.id}`
                : open === "confirm"
                  ? `Confirm ${noun}`
                  : `Reject ${noun}`}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid size-7 place-items-center rounded-lg border border-border text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              ✕
            </button>
          </div>

          {open === "confirm" ? <Notice>{summary}</Notice> : null}
          {open === "reject" ? <Notice>⚠ {rejectNote}</Notice> : null}

          <div className="grid grid-cols-2 gap-2">
            {fields.map((f) => (
              <div
                key={f.label}
                className={`rounded-xl border border-border bg-muted/40 p-3 ${
                  f.full ? "col-span-2" : ""
                }`}
              >
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {f.label}
                </p>
                {f.copy ? (
                  <button
                    type="button"
                    title="Click to copy"
                    onClick={() => onCopy(f.value)}
                    className="mt-1 break-all text-left font-mono text-xs text-foreground hover:underline"
                  >
                    {f.value}
                  </button>
                ) : (
                  <p
                    className={`mt-1 break-all text-sm text-foreground ${
                      f.mono ? "font-mono text-xs" : ""
                    } ${f.strong ? "font-semibold tabular-nums" : ""}`}
                  >
                    {f.value}
                  </p>
                )}
              </div>
            ))}
            {open === "view" && record.reason ? (
              <div className="col-span-2 rounded-xl border border-border bg-muted/40 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Rejection reason
                </p>
                <p className="mt-1 text-sm text-foreground">{record.reason}</p>
              </div>
            ) : null}
          </div>

          {open === "reject" ? (
            <RejectForm
              initial={record.reason}
              onReject={onReject}
              onCancel={onClose}
            />
          ) : (
            <div className="flex flex-wrap gap-2 border-t border-border pt-4">
              {open === "view" && record.status === "pending" ? (
                <>
                  <Button variant="primary" size="md" className="flex-1" onClick={onConfirm}>
                    ✓ Confirm
                  </Button>
                  <Button variant="outline" size="md" className="flex-1" onClick={() => onSwitch("reject")}>
                    ✕ Reject
                  </Button>
                  <Button variant="ghost" size="md" onClick={onClose}>
                    Close
                  </Button>
                </>
              ) : null}
              {open === "view" && record.status !== "pending" ? (
                <>
                  <Button variant="outline" size="md" className="flex-1" onClick={onClose}>
                    Close
                  </Button>
                  <Button variant="ghost" size="md" onClick={() => onCopy(record.copyValue)}>
                    {record.copyLabel}
                  </Button>
                </>
              ) : null}
              {open === "confirm" ? (
                <>
                  <Button variant="primary" size="md" className="flex-1" onClick={onConfirm}>
                    ✓ Confirm
                  </Button>
                  <Button variant="outline" size="md" className="flex-1" onClick={onClose}>
                    Cancel
                  </Button>
                </>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </Dialog>
  );
}
