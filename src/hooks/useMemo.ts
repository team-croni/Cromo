import { useQuery } from '@tanstack/react-query';
import { Memo } from '@/types';
import { useParams, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useMemoBrowserStore } from '@store/memoBrowserStore';
import { memoService } from '@/services/memoService';
import { useQueryClient } from '@tanstack/react-query';
import { useEditorStore } from '@store/editorStore';
import { useEditorSaveStore } from '@store/editorSaveStore';

// 특정 메모를 가져오는 훅
export function useMemo(memoId?: string) {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const params = useParams();
  const urlMemoId = searchParams.get('id') || params.id as string;
  const { setSelectedMemos, setActiveMode } = useMemoBrowserStore();
  const { initialTitleRef, initialContentRef } = useEditorSaveStore();
  const { setIsEditorReady } = useEditorStore();
  const queryClient = useQueryClient();

  const result = useQuery<Memo, Error>({
    queryKey: ['memo', memoId || urlMemoId],
    queryFn: async () => {
      const fetchedMemo = await memoService.fetchMemo(memoId || urlMemoId);

      // URL 파라미터에서 id를 가져왔고, 그 값이 실제 메모의 shareToken과 일치하며,
      // 현재 사용자가 메모 소유자가 아닐 경우 (즉, 공유된 메모에 접근한 경우)
      // URL 파라미터의 id가 UUID 형식이 아닌 경우 (UUID가 아니면 토큰일 가능성 있음)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(urlMemoId || memoId || '');
      const accessedViaToken = !isUUID && (urlMemoId || memoId) === fetchedMemo.shareToken;

      if (accessedViaToken && session?.user?.id && fetchedMemo.userId !== session.user.id) {
        // 공유 메모 리스트 쿼리 캐시에 메모 추가
        queryClient.setQueryData<Memo[]>(['memos', 'shared'], (oldSharedMemos = []) => {
          // 이미 존재하는지 확인
          const exists = oldSharedMemos.some(m => m.id === fetchedMemo.id);
          if (exists) {
            return oldSharedMemos;
          }
          // 새 메모를 캐시에 추가
          return [...oldSharedMemos, fetchedMemo];
        });

        // 공유 메모 리스트 쿼리 무효화하여 UI에 반영
        queryClient.invalidateQueries({ queryKey: ['memos', 'shared'] });
      }

      setIsEditorReady(true);

      return fetchedMemo;
    },
    enabled: !!(memoId || urlMemoId),
    staleTime: 0,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false
  });

  useEffect(() => {
    setSelectedMemos(new Set());
    setActiveMode('none');
  }, [searchParams, setSelectedMemos, setActiveMode])

  const isCurrentMemoOwner = !(!!(result.data as Memo)?.userId && session?.user?.id !== (result.data as Memo)?.userId);

  return {
    ...result,
    isCurrentMemoOwner,
  };
}