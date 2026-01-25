import { Memo } from '@/types';
import { get, post, put, patch, del } from '@/utils/fetchWrapper';

export const memoService = {
  fetchMemos: async (type: string = 'all'): Promise<Memo[]> => {
    return get<Memo[]>(`/api/memos?type=${type}`);
  },

  fetchMemo: async (id: string): Promise<Memo> => {
    return get<Memo>(`/api/memos/${id}`);
  },

  fetchMemosByFolder: async (folderId: string): Promise<Memo[]> => {
    return get<Memo[]>(`/api/folders/${folderId}/memos`);
  },

  updateMemo: async ({
    id,
    title,
    content,
    folderId,
  }: {
    id: string;
    title: string;
    content: string;
    folderId?: string | null;
  }): Promise<Memo> => {
    return put<Memo>(`/api/memos/${id}`, { title, content, folderId });
  },

  createMemo: async ({
    title,
    content,
    folderId,
    isArchived,
  }: {
    title: string;
    content: string;
    folderId?: string | null;
    isArchived?: boolean;
  }): Promise<Memo> => {
    return post<Memo>('/api/memos', { title, content, isArchived, folderId });
  },

  archiveMemo: async ({
    id,
    isArchived,
  }: {
    id: string;
    isArchived: boolean;
  }): Promise<Memo> => {
    return put<Memo>(`/api/memos/${id}`, { isArchived });
  },

  liveShareMemo: async ({
    id,
    isLiveShareEnabled,
  }: {
    id: string;
    isLiveShareEnabled: boolean;
  }): Promise<Memo> => {
    return patch<Memo>(`/api/memos/${id}`, { isLiveShareEnabled });
  },

  moveMemoToTrash: async (id: string): Promise<Memo> => {
    return del<Memo>(`/api/memos/${id}?action=trash`);
  },

  restoreMemoFromTrash: async (id: string): Promise<Memo> => {
    return patch<Memo>(`/api/memos/${id}`, { action: 'restore' });
  },

  permanentlyDeleteMemo: async (id: string): Promise<void> => {
    return del<void>(`/api/memos/${id}?action=permanent`);
  },

  addTagsToMemo: async ({
    id,
    tags,
  }: {
    id: string;
    tags: string[];
  }): Promise<Memo> => {
    return patch<Memo>(`/api/memos/${id}`, { action: 'addTag', tags });
  },

  removeTagFromMemo: async ({
    id,
    tagId,
  }: {
    id: string;
    tagId: string;
  }): Promise<Memo> => {
    return patch<Memo>(`/api/memos/${id}`, { action: 'removeTag', tags: [tagId] });
  },

  moveMemoToFolder: async ({
    id,
    targetFolderId,
  }: {
    id: string;
    targetFolderId: string | null;
  }): Promise<Memo> => {
    return put<Memo>(`/api/memos/${id}`, { folderId: targetFolderId });
  },

  removeFromSharedList: async (shareToken: string): Promise<void> => {
    return del<void>(`/api/memos/shared/${shareToken}`);
  },

  // 공유된 메모 목록 가져오기
  fetchSharedMemos: async (): Promise<Memo[]> => {
    return get<Memo[]>(`/api/memos/shared`);
  },

  // Batch operations
  batchArchiveMemos: async ({
    ids,
    isArchived,
  }: {
    ids: string[];
    isArchived: boolean;
  }): Promise<void> => {
    return patch<void>(`/api/memos`, { ids, action: isArchived ? 'archive' : 'unarchive' });
  },

  batchMoveMemosToTrash: async (ids: string[]): Promise<void> => {
    return patch<void>(`/api/memos`, { ids, action: 'trash' });
  },

  batchRestoreMemosFromTrash: async (ids: string[]): Promise<void> => {
    return patch<void>(`/api/memos`, { ids, action: 'restore' });
  },

  batchPermanentlyDeleteMemos: async (ids: string[]): Promise<void> => {
    return patch<void>(`/api/memos`, { ids, action: 'permanent-delete' });
  },

  batchMoveMemosToFolder: async ({
    ids,
    targetFolderId,
  }: {
    ids: string[];
    targetFolderId: string | null;
  }): Promise<any> => {
    return patch('/api/memos', {
      ids,
      action: 'move',
      folderId: targetFolderId
    });
  }
};
