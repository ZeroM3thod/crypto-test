// app/(public)/_components/icon-card.tsx
import { Icon } from "./icon";
import { CARD, type IconItem } from "./data";

export function IconCard({ icon, title, desc }: IconItem) {
  return (
    <div
      className={`${CARD} rounded-[20px] p-6 hover:bg-surface-container-low transition-colors`}
    >
      <Icon name={icon} className="text-3xl text-outline mb-4" />
      <h3 className="font-h3 text-xl text-on-surface mb-2">{title}</h3>
      <p className="text-sm text-on-surface-variant leading-relaxed">{desc}</p>
    </div>
  );
}
