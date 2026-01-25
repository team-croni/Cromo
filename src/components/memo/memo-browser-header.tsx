import { SquareCheckBig, FolderRoot, ArrowLeftToLine, Plus, Search, ArrowLeft, X, Trash2, Trash, BrushCleaning } from "lucide-react";
import { useMemoBrowserStore } from '@store/memoBrowserStore';
import { TabSelect } from "@components/layout/tab-select";
import { useSearchParams, useRouter } from "next/navigation";
import { FolderEditTrigger } from "@components/modals/folder-edit-trigger";
import { useEffect, useState, useRef } from "react";
import { useMemos } from "@hooks/useMemos";
import { Ring } from "ldrs/react";

export function MemoBrowserHeader() {
  const {
    isCreatingMemo,
    setIsCreatingMemo,
    activeMode,
    toggleSelectionMode,
    filterOptions,
    toggleMemoBrowser,
    isSearchOpen,
    setIsSearchOpen,
    isSearchFocused,
  } = useMemoBrowserStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get('tab');
  const folderId = searchParams.get('folderId');
  const [initFolderId, setInitFolderId] = useState<string>();
  const { createMemo, deletedMemos, batchPermanentlyDeleteMemos } = useMemos();

  useEffect(() => {
    if (folderId) {
      setInitFolderId(folderId);
    } else if (tabParam) {
      setInitFolderId(undefined);
    }
    setIsSearchOpen(false);
  }, [folderId, tabParam])

  const handleCloseMemoBrowser = () => {
    toggleMemoBrowser();
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.delete('tab');
    newSearchParams.delete('folderId');
    router.replace(`?${newSearchParams.toString()}`, { scroll: false });
  };

  const handleCreateMemo = async () => {
    try {
      setIsCreatingMemo(true);
      const newMemo = await createMemo("새로운 메모", "", false, folderId !== 'root' ? folderId || null : null);
      if (newMemo) {
        // 메모 선택 처리
        // handleSelectMemo(newMemo); // 필요 시 추가
      }
    } catch (error) {
      console.error("Error creating new memo:", error);
    } finally {
      setIsCreatingMemo(false);
    }
  }

  // 휴지통 비우기 함수
  const handleEmptyTrash = async () => {
    if (!confirm('휴지통의 모든 메모를 영구 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    // 현재 휴지통에 있는 모든 메모 ID를 가져옴
    const deletedMemoIds = deletedMemos?.map(memo => memo.id) || [];

    if (deletedMemoIds.length === 0) {
      alert('휴지통이 이미 비어 있습니다.');
      return;
    }

    try {
      const success = await batchPermanentlyDeleteMemos(deletedMemoIds);
      if (success) {
        alert('휴지통이 비워졌습니다.');
      } else {
        alert('휴지통 비우기에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error emptying trash:', error);
      alert('휴지통 비우기에 실패했습니다.');
    }
  }

  const defaultFilters = {
    showArchived: true,
    sortBy: 'updatedAt' as const,
    sortDirection: 'desc' as const,
    showLiveShareTop: true,
    groupBy: 'none' as const,
    dateFrom: null,
    dateTo: null,
  };

  const isFilterModified =
    filterOptions.showArchived !== defaultFilters.showArchived ||
    filterOptions.sortBy !== defaultFilters.sortBy ||
    filterOptions.sortDirection !== defaultFilters.sortDirection ||
    filterOptions.showLiveShareTop !== defaultFilters.showLiveShareTop ||
    filterOptions.groupBy !== defaultFilters.groupBy ||
    filterOptions.dateFrom !== defaultFilters.dateFrom ||
    filterOptions.dateTo !== defaultFilters.dateTo;

  // 휴지통 또는 공유된 메모 탭인지 확인
  const isTrashOrSharedTab = tabParam === 'trash' || tabParam === 'shared';

  return (
    <>
      <div className="relative flex gap-3 items-center justify-between py-4 px-4 z-30 bg-background">
        {!isSearchOpen && <div className="flex items-center gap-2.5">
          {initFolderId ? (
            <div className="flex items-center text-lg font-semibold text-foreground">
              {initFolderId === 'root' ? (
                <>
                  <FolderRoot className="w-5 h-5 mr-2.5" />
                  Home
                </>
              ) : <FolderEditTrigger />
              }
            </div>
          ) : (
            <TabSelect />
          )}
        </div>
        }
        <div className="flex-1 flex justify-end items-center gap-1">
          {isSearchOpen ? (
            <div className="flex items-center w-full">
              {/* <SearchInput
                placeholder="메모 검색..."
                className={`flex-1`}
              />
              <button
                className={`p-1.75 rounded-lg text-foreground hover:bg-muted-foreground/5 ${isSearchFocused ? 'w-0 opacity-0 overflow-hidden pointer-events-none ml-0' : 'ml-1'}`}
                onClick={() => setIsSearchOpen(false)}
                aria-label="검색 닫기"
              >
                <X className="h-5.5 w-5.5" />
              </button> */}
              <div className={`flex justify-end transition-all overflow-hidden ${isSearchFocused ? 'w-0 ml-0 opacity-0 pointer-events-none' : 'w-9 ml-1'}`}>
                {/* <button
                  className={`shrink-0 p-2.25 rounded-lg text-foreground ${activeMode === 'filter'
                    ? "bg-primary"
                    : "hover:bg-muted-foreground/5"
                    }`}
                  title={activeMode === 'filter' ? "메모 필터 닫기" : "메모 필터"}
                  onClick={toggleFilterSection}
                >
                  <Filter className={`h-4.5 w-4.5 ${activeMode === 'filter' ? 'text-foreground' : isFilterModified ? 'text-primary' : ''}`} />
                </button> */}
                <button
                  className={`shrink-0 p-2.25 rounded-lg text-foreground ${activeMode === 'selection'
                    ? "bg-primary"
                    : "hover:bg-muted-foreground/5"
                    }`}
                  title={activeMode === 'selection' ? "선택 모드 종료" : "메모 선택"}
                  onClick={() => toggleSelectionMode()}
                >
                  <SquareCheckBig className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* 휴지통 또는 공유된 메모 탭에서는 메모 생성 버튼 표시 안 함 */}
              {!isTrashOrSharedTab && (
                <button
                  className={`p-2.25 rounded-lg text-foreground hover:bg-muted-foreground/5 disabled:pointer-events-none`}
                  title="메모 생성"
                  disabled={isCreatingMemo}
                  onClick={() => handleCreateMemo()}
                >
                  {isCreatingMemo ? (
                    <div className="w-4.5 h-4.5 flex items-center justify-center">
                      <Ring
                        size="18"
                        speed="2"
                        stroke={2}
                        color="var(--color-foreground)"
                        bgOpacity={0.2}
                      />
                    </div>
                  ) :
                    <Plus className="h-5.5 w-5.5 -m-0.5" />
                  }
                </button>
              )}
              {/* 휴지통 탭에서는 휴지통 비우기 아이콘 표시 */}
              {tabParam === 'trash' && (
                <button
                  className={`p-2.25 rounded-lg text-foreground hover:bg-muted-foreground/5`}
                  title="휴지통 비우기"
                  onClick={handleEmptyTrash}
                >
                  <BrushCleaning className="h-5 w-5 -m-px" />
                </button>
              )}
              <button
                className={`p-2.25 rounded-lg text-foreground ${activeMode === 'selection'
                  ? "bg-primary"
                  : "hover:bg-muted-foreground/5"
                  }`}
                title={activeMode === 'selection' ? "선택 모드 종료" : "메모 선택"}
                onClick={() => toggleSelectionMode()}
              >
                <SquareCheckBig className="h-4.5 w-4.5" />
              </button>
            </>
          )}
          <button
            className="flex items-center justify-center shrink-0 text-xs w-9 h-9 ml-1.5 border rounded-full text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 hover:bg-muted-foreground/5"
            title="메모 브라우저 닫기"
            onClick={handleCloseMemoBrowser}
          >
            <ArrowLeftToLine className="h-4 w-4 ml-0.5" />
          </button>
        </div>
      </div>
    </>
  );
}