// app/(public)/_components/security.tsx
import { Icon } from "./icon";
import { SECURITY } from "./data";

export function Security() {
  return (
    <section className="max-w-[1280px] mx-auto px-6 mb-[150px] grid grid-cols-1 md:grid-cols-2 gap-12 items-center border-y border-surface-variant py-[80px]">
      <div className="flex flex-col space-y-6">
        <h2 className="font-h2 text-h2 text-on-surface">
          Bank-grade safety &amp; compliance
        </h2>
        <p className="font-body text-body text-on-surface-variant">
          Google Authenticator 2FA with backup codes, a 4-step KYC flow, a full
          login audit trail with IP and device flags, and one-click session
          revocation. Withdrawals require 2FA confirmation.
        </p>
        <a
          className="text-sm font-medium text-primary hover:underline inline-flex items-center"
          href="#"
        >
          Learn about security{" "}
          <Icon name="arrow_forward" className="text-[16px] ml-1" />
        </a>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {SECURITY.map((s) => (
          <div
            key={s.title}
            className="border border-outline-variant rounded-xl p-6 bg-surface-container-lowest flex flex-col items-center justify-center text-center h-32"
          >
            <span className="font-bold text-on-surface mb-1 text-lg">
              {s.title}
            </span>
            <span className="text-xs text-on-surface-variant">{s.desc}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
