"use client";

import React, { useEffect, useRef } from 'react';
import LogoSymbolSvg from "@svgs/logo/logo-dark.svg";
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export const BetaTestSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

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
      { threshold: 0.5 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div className="fixed inset-0 z-0">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="geometric-pattern" x="0" y="0" width="70" height="70" patternUnits="userSpaceOnUse">
              <path d="M0 0h70v70H0z" fill="#151618" />
              <path d="M0 0l70 70M70 0L0 70" stroke="rgba(255,255,255,0.035)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#geometric-pattern)" />
        </svg>
      </div>
      <section id="beta-test" className="relative py-40 px-6 overflow-hidden">
        <div className='absolute left-0 top-0 w-full h-20 bg-linear-to-t from-black/0 to-black/30' />
        <div className='absolute left-0 bottom-0 w-full h-20 bg-linear-to-t from-black/30 to-black/0' />
        <div ref={sectionRef} className="container mx-auto max-w-5xl relative z-10 opacity-0">
          <div className="text-center mb-10">
            {/* 베타 뱃지 & 로고 */}
            <div className="inline-flex items-center px-4.5 py-2 rounded-full border mb-6 backdrop-blur-sm">
              <span className="text-sm font-medium tracking-widest text-blue-300 uppercase">Beta version</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-8">
              Cromo의 시작을 <br className="md:hidden" />
              함께 완성해 주세요
            </h2>
            <p className="text-xl text-zinc-400">
              현재 Cromo는 더 완벽한 경험을 위해 진화 중입니다. <br className="hidden md:block" />
              베타 기간 동안 제공되는 <strong>프리미엄 기능</strong>을 먼저 경험하고 소중한 의견을 들려주세요.
            </p>
          </div>

          <div className='flex justify-center mb-16'>
            <p className="py-2 px-4 text-red-300/70 leading-relaxed rounded-xl text-center">
              베타 단계 특성상 예기치 못한 오류가 있을 수 있습니다. 중요한 데이터는 주기적인 백업을 권장하며, 문제 발생 시 즉각 대응하겠습니다.
            </p>
          </div>

          {/* 하단 CTA */}
          <Link href="/memo">
            <button className="flex items-center justify-center py-4 px-8 mx-auto font-medium text-foreground transition duration-200 hover:text-foreground border border-primary hover:bg-black/50 hover:border-primary rounded-full shine-border">
              지금 무료로 시작하기
              <ChevronRight className="w-4 h-4 ml-2 -mr-1.5" />
            </button>
          </Link>
        </div>
      </section>
    </>
  );
};