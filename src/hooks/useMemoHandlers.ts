import { useMemoStore } from '@/store/memoStore';
import { useFolderStore } from '@/store/folderStore';
import { useMemos } from "@/hooks/useMemos";
import { useRouter, useSearchParams } from 'next/navigation';
import { Memo } from '@/types';
import { useMemo } from '@/hooks/useMemo';
import { useEditorStore } from '@store/editorStore';
import { useIsMobile } from '@hooks/useMediaQuery';

export const useMemoHandlers = () => {
  const { memos } = useMemoStore();
  const { setIsEditorReady } = useEditorStore();
  const { data: memoData } = useMemo();
  const { folders, toggleFolder, expandFolder } = useFolderStore();
  const isMobile = useIsMobile();

  const {
    refreshMemos,
    archiveMemo: apiArchiveMemo,
    liveShareMemo: apiLiveShareEnableMemo,
    moveMemoToTrash: apiMoveToTrash,
    restoreMemoFromTrash: apiRestoreFromTrash,
    permanentlyDeleteMemo: apiPermanentlyDelete,
    addTagsToMemo: apiAddTags,
    removeTagFromMemo: apiRemoveTag,
    removeFromSharedList: apiRemoveFromSharedList
  } = useMemos();
  const router = useRouter();

  const handleSelectMemo = (memo: Memo) => {
    if (memo.id === memoData?.id) return;

    setIsEditorReady(false);
    // 현재 URL의 파라미터를 유지하면서 새로운 URL로 이동
    const params = new URLSearchParams(window.location.search);
    params.set('id', memo.id);
    if (isMobile) {
      params.delete('tab');
    }
    router.push(`/memo?${params.toString()}`);

    // 메모의 상위 폴더들을 모두 확장
    if (memo.folderId) {
      // 메모가 속한 폴더의 모든 상위 폴더를 찾기
      const expandParentFolders = (folderId: string) => {
        const folder = folders.find(f => f.id === folderId);
        if (folder) {
          expandFolder(folder.id);
          // 재귀적으로 상위 폴더도 확장
          if (folder.parentId) {
            expandParentFolders(folder.parentId);
          }
        }
      };

      // 메모가 속한 폴더부터 상위 폴더들까지 모두 확장
      expandParentFolders(memo.folderId);
    }
  };

  // 메모 보관/보관 해제 함수
  const handleToggleLiveShareMemo = async (id: string, isLiveShareEnabled: boolean) => {
    try {
      // 메모의 보관 상태를 토글
      const updatedMemo = await apiLiveShareEnableMemo(id, !isLiveShareEnabled);

      if (!updatedMemo) {
        throw new Error('Failed to toggle archive status');
      }

      return true;
    } catch (error) {
      console.error("Error toggling archive status:", error);
      // 오류 메시지를 더 자세히 표시
      if (error instanceof Error) {
        alert(`보관 상태 전환 중 오류 발생: ${error.message}`);
      } else {
        alert('보관 상태 전환 중 알 수 없는 오류가 발생했습니다');
      }
      return false;
    }
  };

  // 메모 보관/보관 해제 함수
  const handleToggleArchiveMemo = async (id: string, isArchived: boolean) => {
    try {
      // 메모의 보관 상태를 토글
      const updatedMemo = await apiArchiveMemo(id, !isArchived);

      if (!updatedMemo) {
        throw new Error('Failed to toggle archive status');
      }

      return true;
    } catch (error) {
      console.error("Error toggling archive status:", error);
      // 오류 메시지를 더 자세히 표시
      if (error instanceof Error) {
        alert(`보관 상태 전환 중 오류 발생: ${error.message}`);
      } else {
        alert('보관 상태 전환 중 알 수 없는 오류가 발생했습니다');
      }
      return false;
    }
  };

  // 메모 휴지통 이동 함수
  const handleMoveMemoToTrash = async (id: string) => {
    try {
      const result = await apiMoveToTrash(id);

      if (!result) {
        throw new Error('Failed to move memo to trash');
      }

      // 현재 선택된 메모가 삭제된 메모라면 선택 해제
      if (memoData?.id === id) {
        // 현재 URL의 파라미터를 유지하면서 id만 제거
        const params = new URLSearchParams(window.location.search);
        params.delete('id');
        router.replace(`/memo?${params.toString()}`);
      }

      return true;
    } catch (error) {
      console.error("Error moving memo to trash:", error);
      // 오류 메시지를 더 자세히 표시
      if (error instanceof Error) {
        alert(`메모를 휴지통으로 이동하는 중 오류 발생: ${error.message}`);
      } else {
        alert('메모를 휴지통으로 이동하는 중 알 수 없는 오류가 발생했습니다');
      }
      return false;
    }
  };

  // 메모 휴지통에서 복원 함수
  const handleRestoreMemoFromTrash = async (id: string) => {
    try {
      const restoredMemo = await apiRestoreFromTrash(id);

      if (!restoredMemo) {
        throw new Error('Failed to restore memo from trash');
      }

      return true;
    } catch (error) {
      console.error("Error restoring memo from trash:", error);
      // 오류 메시지를 더 자세히 표시
      if (error instanceof Error) {
        alert(`휴지통에서 메모를 복원하는 중 오류 발생: ${error.message}`);
      } else {
        alert('메모를 복원하는 중 알 수 없는 오류가 발생했습니다');
      }
      return false;
    }
  };

  // 메모 영구 삭제 함수
  const handlePermanentlyDeleteMemo = async (id: string) => {
    if (!confirm("정말 이 메모를 영구 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      return false;
    }

    try {
      const result = await apiPermanentlyDelete(id);

      if (!result) {
        throw new Error('Failed to permanently delete memo');
      }

      // 현재 선택된 메모가 삭제된 메모라면 선택 해제
      if (memoData?.id === id) {
        // 현재 URL의 파라미터를 유지하면서 id만 제거
        const params = new URLSearchParams(window.location.search);
        params.delete('id');
        router.replace(`/memo?${params.toString()}`);
      }

      return true;
    } catch (error) {
      console.error("Error permanently deleting memo:", error);
      // 오류 메시지를 더 자세히 표시
      if (error instanceof Error) {
        alert(`메모를 영구 삭제하는 중 오류 발생: ${error.message}`);
      } else {
        alert('메모를 영구 삭제하는 중 알 수 없는 오류가 발생했습니다');
      }
      return false;
    }
  };

  // 메모에 태그 추가 함수
  const handleAddTagsToMemo = async (id: string, tags: string[]) => {
    try {
      const updatedMemo = await apiAddTags(id, tags);

      if (!updatedMemo) {
        throw new Error('Failed to add tags to memo');
      }

      return true;
    } catch (error) {
      console.error("Error adding tags to memo:", error);
      // 오류 메시지를 더 자세히 표시
      if (error instanceof Error) {
        alert(`메모에 태그를 추가하는 중 오류 발생: ${error.message}`);
      } else {
        alert('메모에 태그를 추가하는 중 알 수 없는 오류가 발생했습니다');
      }
      return false;
    }
  };

  // 메모에서 태그 제거 함수
  const handleRemoveTagFromMemo = async (id: string, tagId: string) => {
    try {
      const updatedMemo = await apiRemoveTag(id, tagId);

      if (!updatedMemo) {
        throw new Error('Failed to remove tag from memo');
      }

      return true;
    } catch (error) {
      console.error("Error removing tag from memo:", error);
      // 오류 메시지를 더 자세히 표시
      if (error instanceof Error) {
        alert(`메모에서 태그를 제거하는 중 오류 발생: ${error.message}`);
      } else {
        alert('메모에서 태그를 제거하는 중 알 수 없는 오류가 발생했습니다');
      }
      return false;
    }
  };

  // 공유된 메모에서 제거 함수
  const handleRemoveFromSharedList = async (id: string) => {
    try {
      const result = await apiRemoveFromSharedList(id);

      if (!result) {
        throw new Error('Failed to remove memo from shared list');
      }

      // 현재 선택된 메모가 공유에서 제거된 메모라면 URL에서 id 파라미터 제거
      if (memoData?.id === id) {
        const params = new URLSearchParams(window.location.search);
        params.delete('id');
        router.replace(`/memo?${params.toString()}`);
      }

      return true;
    } catch (error) {
      console.error("Error removing memo from shared list:", error);
      // 오류 메시지를 더 자세히 표시
      if (error instanceof Error) {
        alert(`공유된 메모에서 제거하는 중 오류 발생: ${error.message}`);
      } else {
        alert('공유된 메모에서 제거하는 중 알 수 없는 오류가 발생했습니다');
      }
      return false;
    }
  };

  const handleDeleteMemo = async (id: string) => {
    return handleMoveMemoToTrash(id);
  };

  return {
    memos,
    folders,
    handleSelectMemo,
    handleDeleteMemo,
    handleToggleArchiveMemo,
    handleToggleLiveShareMemo,
    handleMoveMemoToTrash,
    handleRestoreMemoFromTrash,
    handlePermanentlyDeleteMemo,
    handleAddTagsToMemo,
    handleRemoveTagFromMemo,
    handleRemoveFromSharedList,
    refreshMemos,
    toggleFolder,
    expandFolder
  };
};