// app/(public)/_components/ai-trading.tsx
import { Icon } from "./icon";

const DAYS = [
  { day: 1, text: "+$2.50 Profit", loss: false },
  { day: 2, text: "+$1.20 Profit", loss: false },
  { day: 3, text: "-$0.80 Loss", loss: true },
  { day: 4, text: "+$3.10 Profit", loss: false },
  { day: 5, text: "+$1.70 Profit", loss: false },
];

const CHIPS = ["From $100", "15-day strategy lock", "Daily P&L updates"];

export function AiTrading() {
  return (
    <section
      id="trading"
      className="max-w-[1280px] mx-auto px-6 mb-[150px] grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
    >
      {/* Code window */}
      <div className="bg-[#111318] rounded-[24px] p-8 overflow-hidden shadow-lg border border-outline-variant/20 order-2 md:order-1">
        <div className="flex space-x-2 mb-6">
          <div className="w-3 h-3 rounded-full bg-outline-variant/30" />
          <div className="w-3 h-3 rounded-full bg-outline-variant/30" />
          <div className="w-3 h-3 rounded-full bg-outline-variant/30" />
        </div>
        <pre className="text-sm font-mono text-white/80 whitespace-pre-wrap">
          <code>
            <span className="text-on-tertiary-container">package</span>
            {" = AI_Trading(min="}
            <span className="text-secondary-fixed-dim">{'"$100.00"'}</span>
            {", lock="}
            <span className="text-secondary-fixed-dim">{'"15 days"'}</span>
            {")\n\n"}
            {DAYS.map((d) => (
              <span key={d.day}>
                {`Day ${d.day}:  `}
                <span
                  className={
                    d.loss
                      ? "text-on-tertiary-container"
                      : "text-secondary-fixed-dim"
                  }
                >
                  {d.text}
                </span>
                {"\n"}
              </span>
            ))}
            {"\n# Day 15 -> principal + net P&L unlocked"}
          </code>
        </pre>
      </div>

      {/* Copy */}
      <div className="flex flex-col space-y-6 order-1 md:order-2">
        <h2 className="font-h2 text-h2 text-on-surface">
          Quantitative AI Trading
        </h2>
        <p className="font-body text-body text-on-surface-variant">
          Algorithmic execution 24/7 on top pairs. Every 24 hours your real
          daily performance is updated. Returns are never fixed or guaranteed
          and reflect genuine market movement.
        </p>
        <div className="flex flex-wrap gap-3">
          {CHIPS.map((c) => (
            <span
              key={c}
              className="px-3 py-1 bg-surface-container border border-outline-variant rounded-full text-xs font-medium"
            >
              {c}
            </span>
          ))}
        </div>
        <a
          className="text-sm font-medium text-primary hover:underline inline-flex items-center mt-4"
          href="#"
        >
          View AI strategies{" "}
          <Icon name="arrow_forward" className="text-[16px] ml-1" />
        </a>
      </div>
    </section>
  );
}
