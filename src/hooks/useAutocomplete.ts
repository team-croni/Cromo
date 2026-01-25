import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

interface AutocompleteItem {
  text: string;
  type: string;
}

export function useAutocomplete(inputSearchTerm: string) {
  const [searchTerm, setSearchTerm] = useState(inputSearchTerm);

  // 디바운스 로직: 입력이 멈춘 후 300ms 뒤에 검색어 업데이트
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(inputSearchTerm);
    }, 300);

    // 이전 타이머 클리어
    return () => {
      clearTimeout(timer);
    };
  }, [inputSearchTerm]);

  const { data: suggestions = [], isLoading, isError, error } = useQuery<AutocompleteItem[]>({
    queryKey: ['autocomplete', searchTerm],
    queryFn: async () => {
      if (searchTerm.trim().length === 0) {
        return [];
      }

      const res = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(searchTerm)}`);
      if (!res.ok) {
        throw new Error('자동완성 API 호출 실패');
      }
      return res.json();
    },
    enabled: searchTerm.trim().length > 0,
    staleTime: 5000, // 5초 동안 캐시 유지 (이전 1초에서 증가)
    gcTime: 10000, // 10초 동안 가비지 컬렉션 시간 (이전 5초에서 증가)
    retry: 0, // 재시도 제거로 응답 속도 향상
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return { suggestions, isLoading, isError, error };
}