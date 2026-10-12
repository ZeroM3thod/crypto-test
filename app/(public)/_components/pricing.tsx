// app/(public)/_components/pricing.tsx
import { SectionHeading } from "./section-heading";
import { CARD, PLANS } from "./data";

export function Pricing() {
  return (
    <section id="plans" className="max-w-[1280px] mx-auto px-6 mb-[150px]">
      <SectionHeading
        title="Choose your strategy"
        subtitle="Daily profit tiers and AI trading. Start from $30."
      />
      <div className="flex flex-col lg:flex-row gap-6 justify-center items-stretch">
        {PLANS.map((p) => (
          <div
            key={p.name}
            className={`flex-1 rounded-[24px] p-6 flex flex-col ${
              p.popular
                ? "relative bg-surface-container border-2 border-primary lg:-translate-y-4 shadow-md"
                : CARD
            }`}
          >
            {p.popular && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-on-primary text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Most Popular
              </div>
            )}
            <h3
              className={`text-lg font-medium text-on-surface mb-2${
                p.popular ? " mt-2" : ""
              }`}
            >
              {p.name}
            </h3>
            <div className="text-3xl font-bold text-on-surface mb-6">
              {p.price}
              <span className="text-sm font-normal text-on-surface-variant">
                {p.unit}
              </span>
            </div>
            <p className="text-sm text-on-surface-variant mb-6 grow">
              {p.desc}
            </p>
            <button
              type="button"
              className={
                p.popular
                  ? "w-full py-2 px-4 rounded-full bg-primary text-on-primary font-medium hover:opacity-90 transition-opacity"
                  : "w-full py-2 px-4 rounded-full border border-outline-variant text-on-surface font-medium hover:bg-surface-container transition-colors"
              }
            >
              {p.cta}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
