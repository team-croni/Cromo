import { create } from 'zustand';
import { Memo } from '@/types';

interface MemoState {
  memos: Memo[];
  selectedMemo: Memo | null;
  processingMemos: Set<string>;
  searchTerm: string;
  setMemos: (memos: Memo[]) => void;
  addMemo: (memo: Memo) => void;
  updateMemo: (memo: Memo) => void;
  deleteMemo: (id: string) => void;
  moveToTrash: (id: string) => void;
  restoreFromTrash: (memo: Memo) => void;
  archiveMemo: (memo: Memo) => void;
  unarchiveMemo: (memo: Memo) => void;
  setSelectedMemo: (memo: Memo | null) => void;
  addProcessingMemo: (id: string) => void;
  removeProcessingMemo: (id: string) => void;
  clearProcessingMemos: () => void;
  setSearchTerm: (searchTerm: string) => void;
  setLoading: (loading: boolean) => void;
  loading: boolean;
}

export const useMemoStore = create<MemoState>()((set, get) => ({
  memos: [],
  selectedMemo: null,
  processingMemos: new Set(),
  loading: false,
  searchTerm: '',
  setMemos: (memos) => set({ memos }),
  addMemo: (memo) => set((state) => ({ memos: [memo, ...state.memos] })),
  updateMemo: (memo) => set((state) => ({
    memos: state.memos.map((m) => m.id === memo.id ? memo : m)
  })),
  deleteMemo: (id) => set((state) => ({
    memos: state.memos.filter((m) => m.id !== id)
  })),
  moveToTrash: (id) => set((state) => ({
    memos: state.memos.filter((m) => m.id !== id)
  })),
  restoreFromTrash: (memo) => set((state) => ({
    memos: [memo, ...state.memos]
  })),
  archiveMemo: (memo) => set((state) => ({
    memos: state.memos.map((m) => m.id === memo.id ? { ...memo, isArchived: true } : m)
  })),
  unarchiveMemo: (memo) => set((state) => ({
    memos: state.memos.map((m) => m.id === memo.id ? { ...memo, isArchived: false } : m)
  })),
  setSelectedMemo: (memo) => set({ selectedMemo: memo }),
  addProcessingMemo: (id) => set((state) => ({
    processingMemos: new Set(state.processingMemos).add(id)
  })),
  removeProcessingMemo: (id) => set((state) => {
    const newSet = new Set(state.processingMemos);
    newSet.delete(id);
    return { processingMemos: newSet };
  }),
  clearProcessingMemos: () => set({ processingMemos: new Set() }),
  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setLoading: (loading) => set({ loading }),
}));
