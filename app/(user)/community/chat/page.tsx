// app/(user)/community/page.tsx
"use client";

import { UserShell } from "@/app/(user)/_components/user-shell";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;

const DOT_GAP = 12;
const TWO_PI = Math.PI * 2;

const STATUS_LINES = [
  "Building the community",
  "Refining details",
  "Almost ready",
];

/* ---------- Dither background (fills its parent, not the screen) ---------- */

function DitherBackground({ reduce }: { reduce: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    let frame = 0;
    let width = 0;
    let height = 0;
    let dotColor = "currentColor";

    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0, inside: false };
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const pointerEnabled = canHover && !reduce;

    const draw = (time: number) => {
      context.clearRect(0, 0, width, height);

      if (!pointer.inside) {
        pointer.targetX =
          width / 2 + (reduce ? 0 : Math.sin(time / 1700) * width * 0.18);
        pointer.targetY =
          height / 2 + (reduce ? 0 : Math.cos(time / 2100) * height * 0.14);
      }

      const follow = reduce ? 1 : pointer.inside ? 0.16 : 0.045;
      pointer.x += (pointer.targetX - pointer.x) * follow;
      pointer.y += (pointer.targetY - pointer.y) * follow;

      const radius = Math.min(width, height) * 0.38;
      const columns = Math.ceil(width / DOT_GAP) + 1;
      const rows = Math.ceil(height / DOT_GAP) + 1;
      const offsetX = (width - (columns - 1) * DOT_GAP) / 2;
      const offsetY = (height - (rows - 1) * DOT_GAP) / 2;

      context.fillStyle = dotColor;

      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          const anchorX = offsetX + column * DOT_GAP;
          const anchorY = offsetY + row * DOT_GAP;
          const deltaX = anchorX - pointer.x;
          const deltaY = anchorY - pointer.y;
          const distance = Math.hypot(deltaX, deltaY);
          const proximity = Math.max(0, 1 - distance / radius);
          const influence = proximity * proximity * (3 - 2 * proximity);
          const displacement = influence * influence * 12;
          const directionX = distance > 0 ? deltaX / distance : 0;
          const directionY = distance > 0 ? deltaY / distance : 0;
          const x = anchorX + directionX * displacement;
          const y = anchorY + directionY * displacement;
          const dotRadius = 0.7 + influence * 1.1;

          context.globalAlpha = 0.14 + influence * 0.72;
          context.beginPath();
          context.arc(x, y, dotRadius, 0, TWO_PI);
          context.fill();
        }
      }

      context.globalAlpha = 1;
      if (!reduce) frame = window.requestAnimationFrame(draw);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width || canvas.clientWidth || 300;
      height = rect.height || canvas.clientHeight || 300;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      dotColor = window.getComputedStyle(canvas).color;
      pointer.x = pointer.targetX = width / 2;
      pointer.y = pointer.targetY = height / 2;
      if (reduce) draw(0);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!pointerEnabled) return;
      const rect = canvas.getBoundingClientRect();
      pointer.inside = true;
      pointer.targetX = event.clientX - rect.left;
      pointer.targetY = event.clientY - rect.top;
    };

    const handlePointerLeave = () => {
      pointer.inside = false;
    };

    const resizeObserver =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);

    resize();
    resizeObserver?.observe(canvas);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("pointerleave", handlePointerLeave);
    if (!reduce) draw(0);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [reduce]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 size-full text-foreground"
    />
  );
}

/* ---------- Spinning dither mark ---------- */

function DitherMark({ reduce }: { reduce: boolean }) {
  return (
    <motion.span
      aria-hidden="true"
      animate={reduce ? undefined : { rotate: 360 }}
      transition={{
        duration: 2.4,
        ease: EASE_IN_OUT,
        repeat: Number.POSITIVE_INFINITY,
      }}
      className="grid size-3.5 grid-cols-2 place-items-center gap-0.5"
    >
      <span className="size-1 rounded-[1px] bg-current" />
      <span className="size-1 rounded-[1px] bg-current opacity-55" />
      <span className="size-1 rounded-[1px] bg-current opacity-55" />
      <span className="size-1 rounded-[1px] bg-current" />
    </motion.span>
  );
}

/* ---------- Cycling status text ---------- */

function StatusLine({ reduce }: { reduce: boolean }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % STATUS_LINES.length),
      2600,
    );
    return () => window.clearInterval(id);
  }, [reduce]);

  const text = STATUS_LINES[index];

  return (
    <div
      aria-live="polite"
      className="flex min-h-5 items-center gap-2 text-sm font-medium text-foreground"
    >
      <DitherMark reduce={reduce} />
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={text}
          initial={reduce ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, y: -4 }}
          transition={{ duration: reduce ? 0 : 0.15, ease: EASE_OUT }}
        >
          {text}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

/* ---------- Page ---------- */

export default function CommunityPage() {
  const reduce = useReducedMotion() ?? false;

  return (
    <UserShell active="Community">
      <div className="relative isolate flex h-[calc(100dvh-64px)] min-h-0 w-full items-center justify-center overflow-hidden bg-background text-foreground">
        <DitherBackground reduce={reduce} />

        {/* Soft center fade so the text stays readable over the dots */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--background)_0%,transparent_60%)] opacity-90"
        />

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: reduce ? 0 : 0.8, ease: EASE_OUT }}
          className="relative z-10 flex flex-col items-center gap-5 px-6 text-center"
        >
          <span className="rounded-full bg-muted px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Community
          </span>

          <h1 className="text-balance text-5xl font-semibold tracking-tight sm:text-7xl">
            Coming soon
          </h1>

          <p className="max-w-md text-balance text-base text-muted-foreground sm:text-lg">
            The community chat is getting a big upgrade. Check back shortly.
          </p>

          <StatusLine reduce={reduce} />
        </motion.div>
      </div>
    </UserShell>
  );
}