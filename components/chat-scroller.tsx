"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export interface ChatScrollerProps {
  children: ReactNode;
  className?: string;
  viewportClassName?: string;
  contentClassName?: string;
  followThreshold?: number;
}

export function ChatScroller({
  children,
  className,
  viewportClassName,
  contentClassName,
  followThreshold = 64,
}: ChatScrollerProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const followingRef = useRef(true);
  const programmaticRef = useRef(false);

  const scrollToEnd = useCallback((behavior: ScrollBehavior) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    programmaticRef.current = true;
    viewport.scrollTo({ top: viewport.scrollHeight, behavior });
    window.setTimeout(
      () => {
        programmaticRef.current = false;
      },
      behavior === "smooth" ? 300 : 0,
    );
  }, []);

  const handleScroll = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport || programmaticRef.current) return;
    const distance =
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    followingRef.current = distance <= followThreshold;
  }, [followThreshold]);

  useLayoutEffect(() => {
    scrollToEnd("auto");
  }, [scrollToEnd]);

  useEffect(() => {
    const content = contentRef.current;
    if (!content || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      if (followingRef.current) scrollToEnd("smooth");
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, [scrollToEnd]);

  return (
    <div className={cn("min-h-0", className)}>
      <div
        ref={viewportRef}
        onScroll={handleScroll}
        className={cn(
          "h-full overflow-y-auto overscroll-contain [scrollbar-gutter:stable]",
          viewportClassName,
        )}
      >
        <div
          ref={contentRef}
          role="log"
          aria-live="polite"
          aria-relevant="additions text"
          className={contentClassName}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
