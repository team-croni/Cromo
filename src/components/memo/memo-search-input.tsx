"use client";

import { Search, X, ArrowUpDown } from "lucide-react"; // 아이콘 추가
import { useMemoStore } from "@/store/memoStore";
import { useEffect, useRef } from "react";
import { useHybridSearchStore, DateFilterOption } from "@/store/hybridSearchStore";
import { useAutocompleteDropdown } from "@/hooks/useAutocompleteDropdown";
import { AutocompleteDropdown } from "./autocomplete-dropdown";
import { getSearchHistory, addToSearchHistory } from "@/utils/searchHistoryUtils";
import { useAutocompleteStore } from "@/store/autocompleteStore";
import { useSearchParams } from 'next/navigation';
import { useIsMobile } from "@hooks/useMediaQuery";

export function MemoSearchInput() {
  const searchParams = useSearchParams();
  const { searchTerm } = useMemoStore();
  const { dateFilter, setDateFilter } = useHybridSearchStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  // URL의 search 파라미터를 가져옴
  const urlSearchTerm = searchParams.get('search') || '';

  // URL 파라미터가 변경될 때마다 상태를 업데이트
  useEffect(() => {
    if (urlSearchTerm !== searchTerm) {
      setLocalSearchTerm(urlSearchTerm);
    }
  }, [urlSearchTerm]);

  const {
    localSearchTerm,
    setLocalSearchTerm,
    setShowSuggestions,
    isFocused,
    setSelectedIndex,
    setIsFocused,
    setHasNavigated,
    setSearchHistory,
    setRecentSuccessfulSearch
  } = useAutocompleteStore();

  const {
    containerRef,
    handleKeyDown,
    handleCompositionStart,
    handleCompositionEnd,
    handleClearSearch,
    handleSearchSubmit
  } = useAutocompleteDropdown();

  // 하이브리드 검색 결과를 감시하여 성공적인 검색어를 히스토리에 추가
  const {
    recentSuccessfulSearch
  } = useAutocompleteStore();

  const hybridSearchResults = useHybridSearchStore(state => state.hybridSearchResults);
  const previousSearchTerm = useHybridSearchStore(state => state.previousSearchTerm);

  // Period filter options
  const periodOptions: DateFilterOption[] = ['all', 'week', 'month', 'year'];
  const periodLabels = {
    all: '전체 기간',
    week: '이번 주',
    month: '이번 달',
    year: '올해'
  };

  const togglePeriod = () => {
    const currentIndex = periodOptions.indexOf(dateFilter);
    const nextIndex = (currentIndex + 1) % periodOptions.length;
    const newFilter = periodOptions[nextIndex];
    setDateFilter(newFilter);
  };

  useEffect(() => {
    // 검색어가 있고 결과가 있으며, 최근에 성공한 검색이 아닌 경우에만 히스토리에 추가
    if (previousSearchTerm && hybridSearchResults.length > 0 && recentSuccessfulSearch !== previousSearchTerm) {
      addToSearchHistory(previousSearchTerm);
      setRecentSuccessfulSearch(previousSearchTerm);
      setSearchHistory(getSearchHistory()); // 히스토리 업데이트
    }
  }, [hybridSearchResults, previousSearchTerm, recentSuccessfulSearch]);

  return (
    <div className="absolute bottom-5 md:bottom-10 w-full md:w-[calc(100%-1.125rem)] flex px-4 justify-center z-30 slide-up">
      <div ref={containerRef} className="relative w-full max-w-216 group">
        <AutocompleteDropdown />
        <input
          ref={inputRef}
          type="text"
          placeholder={isMobile ? "메모를 검색하세요..." : "찾고 싶은 메모에 대해서 입력하세요..."}
          value={localSearchTerm}
          onChange={(e) => {
            setSelectedIndex(-1);
            setLocalSearchTerm(e.target.value);
            setShowSuggestions(true);
            // 검색어가 비어있고 포커스 상태이면 검색 히스토리를 표시
            if (!e.target.value && isFocused) {
              const history = getSearchHistory();
              if (history.length > 0) {
                setShowSuggestions(true);
              }
            }
          }}
          onKeyDown={handleKeyDown}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          onFocus={() => {
            setIsFocused(true);
            setHasNavigated(false); // 포커스 시 네비게이션 상태 초기화
            setSearchHistory(getSearchHistory()); // 포커스 시 검색 히스토리 불러오기
            (localSearchTerm || getSearchHistory().length > 0) && setShowSuggestions(true);
          }}
          className={`w-full pl-27.5 pr-32 py-3 text-base rounded-2xl border border-primary bg-inverse/50 backdrop-blur-2xl shadow-xl/20 text-foreground transition-all outline-primary ${searchTerm ? 'outline-[1.5px] outline-primary' : 'focus:outline-[1.5px] focus:outline-primary'}`}
        />
        <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10">
          <button
            onClick={togglePeriod}
            className="flex items-center w-22.5 px-3 py-2 rounded-[10px] text-xs bg-cyan-700/40 hover:bg-cyan-700/60"
          >
            <span className="flex-1">{periodLabels[dateFilter]}</span>
            <ArrowUpDown className="h-3 w-3 ml-2 text-muted-foreground" />
          </button>
        </div>
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10">
          {localSearchTerm && (
            <button onClick={handleClearSearch} className="p-1.5 rounded-full hover:bg-muted-foreground/15 text-muted-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => {
              handleSearchSubmit();
              inputRef.current?.blur(); // 검색 버튼 클릭 시 포커스 해제
            }}
            disabled={!localSearchTerm}
            className="flex items-center gap-2 px-3 py-2 bg-primary rounded-xl text-primary-foreground disabled:bg-transparent disabled:opacity-30"
          >
            <Search className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div >
  );
}