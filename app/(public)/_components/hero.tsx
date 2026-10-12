// app/(public)/_components/hero.tsx
import Link from "next/link";
import { Icon } from "./icon";
import { DividendCountdown } from "./dividend-countdown";
import { CARD, PNL, WALLET_TABS, ACTIVE_WALLET_TAB } from "./data";

export function Hero() {
  return (
    <section className="max-w-[1280px] mx-auto px-6 flex flex-col items-center text-center mt-12 mb-[150px]">
      {/* Announcement pill */}
      <div className="inline-flex items-center space-x-2 bg-surface-container-high px-4 py-2 rounded-full mb-8 border border-outline-variant">
        <span className="bg-tertiary text-on-tertiary text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full">
          New
        </span>
        <span className="text-sm font-medium text-on-surface">
          Referral Milestone Bonuses are live
        </span>
        <Icon name="arrow_forward" className="text-sm text-outline" />
      </div>

      <h1 className="font-h1 text-h1 text-on-surface max-w-[900px] mb-8">
        The all-in-one crypto wealth &amp; trading ecosystem
      </h1>
      <p className="font-body text-body text-on-surface-variant max-w-[620px] mb-12">
        Automated daily profit plans and professional AI trading, organized in a
        segregated 3-wallet system with 2FA, KYC and login tracking built in.
      </p>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-24">
        <Link
          href="/signin"
          className="inline-flex items-center justify-center bg-primary text-on-primary font-button text-button px-8 py-4 rounded-full hover:opacity-90 transition-opacity w-full sm:w-auto"
        >
          Dashboard
        </Link>
        <a
          href="/signup"
          className="inline-flex items-center justify-center bg-transparent border border-outline-variant text-on-surface font-button text-button px-8 py-4 rounded-full hover:bg-surface-container transition-colors w-full sm:w-auto"
        >
          Get Started
        </a>
      </div>

      {/* Dashboard preview */}
      <div className="w-full max-w-[1024px] bg-surface-container-lowest border border-outline-variant rounded-2xl p-2 shadow-sm">
        <div className="bg-surface-container-low rounded-xl overflow-hidden border border-outline-variant/50 relative p-6 md:p-8 text-left">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <div className="text-xs font-medium text-on-surface-variant uppercase tracking-widest mb-1">
                Portfolio Value
              </div>
              <div className="text-4xl font-semibold tracking-tight">
                $12,480.55
              </div>
            </div>
            <div className="flex gap-2">
              {WALLET_TABS.map((tab) => (
                <span
                  key={tab}
                  className={`px-3 py-1 rounded-full text-xs font-medium border border-outline-variant ${
                    tab === ACTIVE_WALLET_TAB
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-lowest text-on-surface"
                  }`}
                >
                  {tab}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {PNL.map((p) => (
              <div key={p.label} className={`${CARD} rounded-xl p-4`}>
                <div className="text-xs text-on-surface-variant mb-1">
                  {p.label} P&amp;L
                </div>
                <div className="text-lg font-semibold">{p.value}</div>
              </div>
            ))}
          </div>

          <div className="bg-surface-container-lowest/90 border border-outline-variant rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                type="button"
                className="bg-primary text-on-primary w-10 h-10 rounded-full flex items-center justify-center"
              >
                <Icon name="schedule" filled />
              </button>
              <div>
                <div className="text-sm font-medium">Next dividend credit</div>
                <DividendCountdown />
              </div>
            </div>
            <div className="flex space-x-1 items-end">
              <div className="w-1 h-6 bg-primary rounded-full animate-pulse" />
              <div className="w-1 h-8 bg-primary rounded-full animate-pulse delay-75" />
              <div className="w-1 h-4 bg-primary rounded-full animate-pulse delay-150" />
              <div className="w-1 h-7 bg-primary rounded-full animate-pulse delay-200" />
              <div className="w-1 h-5 bg-outline rounded-full" />
              <div className="w-1 h-3 bg-outline rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
