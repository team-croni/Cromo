import { create } from 'zustand';
import { FilterOptions } from '@/types';

interface HomeFilterStore {
  // 홈 전용 필터 옵션
  filterOptions: Pick<FilterOptions, 'sortBy' | 'sortDirection'> & {
    showArchived: boolean;
    groupBy: 'none' | 'monthly';
    showLiveShareTop?: boolean;
    dateFrom?: string | null;
    dateTo?: string | null;
  };
  searchTerm: string;
  updateFilterOptions: (newOptions: Partial<Pick<FilterOptions, 'sortBy' | 'sortDirection'> & {
    showArchived: boolean;
    groupBy: 'none' | 'monthly';
    showLiveShareTop?: boolean;
    dateFrom?: string | null;
    dateTo?: string | null;
  }>) => void;
  setSearchTerm: (searchTerm: string) => void;
}

export const useHomeFilterStore = create<HomeFilterStore>((set) => ({
  // 홈 전용 필터 옵션 초기값
  filterOptions: {
    sortBy: 'updatedAt',
    sortDirection: 'desc',
    showArchived: true,
    groupBy: 'none',
    showLiveShareTop: true,
    dateFrom: null,
    dateTo: null,
  },
  searchTerm: '',
  updateFilterOptions: (newOptions) => set((state) => ({
    filterOptions: { ...state.filterOptions, ...newOptions }
  })),
  setSearchTerm: (searchTerm) => set({ searchTerm }),
}));

