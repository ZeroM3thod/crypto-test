// app/(public)/_components/features.tsx
import { Icon } from "./icon";
import { SectionHeading } from "./section-heading";
import { CARD, FEATURES } from "./data";

export function Features() {
  return (
    <section id="features" className="max-w-[1280px] mx-auto px-6 mb-[150px]">
      <SectionHeading
        title="Everything your capital needs"
        subtitle="Five systems, one dashboard: grow, trade, transfer and earn from your network."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className={`${CARD} rounded-[24px] p-6 hover:shadow-sm transition-shadow duration-300 group flex flex-col h-full`}
          >
            <div className="mb-6 bg-surface-container h-40 rounded-xl flex items-center justify-center">
              <Icon
                name={f.icon}
                className="text-4xl text-outline group-hover:text-primary transition-colors"
              />
            </div>
            <h3 className="font-h3 text-h3 text-on-surface mb-2 text-xl">
              {f.title}
            </h3>
            <p className="text-on-surface-variant text-sm leading-relaxed mb-4 grow">
              {f.desc}
            </p>
            <a
              className="text-sm font-medium text-primary hover:underline inline-flex items-center"
              href="#"
            >
              {f.cta} <Icon name="arrow_forward" className="text-[16px] ml-1" />
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
