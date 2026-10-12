// app/(public)/_components/footer.tsx
import Link from "next/link";
import { Icon } from "./icon";
import { FOOTER_COLUMNS } from "./data";

export function Footer() {
  return (
    <footer className="w-full border-t border-surface-variant bg-surface-bright pt-24 pb-12">
      {/* Final CTA */}
      <div className="max-w-[1280px] mx-auto px-6 mb-20 text-center">
        <h2 className="text-5xl md:text-7xl font-bold tracking-tighter text-on-surface mb-8">
          Ready to grow?
        </h2>
        <Link
          href="/signup"
          className="inline-flex items-center justify-center bg-primary text-on-primary font-button text-lg px-8 py-4 rounded-full hover:opacity-90 transition-opacity active:scale-95 duration-200"
        >
          Create Your Account
        </Link>
      </div>

      {/* Link grid */}
      <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-12 mb-16">
        <div className="col-span-2 md:col-span-4 lg:col-span-2">
          <div className="text-2xl font-bold tracking-tighter text-on-surface mb-6">
            Qouantex
          </div>
          <p className="font-body text-sm text-on-surface-variant mb-6 pr-4">
            The all-in-one intelligent crypto wealth and trading ecosystem.
          </p>
          <div className="flex flex-col space-y-2">
            <label
              className="text-xs font-medium text-on-surface"
              htmlFor="newsletter-email"
            >
              Subscribe to updates
            </label>
            <div className="flex">
              <input
                id="newsletter-email"
                type="email"
                placeholder="Email address"
                className="bg-surface-container border border-outline-variant text-on-surface text-sm rounded-l-md px-3 py-2 w-full focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                className="bg-primary text-on-primary px-4 py-2 rounded-r-md text-sm font-medium hover:opacity-90"
              >
                Join
              </button>
            </div>
          </div>
        </div>

        {Object.entries(FOOTER_COLUMNS).map(([heading, links]) => (
          <div key={heading}>
            <h4 className="font-label-caps text-label-caps text-on-surface mb-4">
              {heading}
            </h4>
            <ul className="space-y-3 font-body text-xs leading-relaxed text-on-surface-variant">
              {links.map((l) => (
                <li key={l}>
                  <a className="hover:text-on-surface transition-colors" href="#">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="max-w-[1280px] mx-auto px-6 pt-8 border-t border-surface-variant flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
        <div className="font-body text-xs leading-relaxed text-outline">
          &copy; 2026 Qouantex. Trading and investing involve risk; past
          performance does not guarantee future results.
        </div>
        <div className="flex space-x-4 text-outline">
          <a
            className="hover:text-on-surface transition-colors"
            href="#"
            aria-label="Website"
          >
            <Icon name="language" className="text-[20px]" />
          </a>
          <a
            className="hover:text-on-surface transition-colors"
            href="#"
            aria-label="Chat"
          >
            <Icon name="chat" className="text-[20px]" />
          </a>
        </div>
      </div>
    </footer>
  );
}
