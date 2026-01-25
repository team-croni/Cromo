/**
 * 검색 히스토리를 관리하는 유틸리티 함수들
 */

const SEARCH_HISTORY_KEY = 'memo_search_history';
const MAX_HISTORY_ITEMS = 10;

/**
 * 로컬 스토리지에서 검색 히스토리를 가져옴
 * @returns 검색 히스토리 배열
 */
export const getSearchHistory = (): string[] => {
  if (typeof window === 'undefined') return []; // SSR 환경에서는 빈 배열 반환

  try {
    const history = localStorage.getItem(SEARCH_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Failed to load search history:', error);
    return [];
  }
};

/**
 * 검색 히스토리에 새로운 항목을 추가
 * @param searchTerm 추가할 검색어
 */
export const addToSearchHistory = (searchTerm: string): void => {
  if (typeof window === 'undefined') return; // SSR 환경에서는 아무 작업도 하지 않음

  if (!searchTerm.trim()) return;

  try {
    const history = getSearchHistory();
    // 중복 제거: 기존에 있던 항목은 제거하고 맨 앞으로 추가
    const filteredHistory = history.filter(item => item.toLowerCase() !== searchTerm.toLowerCase());
    const newHistory = [searchTerm, ...filteredHistory].slice(0, MAX_HISTORY_ITEMS);

    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
  } catch (error) {
    console.error('Failed to save search history:', error);
  }
};

/**
 * 검색 히스토리에서 특정 항목을 삭제
 * @param searchTerm 삭제할 검색어
 */
export const removeFromSearchHistory = (searchTerm: string): void => {
  if (typeof window === 'undefined') return; // SSR 환경에서는 아무 작업도 하지 않음

  try {
    const history = getSearchHistory();
    const newHistory = history.filter(item => item.toLowerCase() !== searchTerm.toLowerCase());

    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
  } catch (error) {
    console.error('Failed to remove from search history:', error);
  }
};

/**
 * 검색 히스토리 전체를 삭제
 */
export const clearSearchHistory = (): void => {
  if (typeof window === 'undefined') return; // SSR 환경에서는 아무 작업도 하지 않음

  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch (error) {
    console.error('Failed to clear search history:', error);
  }
};