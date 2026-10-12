"use client";
// beui.dev/components/motion/morphing-modal
//
// A single overlay whose panel morphs between views: pass a `viewId` to open
// (any string), `null` to close. The panel animates its own size whenever the
// children change, so swapping view content resizes it smoothly in place.

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { EASE_OUT, SPRING_LAYOUT, SPRING_PANEL } from "@/lib/ease";
import { cn } from "@/lib/utils";

// Portals need document.body, so render only after hydration: false on the
// server, true on the client. External-store reads keep this out of effects.
const subscribeToNothing = () => () => {};
const getClientMounted = () => true;
const getServerMounted = () => false;

export interface MorphingModalProps {
  /** Current view identifier, or `null` when the modal is closed. */
  viewId: string | null;
  /** Called on Escape, backdrop press and any close affordance. */
  onClose: () => void;
  children?: ReactNode;
  className?: string;
  overlayClassName?: string;
  /** Set to `false` to block Escape / backdrop dismissal. */
  dismissible?: boolean;
  ariaLabel?: string;
}

export function MorphingModal({
  viewId,
  onClose,
  children,
  className,
  overlayClassName,
  dismissible = true,
  ariaLabel,
}: MorphingModalProps) {
  const reduce = useReducedMotion();
  const open = viewId != null;
  const panelRef = useRef<HTMLDivElement>(null);
  const mounted = useSyncExternalStore(
    subscribeToNothing,
    getClientMounted,
    getServerMounted,
  );

  // Lock page scroll and wire Escape while open; restore everything on close.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && dismissible) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    const focusTimer = window.setTimeout(() => panelRef.current?.focus(), 0);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [open, dismissible, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[8000] grid place-items-center p-4">
          <motion.button
            type="button"
            aria-label="Close"
            tabIndex={-1}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            onClick={dismissible ? onClose : undefined}
            className={cn(
              "absolute inset-0 cursor-default bg-black/60 backdrop-blur-[2px]",
              !dismissible && "pointer-events-none",
              overlayClassName,
            )}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            tabIndex={-1}
            layout
            initial={reduce ? false : { opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 8 }}
            transition={{
              layout: reduce ? { duration: 0 } : SPRING_LAYOUT,
              opacity: { duration: 0.18, ease: EASE_OUT },
              scale: reduce ? { duration: 0 } : SPRING_PANEL,
              y: reduce ? { duration: 0 } : SPRING_PANEL,
            }}
            className={cn(
              "relative z-10 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-background p-5 shadow-2xl outline-none",
              "focus-visible:ring-2 focus-visible:ring-ring",
              className,
            )}
          >
            {children}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
