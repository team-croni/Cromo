import { useQuery } from '@tanstack/react-query';
import { Memo } from '@/types';
import { post } from '@/utils/fetchWrapper';

// 1. 단일 검색 결과 아이템 타입
export interface VectorSearchResult extends Memo {
  distance: number;
  searchType: 'memo' | 'tag' | 'text';
}

// 2. 서버 응답 전체 객체 타입 (수정됨)
export interface SearchResponse {
  results: VectorSearchResult[];
  correction: string | null;
  originalQuery: string;
  count: number;
}

// 검색 API 함수
const searchMemosByEmbedding = async (query: string): Promise<SearchResponse> => {
  // 이제 post의 제네릭 타입을 SearchResponse로 변경합니다.
  const result = await post<SearchResponse>('/api/search', { query });
  return result;
};

// 벡터 검색을 위한 React Query 훅
export function useVectorSearch(query: string) {
  // 리턴 타입을 SearchResponse로 변경
  return useQuery<SearchResponse, Error>({
    queryKey: ['memos', 'search', query],
    queryFn: () => searchMemosByEmbedding(query),
    enabled: !!query,
    retry: 1,
    staleTime: 0, // 항상 fresh 데이터 요청
    gcTime: 0, // 가비지 콜렉션 시간을 0으로 설정하여 응답 즉시 GC
    refetchOnWindowFocus: false, // 윈도우 포커스 시 재요청 방지 (필요 시 활성화 가능)
    refetchOnReconnect: false, // 네트워크 재연결 시 재요청 방지 (필요 시 활성화 가능)
    refetchOnMount: true, // 컴포넌트 마운트 시 항상 재요청
  });
}