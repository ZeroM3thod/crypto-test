// app/(public)/_components/referral.tsx
import { Icon } from "./icon";
import { REFERRAL_POINTS, REFERRAL_TIERS } from "./data";

export function Referral() {
  return (
    <section
      id="referral"
      className="max-w-[1280px] mx-auto px-6 mb-[150px] grid grid-cols-1 md:grid-cols-12 gap-12 items-center"
    >
      {/* Left: copy */}
      <div className="md:col-span-5 flex flex-col space-y-6">
        <span className="font-label-caps text-label-caps text-outline uppercase tracking-widest">
          Referral Milestone Bonus System
        </span>
        <h2 className="font-h2 text-h2 text-on-surface">
          Invite friends. Claim instant cash.
        </h2>
        <p className="font-body text-body text-on-surface-variant">
          Meet your active referral target and claim a cash bonus straight to
          your account. Claim early, or skip ahead and save progress for a
          bigger payout.
        </p>
        <ul className="space-y-4">
          {REFERRAL_POINTS.map((t) => (
            <li key={t} className="flex items-start">
              <Icon
                name="check_circle"
                className="text-primary mr-3 mt-1 text-[20px]"
              />
              <span className="text-on-surface-variant text-sm">{t}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Right: targets card */}
      <div className="md:col-span-7 bg-surface-container-low border border-outline-variant rounded-[24px] p-8 shadow-sm relative overflow-hidden">
        <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/50">
          <div className="mb-4 text-xs font-medium text-on-surface-variant tracking-widest uppercase">
            Referral Targets &amp; Cash Rewards
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {REFERRAL_TIERS.map((t) => (
              <div
                key={t.referrals}
                className="bg-surface border border-outline-variant rounded-lg p-3 text-center"
              >
                <div className="text-xs text-on-surface-variant">
                  {t.referrals} Referrals
                </div>
                <div className="text-lg font-bold">${t.bonus}.00</div>
              </div>
            ))}
          </div>

          <div className="bg-surface p-4 rounded-lg border border-outline-variant mb-6 text-sm text-on-surface font-mono leading-relaxed">
            0 Referrals &rarr; Reach{" "}
            <span className="bg-primary/10 text-primary px-1 rounded-sm">
              10 Referrals
            </span>{" "}
            &rarr; Claim $10.00 &rarr; Counter resets to 0
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1 text-on-surface-variant">
                <span>Progress to 10 referrals</span>
                <span>7 / 10</span>
              </div>
              <div className="h-2 bg-surface-variant rounded-full">
                <div className="h-full bg-primary rounded-full w-[70%]" />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4 border-t border-surface-variant pt-4 mt-6">
            <button
              type="button"
              className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center"
            >
              <Icon name="redeem" filled />
            </button>
            <div className="text-sm text-on-surface-variant">
              Plus <b className="text-on-surface">5% lifetime commission</b> on
              referral profits.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
