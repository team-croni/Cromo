import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Memo } from '@/types';
import { useMemoStore } from '@/store/memoStore';
import { useAutoSaveFailureStore } from '@/store/autoSaveFailureStore';
import { useSearchParams } from 'next/navigation';
import { memoService } from '@/services/memoService';
import { useMemoCacheUpdate } from '@/hooks/useMemoCacheUpdate';
import { useHybridSearchStore } from '@/store/hybridSearchStore';

interface UseMemosResult {
  allMemos: Memo[];
  memos: Memo[];
  archivedMemos: Memo[];
  deletedMemos: Memo[];
  sharedMemos: Memo[];
  folderMemos: Memo[];
  allMemosLoading: boolean;
  recentMemosLoading: boolean;
  archivedMemosLoading: boolean;
  deletedMemosLoading: boolean;
  sharedMemosLoading: boolean;
  folderMemosLoading: boolean;
  currentMemosLoading: boolean;
  error: string | null;
  createMemo: (title: string, content: string, isArchived: boolean, folderId?: string | null) => Promise<Memo | null>;
  updateMemo: (id: string, title: string, content: string, folderId?: string | null) => Promise<Memo | null>;
  deleteMemo: (id: string) => Promise<boolean>;
  archiveMemo: (id: string, isArchived: boolean) => Promise<Memo | null>;
  liveShareMemo: (id: string, isLiveShareEnabled: boolean) => Promise<Memo | null>;
  moveMemoToTrash: (id: string) => Promise<boolean>;
  restoreMemoFromTrash: (id: string) => Promise<Memo | null>;
  permanentlyDeleteMemo: (id: string) => Promise<boolean>;
  addTagsToMemo: (id: string, tags: string[]) => Promise<Memo | null>;
  removeTagFromMemo: (id: string, tagId: string) => Promise<Memo | null>;
  removeFromSharedList: (memoId: string) => Promise<boolean>;
  refreshMemos: () => Promise<void>;
  refreshArchivedMemos: () => Promise<void>;
  refreshDeletedMemos: () => Promise<void>;
  refreshSharedMemos: () => Promise<void>;
  refreshFolderMemos: () => Promise<void>; // 추가
  isAutoSaveFailed: (memoId: string | null) => boolean; // 추가된 함수
  batchArchiveMemos: (ids: string[], isArchived: boolean) => Promise<boolean>;
  batchMoveMemosToTrash: (ids: string[]) => Promise<boolean>;
  batchRestoreMemosFromTrash: (ids: string[]) => Promise<boolean>;
  batchPermanentlyDeleteMemos: (ids: string[]) => Promise<boolean>;
}

