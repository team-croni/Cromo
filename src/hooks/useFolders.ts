import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Folder } from '@/types';
import { get, post, put, del } from '@/utils/fetchWrapper';

interface UseFoldersResult {
  folders: Folder[];
  loading: boolean;
  error: string | null;
  createFolder: (name: string, parentId?: string | null) => Promise<Folder | null>;
  updateFolder: (id: string, name: string, icon?: string, color?: string) => Promise<Folder | null>;
  deleteFolder: (id: string) => Promise<boolean>;
  reorderFolder: (folderId: string, newOrder: number) => Promise<boolean>;
  refreshFolders: () => Promise<void>;
}

// API 호출 함수들
const fetchFolders = async (): Promise<Folder[]> => {
  return get<Folder[]>('/api/folders');
};

const createFolderAPI = async ({
  name,
  parentId,
}: {
  name: string;
  parentId?: string | null;
}): Promise<Folder> => {
  return post<Folder>('/api/folders', { name, parentId });
};

const updateFolderAPI = async ({
  id,
  name,
  icon,
  color,
}: {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}): Promise<Folder> => {
  return put<Folder>(`/api/folders/${id}`, { name, icon, color });
};

const deleteFolderAPI = async (id: string): Promise<void> => {
  try {
    await del<void>(`/api/folders/${id}`);
  } catch (error: any) {
    // 404 응답도 정상적으로 처리 (이미 삭제되었거나 존재하지 않는 폴더)
    if (error.status === 404) {
      return;
    }
    throw error;
  }
};

const reorderFolderAPI = async (id: string, newOrder: number): Promise<void> => {
  try {
    await post<void>(`/api/folders/${id}/reorder`, { newOrder });
  } catch (error: any) {
    console.error('Folder reorder error:', error);
    throw error;
  }
};

export function useFolders(): UseFoldersResult {
  const queryClient = useQueryClient();

  // 폴더 목록을 가져오는 쿼리
  const {
    data: folders = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery<Folder[], Error>({
    queryKey: ['folders'],
    queryFn: fetchFolders,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // 폴더 생성 뮤테이션
  const createMutation = useMutation({
    mutationFn: createFolderAPI,
    onSuccess: (newFolder) => {
      // 새 폴더를 캐시에 추가
      queryClient.setQueryData<Folder[]>(['folders'], (oldFolders = []) => [...oldFolders, newFolder]);
    },
  });

  // 폴더 업데이트 뮤테이션
  const updateMutation = useMutation({
    mutationFn: updateFolderAPI,
    onSuccess: (updatedFolder) => {
      // 업데이트된 폴더로 캐시를 갱신
      queryClient.setQueryData<Folder[]>(['folders'], (oldFolders = []) =>
        oldFolders.map((folder) => (folder.id === updatedFolder.id ? updatedFolder : folder))
      );
    },
  });

  // 폴더 삭제 뮤테이션
  const deleteMutation = useMutation({
    mutationFn: deleteFolderAPI,
    onSuccess: (_, deletedFolderId) => {
      // 삭제된 폴더를 캐시에서 제거
      queryClient.setQueryData<Folder[]>(['folders'], (oldFolders = []) =>
        oldFolders.filter((folder) => folder.id !== deletedFolderId)
      );
    },
  });

  // 폴더 순서 변경 뮤테이션
  const reorderMutation = useMutation({
    mutationFn: ({ id, newOrder }: { id: string; newOrder: number }) =>
      reorderFolderAPI(id, newOrder),
    onSuccess: () => {
      // 폴더 순서 변경 후 캐시 무효화하여 다시 로드
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
    onError: (error, variables) => {
      console.error('Folder reorder error:', error);
      // 에러 시 optimistic update 롤백
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
  });

  const createFolder = async (
    name: string,
    parentId?: string | null
  ): Promise<Folder | null> => {
    try {
      const newFolder = await createMutation.mutateAsync({ name, parentId });
      return newFolder;
    } catch (err) {
      console.error('Error creating folder:', err);
      return null;
    }
  };

  const updateFolder = async (
    id: string,
    name: string,
    icon?: string,
    color?: string
  ): Promise<Folder | null> => {
    try {
      const updatedFolder = await updateMutation.mutateAsync({ id, name, icon, color });
      return updatedFolder;
    } catch (err) {
      console.error('Error updating folder:', err);
      return null;
    }
  };

  const deleteFolder = async (id: string): Promise<boolean> => {
    try {
      await deleteMutation.mutateAsync(id);
      return true;
    } catch (err) {
      console.error('Error deleting folder:', err);
      return false;
    }
  };

  const reorderFolder = async (id: string, newOrder: number): Promise<boolean> => {
    try {
      // 폴더 목록 캐시에서 가져오기
      const currentFolders = queryClient.getQueryData<Folder[]>(['folders']);
      if (!currentFolders) {
        // 캐시가 없으면 서버에서 가져오기
        await reorderMutation.mutateAsync({ id, newOrder });
        return true;
      }

      // 현재 폴더와 대상 폴더 찾기
      const draggedFolder = currentFolders.find(folder => folder.id === id);
      if (!draggedFolder) {
        await reorderMutation.mutateAsync({ id, newOrder });
        return true;
      }

      // 같은 레벨의 폴더들 필터링 (parentId가 동일한 폴더들)
      const siblingFolders = currentFolders.filter(folder =>
        folder.parentId === draggedFolder.parentId
      );

      // 현재 인덱스와 새로운 인덱스 찾기
      const currentIndex = siblingFolders.findIndex(folder => folder.id === id);
      const targetIndex = Math.max(0, Math.min(newOrder, siblingFolders.length - 1));

      if (currentIndex === targetIndex) {
        return true; // 순서가 같으면 아무 것도 하지 않음
      }

      // 폴더 순서 재배열
      const reorderedSiblings = [...siblingFolders];
      const [movedFolder] = reorderedSiblings.splice(currentIndex, 1);
      reorderedSiblings.splice(targetIndex, 0, movedFolder);

      // 순서 필드 업데이트
      const updatedSiblings = reorderedSiblings.map((folder, index) => ({
        ...folder,
        order: index
      }));

      // 전체 폴더 목록 업데이트
      const updatedFolders = currentFolders.map(folder => {
        const updatedSibling = updatedSiblings.find(sibling => sibling.id === folder.id);
        return updatedSibling || folder;
      });

      // Optimistic update: 캐시 즉시 업데이트
      queryClient.setQueryData<Folder[]>(['folders'], updatedFolders);

      // 서버에 순서 변경 요청
      await reorderMutation.mutateAsync({ id, newOrder });

      return true;
    } catch (err) {
      console.error('Error reordering folder:', err);

      // 에러 시 캐시를 원래 상태로 되돌리기
      queryClient.invalidateQueries({ queryKey: ['folders'] });

      return false;
    }
  };

  const refreshFolders = async () => {
    await refetch();
  };

  return {
    folders,
    loading,
    error: error?.message || null,
    createFolder,
    updateFolder,
    deleteFolder,
    reorderFolder,
    refreshFolders,
  };
}