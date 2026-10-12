// app/(public)/_components/wallets.tsx
import { SectionHeading } from "./section-heading";
import { IconCard } from "./icon-card";
import { WALLETS } from "./data";

export function Wallets() {
  return (
    <section className="max-w-[1280px] mx-auto px-6 mb-[150px]">
      <SectionHeading
        title="Three wallets. Total clarity."
        subtitle="Trading risk never bleeds into your long-term investment. Internal transfers are zero-fee."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {WALLETS.map((w) => (
          <IconCard key={w.title} {...w} />
        ))}
      </div>
    </section>
  );
}
