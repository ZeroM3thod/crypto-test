"use client";
// Shared shell for the multi-step signup wizard. Renders a 50% form panel and
// a 50% ShaderBackground (Voronoi) panel, alternating sides per step.

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { ShaderBackground } from "@/components/motion/shader-background";
import { EASE_OUT } from "@/lib/ease";

export interface WizardShellProps {
  /** Shader panel on "left" or "right". */
  shaderSide: "left" | "right";
  children: ReactNode;
  /** Used as the AnimatePresence key so steps cross-fade/slide on change. */
  stepKey: string | number;
}

export function WizardShell({ shaderSide, children, stepKey }: WizardShellProps) {
  const reduce = useReducedMotion();

  const shaderPanel = (
    <div className="relative hidden w-1/2 md:block">
      <ShaderBackground
        variant="voronoi"
        colors={["#ff8247", "#ffe53d"]}
        speed={0.3}
        className="absolute inset-0"
      />
    </div>
  );

  const formPanel = (
    <div className="flex w-full items-center justify-center overflow-hidden px-4 py-10 md:w-1/2">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={stepKey}
          initial={
            reduce
              ? { opacity: 0 }
              : { opacity: 0, x: shaderSide === "left" ? 48 : -48, scale: 0.98 }
          }
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={
            reduce
              ? { opacity: 0 }
              : { opacity: 0, x: shaderSide === "left" ? -48 : 48, scale: 0.98 }
          }
          transition={{ duration: 0.32, ease: EASE_OUT }}
          className="w-full max-w-sm"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      {shaderSide === "left" ? (
        <>
          {shaderPanel}
          {formPanel}
        </>
      ) : (
        <>
          {formPanel}
          {shaderPanel}
        </>
      )}
    </div>
  );
}
