"use client";

import { Ellipsis } from "lucide-react";

interface MemoProps {
  date: string;
  title: string;
  content: string;
  isLive?: boolean;
  isArchived?: boolean;
  tags?: string[];
  className?: string;
}

export function MemoPreview() {

  return (
    <div className="flex justify-center relative w-[calc(100vw-64px)] md:w-[calc(100vw-160px)] xl:w-full h-100 xl:h-0 -bottom-60 xl:bottom-0 xl:min-w-160 max-w-175">
      <Memo
        date='1시간 전'
        title='✈️ 가족여행 계획 (2026. 02. 23 ~ 2026. 03.01)'
        content='부모님과 함께 제주도로 여행 계획. 항공편과 숙소 예약 필요. 주요 관광지: 한라산, 우도, 성산일출봉 등. 예산 및 일정 조율 중.'
        isLive
        tags={['가족여행', '제주도', '2026']}
        className="floating2 scale-90 md:scale-90 -top-7.5 md:-top-55 max-md:animate-none! md:left-[calc(50%-150px)]"
      />
      <Memo
        date='1달 전'
        title='📄 회의록: 팀 미팅'
        content='팀 목표 설정 및 업무 분담 논의. Q4 목표 달성을 위한 전략 수립. 다음 회의는 다음주 화요일 오후 2시.'
        isArchived
        tags={['회의', '팀']}
        className="floating scale-95 md:scale-100 -top-27.5 md:top-7.5 max-md:animate-none! md:left-[calc(50%-60px)]"
      />
      <Memo
        date='2025. 11. 13'
        title='💻 프로젝트 진행 상황'
        content='디자인 단계 완료, 개발 진행 중. 백엔드 API 구현 마무리. QA 테스트 예정. 마감일: 2025년 12월 1일.'
        isArchived
        isLive
        tags={['프로젝트', 'TODO']}
        className="floating3 scale-100 md:scale-120 -top-55 md:-top-27.5 max-md:animate-none! md:left-[calc(50%+110px)]"
      />
      <div className="hidden sm:block absolute w-150 h-2 rounded-full bg-black blur-xl bottom-40 xl:-bottom-70 left-1/2 -translate-x-1/2" />
    </div>
  );
}

const Memo = ({ date, title, content, isLive, isArchived, tags, className }: MemoProps) => {
  return (
    <div
      className={`absolute w-full md:w-100 flex flex-col bg-background select-none px-2 py-2 border border-muted-foreground/20 rounded-2xl shadow-xl/30 ${className}`}
    >
      <div className="flex p-2 pt-2 items-center justify-between">
        <div className="flex items-center">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {date}
          </span>
        </div>
        <div className="absolute right-2 top-2 text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-foreground/5">
          <Ellipsis className="h-5 w-5" />
        </div>
      </div>
      <div className="flex-1 px-2 pb-2 min-w-0">
        <div className="flex items-center">
          {/* Live Share Indicator */}
          <p className="text-base text-popover-foreground truncate">{title}</p>
        </div>
        <div className="mt-1.5">
          <p className="text-xs text-muted-foreground leading-5 line-clamp-2 h-10">
            {content}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {isArchived && <span className="text-xs px-2 py-0.5 rounded bg-secondary/8 border border-secondary/18 text-secondary">
            보관함
          </span>}
          {isLive && <span className="text-xs px-2 py-0.5 rounded bg-background border border-destructive/50 text-destructive">
            LIVE
          </span>}
          {(tags && tags.length > 0) && tags.map((tag, index) =>
            <span key={index} className="text-xs px-2 py-0.5 border border-popover-border text-muted-foreground rounded">
              {tag}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}