"use client";

import { useEffect, useRef } from "react";
import { FileText, Brain, Users, Cloud } from "lucide-react";
import { EditorPreview } from "./editor-preview";
import { MemoPreview } from "@/components/landing/memo-preview";
import { TypingAnimation } from "./typing-animation";

export function FeaturesSection() {
  const headerRef = useRef<HTMLDivElement>(null);
  const featureRefs = useRef<(HTMLDivElement | null)[]>([]);
  const memoSectionRef = useRef<HTMLDivElement>(null);
  const memoPreviewRef = useRef<HTMLDivElement>(null);
  const editorSectionRef = useRef<HTMLDivElement>(null);
  const editorPreviewRef = useRef<HTMLDivElement>(null);

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

    if (headerRef.current) observer.observe(headerRef.current);
    featureRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });
    if (memoSectionRef.current) observer.observe(memoSectionRef.current);
    if (memoPreviewRef.current) observer.observe(memoPreviewRef.current);
    if (editorSectionRef.current) observer.observe(editorSectionRef.current);
    if (editorPreviewRef.current) observer.observe(editorPreviewRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <section id="features" className="relative pt-30 pb-4 bg-[#101012] z-10 overflow-hidden">
      <div className="container px-4 mx-auto">
        <div ref={headerRef} className="text-center max-w-3xl mx-auto mb-20 opacity-0">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-6">
            Cromo만의 특별한 기능들
          </h2>
          <p className="text-lg sm:text-xl text-zinc-400">
            단순한 메모앱이 아닌, 당신의 생각을 스마트하게 정리해주는 파트너입니다.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-32">
          {[
            {
              icon: FileText,
              title: "스마트한 메모 기능",
              desc: "직관적이고 강력한 에디터로 아이디어를 쉽게 정리하고 조직화할 수 있습니다."
            },
            {
              icon: Brain,
              title: "AI 활용 메모",
              desc: "AI가 메모 내용을 분석하여 자동으로 카테고리화하고 관련 정보를 제안합니다."
            },
            {
              icon: Users,
              title: "실시간 공유",
              desc: "소켓 기반 실시간 동기화로 여러 사람이 동시에 메모를 작성하고 수정할 수 있습니다."
            },
            {
              icon: Cloud,
              title: "클라우드 저장",
              desc: "로컬 저장 공간 걱정 없이 클라우드에 안전하게 데이터를 보관하세요."
            }
          ].map((feature, idx) => (
            <div
              key={idx}
              ref={(el) => { featureRefs.current[idx] = el; }}
              className={`group p-6 rounded-2xl border border-white/5 bg-zinc-900/50 hover:bg-zinc-900 hover:border-primary/20 transition-all duration-300 opacity-0 ${idx === 0 ? '' : idx === 1 ? 'delay-2' : idx === 2 ? 'delay-3' : 'delay-4'}`}
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-zinc-100">{feature.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>

        {/* 메모 관리 기능 섹션 */}
        <div className="flex flex-col xl:flex-row justify-center items-center min-h-150 mt-40">
          <div ref={memoSectionRef} className="relative xl:mr-36 mb-10 sm:mb-16 opacity-0 max-w-150">
            <div className="absolute -left-15 xl:-left-20 top-14 w-160 xl:w-140 h-40 rounded-full bg-blue-500/15 blur-[100px]" />
            <TypingAnimation />
            <h2 className="text-xl md:text-[2.5rem] font-medium mt-5 mb-5 text-transparent bg-clip-text bg-linear-to-b from-foreground to-[#a2a2a8]">
              똑똑한 메모 관리 & 검색
            </h2>
            <p className="text-base sm:text-lg leading-normal text-muted-foreground whitespace-break-spaces">
              AI가 메모 내용을 분석하여 자동으로 카테고리화하고 관련 정보를 제안합니다.
              또, AI 기반 메모 검색을 통해 찾기 힘들었던 오래된 메모들을 쉽고 빠르게 찾을 수 있습니다.
            </p>
          </div>
          <div ref={memoPreviewRef} className="opacity-0 delay-2">
            <MemoPreview />
          </div>
        </div>

        {/* 에디터 기능 미리보기 섹션 */}
        <div className="flex flex-col xl:flex-row justify-center items-center min-h-150 my-20 sm:my-44">
          <div ref={editorSectionRef} className="relative xl:mr-36 mb-16 sm:mb-24 xl:mb-16 opacity-0 max-w-150">
            <div className="absolute -left-15 xl:-left-20 top-14 w-160 xl:w-140 h-40 rounded-full bg-red-500/15 blur-[100px]" />
            <div className="inline-flex items-center px-5 py-2 text-sm sm:text-base text-destructive rounded-full bg-black/70 border border-destructive/50 shadow-lg/50">
              <p className="w-1.5 h-1.5 rounded-full bg-destructive mr-3 animate-pulse"></p>
              <p className="animate-pulse mb-px">LIVE ON</p>
            </div>
            <h2 className="text-xl md:text-[2.5rem] font-medium mt-5 mb-5 text-transparent bg-clip-text bg-linear-to-b from-foreground to-[#a2a2a8]">
              실시간 공유
            </h2>
            <p className="text-base sm:text-lg leading-normal text-muted-foreground whitespace-break-spaces">
              소켓 기반의 강력한 실시간 동기화 기술을 통해, 링크 하나로 간편하게 메모를 공유할 수 있습니다.
              여러 명의 팀원이 동시에 접속하여도 지연 없이 매끄럽게 메모를 확인하고 수정할 수 있습니다.
            </p>
          </div>
          <div ref={editorPreviewRef} className="opacity-0 delay-2">
            <EditorPreview />
          </div>
        </div>
      </div>
    </section>
  );
}