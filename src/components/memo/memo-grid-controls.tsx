import { useState, useRef, useEffect } from "react";
import { LayoutGrid, ArrowUpDown, ChevronDown, ArrowUpWideNarrow, ArrowDownWideNarrow, Search, Trash2, Archive, X, SquareCheckBig, Check, Undo2, ArchiveX, ListX } from "lucide-react";
import { useSearchParams } from 'next/navigation';
import { useHomeFilterStore } from "@/store/homeFilterStore";
import { useHybridSearch } from "@/hooks/useHybridSearch";
import { useMemoStore } from "@/store/memoStore";
import { SortDropdown } from "./sort-dropdown";
import { useMemos } from "@/hooks/useMemos";
import { useMemoBrowserStore } from "@/store/memoBrowserStore";
import { useMemoHandlers } from "@/hooks/useMemoHandlers";

export function MemoGridControls() {
  const { filterOptions, updateFilterOptions } = useHomeFilterStore();
  const { searchTerm } = useMemoStore();
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | undefined>(undefined);
  const sortButtonRef = useRef<HTMLButtonElement>(null);
  const { hybridSearchResults, isLoading } = useHybridSearch();
  const {
    memos,
    recentMemosLoading,
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

  const { activeMode, toggleSelectionMode, selectedMemos, setSelectedMemos } = useMemoBrowserStore();

  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'recent';

  useEffect(() => {
    if (isSortDropdownOpen && sortButtonRef.current) {
      const rect = sortButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        right: window.innerWidth - rect.right
      });
    }
  }, [isSortDropdownOpen]);

  const getSortLabel = () => {
    if (filterOptions.sortBy === 'updatedAt') {
      return '수정일순';
    } else if (filterOptions.sortBy === 'createdAt') {
      return '생성일순';
    } else if (filterOptions.sortBy === 'relevance') {
      return '정확도순';
    } else {
      return '제목순';
    }
  };

  const toggleSortDirection = () => {
    updateFilterOptions({
      sortDirection: filterOptions.sortDirection === 'desc' ? 'asc' : 'desc',
    });
  };

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

  const handleArchiveSelectedMemos = async () => {
    try {
      const selectedMemoIds = Array.from(selectedMemos);
      if (selectedMemoIds.length > 1) {
        await batchArchiveMemos(selectedMemoIds, true);
      } else if (selectedMemoIds.length === 1) {
        await archiveMemo(selectedMemoIds[0], true);
      }
      setSelectedMemos(new Set());
      toggleSelectionMode(false);
    } catch (error) {
      console.error("Error archiving memos:", error);
      alert("메모를 보관함으로 이동하는 중 오류가 발생했습니다.");
    }
  };

  const handleUnarchiveSelectedMemos = async () => {
    try {
      const selectedMemoIds = Array.from(selectedMemos);
      if (selectedMemoIds.length > 1) {
        await batchArchiveMemos(selectedMemoIds, false);
      } else if (selectedMemoIds.length === 1) {
        await archiveMemo(selectedMemoIds[0], false);
      }
      if (activeTab === 'archived') {
        setSelectedMemos(new Set());
        toggleSelectionMode(false);
      } else {
        setSelectedMemos(new Set());
        toggleSelectionMode(false);
      }
    } catch (error) {
      console.error("Error unarchiving memos:", error);
      alert("메모를 보관함에서 해제하는 중 오류가 발생했습니다.");
    }
  };

  const handleMoveSelectedMemosToTrash = async () => {
    if (!confirm(`${selectedMemos.size}개의 메모를 휴지통으로 이동하시겠습니까?`)) return;
    try {
      const selectedMemoIds = Array.from(selectedMemos);
      if (selectedMemoIds.length > 1) {
        await batchMoveMemosToTrash(selectedMemoIds);
      } else if (selectedMemoIds.length === 1) {
        await moveMemoToTrash(selectedMemoIds[0]);
      }
      setSelectedMemos(new Set());
      toggleSelectionMode(false);
    } catch (error) {
      console.error("Error moving memos to trash:", error);
      alert("메모를 휴지통으로 이동하는 중 오류가 발생했습니다.");
    }
  };

  const handleRestoreSelectedMemos = async () => {
    try {
      const selectedMemoIds = Array.from(selectedMemos);
      if (selectedMemoIds.length > 1) {
        await batchRestoreMemosFromTrash(selectedMemoIds);
      } else if (selectedMemoIds.length === 1) {
        await restoreMemoFromTrash(selectedMemoIds[0]);
      }
      setSelectedMemos(new Set());
      toggleSelectionMode(false);
    } catch (error) {
      console.error("Error restoring memos:", error);
      alert("메모를 복원하는 중 오류가 발생했습니다.");
    }
  };

  const handlePermanentlyDeleteSelectedMemos = async () => {
    if (!confirm(`${selectedMemos.size}개의 메모를 영구 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return;
    try {
      const selectedMemoIds = Array.from(selectedMemos);
      if (selectedMemoIds.length > 1) {
        await batchPermanentlyDeleteMemos(selectedMemoIds);
      } else if (selectedMemoIds.length === 1) {
        await permanentlyDeleteMemo(selectedMemoIds[0]);
      }
      setSelectedMemos(new Set());
      toggleSelectionMode(false);
    } catch (error) {
      console.error("Error permanently deleting memos:", error);
      alert("메모를 영구 삭제하는 중 오류가 발생했습니다.");
    }
  };

  const handleRemoveSelectedFromSharedList = async () => {
    if (!confirm(`${selectedMemos.size}개의 메모를 공유 리스트에서 제거하시겠습니까?`)) return;
    try {
      const selectedMemoIds = Array.from(selectedMemos);
      for (const memoId of selectedMemoIds) {
        await removeFromSharedList(memoId);
      }
      setSelectedMemos(new Set());
      toggleSelectionMode(false);
    } catch (error) {
      console.error("Error removing memos from shared list:", error);
      alert("메모를 공유 리스트에서 제거하는 중 오류가 발생했습니다.");
    }
  };

  const isSelectionMode = activeMode === 'selection';

  return (
    <div className="sticky top-0 flex flex-col gap-4 pb-2 pt-5 mb-2 bg-background/75 z-20 backdrop-blur-2xl">
      <div className="flex items-center justify-between max-w-4xl w-full mx-auto px-4 md:px-8 lg:px-8">

        {/* Left Side */}
        <div className="flex items-center gap-6">
          {isSelectionMode ? (
            <div className="flex items-center gap-2.5">
              <span className="flex items-center text-base text-muted-foreground">
                <Check className="w-5 h-5 mr-1.5 text-muted-foreground/70" />
                {selectedMemos.size > 0 ? `${selectedMemos.size}개 선택됨` : '메모를 선택해주세요'}
              </span>
            </div>
          ) : (
            searchTerm ? (
              <div className="flex items-center gap-2.5">
                <Search className="w-5 h-5 text-muted-foreground/70" />
                <h2 className="flex text-base text-foreground whitespace-nowrap">
                  <span className="font-semibold">
                    &apos;{searchTerm.length > 20 ? searchTerm.substring(0, 20) + '...' : searchTerm}&apos;
                  </span>에 대한 검색 결과
                </h2>
                {(hybridSearchResults.length > 0 && !isLoading) && (
                  <span className="text-muted-foreground font-normal whitespace-nowrap">
                    {hybridSearchResults.length}개
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <LayoutGrid className="w-5 h-5 text-muted-foreground/70" />
                <h2 className="text-base font-medium text-foreground">모든 메모</h2>
                {(memos.length > 0 && !recentMemosLoading) && (
                  <span className="text-muted-foreground font-normal">
                    {memos.length}개
                  </span>
                )}
              </div>
            )
          )}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          {isSelectionMode ? (
            <div className="flex items-center gap-1">
              {selectedMemos.size > 0 && (
                <>
                  {/* Tab-specific Action Buttons */}
                  {activeTab === 'archived' && (
                    <>
                      <button
                        onClick={handleUnarchiveSelectedMemos}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-foreground hover:bg-muted-foreground/5 rounded-lg"
                        title="보관함 해제"
                      >
                        <ArchiveX className="h-4 w-4" />
                        <span className="whitespace-nowrap hidden sm:inline">보관 해제</span>
                      </button>
                      <button
                        onClick={handleMoveSelectedMemosToTrash}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/5 rounded-lg"
                        title="휴지통 이동"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="whitespace-nowrap hidden sm:inline">삭제</span>
                      </button>
                    </>
                  )}

                  {activeTab === 'trash' && (
                    <>
                      <button
                        onClick={handleRestoreSelectedMemos}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-foreground hover:bg-muted-foreground/5 rounded-lg"
                        title="복원"
                      >
                        <Undo2 className="h-4 w-4" />
                        <span className="whitespace-nowrap hidden sm:inline">복원</span>
                      </button>
                      <button
                        onClick={handlePermanentlyDeleteSelectedMemos}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/5 rounded-lg"
                        title="영구 삭제"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="whitespace-nowrap hidden sm:inline">영구 삭제</span>
                      </button>
                    </>
                  )}

                  {activeTab === 'shared' && (
                    <button
                      onClick={handleRemoveSelectedFromSharedList}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/5 rounded-lg"
                      title="공유에서 제거"
                    >
                      <ListX className="h-4 w-4" />
                      <span className="whitespace-nowrap hidden sm:inline">공유 제거</span>
                    </button>
                  )}

                  {activeTab !== 'archived' && activeTab !== 'trash' && activeTab !== 'shared' && (
                    <>
                      {areAllSelectedMemosArchived() ? (
                        <button
                          onClick={handleUnarchiveSelectedMemos}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-foreground hover:bg-muted-foreground/5 rounded-lg"
                          title="보관함 해제"
                        >
                          <ArchiveX className="h-4 w-4" />
                          <span className="whitespace-nowrap hidden sm:inline">보관 해제</span>
                        </button>
                      ) : (
                        <button
                          onClick={handleArchiveSelectedMemos}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-foreground hover:bg-muted-foreground/5 rounded-lg"
                          title="보관함 이동"
                        >
                          <Archive className="h-4 w-4" />
                          <span className="whitespace-nowrap hidden sm:inline">보관</span>
                        </button>
                      )}
                      <button
                        onClick={handleMoveSelectedMemosToTrash}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/5 rounded-lg"
                        title="휴지통 이동"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="whitespace-nowrap hidden sm:inline">삭제</span>
                      </button>
                    </>
                  )}
                  <div className="w-px h-6.5 bg-border mx-1" />
                </>
              )}
              <button
                onClick={() => toggleSelectionMode(false)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-foreground hover:bg-muted-foreground/5 rounded-lg"
              >
                <X className="h-4 w-4" />
                <span className="whitespace-nowrap">취소</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              {/* 정렬 드롭다운 */}
              <div className="relative">
                <button
                  onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-foreground rounded-lg ${isSortDropdownOpen ? 'bg-muted-foreground/5' : 'hover:bg-muted-foreground/5'}`}
                  ref={sortButtonRef}
                >
                  <ArrowUpDown className="h-4 w-4" />
                  <span className="whitespace-nowrap">{getSortLabel()}</span>
                  <ChevronDown className={`h-3 w-3 transition-transform ${isSortDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <SortDropdown
                  isOpen={isSortDropdownOpen}
                  onClose={() => setIsSortDropdownOpen(false)}
                  position={dropdownPosition}
                />
              </div>

              {/* 정렬 방향 토글 */}
              <button
                onClick={toggleSortDirection}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-foreground hover:bg-muted-foreground/5 rounded-lg"
                title={filterOptions.sortDirection === 'desc' ? '오름차순으로 변경' : '내림차순으로 변경'}
              >
                {filterOptions.sortDirection === 'desc' ? (
                  <>
                    <ArrowDownWideNarrow className="h-4 w-4" />
                    <span className="whitespace-nowrap">내림차순</span>
                  </>
                ) : (
                  <>
                    <ArrowUpWideNarrow className="h-4 w-4" />
                    <span className="whitespace-nowrap">오름차순</span>
                  </>
                )}
              </button>

              <div className="w-px h-6.5 bg-border mx-1" />

              {/* 선택 모드 토글 */}
              <button
                onClick={() => toggleSelectionMode(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-foreground hover:bg-muted-foreground/5 rounded-lg"
                title="선택 모드"
              >
                <SquareCheckBig className="h-4 w-4" />
                <span className="whitespace-nowrap hidden sm:inline">선택 모드</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}