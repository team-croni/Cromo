import { create } from 'zustand';

interface AutoSaveAttemptState {
  attemptCounts: Map<string, number>;
  getAttemptCount: (memoId: string | null) => number;
  incrementAttemptCount: (memoId: string) => void;
  resetAttemptCount: (memoId: string) => void;
  clearAllAttempts: () => void;
}

export const useAutoSaveAttemptStore = create<AutoSaveAttemptState>((set, get) => ({
  attemptCounts: new Map<string, number>(),

  getAttemptCount: (memoId) => {
    if (!memoId) return 0;
    return get().attemptCounts.get(memoId) || 0;
  },

  incrementAttemptCount: (memoId) => {
    set((state) => {
      const newCounts = new Map(state.attemptCounts);
      const currentCount = newCounts.get(memoId) || 0;
      newCounts.set(memoId, currentCount + 1);
      return { attemptCounts: newCounts };
    });
  },

  resetAttemptCount: (memoId) => {
    set((state) => {
      const newCounts = new Map(state.attemptCounts);
      const previousCount = newCounts.get(memoId) || 0;
      newCounts.delete(memoId);
      return { attemptCounts: newCounts };
    });
  },

  clearAllAttempts: () => {
    set((state) => {
      const count = state.attemptCounts.size;
      return { attemptCounts: new Map<string, number>() };
    });
  },
}));