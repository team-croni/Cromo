import { useState, useEffect, useCallback } from 'react';
import { useMemoStore } from '@/store/memoStore';
import { debounce } from '@/utils/debounce';

interface UseSearchProps {
  delay?: number;
}

export const useSearch = ({ delay = 300 }: UseSearchProps = {}) => {
  const { searchTerm, setSearchTerm } = useMemoStore();
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  // 디바운스된 검색어 업데이트 함수
  const debouncedSetSearchTerm = useCallback(
    debounce((term: string) => {
      setSearchTerm(term);
    }, delay),
    [delay]
  );

  // 로컬 검색어 상태가 변경될 때 디바운스된 함수 호출
  useEffect(() => {
    debouncedSetSearchTerm(localSearchTerm);
  }, [localSearchTerm, debouncedSetSearchTerm]);

  // 외부에서 검색어가 변경되었을 때 로컬 상태 동기화
  useEffect(() => {
    if (searchTerm !== localSearchTerm) {
      setLocalSearchTerm(searchTerm);
    }
  }, [searchTerm]);

  const handleSearchChange = (term: string) => {
    setLocalSearchTerm(term);
  };

  const clearSearch = () => {
    setLocalSearchTerm('');
    setSearchTerm('');
  };

  return {
    searchTerm: localSearchTerm,
    handleSearchChange,
    clearSearch,
  };
};