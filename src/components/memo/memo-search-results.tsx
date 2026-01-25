"use client";

import { Memo } from "@/types";
import { useMemoStore } from "@/store/memoStore";
import { useHybridSearch } from "@/hooks/useHybridSearch";
import { useMemos } from "@/hooks/useMemos";
import { CreateMemoButton } from "@/components/memo/create-memo-button";
import { Ring } from "ldrs/react";
import { getFilteredMemos } from "@/utils/getFilteredItems";
import { MemoGridItem } from "@/components/memo/memo-grid-item";
import { useHomeFilterStore } from "@/store/homeFilterStore";
import { useState, useEffect } from "react";
import { SearchX } from "lucide-react"; // Sparkles 아이콘 추가
import { useSearchParams } from 'next/navigation';

export function MemoSearchResults() {
  const searchParams = useSearchParams();
  const urlSearchTerm = searchParams.get('search') || '';
  const { searchTerm, setSearchTerm } = useMemoStore();
  const { classifiedResults, hybridSearchResults, isLoading } = useHybridSearch();
  const { filterOptions, updateFilterOptions } = useHomeFilterStore();
  const [showGridItems, setShowGridItems] = useState(false);
  const [animatedItems, setAnimatedItems] = useState<number>(0);
  const { allMemos, sharedMemos } = useMemos();


  // URL 파라미터가 변경될 때마다 상태를 동기화
  useEffect(() => {
    if (urlSearchTerm !== searchTerm) {
      setSearchTerm(urlSearchTerm);
    }
  }, [urlSearchTerm, searchTerm]);

  const currentMemoList = urlSearchTerm
    ? classifiedResults.high
    : [...allMemos, ...sharedMemos];
  const filteredMemoList = getFilteredMemos(currentMemoList.filter((memo: Memo) => !memo.isDeleted), filterOptions);

  useEffect(() => {
    if (urlSearchTerm) {
      updateFilterOptions({ sortBy: 'relevance' });
    } else {
      updateFilterOptions({ sortBy: 'updatedAt' });
    }
  }, [urlSearchTerm, updateFilterOptions]);

  useEffect(() => {
    if (!isLoading) {
      setShowGridItems(true);
      setAnimatedItems(0);
    }
  }, [isLoading]);

  useEffect(() => {
    if (showGridItems) {
      const interval = setInterval(() => {
        setAnimatedItems(prev => (prev >= filteredMemoList.length ? (clearInterval(interval), prev) : prev + 1));
      }, 30);
      return () => clearInterval(interval);
    }
  }, [showGridItems, filteredMemoList, classifiedResults.high]);



  if (isLoading && searchTerm) {
    return (
      <div className="flex items-center justify-center w-full h-[calc(100vh-10.75rem)]">
        <Ring size="28" speed="2" stroke={3} bgOpacity={0.2} color="var(--color-foreground)" />
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto px-4 md:px-8 lg:px-8 pb-70">
      {filteredMemoList.length === 0 && urlSearchTerm ? (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-10.75rem)] gap-6">
          <SearchX className="text-muted-foreground opacity-20" size={72} strokeWidth={1.5} />
          <p className="text-muted-foreground opacity-50">&apos;{urlSearchTerm}&apos;에 대한 검색 결과가 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 min-[32rem]:grid-cols-2 lg:grid-cols-3 gap-4">
          {!urlSearchTerm && <CreateMemoButton />}
          {showGridItems && filteredMemoList.slice(0, animatedItems).map((memo: Memo, index: number) => (
            <div key={memo.id} className="opacity-0" style={{ animation: `slideUp 0.5s forwards`, animationDelay: `${index * 30}ms` }}>
              <MemoGridItem memo={memo} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}