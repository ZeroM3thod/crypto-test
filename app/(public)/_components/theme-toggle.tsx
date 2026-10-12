// app/(public)/_components/theme-toggle.tsx
"use client";

import { useSyncExternalStore } from "react";
import { Icon } from "./icon";

const STORAGE_KEY = "crypto_invest_theme";

// Re-render whenever the <html> class list changes (from anywhere)
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

const getSnapshot = () => document.documentElement.classList.contains("dark");
const getServerSnapshot = () => true; // your app defaults to dark

export function ThemeToggle() {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = () => {
    const next = isDark ? "light" : "dark";
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(next);
    root.setAttribute("data-theme", next);
    root.style.colorScheme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle light/dark mode"
      className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container-highest transition-colors"
    >
      <Icon name={isDark ? "light_mode" : "dark_mode"} className="text-[20px]" />
    </button>
  );
}
