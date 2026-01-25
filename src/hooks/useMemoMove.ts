import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemoStore } from '@/store/memoStore';
import { memoService } from '@/services/memoService';
import { useMemoCacheUpdate } from '@/hooks/useMemoCacheUpdate';

interface MoveMemoParams {
  memoId: string;
  targetFolderId: string | null;
  currentFolderId?: string | null;
}

interface MoveMemosParams {
  memoIds: string[];
  targetFolderId: string | null;
}

interface UseMemoMoveResult {
  moveMemo: (params: MoveMemoParams) => Promise<boolean>;
  moveMemos: (params: MoveMemosParams) => Promise<boolean>;
  isMoving: boolean;
}

export function useMemoMove(): UseMemoMoveResult {
  const queryClient = useQueryClient();
  const { addProcessingMemo, removeProcessingMemo } = useMemoStore();
  const { moveMemoInCache } = useMemoCacheUpdate();

  // 메모 이동 뮤테이션
  const moveMutation = useMutation({
    mutationFn: (variables: { id: string; targetFolderId: string | null; currentFolderId?: string | null }) =>
      memoService.moveMemoToFolder({ id: variables.id, targetFolderId: variables.targetFolderId }),
    onMutate: (variables) => {
      // 처리 중인 메모 추가
      addProcessingMemo(variables.id);
    },
    onSuccess: (updatedMemo, variables) => {
      const { id: memoId } = updatedMemo;
      const { currentFolderId, targetFolderId: newFolderId } = variables;

      // 처리 완료 후 메모 제거
      removeProcessingMemo(memoId);

      // 캐시 업데이트
      moveMemoInCache(memoId, currentFolderId, newFolderId, updatedMemo);
      
      // 메모 개수 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['memo-counts'] });
    },
    onError: (error, variables) => {
      console.error(`[Mutation] Error moving memo ${variables.id}:`, error);
      // 에러 발생 시 처리 중인 메모 제거
      removeProcessingMemo(variables.id);
    }
  });

  // 다중 메모 이동 뮤테이션
  const moveMemosMutation = useMutation({
    mutationFn: (variables: { ids: string[]; targetFolderId: string | null }) =>
      memoService.batchMoveMemosToFolder({ ids: variables.ids, targetFolderId: variables.targetFolderId }),
    onMutate: (variables) => {
      // 처리 중인 메모들 추가
      variables.ids.forEach(id => addProcessingMemo(id));
    },
    onSuccess: (_, variables) => {
      const { ids } = variables;

      // 처리 완료 후 메모들 제거
      ids.forEach(id => removeProcessingMemo(id));

      // 데이터 일관성을 위해 전체 메모 쿼리 무효화 (가장 안전한 방법)
      queryClient.invalidateQueries({ queryKey: ['memos'] });
      queryClient.invalidateQueries({ queryKey: ['memo-counts'] });
    },
    onError: (error, variables) => {
      console.error(`[Mutation] Error moving memos:`, error);
      // 에러 발생 시 처리 중인 메모들 제거
      variables.ids.forEach(id => removeProcessingMemo(id));
    }
  });

  const moveMemo = async ({
    memoId,
    targetFolderId,
    currentFolderId,
  }: MoveMemoParams): Promise<boolean> => {
    try {
      // 동일한 폴더로 이동하는 경우 무시
      if (currentFolderId === targetFolderId) {
        return true;
      }

      await moveMutation.mutateAsync({ id: memoId, targetFolderId, currentFolderId });
      return true;
    } catch (err) {
      console.error('Error moving memo:', err);
      return false;
    }
  };

  const moveMemos = async ({
    memoIds,
    targetFolderId,
  }: MoveMemosParams): Promise<boolean> => {
    try {
      if (memoIds.length === 0) return false;
      await moveMemosMutation.mutateAsync({ ids: memoIds, targetFolderId });
      return true;
    } catch (err) {
      console.error('Error moving memos:', err);
      return false;
    }
  };

  return {
    moveMemo,
    moveMemos,
    isMoving: moveMutation.isPending || moveMemosMutation.isPending,
  };
}