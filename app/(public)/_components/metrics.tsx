// app/(public)/_components/metrics.tsx
import { METRICS } from "./data";

export function Metrics() {
  return (
    <section className="max-w-[1280px] mx-auto px-6 py-[80px] mb-[150px] border-y border-surface-variant">
      <p className="text-center text-sm font-medium text-outline mb-8 uppercase tracking-widest">
        The platform at a glance
      </p>
      <div className="flex flex-wrap justify-center gap-x-16 gap-y-8 text-center">
        {METRICS.map((m) => (
          <div key={m.label}>
            <div className="text-4xl font-semibold tracking-tight">
              {m.value}
            </div>
            <div className="text-sm text-outline mt-1">{m.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
