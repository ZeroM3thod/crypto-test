// app/(public)/page.tsx
import type { Metadata } from "next";
import { Navbar } from "./_components/navbar";
import { Hero } from "./_components/hero";
import { Metrics } from "./_components/metrics";
import { Features } from "./_components/features";
import { Referral } from "./_components/referral";
import { AiTrading } from "./_components/ai-trading";
import { HowItWorks } from "./_components/how-it-works";
import { Wallets } from "./_components/wallets";
import { Pricing } from "./_components/pricing";
import { Security } from "./_components/security";
import { Faq } from "./_components/faq";
import { Footer } from "./_components/footer";

export const metadata: Metadata = {
  title: "Qouantex - Crypto Wealth & Trading Ecosystem",
};

export default function HomePage() {
  return (
    <div className="qx min-h-screen bg-surface font-body text-body text-on-surface">
      <Navbar />
      <main className="pt-32 pb-32">
        <Hero />
        <Metrics />
        <Features />
        <Referral />
        <AiTrading />
        <HowItWorks />
        <Wallets />
        <Pricing />
        <Security />
        <Faq />
      </main>
      <Footer />
    </div>
  );
}
