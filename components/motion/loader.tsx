"use client";

import { motion, useReducedMotion } from "motion/react";
import { EASE_IN_OUT } from "@/lib/ease";
import { cn } from "@/lib/utils";

const BAYER_4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

export interface DitherLoaderProps {
  size?: number;
  speed?: number;
  label?: string;
  className?: string;
}

export function DitherLoader({ size = 36, speed = 1, label = "Loading", className }: DitherLoaderProps) {
  const reduce = useReducedMotion() ?? false;
  const gap = Math.max(1, size * 0.05);
  const cell = (size - gap * 3) / 4;

  return (
    <span role="status" aria-label={label} className={cn("inline-flex items-center justify-center text-foreground", className)}>
      <span className="grid" style={{ gap, gridTemplateColumns: `repeat(4, ${cell}px)` }}>
        {BAYER_4.map((order, idx) => (
          <motion.span
            key={idx}
            className="bg-current"
            style={{ width: cell, height: cell }}
            animate={reduce ? { opacity: [0.3, 1, 0.3] } : { opacity: [0.1, 1, 0.1] }}
            transition={{ duration: speed, ease: EASE_IN_OUT, repeat: Infinity, delay: (order / BAYER_4.length) * speed }}
          />
        ))}
      </span>
      <span className="sr-only">{label}</span>
    </span>
  );
}
