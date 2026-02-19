import { LandingHeader } from "@/components/landing/landing-header";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { BetaTestSection } from "@/components/landing/beta-test-section";
import { Footer } from "@/components/landing/footer";
import { FaqSection } from "@components/landing/faq-section";
import "@styles/landing.css";

export default function Home() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cromo.site";

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Cromo",
      "description": "AI와 함께하는 스마트한 메모 관리 플랫폼. 실시간 공유와 지능형 검색을 통해 아이디어를 가치 있게 만드세요.",
      "url": baseUrl,
      "applicationCategory": "ProductivityApplication",
      "operatingSystem": "Web",
      "author": {
        "@type": "Organization",
        "name": "Croni",
        "url": "https://github.com/team-croni"
      },
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "KRW"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Cromo",
      "url": baseUrl,
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${baseUrl}/memo?search={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "itemListElement": [
        {
          "@type": "SiteNavigationElement",
          "position": 1,
          "name": "시작하기",
          "url": `${baseUrl}/memo`
        },
        {
          "@type": "SiteNavigationElement",
          "position": 2,
          "name": "로그인",
          "url": `${baseUrl}/login`
        },
        {
          "@type": "SiteNavigationElement",
          "position": 3,
          "name": "문의하기",
          "url": `${baseUrl}/contact`
        }
      ]
    }
  ];

  return (
    <main className="flex-1">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