export function useMemos(): UseMemosResult {
  const queryClient = useQueryClient();
  const { addProcessingMemo, removeProcessingMemo } = useMemoStore();
  const { isAutoSaveFailed } = useAutoSaveFailureStore();
  const { addMemoToCache, updateMemoInCache, removeMemoFromCache, moveMemoInCache, removeMemoFromSharedCache } = useMemoCacheUpdate();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab');
  const folderId = searchParams.get('folderId');

  // 모든 메모를 가져오는 통합 쿼리 (휴지통 제외)
  const {
    data: allMemos = [],
    isLoading: allMemosLoading,
    error,
    refetch: refetchAllMemos,
  } = useQuery<Memo[], Error>({
    queryKey: ['memos', 'all'],
    queryFn: () => memoService.fetchMemos('all'),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // 공유된 메모를 가져오는 쿼리
  const {
    data: sharedMemosFromAPI = [],
    isLoading: sharedMemosLoading,
    refetch: refetchSharedMemos,
  } = useQuery<Memo[], Error>({
    queryKey: ['memos', 'shared'],
    queryFn: () => memoService.fetchSharedMemos(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Derived filtered lists using useMemo
  const memos = useMemo(() => {
    return allMemos.filter(memo => !memo.isArchived && !memo.isDeleted);
  }, [allMemos]);

  const archivedMemos = useMemo(() => {
    return allMemos.filter(memo => memo.isArchived && !memo.isDeleted);
  }, [allMemos]);

  // 공유된 메모 목록을 API에서 가져온 데이터 사용
  const sharedMemos = useMemo(() => {
    return sharedMemosFromAPI;
  }, [sharedMemosFromAPI]);

  const folderMemos = useMemo(() => {
    if (!folderId || folderId === 'root') {
      return allMemos.filter(memo => memo.folderId === null && !memo.isDeleted);
    }
    return allMemos.filter(memo => memo.folderId === folderId && !memo.isDeleted);
  }, [allMemos, folderId]);

  // 삭제된 메모 목록 (휴지통은 별도 관리)
  const {
    data: deletedMemos = [],
    isLoading: deletedMemosLoading,
    refetch: refetchDeletedMemos,
  } = useQuery<Memo[], Error>({
    queryKey: ['memos', 'deleted'],
    queryFn: () => memoService.fetchMemos('deleted'),
    staleTime: 1000 * 60 * 10, // 10 minutes
    enabled: activeTab === 'trash'
  });

  const recentMemosLoading = allMemosLoading;
  const archivedMemosLoading = allMemosLoading;
  const sharedMemosLoadingCombined = sharedMemosLoading; // API에서 가져온 공유 메모 로딩 상태 사용
  const folderMemosLoading = allMemosLoading;
  const currentMemosLoading = allMemosLoading || deletedMemosLoading;

  const refreshMemos = async (): Promise<void> => {
    await refetchAllMemos();
  };

  const refreshArchivedMemos = async (): Promise<void> => {
    await refetchAllMemos();
  };

  const refreshDeletedMemos = async (): Promise<void> => {
    await refetchDeletedMemos();
  };

  const refreshSharedMemos = async (): Promise<void> => {
    await refetchSharedMemos(); // 공유된 메모 전용 리프레시 함수
  };

  const refreshFolderMemos = async (): Promise<void> => {
    await refetchAllMemos();
  };

  // 메모 생성 뮤테이션
  const createMutation = useMutation({
    mutationFn: (variables: { title: string; content: string; folderId?: string | null; isArchived?: boolean }) =>
      memoService.createMemo({ title: variables.title, content: variables.content, folderId: variables.folderId, isArchived: variables.isArchived }),
    onMutate: (variables) => {
    },
    onSuccess: (newMemo) => {
      addMemoToCache(newMemo);
    },
    onError: (error) => {
      console.error('[Mutation] Error creating memo:', error);
    }
  });

  // 메모 업데이트 뮤테이션
  const updateMutation = useMutation({
    mutationFn: (variables: { id: string; title: string; content: string; folderId?: string | null }) =>
      memoService.updateMemo({ id: variables.id, title: variables.title, content: variables.content, folderId: variables.folderId }),
    onMutate: (variables) => {
    },
    onSuccess: (updatedMemo) => {
      updateMemoInCache(updatedMemo);
    },
    onError: (error, variables) => {
      console.error(`[Mutation] Error updating memo ${variables.id}:`, error);
    }
  });

  // 메모 보관 뮤테이션
  const archiveMutation = useMutation({
    mutationFn: (variables: { id: string; isArchived: boolean }) =>
      memoService.archiveMemo({ id: variables.id, isArchived: variables.isArchived }),
    onMutate: (variables) => {
      // 처리 중인 메모 추가
      addProcessingMemo(variables.id);
    },
    onSuccess: (updatedMemo) => {
      // 처리 완료 후 메모 제거
      removeProcessingMemo(updatedMemo.id);
      updateMemoInCache(updatedMemo);
    },
    onError: (error, variables) => {
      console.error(`[Mutation] Error archiving memo ${variables.id}:`, error);
      // 에러 발생 시 처리 중인 메모 제거
      removeProcessingMemo(variables.id);
    }
  });

  // 메모 Live Share 뮤테이션
  const liveShareMutation = useMutation({
    mutationFn: (variables: { id: string; isLiveShareEnabled: boolean }) =>
      memoService.liveShareMemo({ id: variables.id, isLiveShareEnabled: variables.isLiveShareEnabled }),
    onMutate: (variables) => {
      // 처리 중인 메모 추가
      addProcessingMemo(variables.id);
    },
    onSuccess: (updatedMemo) => {
      // 처리 완료 후 메모 제거
      removeProcessingMemo(updatedMemo.id);
      updateMemoInCache(updatedMemo);
    },
    onError: (error, variables) => {
      console.error(`[Mutation] Error toggling live share for memo ${variables.id}:`, error);
      // 에러 발생 시 처리 중인 메모 제거
      removeProcessingMemo(variables.id);
    }
  });

  // 메모 휴지통 이동 뮤테이션
  const moveToTrashMutation = useMutation({
    mutationFn: (id: string) => memoService.moveMemoToTrash(id),
    onMutate: (variables) => {
      // 처리 중인 메모 추가
      addProcessingMemo(variables);
    },
    onSuccess: (deletedMemo) => {
      // 처리 완료 후 메모 제거
      removeProcessingMemo(deletedMemo.id);
      removeMemoFromCache(deletedMemo.id);
      // 휴지통 목록 갱신
      queryClient.setQueryData<Memo[]>(['memos', 'deleted'], (oldMemos = []) => [...oldMemos, deletedMemo]);
      queryClient.invalidateQueries({ queryKey: ['memo-counts'] });
      // 검색 결과에서도 메모 제거
      useHybridSearchStore.getState().removeMemoFromSearchResults(deletedMemo.id);
    },
    onError: (error, variables) => {
      console.error(`[Mutation] Error moving memo to trash ${variables}:`, error);
      // 에러 발생 시 처리 중인 메모 제거
      removeProcessingMemo(variables);
    }
  });

  // 메모 휴지통 복원 뮤테이션
  const restoreFromTrashMutation = useMutation({
    mutationFn: (id: string) => memoService.restoreMemoFromTrash(id),
    onMutate: (variables) => {
      // 처리 중인 메모 추가
      addProcessingMemo(variables);
    },
    onSuccess: (restoredMemo) => {
      // 처리 완료 후 메모 제거
      removeProcessingMemo(restoredMemo.id);
      // 복원된 메모리 추가 (addMemoToCache가 'all'에 추가함)
      addMemoToCache(restoredMemo);

      // 휴지통 목록에서 제거
      queryClient.setQueryData<Memo[]>(['memos', 'deleted'], (oldMemos = []) =>
        oldMemos.filter((memo) => memo.id !== restoredMemo.id)
      );

      // 검색 결과에서도 메모 제거 (이후 검색 시 다시 포함됨)
      useHybridSearchStore.getState().removeMemoFromSearchResults(restoredMemo.id);
    },
    onError: (error, variables) => {
      console.error(`[Mutation] Error restoring memo from trash ${variables}:`, error);
      // 에러 발생 시 처리 중인 메모 제거
      removeProcessingMemo(variables);
    },
  });

  // 메모 영구 삭제 뮤테이션
  const permanentlyDeleteMutation = useMutation({
    mutationFn: (id: string) => memoService.permanentlyDeleteMemo(id),
    onMutate: (variables) => {
      // 처리 중인 메모 추가
      addProcessingMemo(variables);
    },
    onSuccess: (_, deletedMemoId) => {
      // 처리 완료 후 메모 제거
      removeProcessingMemo(deletedMemoId);
      // 휴지통 목록에서 제거
      queryClient.setQueryData<Memo[]>(['memos', 'deleted'], (oldMemos = []) =>
        oldMemos.filter((memo) => memo.id !== deletedMemoId)
      );
      // 카운트 무효화
      queryClient.invalidateQueries({ queryKey: ['memo-counts'] });

      // 검색 결과에서도 메모 제거
      useHybridSearchStore.getState().removeMemoFromSearchResults(deletedMemoId);
    },
    onError: (error, variables) => {
      console.error(`[Mutation] Error permanently deleting memo ${variables}:`, error);
      // 에러 발생 시 처리 중인 메모 제거
      removeProcessingMemo(variables);
    },
  });

  // 메모에 태그 추가 뮤테이션
  const addTagsMutation = useMutation({
    mutationFn: (variables: { id: string; tags: string[] }) =>
      memoService.addTagsToMemo({ id: variables.id, tags: variables.tags }),
    onMutate: (variables) => {
    },
    onSuccess: (updatedMemo) => {
      updateMemoInCache(updatedMemo);
    },
    onError: (error) => {
      console.error('[Mutation] Error adding tags to memo:', error);
    }
  });

  // 메모에서 태그 제거 뮤테이션
  const removeTagMutation = useMutation({
    mutationFn: (variables: { id: string; tagId: string }) =>
      memoService.removeTagFromMemo({ id: variables.id, tagId: variables.tagId }),
    onMutate: (variables) => {
    },
    onSuccess: (updatedMemo) => {
      updateMemoInCache(updatedMemo);
    },
    onError: (error) => {
      console.error('[Mutation] Error removing tag from memo:', error);
    }
  });

  // 공유된 메모에서 제거 뮤테이션
  const removeFromSharedListMutation = useMutation({
    mutationFn: (memoId: string) => {
      // 현재 공유된 메모에서 해당 메모를 찾아서 서비스 호출
      const memo = sharedMemos.find(m => m.id === memoId);
      if (!memo || !memo.shareToken) {
        throw new Error('Memo not found or no share token');
      }
      return memoService.removeFromSharedList(memo.shareToken);
    },
    onMutate: (variables) => {
      // 처리 중인 메모 추가
      addProcessingMemo(variables);
    },
    onSuccess: (_, memoId) => {
      // 처리 완료 후 메모 제거
      removeProcessingMemo(memoId);
      // 쿼리 캐시에서 공유된 메모 제거
      removeMemoFromSharedCache(memoId);
    },
    onError: (error, variables) => {
      console.error(`[Mutation] Error removing memo from shared list ${variables}:`, error);
      // 에러 발생 시 처리 중인 메모 제거
      removeProcessingMemo(variables);
    }
  });

  // Batch 처리를 위한 새로운 뮤테이션들
  const batchArchiveMutation = useMutation({
    mutationFn: (variables: { ids: string[]; isArchived: boolean }) =>
      memoService.batchArchiveMemos({ ids: variables.ids, isArchived: variables.isArchived }),
    onMutate: (variables) => {
      // 처리 중인 메모 추가
      variables.ids.forEach(id => addProcessingMemo(id));
    },
    onSuccess: (_, variables) => {
      // 일괄 업데이트는 개별적으로 처리하기 어려우므로 전체 갱신 호출
      refreshMemos();
      // 처리 완료 후 메모 제거
      variables.ids.forEach(id => removeProcessingMemo(id));
      queryClient.invalidateQueries({ queryKey: ['memo-counts'] });
    },
    onError: (error, variables) => {
      console.error('[Mutation] Error batch archiving memos:', error);
      variables.ids.forEach(id => removeProcessingMemo(id));
    }
  });

  const batchMoveToTrashMutation = useMutation({
    mutationFn: (ids: string[]) => memoService.batchMoveMemosToTrash(ids),
    onMutate: (variables) => {
      // 처리 중인 메모 추가
      variables.forEach(id => addProcessingMemo(id));
    },
    onSuccess: (_, ids) => {
      // 삭제된 메모들을 'all' 쿼리에서 미리 찾아둔다.
      const memosToMove = queryClient.getQueryData<Memo[]>(['memos', 'all'])?.filter(memo => ids.includes(memo.id)) || [];

      // 캐시에서 일괄 제거
      ids.forEach(id => removeMemoFromCache(id));

      // 휴지통 목록에 추가
      queryClient.setQueryData<Memo[]>(['memos', 'deleted'], (oldMemos = []) => {
        // 이미 휴지통에 있는 메모는 제외하고 추가
        const filteredNewMemos = memosToMove.filter(newMemo => !oldMemos.some(oldMemo => oldMemo.id === newMemo.id));
        return [...oldMemos, ...filteredNewMemos.map(memo => ({ ...memo, isDeleted: true }))];
      });

      // 처리 완료 후 메모 제거
      ids.forEach(id => removeProcessingMemo(id));
      queryClient.invalidateQueries({ queryKey: ['memo-counts'] });

      // 검색 결과에서도 메모 제거
      ids.forEach(id => {
        useHybridSearchStore.getState().removeMemoFromSearchResults(id);
      });
    },
    onError: (error, variables) => {
      console.error('[Mutation] Error batch moving memos to trash:', error);
      variables.forEach(id => removeProcessingMemo(id));
    }
  });

  const batchRestoreFromTrashMutation = useMutation({
    mutationFn: (ids: string[]) => memoService.batchRestoreMemosFromTrash(ids),
    onMutate: (variables) => {
      // 처리 중인 메모 추가
      variables.forEach(id => addProcessingMemo(id));
    },
    onSuccess: (_, ids) => {
      // 복원된 메모들을 'deleted' 쿼리에서 찾아둔다.
      const restoredMemos = queryClient.getQueryData<Memo[]>(['memos', 'deleted'])?.filter(memo => ids.includes(memo.id)) || [];

      // 'all' 쿼리에 복원된 메모들을 추가 (isDeleted: false로 변경)
      queryClient.setQueryData<Memo[]>(['memos', 'all'], (oldMemos = []) => {
        const newMemos = restoredMemos.map(memo => ({ ...memo, isDeleted: false }));
        return [...oldMemos, ...newMemos.filter(newMemo => !oldMemos.some(oldMemo => oldMemo.id === newMemo.id))];
      });

      // 휴지통 목록에서 제거
      queryClient.setQueryData<Memo[]>(['memos', 'deleted'], (oldMemos = []) =>
        oldMemos.filter((memo) => !ids.includes(memo.id))
      );
      // 처리 완료 후 메모 제거
      ids.forEach(id => removeProcessingMemo(id));
      queryClient.invalidateQueries({ queryKey: ['memo-counts'] });
    },
    onError: (error, variables) => {
      console.error('[Mutation] Error batch restoring memos from trash:', error);
      variables.forEach(id => removeProcessingMemo(id));
    }
  });

  const batchPermanentlyDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => memoService.batchPermanentlyDeleteMemos(ids),
    onMutate: (variables) => {
      // 처리 중인 메모 추가
      variables.forEach(id => addProcessingMemo(id));
    },
    onSuccess: (_, variables) => {
      // 휴지통에서 제거
      queryClient.setQueryData<Memo[]>(['memos', 'deleted'], (oldMemos = []) =>
        oldMemos.filter((memo) => !variables.includes(memo.id))
      );
      // 처리 완료 후 메모 제거
      variables.forEach(id => removeProcessingMemo(id));
      queryClient.invalidateQueries({ queryKey: ['memo-counts'] });

      // 검색 결과에서도 메모 제거
      variables.forEach(id => {
        useHybridSearchStore.getState().removeMemoFromSearchResults(id);
      });
    },
    onError: (error, variables) => {
      console.error('[Mutation] Error batch permanently deleting memos:', error);
      variables.forEach(id => removeProcessingMemo(id));
    }
  });

  const updateMemo = async (
    id: string,
    title: string,
    content: string,
    folderId?: string | null
  ): Promise<Memo | null> => {
    try {
      const updatedMemo = await Promise.race([
        updateMutation.mutateAsync({ id, title, content, folderId }),
        new Promise<never>((_, reject) =>
          setTimeout(() => {
            reject(new Error('Update mutation timeout'));
          }, 10000)
        )
      ]);
      return updatedMemo;
    } catch (err) {
      console.error(`[useMemos] Error updating memo ${id}:`, err);
      throw err;
    }
  };

  const createMemo = async (
    title: string,
    content: string,
    isArchived: boolean,
    folderId?: string | null,
  ): Promise<Memo | null> => {
    try {
      const newMemo = await Promise.race([
        createMutation.mutateAsync({ title, content, folderId, isArchived }),
        new Promise<never>((_, reject) =>
          setTimeout(() => {
            reject(new Error('Create mutation timeout'));
          }, 10000)
        )
      ]);
      return newMemo;
    } catch (err) {
      console.error('[useMemos] Error creating memo:', err);
      throw err;
    }
  };

  const archiveMemo = async (id: string, isArchived: boolean): Promise<Memo | null> => {
    try {
      const updatedMemo = await archiveMutation.mutateAsync({ id, isArchived });
      return updatedMemo;
    } catch (err) {
      console.error('Error archiving memo:', err);
      if (err instanceof Error) {
        alert(`메모 보관 중 오류 발생: ${err.message}`);
      } else {
        alert('메모 보관 중 알 수 없는 오류가 발생했습니다');
      }
      return null;
    }
  };

  const liveShareMemo = async (id: string, isLiveShareEnabled: boolean): Promise<Memo | null> => {
    try {
      const updatedMemo = await liveShareMutation.mutateAsync({ id, isLiveShareEnabled });
      return updatedMemo;
    } catch (err) {
      console.error('Error sharing memo:', err);
      if (err instanceof Error) {
        alert(`메모 공유 중 오류 발생: ${err.message}`);
      } else {
        alert('메모 공유 중 알 수 없는 오류가 발생했습니다');
      }
      return null;
    }
  };

  const moveMemoToTrash = async (id: string): Promise<boolean> => {
    try {
      await moveToTrashMutation.mutateAsync(id);
      return true;
    } catch (err) {
      console.error('Error moving memo to trash:', err);
      return false;
    }
  };

  const restoreMemoFromTrash = async (id: string): Promise<Memo | null> => {
    try {
      const restoredMemo = await restoreFromTrashMutation.mutateAsync(id);
      return restoredMemo;
    } catch (err) {
      console.error('Error restoring memo from trash:', err);
      return null;
    }
  };

  const permanentlyDeleteMemo = async (id: string): Promise<boolean> => {
    try {
      await permanentlyDeleteMutation.mutateAsync(id);
      return true;
    } catch (err) {
      console.error('Error permanently deleting memo:', err);
      return false;
    }
  };

  const addTagsToMemo = async (id: string, tags: string[]): Promise<Memo | null> => {
    try {
      const updatedMemo = await addTagsMutation.mutateAsync({ id, tags });
      return updatedMemo;
    } catch (err) {
      console.error('Error adding tags to memo:', err);
      return null;
    }
  };

  const removeTagFromMemo = async (id: string, tagId: string): Promise<Memo | null> => {
    try {
      const updatedMemo = await removeTagMutation.mutateAsync({ id, tagId });
      return updatedMemo;
    } catch (err) {
      console.error('Error removing tag from memo:', err);
      return null;
    }
  };

  const deleteMemo = async (id: string): Promise<boolean> => {
    return moveMemoToTrash(id);
  };

  const batchArchiveMemos = async (ids: string[], isArchived: boolean): Promise<boolean> => {
    try {
      await batchArchiveMutation.mutateAsync({ ids, isArchived });
      return true;
    } catch (err) {
      console.error('Error batch archiving memos:', err);
      return false;
    }
  };

  const batchMoveMemosToTrash = async (ids: string[]): Promise<boolean> => {
    try {
      await batchMoveToTrashMutation.mutateAsync(ids);
      return true;
    } catch (err) {
      console.error('Error batch moving memos to trash:', err);
      return false;
    }
  };

  const batchRestoreMemosFromTrash = async (ids: string[]): Promise<boolean> => {
    try {
      await batchRestoreFromTrashMutation.mutateAsync(ids);
      return true;
    } catch (err) {
      console.error('Error batch restoring memos from trash:', err);
      return false;
    }
  };

  const batchPermanentlyDeleteMemos = async (ids: string[]): Promise<boolean> => {
    try {
      await batchPermanentlyDeleteMutation.mutateAsync(ids);
      return true;
    } catch (err) {
      console.error('Error batch permanently deleting memos:', err);
      return false;
    }
  };

  const removeFromSharedList = async (memoId: string): Promise<boolean> => {
    try {
      await removeFromSharedListMutation.mutateAsync(memoId);
      return true;
    } catch (err) {
      console.error('Error removing memo from shared list:', err);
      return false;
    }
  };

  return {
    allMemos,
    memos,
    archivedMemos,
    deletedMemos,
    sharedMemos,
    folderMemos,
    allMemosLoading,
    recentMemosLoading,
    archivedMemosLoading,
    deletedMemosLoading,
    sharedMemosLoading: sharedMemosLoadingCombined, // 변수명 업데이트
    folderMemosLoading,
    currentMemosLoading,
    error: error?.message || null,
    createMemo,
    updateMemo,
    deleteMemo,
    archiveMemo,
    liveShareMemo,
    moveMemoToTrash,
    restoreMemoFromTrash,
    permanentlyDeleteMemo,
    addTagsToMemo,
    removeTagFromMemo,
    removeFromSharedList,
    batchArchiveMemos,
    batchMoveMemosToTrash,
    batchRestoreMemosFromTrash,
    batchPermanentlyDeleteMemos,
    refreshMemos,
    refreshArchivedMemos,
    refreshDeletedMemos,
    refreshSharedMemos,
    refreshFolderMemos,
    isAutoSaveFailed,
  };
}