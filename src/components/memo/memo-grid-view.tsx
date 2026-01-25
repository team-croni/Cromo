"use client";

import { useMemos } from "@hooks/useMemos";
import { useSession } from "next-auth/react";
import { MemoSearchInput } from "./memo-search-input";
import { Ring } from "ldrs/react";
import { useEffect, useState } from "react";
import { MemoGridControls } from "./memo-grid-controls";
import { MemoSearchResults } from "./memo-search-results";
import { ScrollFadeOverlay } from "@components/layout/scroll-fade-overlay";
import { useMemoStore } from "@store/memoStore";

export function MemoGridView() {
  const { allMemosLoading, sharedMemosLoading } = useMemos();
  const { data: session } = useSession();
  const { searchTerm } = useMemoStore();
  const [greeting, setGreeting] = useState("");

  const isMain = !searchTerm;

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) {
        setGreeting("좋은 아침이에요");
      } else if (hour >= 12 && hour < 17) {
        setGreeting("즐거운 오후 보내고 계신가요");
      } else if (hour >= 17 && hour < 21) {
        setGreeting("평안한 저녁 되세요");
      } else {
        setGreeting("오늘 하루도 고생 많으셨어요");
      }
    };

    updateGreeting();
    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, []);


  if (allMemosLoading || sharedMemosLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Ring
          size="28"
          speed="2"
          stroke={3}
          color="var(--color-foreground)"
          bgOpacity={0.2}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-y-auto scrollbar-hide relative">
      <div className="flex flex-col w-full h-full mx-auto pb-24 overflow-y-scroll scrollbar-normal">
        <div className={`flex flex-col w-full mx-auto transition-all ${!isMain ? '' : 'mt-4'}`}>
          <div className={`shrink-0 flex flex-col max-w-4xl w-full mx-auto px-4 md:px-8 lg:px-8 overflow-hidden transition-all ${!isMain ? 'opacity-0 h-0' : 'h-48'}`}>
            <h1 className="text-3xl lg:text-[2.5rem] font-light text-foreground mt-6 md:mt-12 mb-4 tracking-tight leading-tight">
              {greeting}, <span className="text-primary font-medium">{session?.user?.name || "사용자"}</span>님!
            </h1>
            <p className="text-muted-foreground/80 text-base max-w-2xl leading-relaxed">
              오늘 당신의 생각은 무엇인가요? <br className="hidden sm:block" />
              기존 기록들을 확인하거나 새로운 메모를 작성해보세요.
            </p>
          </div>
          <MemoGridControls />
          <MemoSearchResults />
        </div>
      </div>
      <MemoSearchInput />
      <ScrollFadeOverlay />
    </div>
  );
}
