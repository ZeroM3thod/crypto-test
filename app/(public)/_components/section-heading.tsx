// app/(public)/_components/section-heading.tsx
export function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="text-center mb-16">
      <h2
        className={`font-h2 text-h2 text-on-surface${subtitle ? " mb-4" : ""}`}
      >
        {title}
      </h2>
      {subtitle && (
        <p className="font-body text-body text-on-surface-variant max-w-[600px] mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
}
