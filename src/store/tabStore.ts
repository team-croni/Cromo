import { create } from 'zustand';

type TabType = 'folders' | 'recent' | 'pinned';

interface TabState {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const useTabStore = create<TabState>((set) => ({
  activeTab: 'recent',
  setActiveTab: (tab) => set({ activeTab: tab }),
}));