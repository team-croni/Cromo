"use client";

import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import { useMemo } from '@hooks/useMemo';
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { Memo } from "@/types";
import { Ring } from "ldrs/react";
import { WifiOff, Ban, FileQuestion } from "lucide-react";
import { useEditorStore } from "@store/editorStore";
import { Editor } from '@components/editor/editor';

export function EditorWrapper() {
  const searchParams = useSearchParams();
  const params = useParams();
  const urlMemoId = searchParams.get('id') || params.id as string;
  const isAutoSaveUpdateRef = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { status } = useSession();
  const { isLoading } = useMemo();
  const queryClient = useQueryClient();
  const [showDetail, setShowDetail] = useState(false);

  const { data: memoData, error } = useMemo();
  const { setScrollY } = useEditorStore();

  useEffect(() => {
    // 자동저장으로 인한 업데이트 표시 초기화
    isAutoSaveUpdateRef.current = false;
  }, [memoData]);

  // 스크롤 이벤트 핸들러
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      setScrollY(scrollContainerRef.current.scrollTop);
    }
  };

  // 스크롤 이벤트 리스너 및 리사이즈 옵저버 등록
  useEffect(() => {
    const scrollElement = scrollContainerRef.current;
    setScrollY(0);

    if (scrollElement) {
      // 스크롤 이벤트 리스너 등록
      scrollElement.addEventListener('scroll', handleScroll);

      // ResizeObserver를 사용하여 요소 크기 변화 감지
      const resizeObserver = new ResizeObserver(() => {
        // 크기 변화가 감지되면 스크롤 위치 업데이트
        handleScroll();
      });

      resizeObserver.observe(scrollElement);

      return () => {
        scrollElement.removeEventListener('scroll', handleScroll);
        resizeObserver.unobserve(scrollElement);
        resizeObserver.disconnect();
      };
    }
  }, [memoData, scrollContainerRef.current]);

  useEffect(() => {
    const memoQueries = queryClient.getQueriesData<Memo[]>({
      queryKey: ['memos']
    });

    let targetMemo: Memo | undefined;
    for (const [, memosData] of memoQueries) {
      if (Array.isArray(memosData)) {
        targetMemo = memosData.find((memo) => memo.id === urlMemoId);
        if (targetMemo) break;
      }
    }

    if (targetMemo && !queryClient.getQueryData(['memo', urlMemoId || ''])) {
      queryClient.setQueryData(['memo', urlMemoId || ''], targetMemo);
    }
  }, [urlMemoId, queryClient]);

  // 메모 ID가 없는 경우 null 반환
  if (!urlMemoId) {
    return null;
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Ring
          size="28"
          speed="2"
          stroke={3}
          color="var(--color-foreground)"
          bgOpacity={0.2}
        />
      </div>
    );
  } else if (!memoData) {
    // 에러 타입별 메시지 매핑
    const errorConfig = {
      unauthorized: {
        message: "접근 권한이 없습니다.",
        detail: "이 메모에 접근할 수 있는 권한이 없습니다.",
        icon: <Ban className="w-24 h-24 text-popover-border mb-8" />
      },
      notFound: {
        message: "메모를 찾을 수 없습니다.",
        detail: "메모가 삭제되었거나 이동되었을 수 있습니다.\nURL 주소가 올바른지 확인해 주세요.",
        icon: <FileQuestion className="w-24 h-24 text-popover-border mb-8 stroke-[1.5]" />
      },
      network: {
        message: "네트워크 오류가 발생했습니다.",
        detail: "네트워크가 불안정하거나 서버에 일시적인 문제가 발생했을 수 있습니다.\n잠시 후 다시 시도해 주세요.",
        icon: <WifiOff className="w-24 h-24 text-popover-border mb-8" />
      },
      default: {
        message: "메모를 찾을 수 없습니다.",
        detail: "메모가 삭제되었거나 접근 권한이 없어졌을 수 있습니다.\n다른 메모를 확인하거나 관리자에게 문의해 주세요.",
        icon: <FileQuestion className="w-24 h-24 text-popover-border mb-8 stroke-[1.5]" />
      }
    };

    // 에러 타입 결정
    let errorType = 'default';
    if (error) {
      if (error.message.includes('403') || error.message.includes('401')) {
        errorType = 'unauthorized';
      } else if (error.message.includes('404')) {
        errorType = 'notFound';
      } else if (error.message.includes('network') || error.message.includes('TypeError')) {
        errorType = 'network';
      }
    }

    const { message, detail, icon } = errorConfig[errorType as keyof typeof errorConfig];

    return (
      <div className="flex flex-col h-screen items-center justify-center">
        {icon}
        <div className="flex flex-col w-full items-center">
          <p className="text-2xl font-bold text-muted-foreground mb-3">{message}</p>
          <p className="text-muted-foreground/50 whitespace-pre-wrap text-center">{detail}</p>

          {/* 에러 객체가 있을 경우에만 상세 정보 버튼 표시 */}
          {error && (
            <div className="relative w-full px-4 flex flex-col items-center mt-14">
              <button
                onClick={() => setShowDetail(!showDetail)}
                className="flex items-center mb-4 text-sm text-muted-foreground hover:text-foreground"
              >
                {showDetail ? "간단히" : "상세 정보"}
                <svg
                  className={`w-3 h-3 ml-2 transition-transform duration-75 ${showDetail ? "rotate-180" : ""}`}
                  viewBox="0 0 48 48"
                >
                  <path fill="currentColor" stroke="currentColor" strokeLinejoin="round" strokeWidth="4" d="M36 19L24 31L12 19z" />
                </svg>
              </button>

              {/* 상세 정보 토글 표시 */}
              {showDetail && (
                <div className="absolute top-9 max-w-md bg-muted py-4 px-5 rounded-xl">
                  <p className="text-sm text-muted-foreground wrap-break-word">
                    <strong>ERROR :</strong> {error.message}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-full">
      <div ref={scrollContainerRef} className="flex px-0 md:pl-12 md:pr-10 flex-col h-full overflow-y-scroll editor scrollbar-normal">
        <Editor key={memoData.id} />
      </div>
    </div>
  );
}