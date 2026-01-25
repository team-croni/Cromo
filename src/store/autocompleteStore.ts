import { create } from 'zustand';
import { removeFromSearchHistory, getSearchHistory, clearSearchHistory } from '@/utils/searchHistoryUtils';

interface AutocompleteState {
  localSearchTerm: string;
  setLocalSearchTerm: (term: string) => void;
  suggestions: { text: string; type: string }[];
  setSuggestions: (suggestions: { text: string; type: string }[]) => void;
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
  isFocused: boolean;
  setIsFocused: (focused: boolean) => void;
  hasNavigated: boolean;
  setHasNavigated: (navigated: boolean) => void;
  searchHistory: string[];
  setSearchHistory: (history: string[]) => void;
  removeSearchHistoryItem: (item: string) => void;
  clearSearchHistory: () => void;
  isComposing: boolean;
  setIsComposing: (composing: boolean) => void;
  recentSuccessfulSearch: string | null;
  setRecentSuccessfulSearch: (search: string | null) => void;
  handleSelectSuggestion: (text: string) => void;
}

export const useAutocompleteStore = create<AutocompleteState>()((set) => ({
  localSearchTerm: '',
  setLocalSearchTerm: (term) => set({ localSearchTerm: term }),
  suggestions: [],
  setSuggestions: (suggestions) => set({ suggestions }),
  selectedIndex: -1,
  setSelectedIndex: (index) => set({ selectedIndex: index }),
  showSuggestions: false,
  setShowSuggestions: (show) => set({ showSuggestions: show }),
  isFocused: false,
  setIsFocused: (focused) => set({ isFocused: focused }),
  hasNavigated: false,
  setHasNavigated: (navigated) => set({ hasNavigated: navigated }),
  searchHistory: [],
  setSearchHistory: (history) => set({ searchHistory: history }),
  isComposing: false,
  setIsComposing: (composing) => set({ isComposing: composing }),
  recentSuccessfulSearch: null,
  setRecentSuccessfulSearch: (search) => set({ recentSuccessfulSearch: search }),
  handleSelectSuggestion: (text) => set((state) => ({
    localSearchTerm: text,
    showSuggestions: false,
    selectedIndex: -1,
    hasNavigated: false,
  })),
  removeSearchHistoryItem: (item) => {
    removeFromSearchHistory(item);
    set({ searchHistory: getSearchHistory() });
  },
  clearSearchHistory: () => {
    clearSearchHistory();
    set({ searchHistory: [] });
  },
}));