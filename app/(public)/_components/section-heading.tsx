import { ScrollReveal } from "@/components/motion/scroll-reveal";

export function SectionHeading({ title, subtitle, eyebrow }: { title: string; subtitle?: string; eyebrow?: string }) {
  return <ScrollReveal amount={0.2} className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
    {eyebrow && <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">{eyebrow}</p>}
    <h2 className="text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl">{title}</h2>
    {subtitle && <p className="mt-4 text-base text-muted-foreground text-pretty sm:text-lg">{subtitle}</p>}
  </ScrollReveal>;
}
