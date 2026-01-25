"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import Image from "next/image";

export function EditorPreview() {
  const focusIndicatorRef = useRef<HTMLDivElement>(null);
  const [focusIndicatorPosition, setFocusIndicatorPosition] = useState({ top: 230 });
  const [focusIndicatorPosition2, setFocusIndicatorPosition2] = useState({ top: 384 });
  const [checked, setChecked] = useState(false);

  // 포커스 인디케이터 애니메이션을 위한 효과
  useEffect(() => {
    const positioniInterval = setInterval(() => {
      setFocusIndicatorPosition(prev => ({
        top: prev.top === 230 ? 444 : prev.top === 444 ? 331 : 230,
      }));
    }, 3000);

    const positioniInterval2 = setInterval(() => {
      setFocusIndicatorPosition2(prev => ({
        top: prev.top === 384 ? 407 : prev.top === 407 ? 148 : 384,
      }));
    }, 5000);

    // 저장 상태 변경 효과
    const checkedInterval = setInterval(() => {
      setChecked(prev => !prev);
    }, 9000);

    return () => {
      clearInterval(positioniInterval);
      clearInterval(positioniInterval2);
      clearInterval(checkedInterval);
    };
  }, []);

  return (
    <div className="w-full min-w-160 max-w-160 pointer-events-none select-none">
      <div className="pl-26 pr-14 bg-background border rounded-2xl relative mask-fade">
        {/* 에디터 콘텐츠 영역 */}
        <div className="tiptap text-[13px] w-full pt-2! pb-10! max-h-180 relative">
          {/* 제목 입력 필드 */}
          <div className="mb-4">
            <p className="text-2xl py-2 font-black bg-background border-none focus:outline-none w-full text-muted-foreground/50 focus:text-foreground transition-colors duration-150">
              회의 안건
            </p>
            <div className="h-px bg-border"></div>
          </div>

          {/* 에디터 내용 */}
          <div className="space-y-4">
            <i>
              📌 이번 주 금요일에 진행할 Q4 전략 회의 준비사항 정리
              <span className="absolute ml-1.5 mt-0.5 w-[1.5px] h-3.5 bg-foreground cursor-pulse" />
            </i>
            <pre className="mt-2">
              <code className="font-pretendard">
                {`날짜 : 2025년 11월 15일
시간 : 오후 2시 - 4시
장소 : 대회의실 A`}
              </code>
            </pre>
            <li className="flex items-center">
              <input type="radio" className="w-5 h-5 mr-2 border" disabled />
              <span>회의 자료 준비</span>
            </li>
            <li className="flex items-center">
              <input type="radio" className="w-5 h-5 mr-2 border" checked={checked} disabled />
              <span className={`${checked ? 'line-through opacity-70' : ''}`}>참석자 일정 조율 완료</span>
            </li>
            <hr />
            <h2>사업부별 성과 보고</h2>
            <h3 className="mb-2">영업팀</h3>
            <ul>
              <li>Q4 매출 목표 달성률 보고</li>
              <li>신규 고객 확보 현황</li>
              <li className="line-through">경쟁사 분석 완료</li>
            </ul>
            <h3 className="mb-2">개발팀</h3>
            <ol>
              <li>새로운 기능 출시 일정</li>
              <li>기술 스택 개선 계획</li>
              <li>보안 점검 결과 공유</li>
            </ol>
            <blockquote className="border-l-4 border-primary pl-4 italic">
              각 팀 리더는 회의 전날까지 관련 자료를 공유해주시기 바랍니다.
            </blockquote>
          </div>

          {/* 실시간 커서 표시 - 다른 사용자들 */}
          <div
            className="absolute flex items-center left-3 top-0 text-right -translate-x-full transition-all ease-out duration-200 text-xs select-none"
            style={{ top: `${focusIndicatorPosition.top}px`, height: '14px' }}
          >
            <div className="flex -space-x-2 mr-1">
              <div className="relative w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center border-2 border-background overflow-hidden">
                <Image src="https://i.pravatar.cc/250?img=31" alt="logo" fill />
              </div>
            </div>
            <ChevronRight className="w-5 h-5 stroke-1.5 text-primary/80" />
          </div>

          <div
            className="absolute flex items-center left-3 top-0 text-right -translate-x-full transition-all ease-out duration-200 text-xs select-none"
            style={{ top: `${focusIndicatorPosition2.top}px`, height: '14px' }}
          >
            <div className="flex -space-x-2 mr-1">
              <div className="relative w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center border-2 border-background overflow-hidden">
                <Image src="https://i.pravatar.cc/250?img=11" alt="logo" fill />
              </div>
            </div>
            <ChevronRight className="w-5 h-5 stroke-1.5 text-primary/80" />
          </div>

          {/* 실시간 커서 표시 - 현재 사용자 */}
          <div
            ref={focusIndicatorRef}
            className="absolute flex items-center left-3 top-0 text-right -translate-x-full transition-all ease-out duration-50 text-xs text-muted-foreground/60 dark:text-muted-foreground/40 slide-right select-none"
            style={{ top: '76px', height: '14px' }}
          >
            <span className="mr-1 slide-right">ITALIC</span>
            <ChevronRight className="w-5 h-5 stroke-1.5" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({
  icon,
  tooltip,
  active = false,
}: {
  icon: React.ReactNode;
  tooltip: string;
  active?: boolean;
}) {
  return (
    <button
      className={`p-2 rounded-md transition-colors ${active
        ? 'bg-primary text-primary-foreground'
        : 'hover:bg-foreground/5'
        }`}
      title={tooltip}
    >
      {icon}
    </button>
  );
}