// app/(public)/_components/navbar.tsx
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function Navbar() {
  return (
    <nav className="fixed top-4 left-0 w-full z-50 px-6 pointer-events-none">
      <div className="pointer-events-auto mx-auto w-full max-w-[560px] flex items-center justify-between bg-surface-container-high border border-outline-variant rounded-full pl-6 pr-2 py-2 backdrop-blur-xl">
        <Link
          href="/"
          className="text-lg font-bold tracking-tighter text-on-surface"
        >
          Qouantex
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Link
            href="/signup"
            className="inline-flex items-center bg-primary text-on-primary font-button text-button px-6 py-3 rounded-full hover:opacity-90 transition-opacity active:scale-95 duration-200"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
