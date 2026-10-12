// app/(public)/_components/faq.tsx
import { Icon } from "./icon";
import { SectionHeading } from "./section-heading";
import { CARD, FAQ } from "./data";

export function Faq() {
  return (
    <section className="max-w-[800px] mx-auto px-6 mb-[150px]">
      <SectionHeading title="Frequently asked questions" />
      <div className="space-y-4">
        {FAQ.map((f) => (
          <details key={f.q} className={`${CARD} rounded-[20px] p-6 group`}>
            <summary className="cursor-pointer font-medium text-on-surface list-none [&::-webkit-details-marker]:hidden flex justify-between items-center">
              {f.q}
              <Icon
                name="expand_more"
                className="text-outline group-open:rotate-180 transition-transform"
              />
            </summary>
            <p className="text-sm text-on-surface-variant leading-relaxed mt-4">
              {f.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
