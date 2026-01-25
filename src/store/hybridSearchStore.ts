import { create } from 'zustand';
import { Memo } from '@/types/index';

export type DateFilterOption = 'all' | 'week' | 'month' | 'year';

export interface ExtendedMemo extends Memo {
  folderName?: string;
  rrfScore?: number;
  distance?: number;
  searchType?: 'memo' | 'tag' | 'text';
  textMatchCount?: number;
}

interface VectorSearchResult {
  id: string;
  distance: number;
  searchType: 'memo' | 'tag' | 'text';
}

export interface HybridSearchState {
  // Constants
  MIN_SCORE_THRESHOLD: number;
  BASE_WEIGHTS: { text: number; memoVector: number; tagVector: number };
  RRF_K: number;
  MAX_DISTANCE: number;

  // Search results
  searchTerm: string;
  previousSearchTerm: string;
  vectorSearchResults: VectorSearchResult[] | null;
  correction: string | null;
  isProcessing: boolean;
  isSearchExecuted: boolean;
  isError: boolean;

  // Date filtering
  dateFilter: DateFilterOption;
  setDateFilter: (dateFilter: DateFilterOption) => void;

  // Processed results
  hybridSearchResults: ExtendedMemo[];
  classifiedResults: { high: ExtendedMemo[]; low: ExtendedMemo[] };

  // Actions
  setSearchTerm: (term: string) => void;
  setVectorSearchResults: (results: VectorSearchResult[] | null) => void;
  setCorrection: (correction: string | null) => void;
  setIsProcessing: (processing: boolean) => void;
  setIsSearchExecuted: (executed: boolean) => void;
  setIsError: (error: boolean) => void;
  setAllMemos: (memos: Memo[]) => void;
  setFolders: (folders: { id: string; name: string }[]) => void;
  processSearchResults: (textResults: Memo[], update?: boolean) => void;
  removeMemoFromSearchResults: (memoId: string) => void;
  reset: () => void;
}

// Utility functions
const calculateWeightedRRFScore = (rank: number, weight: number): number => {
  const RRF_K = 60;
  return weight * (1 / (rank + RRF_K));
};

const calculateHybridScore = (distance: number, rank: number, baseWeight: number): number => {
  const RRF_K = 60;
  const MAX_DISTANCE = 2.0;
  const rankScore = calculateWeightedRRFScore(rank + 1, baseWeight);
  const distanceScore = Math.max(0, (MAX_DISTANCE - distance) / MAX_DISTANCE) * baseWeight;
  return rankScore + distanceScore;
};

/**
 * 점수 절벽 기반 그룹 분류 알고리즘
 * 상위 결과를 강제로 보장하지 않고, 통계적으로 유의미한 점수 차이가 발생할 때만 분류합니다.
 */
const findClassificationPoint = (sortedResults: ExtendedMemo[]): number => {
  if (sortedResults.length <= 1) return sortedResults.length;

  const differences: number[] = [];
  for (let i = 0; i < sortedResults.length - 1; i++) {
    differences.push((sortedResults[i].rrfScore || 0) - (sortedResults[i + 1].rrfScore || 0));
  }

  const mean = differences.reduce((a, b) => a + b, 0) / differences.length;
  const stdDev = Math.sqrt(differences.reduce((s, d) => s + Math.pow(d - mean, 2), 0) / differences.length);

  // 엄격한 기준: 평균 차이 + 표준 편차보다 큰 낙차가 있는 지점을 찾음
  const threshold = mean + stdDev;

  for (let i = 0; i < differences.length; i++) {
    if (differences[i] > threshold) {
      // 절벽 발견 시 해당 지점까지를 high로 반환
      return i + 1;
    }
  }

  // 점수 차이가 고르다면(절벽이 없다면) 전체를 high로 처리
  return sortedResults.length;
};

