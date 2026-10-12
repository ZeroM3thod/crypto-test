"use client";

import { useTheme } from "@/components/theme-provider";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : true;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? "Switch to Day mode" : "Switch to Night mode"}
      aria-label={isDark ? "Switch to Day mode" : "Switch to Night mode"}
      className={cn(
        "group relative flex items-center justify-center gap-2 rounded-xl p-2 text-sm font-medium transition-colors outline-none",
        "border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        className,
      )}
    >
      <div className="relative flex size-4 items-center justify-center">
        {isDark ? (
          <Sun className="size-4 text-amber-400 transition-transform duration-300 group-hover:rotate-45" />
        ) : (
          <Moon className="size-4 text-sky-500 transition-transform duration-300 group-hover:-rotate-12" />
        )}
      </div>
      {showLabel ? (
        <span className="select-none text-xs font-medium text-foreground">
          {isDark ? "Day Mode" : "Night Mode"}
        </span>
      ) : null}
      <span className="sr-only">Toggle day and night mode</span>
    </button>
  );
}

export function FloatingThemeToggle() {
  return (
    <div className="fixed right-4 top-4 z-50">
      <ThemeToggle className="shadow-sm backdrop-blur-md" showLabel />
    </div>
  );
}
