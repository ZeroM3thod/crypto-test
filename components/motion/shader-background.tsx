"use client";
// Full-bleed animated shader panel used by the signup wizard shell.
// Wraps @paper-design/shaders-react so callers only deal with variant/colors/speed.

import { Voronoi } from "@paper-design/shaders-react";
import { cn } from "@/lib/utils";

export type ShaderVariant = "voronoi";

export interface ShaderBackgroundProps {
  variant?: ShaderVariant;
  /** Base cell colors (Voronoi supports up to 5). */
  colors?: string[];
  /** Animation speed — 0 pauses, 1 is fast. */
  speed?: number;
  className?: string;
}

export function ShaderBackground({
  variant = "voronoi",
  colors,
  speed = 0.3,
  className,
}: ShaderBackgroundProps) {
  if (variant !== "voronoi") return null;

  return (
    <Voronoi
      colors={colors}
      speed={speed}
      fit="cover"
      className={cn("h-full w-full", className)}
    />
  );
}
