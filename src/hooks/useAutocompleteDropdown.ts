import { useEffect, useRef } from "react";
import { useAutocomplete } from "./useAutocomplete";
import { getSearchHistory, addToSearchHistory } from "@/utils/searchHistoryUtils";
import { useHybridSearchStore } from "@/store/hybridSearchStore";
import { useMemoStore } from "@/store/memoStore";
import { useAutocompleteStore } from "@/store/autocompleteStore";
import { useSearchParams, useRouter } from 'next/navigation';

interface AutocompleteItem {
  text: string;
  type: string;
}

interface AutocompleteDropdownState {
  containerRef: React.RefObject<HTMLDivElement | null>;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleCompositionStart: () => void;
  handleCompositionEnd: () => void;
  handleClearSearch: () => void;
  handleSearchSubmit: () => void;
  isShowDropdown: boolean;
}

export function useAutocompleteDropdown(): AutocompleteDropdownState {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { searchTerm, setSearchTerm } = useMemoStore();
  const {
    localSearchTerm,
    setLocalSearchTerm,
    suggestions,
    selectedIndex,
    setSelectedIndex,
    showSuggestions,
    setShowSuggestions,
    isFocused,
    hasNavigated,
    setHasNavigated,
    searchHistory,
    setSearchHistory,
    isComposing,
    setIsComposing,
    recentSuccessfulSearch,
    setRecentSuccessfulSearch
  } = useAutocompleteStore();
  const { setIsProcessing } = useHybridSearchStore();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const { suggestions: autocompleteSuggestions = [] } = useAutocomplete(localSearchTerm) as { suggestions: AutocompleteItem[] };

  const { hybridSearchResults, previousSearchTerm, processSearchResults } = useHybridSearchStore();

  // 자동완성 결과 업데이트
  useEffect(() => {
    const newSuggestions = autocompleteSuggestions.filter(suggestion =>
      JSON.stringify(suggestion) !== JSON.stringify(suggestions)
    );
    if (newSuggestions.length !== suggestions.length ||
      JSON.stringify(newSuggestions) !== JSON.stringify(suggestions)) {
      useAutocompleteStore.setState({ suggestions: autocompleteSuggestions });
      // 추천 검색어가 변경될 때 선택 인덱스 초기화
      if (autocompleteSuggestions.length > 0) {
        setSelectedIndex(-1);
      }
    }
  }, [autocompleteSuggestions]);

  // 검색 히스토리 업데이트
  useEffect(() => {
    if (isFocused) {
      const history = getSearchHistory().slice(0, 3); // 최대 3개로 제한
      if (JSON.stringify(history) !== JSON.stringify(searchHistory)) {
        setSearchHistory(history);
      }
      // 검색 히스토리가 변경될 때 선택 인덱스 초기화
      if (history.length > 0) {
        setSelectedIndex(-1);
      }
    }
  }, [isFocused, searchHistory]);

  // 하이브리드 검색 결과 처리
  useEffect(() => {
    if (previousSearchTerm && hybridSearchResults.length > 0 && recentSuccessfulSearch !== previousSearchTerm) {
      addToSearchHistory(previousSearchTerm);
      setRecentSuccessfulSearch(previousSearchTerm);
      setSearchHistory(getSearchHistory().slice(0, 3)); // 최대 3개로 제한
    }
  }, [hybridSearchResults, previousSearchTerm, recentSuccessfulSearch]);

  // 로컬 검색어가 변경될 때 선택 인덱스 초기화
  useEffect(() => {
    setSelectedIndex(-1);
  }, [localSearchTerm]);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
        setHasNavigated(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 검색 함수 정의 - 실제 검색은 사용자 액션 시에만 실행
  const executeSearch = async (searchTerm: string) => {
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchTerm }),
      });

      if (response.ok) {
        const data = await response.json();
        processSearchResults(data.results);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const totalItems = searchHistory.length + autocompleteSuggestions.length; // 순서 변경: 최근 검색어 먼저

    // IME 조합 상태일 때는 방향키 이벤트를 처리하지 않음
    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && isComposing) {
      return;
    }

    if (e.key === 'Enter' && isComposing) {
      return;
    }

    if (e.key === 'ArrowDown') {
      const newIndexDown = selectedIndex < totalItems - 1 ? selectedIndex + 1 : 0; // 순환 구현: 마지막 항목에서 아래로 가면 처음으로
      setSelectedIndex(newIndexDown);
      setHasNavigated(true);
    } else if (e.key === 'ArrowUp') {
      const newIndexUp = selectedIndex <= 0 ? totalItems - 1 : selectedIndex - 1; // 순환 구현: 첫 항목에서 위로 가면 마지막으로
      setSelectedIndex(newIndexUp);
      setHasNavigated(true);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      let selectedSearchTerm = localSearchTerm;

      if (hasNavigated && selectedIndex >= 0) {
        if (selectedIndex < searchHistory.length) { // 최근 검색어 항목
          const selected = searchHistory[selectedIndex];
          setLocalSearchTerm(selected);
          setSearchTerm(selected);
          selectedSearchTerm = selected;
        } else { // 추천 검색어 항목
          const suggestionIndex = selectedIndex - searchHistory.length;
          const selected = autocompleteSuggestions[suggestionIndex]?.text || localSearchTerm;
          setLocalSearchTerm(selected);
          setSearchTerm(selected);
          selectedSearchTerm = selected;
        }
      } else {
        setSearchTerm(localSearchTerm);
      }

      setIsProcessing(true);

      // URL 파라미터 업데이트
      const params = new URLSearchParams(searchParams);
      if (selectedSearchTerm) {
        params.set('search', selectedSearchTerm);
      } else {
        params.delete('search');
      }
      router.push(`?${params.toString()}`);

      setShowSuggestions(false);
      setSelectedIndex(-1);
      setHasNavigated(false);

      // 검색 수행 - 통합된 함수 사용
      executeSearch(selectedSearchTerm);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
      setHasNavigated(false);
    }
  };

  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = () => {
    setIsComposing(false);
  };

  const handleClearSearch = () => {
    // URL 파라미터에서 검색어 제거
    const params = new URLSearchParams(searchParams);
    params.delete('search');
    router.push(`?${params.toString()}`);

    setLocalSearchTerm("");
    setSearchTerm("");
    setShowSuggestions(false);
  };

  const handleSearchSubmit = async () => {
    if (searchTerm !== localSearchTerm) {
      setIsProcessing(true);
    }
    // URL 파라미터 업데이트
    const params = new URLSearchParams(searchParams);
    if (localSearchTerm) {
      params.set('search', localSearchTerm);
    } else {
      params.delete('search');
    }
    router.push(`?${params.toString()}`);

    setSearchTerm(localSearchTerm);
    setShowSuggestions(false);

    // Perform search with date filter using unified function
    await executeSearch(localSearchTerm);
  };

  const isShowDropdown = (showSuggestions && (autocompleteSuggestions.length > 0 || searchHistory.length > 0));

  return {
    containerRef,
    handleKeyDown,
    handleCompositionStart,
    handleCompositionEnd,
    handleClearSearch,
    handleSearchSubmit,
    isShowDropdown,
  };
}