"use client";

import { ArrowRight } from "lucide-react";
import { StatefulButton, type ButtonState } from "@/components/motion/button";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface StepCardProps {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextState?: ButtonState;
  hideBack?: boolean;
  footer?: ReactNode;
  className?: string;
}

export function StepCard({
  title,
  description,
  children,
  onBack,
  onNext,
  nextLabel = "Next",
  nextState = "idle",
  hideBack,
  footer,
  className,
}: StepCardProps) {
  return (
    <div className={cn("flex w-full flex-col gap-5", className)}>
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-4">{children}</div>

      <div className="flex items-center gap-4">
        {!hideBack && onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="text-sm font-medium text-foreground underline-offset-4 transition-colors hover:underline"
          >
            Back
          </button>
        ) : null}

        {/* Exact same invocation as ButtonStatefulPreview's "ok" button */}
        <StatefulButton
          state={nextState}
          variant="primary"
          size="md"
          onClick={onNext}
          loadingText="Saving"
          successText="Saved"
          icon={<ArrowRight className="h-4 w-4" />}
          className="ml-auto bg-foreground text-background hover:bg-foreground/90"
        >
          {nextLabel}
        </StatefulButton>
      </div>

      {footer ? (
        <div className="text-center text-sm text-foreground">{footer}</div>
      ) : null}
    </div>
  );
}
