"use client";

import { LandingHeader } from "@/components/landing/landing-header";
import { Footer } from "@/components/landing/footer";

interface LegalLayoutProps {
  children: React.ReactNode;
  title: string;
  lastUpdated: string;
}

export function LegalLayout({ children, title, lastUpdated }: LegalLayoutProps) {
  return (
    <main className="flex-1">
      <div className="flex flex-col bg-background text-foreground">
        <div className="flex-1 mx-auto px-4 max-w-4xl">
          <div className="sticky top-0 pt-8 pb-5 mb-7 bg-background">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white">{title}</h1>
            <p className="text-muted-foreground">최종 수정일: {lastUpdated}</p>
          </div>

          <div className="prose prose-invert max-w-none pb-20 text-gray-300 leading-relaxed space-y-6">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
