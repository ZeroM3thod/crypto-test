export function SummaryRow({ fee = 0, eta = "Instant" }: { fee?: number; eta?: string }) {
  return (
    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-xl border border-border/50 bg-background/40 px-3 py-2.5 text-[11px] sm:mt-3 sm:px-3.5 md:px-4 md:py-3 md:text-xs">
      <span className="text-muted-foreground">Fee</span>
      <span className="text-right tabular-nums text-foreground">
        {fee === 0 ? "Free" : `$${fee.toFixed(2)}`}
      </span>
      <span className="text-muted-foreground">Speed</span>
      <span className="text-right text-foreground">{eta}</span>
    </div>
  );
}
