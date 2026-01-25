import { LandingHeader } from "@/components/landing/landing-header";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { BetaTestSection } from "@/components/landing/beta-test-section";
import { Footer } from "@/components/landing/footer";
import { FaqSection } from "@components/landing/faq-section";

export default function Home() {
  return (
    <main className="flex-1">
      <div className="flex-1 flex flex-col bg-[#151618]">
        <LandingHeader />
        <HeroSection />
        <FeaturesSection />
        <BetaTestSection />
        <PricingSection />
        <FaqSection />
        <Footer />
      </div>
    </main>
  );
}