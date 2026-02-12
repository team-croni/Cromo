import { create } from 'zustand';
import { FilterOptions } from '@/types';

interface MemoBrowserStore {
  // Active mode - only one mode can be active at a time
  activeMode: 'none' | 'selection' | 'filter';
  setActiveMode: (mode: 'none' | 'selection' | 'filter') => void;
  toggleSelectionMode: (mode?: boolean) => void;
  toggleFilterSection: () => void;

  // Memo browser open/close state
  isMemoBrowserOpen: boolean;
  toggleMemoBrowser: (bool?: boolean) => void;

  // Selected memos
  selectedMemos: Set<string>;
  setSelectedMemos: (memos: Set<string>) => void;
  toggleMemoSelection: (memoId: string) => void;
  toggleSelectAllMemos: (filteredMemosLength: number, currentSelectedCount: number) => void;
  // Dragging state for multi-selection
  isMultiDragging: boolean;
  setIsMultiDragging: (isDragging: boolean) => void;

  // Filter options
  filterOptions: Omit<FilterOptions, 'showDeleted'> & {
    showLiveShareTop: boolean;
  };
  updateFilterOptions: (newOptions: Partial<Omit<FilterOptions, 'showDeleted'> & {
    showLiveShareTop: boolean;
  }>) => void;

  // Template selection
  selectedTemplate: string;
  setSelectedTemplate: (template: string) => void;

  // Memo creation
  isCreatingMemo: boolean;
  setIsCreatingMemo: (isCreating: boolean) => void;

  // 카테고리 분류 여부 결정 함수
  shouldCategorizeMemos: () => boolean;

  isSearchOpen: boolean;
  setIsSearchOpen: (isOpen: boolean) => void;

  isSearchFocused: boolean;
  setIsSearchFocused: (isFocused: boolean) => void;

  // Scroll position for virtualization
  scrollOffset: number;
  setScrollOffset: (offset: number) => void;
}

export const useMemoBrowserStore = create<MemoBrowserStore>((set, get) => ({
  // Active mode - only one mode can be active at a time
  activeMode: 'none',
  setActiveMode: (mode) => set({ activeMode: mode }),
  toggleSelectionMode: (mode?: boolean) => set((state) => {
    let newMode: 'none' | 'selection';
    if (mode === true) {
      newMode = 'selection';
    } else if (mode === false) {
      newMode = 'none';
    } else {
      // 토글 방식
      newMode = state.activeMode === 'selection' ? 'none' : 'selection';
    }
    return {
      activeMode: newMode,
      // Reset selected memos when exiting selection mode
      selectedMemos: newMode !== 'selection' ? new Set() : state.selectedMemos
    };
  }),
  toggleFilterSection: () => set((state) => ({
    activeMode: state.activeMode === 'filter' ? 'none' : 'filter'
  })),

  // Memo browser open/close state
  isMemoBrowserOpen: true, // 기본값은 열린 상태
  toggleMemoBrowser: (bool?: boolean) => set((state) => ({
    isMemoBrowserOpen: bool !== undefined ? bool : !state.isMemoBrowserOpen
  })),

  // Selected memos
  selectedMemos: new Set(),
  setSelectedMemos: (memos) => set({ selectedMemos: memos }),
  toggleMemoSelection: (memoId) => set((state) => {
    if (state.activeMode !== 'selection') return state;

    const newSet = new Set(state.selectedMemos);
    if (newSet.has(memoId)) {
      newSet.delete(memoId);
    } else {
      newSet.add(memoId);
    }
    return { selectedMemos: newSet };
  }),
  toggleSelectAllMemos: (filteredMemosLength, currentSelectedCount) => set((state) => {
    if (state.selectedMemos.size === filteredMemosLength) {
      // 모든 메모가 선택되어 있으면 해제
      return { selectedMemos: new Set() };
    } else {
      // For now, we'll just return the current state
      // The actual implementation will be handled by the parent component
      return state;
    }
  }),

  // Dragging state for multi-selection
  isMultiDragging: false,
  setIsMultiDragging: (isDragging) => set({ isMultiDragging: isDragging }),

  // Filter options
  filterOptions: {
    showArchived: true,
    sortBy: 'updatedAt',
    sortDirection: 'desc',
    showLiveShareTop: true,
    groupBy: 'none',
    dateFrom: null,
    dateTo: null,
  },
  updateFilterOptions: (newOptions) => set((state) => ({
    filterOptions: { ...state.filterOptions, ...newOptions }
  })),

  // Template selection
  selectedTemplate: 'blank',
  setSelectedTemplate: (template) => set({ selectedTemplate: template }),

  // Memo creation
  isCreatingMemo: false,
  setIsCreatingMemo: (isCreating) => set({ isCreatingMemo: isCreating }),

  // 카테고리 분류 여부 결정 함수
  shouldCategorizeMemos: () => {
    const { filterOptions } = get();
    if (filterOptions.groupBy === 'monthly') return true;
    // '최근 수정 순'과 '생성일 순'에는 카테고리 분류 적용
    // '제목 순'에는 카테고리 분류 없이 목록 표시
    return filterOptions.sortBy === 'updatedAt' || filterOptions.sortBy === 'createdAt';
  },

  isSearchOpen: false,
  setIsSearchOpen: (isOpen) => set({ isSearchOpen: isOpen }),

  isSearchFocused: false,
  setIsSearchFocused: (isFocused) => set({ isSearchFocused: isFocused }),

  scrollOffset: 0,
  setScrollOffset: (offset) => set({ scrollOffset: offset }),
}));