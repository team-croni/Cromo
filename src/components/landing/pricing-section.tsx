"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Check } from "lucide-react";

export function PricingSection() {
  const headerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('fade-in-up');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );

    if (headerRef.current) observer.observe(headerRef.current);
    if (cardRef.current) observer.observe(cardRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <section id="pricing" className="relative pt-34 pb-24 sm:py-34 bg-[#101012] overflow-hidden">
      <div className="absolute left-1/2 -translate-1/2 top-120 w-200 h-160 rounded-full bg-muted-foreground/8 blur-[100px] pointer-events-none" />
      <div className="container px-4 mx-auto">
        <div ref={headerRef} className="text-center max-w-3xl mx-auto mb-14 sm:mb-20 opacity-0">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-6 text-transparent bg-clip-text bg-linear-to-b from-white to-white/60">
            가격 정책
          </h2>
          <p className="text-lg sm:text-xl text-zinc-400">
            베타 버전에서는 모든 프리미엄 기능을 무료로 이용 가능합니다.
          </p>
        </div>

        <div>
          {/* BETA Plan */}
          <div ref={cardRef} className="relative w-full max-w-90 h-126 mx-auto shadow-2xl/40 hover:scale-102 transition-all duration-300 ease-out opacity-0 delay-1">
            <div className="absolute -inset-px bg-linear-to-r from-transparent via-white/60 to-transparent animate-shimmer-smooth rounded-3xl" />
            <div className="absolute flex flex-col p-6 inset-0 border rounded-3xl bg-sidebar">
              <div className="text-center mb-6">
                <div className="text-4xl font-bold mt-5 mb-4">
                  ₩0<span className="text-lg font-normal text-muted-foreground ml-1">/월</span>
                </div>
                <p className="text-muted-foreground">베타 테스트를 위한 플랜</p>
              </div>

              <ul className="flex-1 space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  <span>결제 등록 필요 없음</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  <span>에디터 AI 기능</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  <span>폴더 및 메모 관리 AI 기능</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  <span>스마트한 메모 검색 기능</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  <span>클라우드 저장</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  <span>무제한 실시간 공유</span>
                </li>
              </ul>

              <Link href="/login">
                <button className="p-2.5 w-full text-foreground transition duration-200 hover:text-foreground border border-primary hover:bg-black/50 hover:border-primary rounded-xl shine-border">
                  시작하기
                </button>
              </Link>
            </div>
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-inverse border border-blue-500 text-blue-500 font-medium px-4 py-1 rounded-full shadow-lg/30">
              BETA
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}