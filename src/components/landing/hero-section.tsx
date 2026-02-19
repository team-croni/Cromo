"use client";

import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { useEffect, useRef } from "react";
import Image from "next/image";

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);

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
      { threshold: 0.2 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section id="home" className="relative pb-16 md:pb-44 pt-40 sm:pt-54 bg-[#151618] overflow-x-hidden z-10">
      <div className="absolute w-full h-500 bottom-0 bg-linear-to-t from-[#101012] via-[#151618]/50 to-[#151618]/0" />
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px)',
          backgroundSize: '42px 42px'
        }}
      />
      <div className="container px-4 mx-auto">
        <div className="flex flex-col items-center gap-12">
          <div className="relative flex flex-col justify-center items-center flex-1 text-center opacity-0 scale-up" style={{ animationDelay: '100ms' }}>
            <div className="absolute w-200 h-90 mt-4 rounded-full bg-blue-300/10 blur-[100px] pointer-events-none opacity-0" style={{ animation: 'fadeIn 500ms 200ms ease-out forwards' }} />
            <div className="rounded-full space-x-5 text-muted-foreground mb-4 sm:mb-6 text-base sm:text-xl tracking-tight">
              <span>#실시간 공유</span>
              <span>#AI활용</span>
              <span>#똑똑한 메모관리</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold mb-14 sm:mb-18 tracking-tight text-shadow-[0px_8px_20px_rgba(0,0,0,0.5)]">
              <p className="text-blue-300 leading-13 sm:leading-16">AI와 함께하는 스마트한 메모 관리</p>
              <p className="mt-5 sm:mt-3 font-normal text-2xl sm:text-4xl leading-8 sm:leading-16 text-shadow-[0px_6px_12px_rgba(0,0,0,1)]">당신의 아이디어를 더 가치있게 만드세요</p>
            </h1>
            <div className="flex flex-row gap-4 justify-center lg:justify-start opacity-0" style={{ animation: 'slideUp 400ms 200ms ease-out forwards' }}>
              <Link href="/memo">
                <button className="flex items-center justify-center py-3 px-6 font-medium whitespace-nowrap text-sm sm:text-base text-foreground transition duration-200 hover:text-foreground border border-primary hover:bg-black/50 hover:border-primary rounded-full shine-border">
                  지금 시작하기
                  <ChevronRight className="w-4 h-4 ml-2 -mr-1.5" />
                </button>
              </Link>
              <Link href="#features">
                <button className="flex items-center justify-center py-3 px-6 font-medium whitespace-nowrap text-sm sm:text-base text-foreground transition duration-200 hover:text-foreground border border-muted-foreground/30 bg-transparent hover:border-muted-foreground/80 rounded-full">
                  기능 살펴보기
                </button>
              </Link>
            </div>
          </div>
          <div
            ref={containerRef}
            className="relative w-full max-w-6xl sm:mx-auto mt-6 sm:mt-16 rounded-xl sm:rounded-[1.25rem] bg-[#1c1d20] shadow-2xl opacity-0 transform translate-y-8 transition-all duration-1000 overflow-hidden"
            style={{
              boxShadow: '0 0 100px -20px rgba(0, 0, 0, 0.5)',
              animationDelay: '300ms'
            }}
          >
            {/* Browser Toolbar Stickey */}
            <div className="flex items-center gap-2 px-3 sm:px-5 py-1 sm:py-2 border-b border-border/50 bg-[#1e1f23] backdrop-blur-sm sticky top-0 z-10">
              <div className="flex gap-2">
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#FE5F58]" />
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#FEBC2D]" />
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#28C83F]" />
              </div>
              <div className="flex-1 flex items-center justify-center ml-2 mr-1 sm:mx-8 py-1 sm:py-2 px-3 bg-black/25 rounded-lg text-xs text-muted-foreground text-center font-mono">
                <Search className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-2" />
                <span>cromo.site</span>
              </div>
            </div>

            {/* Placeholder Content Area */}
            <div className="relative aspect-1600/968 bg-[#0c0c0e] w-full flex items-center justify-center overflow-hidden group">
              <Image
                src="/images/hero-screenshot1.png"
                alt="Cromo 메모 대시보드 미리보기"
                width={1600}
                height={968}
                priority
                className="object-cover pointer-events-none select-none"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