export const useHybridSearchStore = create<HybridSearchState>((set, get) => ({
  // Constants
  MIN_SCORE_THRESHOLD: 0.02,
  BASE_WEIGHTS: {
    text: 1.2,
    memoVector: 1.5,
    tagVector: 2.0,
  },
  RRF_K: 60,
  MAX_DISTANCE: 2.0,

  // Initial state
  searchTerm: '',
  previousSearchTerm: '',
  vectorSearchResults: null,
  correction: null,
  isProcessing: false,
  isSearchExecuted: false,
  isError: false,
  hybridSearchResults: [],
  classifiedResults: { high: [], low: [] },

  setSearchTerm: (term) => {
    const currentState = get();
    if (currentState.searchTerm !== term) {
      set({
        searchTerm: term,
        previousSearchTerm: currentState.searchTerm,
        isSearchExecuted: false,
        correction: null
      });
    }
  },

  setVectorSearchResults: (results) => set({ vectorSearchResults: results }),
  setCorrection: (correction) => set({ correction }),
  setIsProcessing: (processing: boolean) => set({ isProcessing: processing }),
  setIsSearchExecuted: (executed: boolean) => set({ isSearchExecuted: executed }),
  setIsError: (error) => set({ isError: error }),

  setAllMemos: () => { },
  setFolders: () => { },

  processSearchResults: (textResults, update) => {
    const { searchTerm, previousSearchTerm, vectorSearchResults: storeVectorSearchResults, isSearchExecuted, BASE_WEIGHTS, MIN_SCORE_THRESHOLD, dateFilter } = get();

    // Apply date filtering to text results
    const filteredTextResults = textResults.filter(memo => {
      if (!dateFilter && dateFilter === 'all') return true;

      const filterType = dateFilter;
      // Using local time for user-friendly date comparisons
      const memoDate = new Date(memo.createdAt);
      const now = new Date();

      switch (filterType) {
        case 'week':
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return memoDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          return memoDate >= monthAgo;
        case 'year':
          const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          return memoDate >= yearAgo;
        default:
          return true;
      }
    });

    if (!searchTerm) {
      const currentState = get();
      if (currentState.hybridSearchResults.length === 0 && currentState.searchTerm === '') return;
      set({ hybridSearchResults: [], classifiedResults: { high: [], low: [] }, previousSearchTerm: searchTerm, isSearchExecuted: false, correction: null });
      return;
    }

    if (isSearchExecuted && storeVectorSearchResults && !update) return;

    const vResults = storeVectorSearchResults || [];
    const scores: Record<string, number> = {};
    const memoDataMap: Record<string, ExtendedMemo> = {};

    const calculateTextMatchCount = (item: Memo, query: string): number => {
      const lowerQuery = query.toLowerCase();
      const lowerTitle = (item.title || "").toLowerCase();
      const lowerContent = (item.content || "").toLowerCase();
      const titleMatches = (lowerTitle.match(new RegExp(lowerQuery, 'g')) || []).length;
      const contentMatches = (lowerContent.match(new RegExp(lowerQuery, 'g')) || []).length;
      return titleMatches + contentMatches;
    };

    // 1. 텍스트 매칭 점수 계산
    filteredTextResults.forEach((memo, i) => {
      const textMatchCount = calculateTextMatchCount(memo, searchTerm);
      const weightedScore = calculateWeightedRRFScore(i + 1, BASE_WEIGHTS.text) * (1 + (textMatchCount || 0) * 0.15);
      scores[memo.id] = (scores[memo.id] || 0) + weightedScore;
      memoDataMap[memo.id] = { ...memo, textMatchCount };
    });

    // 2. 벡터 검색 결과 점수 합산
    vResults.forEach((vMemo, i) => {
      const weight = vMemo.searchType === 'tag' ? BASE_WEIGHTS.tagVector : BASE_WEIGHTS.memoVector;
      const combinedScore = calculateHybridScore(vMemo.distance, i, weight);
      scores[vMemo.id] = (scores[vMemo.id] || 0) + combinedScore;

      if (!memoDataMap[vMemo.id]) {
        memoDataMap[vMemo.id] = {
          id: vMemo.id,
          title: '',
          content: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          folderId: null,
          distance: vMemo.distance,
          searchType: vMemo.searchType,
          isArchived: false,
          isDeleted: false,
          userId: ''
        } as ExtendedMemo;
      }
    });

    // 3. 최종 정렬 및 필터링
    const results: ExtendedMemo[] = Object.keys(scores)
      .map(id => ({
        ...memoDataMap[id],
        rrfScore: scores[id],
      }))
      .filter(memo => (memo.rrfScore || 0) >= MIN_SCORE_THRESHOLD)
      .sort((a, b) => (b.rrfScore || 0) - (a.rrfScore || 0));

    // 4. 엄격한 그룹 분류 실행
    const point = findClassificationPoint(results);
    const classified = point > 0 && point < results.length
      ? { high: results.slice(0, point), low: results.slice(point) }
      : { high: results, low: [] };

    set({
      hybridSearchResults: results,
      classifiedResults: classified,
      previousSearchTerm: searchTerm,
      isSearchExecuted: true
    });
  },

  removeMemoFromSearchResults: (memoId) => {
    const { hybridSearchResults, classifiedResults } = get();

    // Remove from hybridSearchResults
    const updatedHybridResults = hybridSearchResults.filter(memo => memo.id !== memoId);

    // Remove from classified results
    const updatedClassifiedResults = {
      high: classifiedResults.high.filter(memo => memo.id !== memoId),
      low: classifiedResults.low.filter(memo => memo.id !== memoId)
    };

    set({
      hybridSearchResults: updatedHybridResults,
      classifiedResults: updatedClassifiedResults
    });
  },

  dateFilter: 'all',
  setDateFilter: (dateFilter) => set({ dateFilter }),

  reset: () => set({
    searchTerm: '',
    previousSearchTerm: '',
    vectorSearchResults: null,
    correction: null,
    isProcessing: false,
    isSearchExecuted: false,
    isError: false,
    dateFilter: 'all',
    hybridSearchResults: [],
    classifiedResults: { high: [], low: [] }
  })
}));