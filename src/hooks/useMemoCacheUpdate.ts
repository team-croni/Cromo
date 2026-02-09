import { useQueryClient } from '@tanstack/react-query';
import { Memo } from '@/types';

/**
 * Custom hook for updating memo cache in React Query
 */
export const useMemoCacheUpdate = () => {
  const queryClient = useQueryClient();

  /**
   * Add a new memo to the cache
   */
  const addMemoToCache = (newMemo: Memo) => {
    // Add to 'all' memos
    queryClient.setQueryData<Memo[]>(['memos', 'all'], (oldMemos = []) => [newMemo, ...oldMemos]);

    // Add to folder cache if applicable
    if (newMemo.folderId) {
      queryClient.setQueryData<Memo[]>(['memos', 'folder', newMemo.folderId], (oldMemos = []) => [newMemo, ...oldMemos]);
    } else {
      queryClient.setQueryData<Memo[]>(['memos', 'folder', null], (oldMemos = []) => [newMemo, ...oldMemos]);
    }

    // Invalidate counts
    queryClient.invalidateQueries({ queryKey: ['memo-counts'] });
  };

  /**
   * Update an existing memo in the cache
   */
  const updateMemoInCache = (updatedMemo: Memo) => {
    // Update individual memo cache
    queryClient.setQueryData(['memo', updatedMemo.id], (oldData: any) => {
      if (!oldData) return updatedMemo;
      return { ...oldData, ...updatedMemo };
    });

    // Update 'all' memos list
    queryClient.setQueriesData(
      { queryKey: ['memos'] },
      (oldMemos: Memo[] | undefined) => {
        if (!oldMemos) return oldMemos;
        return oldMemos.map(memo =>
          memo.id === updatedMemo.id ? { ...memo, ...updatedMemo } : memo
        );
      }
    );

    // Update folder specific cache if needed
    if (updatedMemo.folderId) {
      queryClient.setQueryData<Memo[]>(['memos', 'folder', updatedMemo.folderId], (oldMemos = []) =>
        oldMemos.map(memo => memo.id === updatedMemo.id ? { ...memo, ...updatedMemo } : memo)
      );
    } else {
      queryClient.setQueryData<Memo[]>(['memos', 'folder', null], (oldMemos = []) =>
        oldMemos.map(memo => memo.id === updatedMemo.id ? { ...memo, ...updatedMemo } : memo)
      );
    }
  };

  /**
   * Remove a memo from the cache (e.g. deleted or moved to trash)
   */
  const removeMemoFromCache = (memoId: string) => {
    // Remove from 'all'
    queryClient.setQueriesData(
      { queryKey: ['memos', 'all'] },
      (oldMemos: Memo[] | undefined) => {
        if (!oldMemos) return oldMemos;
        return oldMemos.filter(memo => memo.id !== memoId);
      }
    );

    // Remove from 'recent'
    queryClient.setQueryData<Memo[]>(['memos', 'recent'], (oldMemos = []) =>
      oldMemos.filter(memo => memo.id !== memoId)
    );

    // Remove from folder caches (broad approach or specific if we knew the folder)
    // Here we can't easily know which folder it was in without passing it, so we rely on 'all' usually.
    // But if we want to be thorough:
    queryClient.invalidateQueries({ queryKey: ['memos', 'folder'] });
    queryClient.invalidateQueries({ queryKey: ['memos', 'search'] });
  };


  /**
   * Remove a memo from shared list cache
   */
  const removeMemoFromSharedCache = (memoId: string) => {
    // Remove from 'shared' memos list
    queryClient.setQueryData<Memo[]>(['memos', 'shared'], (oldMemos = []) =>
      oldMemos.filter(memo => memo.id !== memoId)
    );
  };

  /**
   * Handle memo move between folders
   */
  const moveMemoInCache = (memoId: string, oldFolderId: string | null | undefined, newFolderId: string | null, updatedMemo: Memo) => {
    // 1. Remove from old folder
    if (oldFolderId !== undefined) {
      queryClient.setQueryData<Memo[]>(['memos', 'folder', oldFolderId], (oldMemos = []) =>
        oldMemos.filter((memo) => memo.id !== memoId)
      );
    } else {
      // If we don't know the old folder, we might need to search or invalidate.
      // But typically the caller knows. For now, if undefined, we skip specific removal or rely on invalidation.
    }

    // 2. Add to new folder
    queryClient.setQueryData<Memo[]>(['memos', 'folder', newFolderId], (oldMemos = []) => {
      const exists = oldMemos.some(memo => memo.id === memoId);
      if (exists) {
        return oldMemos.map(memo => memo.id === memoId ? updatedMemo : memo);
      }
      return [updatedMemo, ...oldMemos];
    });

    // 3. Update 'all' and individual cache
    updateMemoInCache(updatedMemo);
  };

  return { addMemoToCache, updateMemoInCache, removeMemoFromCache, moveMemoInCache, removeMemoFromSharedCache };
};
