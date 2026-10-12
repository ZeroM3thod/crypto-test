// app/(public)/_components/dividend-countdown.tsx
"use client";

import { useEffect, useState } from "react";

const pad = (n: number) => String(n).padStart(2, "0");
const secondsLeft = () => 86400 - (Math.floor(Date.now() / 1000) % 86400);

export function DividendCountdown() {
  const [s, setS] = useState<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => setS(secondsLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  const label =
    s === null
      ? "--:--:--"
      : [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60]
          .map(pad)
          .join(":");

  return (
    <div className="text-xs text-on-surface-variant font-mono">{label}</div>
  );
}
