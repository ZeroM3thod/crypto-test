// app/(public)/_components/how-it-works.tsx
import { SectionHeading } from "./section-heading";
import { IconCard } from "./icon-card";
import { STEPS } from "./data";

export function HowItWorks() {
  return (
    <section className="max-w-[1280px] mx-auto px-6 mb-[150px]">
      <SectionHeading
        title="How it works"
        subtitle="From sign-up to withdrawal in four steps."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {STEPS.map((s) => (
          <IconCard key={s.title} {...s} />
        ))}
      </div>
    </section>
  );
}
