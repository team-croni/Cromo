import { useMemoBrowserStore } from '@store/memoBrowserStore';
import { useMemoStore } from '@store/memoStore';
import { useMemos } from '@hooks/useMemos';
import { getFilteredMemos } from '@utils/getFilteredItems';
import { Check, Archive, Trash2, Undo2, ArchiveX, ListX } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { MemoActionButton } from '@components/memo/memo-action-button';

export function MemoBrowserSelectionInfo() {
  const { activeMode, selectedMemos, filterOptions, setActiveMode } = useMemoBrowserStore();
  const { processingMemos } = useMemoStore();
  const {
    memos,
    archivedMemos,
    deletedMemos,
    sharedMemos,
    archiveMemo,
    moveMemoToTrash,
    restoreMemoFromTrash,
    permanentlyDeleteMemo,
    batchArchiveMemos,
    batchMoveMemosToTrash,
    batchRestoreMemosFromTrash,
    batchPermanentlyDeleteMemos,
    removeFromSharedList
  } = useMemos();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'recent';
  const folderId = searchParams.get('folderId');
  const isProcessing = processingMemos.size > 0;

  // 현재 탭에 따라 적절한 메모 목록을 선택
  const getCurrentMemos = () => {
    switch (activeTab) {
      case 'archived':
        return archivedMemos;
      case 'trash':
        return deletedMemos;
      case 'shared':
        return sharedMemos;
      default:
        return memos;
    }
  };

  const currentMemos = getCurrentMemos();
  const filteredMemos = getFilteredMemos(currentMemos, filterOptions);

  const handleToggleSelectAllMemos = () => {
    if (selectedMemos.size === filteredMemos.length) {
      // 모든 메모가 선택되어 있으면 해제
      useMemoBrowserStore.getState().setSelectedMemos(new Set());
    } else {
      // 일부 또는 아무것도 선택되어 있지 않으면 모두 선택
      useMemoBrowserStore.getState().setSelectedMemos(new Set(filteredMemos.map(memo => memo.id)));
    }
  };

  // 선택된 메모들을 보관함으로 이동
  const handleArchiveSelectedMemos = async () => {
    try {
      const selectedMemoIds = Array.from(selectedMemos);
      // 선택된 메모가 1개 이상이면 batch 처리, 그렇지 않으면 기존 방식 사용
      if (selectedMemoIds.length > 1) {
        await batchArchiveMemos(selectedMemoIds, true);
      } else if (selectedMemoIds.length === 1) {
        await archiveMemo(selectedMemoIds[0], true);
      }
      // 선택 해제
      // useMemoBrowserStore.getState().setSelectedMemos(new Set());
    } catch (error) {
      console.error("Error archiving memos:", error);
      alert("메모를 보관함으로 이동하는 중 오류가 발생했습니다.");
    }
  };

  // 선택된 메모들을 보관 해제
  const handleUnarchiveSelectedMemos = async () => {
    try {
      const selectedMemoIds = Array.from(selectedMemos);
      // 선택된 메모가 1개 이상이면 batch 처리, 그렇지 않으면 기존 방식 사용
      if (selectedMemoIds.length > 1) {
        await batchArchiveMemos(selectedMemoIds, false);
      } else if (selectedMemoIds.length === 1) {
        await archiveMemo(selectedMemoIds[0], false);
      }
      // 선택 해제
      if (activeTab === 'archived') {
        useMemoBrowserStore.getState().setSelectedMemos(new Set());
      }
    } catch (error) {
      console.error("Error archiving memos:", error);
      alert("메모를 보관함으로 이동하는 중 오류가 발생했습니다.");
    }
  };


  // 선택된 메모들을 휴지통으로 이동
  const handleMoveSelectedMemosToTrash = async () => {
    try {
      const selectedMemoIds = Array.from(selectedMemos);
      // 선택된 메모가 1개 이상이면 batch 처리, 그렇지 않으면 기존 방식 사용
      if (selectedMemoIds.length > 1) {
        await batchMoveMemosToTrash(selectedMemoIds);
      } else if (selectedMemoIds.length === 1) {
        await moveMemoToTrash(selectedMemoIds[0]);
      }
      // 선택 해제
      useMemoBrowserStore.getState().setSelectedMemos(new Set());
    } catch (error) {
      console.error("Error moving memos to trash:", error);
      alert("메모를 휴지통으로 이동하는 중 오류가 발생했습니다.");
    }
  };

  // 선택된 메모들을 복원
  const handleRestoreSelectedMemos = async () => {
    try {
      const selectedMemoIds = Array.from(selectedMemos);
      // 선택된 메모가 1개 이상이면 batch 처리, 그렇지 않으면 기존 방식 사용
      if (selectedMemoIds.length > 1) {
        await batchRestoreMemosFromTrash(selectedMemoIds);
      } else if (selectedMemoIds.length === 1) {
        await restoreMemoFromTrash(selectedMemoIds[0]);
      }
      // 선택 해제
      useMemoBrowserStore.getState().setSelectedMemos(new Set());
    } catch (error) {
      console.error("Error restoring memos:", error);
      alert("메모를 복원하는 중 오류가 발생했습니다.");
    }
  };

  // 선택된 메모들을 영구 삭제
  const handlePermanentlyDeleteSelectedMemos = async () => {
    try {
      const selectedMemoIds = Array.from(selectedMemos);
      // 선택된 메모가 1개 이상이면 batch 처리, 그렇지 않으면 기존 방식 사용
      if (selectedMemoIds.length > 1) {
        await batchPermanentlyDeleteMemos(selectedMemoIds);
      } else if (selectedMemoIds.length === 1) {
        await permanentlyDeleteMemo(selectedMemoIds[0]);
      }
      // 선택 해제
      useMemoBrowserStore.getState().setSelectedMemos(new Set());
    } catch (error) {
      console.error("Error permanently deleting memos:", error);
      alert("메모를 영구 삭제하는 중 오류가 발생했습니다.");
    }
  };

  // 선택된 메모들을 공유 리스트에서 제거
  const handleRemoveSelectedFromSharedList = async () => {
    try {
      const selectedMemoIds = Array.from(selectedMemos);
      // 선택된 메모들을 공유 리스트에서 제거
      for (const memoId of selectedMemoIds) {
        await removeFromSharedList(memoId);
      }
      // 선택 해제
      useMemoBrowserStore.getState().setSelectedMemos(new Set());
    } catch (error) {
      console.error("Error removing memos from shared list:", error);
      alert("메모를 공유 리스트에서 제거하는 중 오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    setActiveMode('none');
  }, [activeTab, folderId])

  // 선택된 메모들이 모두 보관된 상태인지 확인
  const areAllSelectedMemosArchived = () => {
    if (selectedMemos.size === 0) return false;

    const selectedMemoIds = Array.from(selectedMemos);
    const allMemos = [...memos, ...archivedMemos, ...deletedMemos, ...sharedMemos];

    return selectedMemoIds.every(id => {
      const memo = allMemos.find(m => m.id === id);
      return memo && memo.isArchived;
    });
  };

  // 탭에 따라 다른 버튼 표시
  const renderActionButtons = () => {
    const allArchived = areAllSelectedMemosArchived();

    switch (activeTab) {
      case 'archived':
        return (
          <>
            <MemoActionButton
              onClick={handleUnarchiveSelectedMemos}
              icon={<ArchiveX className="w-4 h-4" />}
            >
              보관함 해제
            </MemoActionButton>
            <MemoActionButton
              onClick={handleMoveSelectedMemosToTrash}
              icon={<Trash2 className="w-4 h-4" />}
              variant="destructive"
            >
              휴지통 이동
            </MemoActionButton>
          </>
        );
      case 'trash':
        return (
          <>
            <MemoActionButton
              onClick={handleRestoreSelectedMemos}
              icon={<Undo2 className="w-4 h-4" />}
            >
              복원
            </MemoActionButton>
            <MemoActionButton
              onClick={handlePermanentlyDeleteSelectedMemos}
              icon={<Trash2 className="w-4 h-4" />}
              variant="destructive"
            >
              영구 삭제
            </MemoActionButton>
          </>
        );
      case 'shared':
        return (
          <MemoActionButton
            onClick={handleRemoveSelectedFromSharedList}
            icon={<ListX className="w-4 h-4" />}
            variant="destructive"
          >
            공유에서 제거
          </MemoActionButton>
        );
      default:
        return (
          <>
            {allArchived ? (
              <MemoActionButton
                onClick={handleUnarchiveSelectedMemos}
                icon={<ArchiveX className="w-4 h-4" />}
              >
                보관함 해제
              </MemoActionButton>
            ) : (
              <MemoActionButton
                onClick={handleArchiveSelectedMemos}
                icon={<Archive className="w-4 h-4" />}
              >
                보관함 이동
              </MemoActionButton>
            )}
            <MemoActionButton
              onClick={handleMoveSelectedMemosToTrash}
              icon={<Trash2 className="w-4 h-4" />}
              variant="destructive"
            >
              휴지통 이동
            </MemoActionButton>
          </>
        );
    }
  };

  return (
    <div className={`overflow-hidden ${activeMode === 'selection' ? 'slide-down' : 'hidden'}`}>
      <div className="flex flex-col justify-end px-4 pb-4 space-y-5" >
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-muted-foreground">
            <Check className='w-3 h-3 mr-1' />
            <span>{selectedMemos.size}개 선택됨</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleToggleSelectAllMemos}
              className="px-2 text-sm text-primary hover:underline"
            >
              {selectedMemos.size === filteredMemos.length ? "전체 해제" : "전체 선택"}
            </button>
          </div>
        </div>
        <div className={`flex items-center space-x-2 transition duration-150 ${(isProcessing || selectedMemos.size === 0) ? 'opacity-60 pointer-events-none' : ''}`}>
          {renderActionButtons()}
        </div>
      </div>
    </div>
  );
}