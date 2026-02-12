import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Ring } from 'ldrs/react';
import { useMemos } from '@hooks/useMemos';
import { useMemoBrowserStore } from '@store/memoBrowserStore';
import { CircleCheckBig, CircleX, Plus } from 'lucide-react';
import { ContextMenu, ContextMenuOption } from '@components/ui/context-menu';
import { useVirtualizer } from '@tanstack/react-virtual';
import { VirtualListItem } from '@utils/virtualListUtils';
import { RecentlyUpdatedItem } from './recently-updated-item';

interface MemoListContainerProps {
  children?: React.ReactNode;
  isLoading?: boolean;
  error?: string | null;
  isEmpty?: boolean;
  emptyMessage: string;
  onRetry?: () => void;
  memos?: any[]; // 메모 리스트 (전체 선택용)
  virtualItems?: VirtualListItem[]; // 가상 리스트용 아이템
}

export function MemoListContainer({
  children,
  isLoading = false,
  error = null,
  isEmpty = false,
  emptyMessage,
  onRetry,
  memos = [],
  virtualItems
}: MemoListContainerProps) {
  const [hasScrollbar, setHasScrollbar] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const folderId = searchParams.get('folderId');
  const memoId = searchParams.get('id');
  const { createMemo } = useMemos();
  const {
    toggleSelectionMode,
    toggleMemoSelection,
    selectedMemos,
    activeMode,
    scrollOffset,
    setScrollOffset
  } = useMemoBrowserStore();

  // 가상 리스트 설정
  const rowVirtualizer = useVirtualizer({
    count: virtualItems?.length ?? 0,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: useCallback((index: number) => {
      const item = virtualItems?.[index];
      if (item?.type === 'header') return 36;
      if (item?.type === 'memo') return 152;
      if (item?.type === 'spacer') return item.height ?? 0;
      return 152;
    }, [virtualItems]),
    overscan: 5,
  });

  // 스크롤 위치 복원 및 저장
  useEffect(() => {
    if (scrollContainerRef.current && scrollOffset > 0 && virtualItems && virtualItems.length > 0) {
      // 약간의 지연을 주어 레이아웃이 완료된 후 스크롤
      const timer = setTimeout(() => {
        rowVirtualizer.scrollToOffset(scrollOffset);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [virtualItems, scrollOffset, rowVirtualizer]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setScrollOffset(target.scrollTop);
  }, [setScrollOffset]);

  // 특정 메모로 스크롤 (URL에 id가 있을 때)
  useEffect(() => {
    if (memoId && virtualItems) {
      const index = virtualItems.findIndex(item => item.type === 'memo' && item.id === memoId);
      if (index !== -1) {
        rowVirtualizer.scrollToIndex(index, { align: 'center' });
      }
    }
  }, [memoId, virtualItems, rowVirtualizer]);

  // 스크롤바 존재 여부 확인
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const checkScrollbar = () => {
      setHasScrollbar(container.scrollHeight > container.clientHeight);
    };

    // 초기 체크 및 리사이즈 시 체크
    checkScrollbar();
    window.addEventListener('resize', checkScrollbar);

    // MutationObserver를 사용하여 컨텐츠 변경 시에도 체크
    const observer = new MutationObserver(checkScrollbar);
    observer.observe(container, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('resize', checkScrollbar);
      observer.disconnect();
    };
  }, [searchParams, children, virtualItems]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const closeContextMenu = () => {
    setShowContextMenu(false);
  };

  const handleCreateNewMemo = async () => {
    closeContextMenu();
    try {
      const newMemo = await createMemo("새로운 메모", "", false, folderId !== 'root' ? folderId || null : null);
      if (newMemo) {
        // 메모 선택 처리
        // handleSelectMemo(newMemo); // 필요 시 추가
      }
    } catch (error) {
      console.error("Error creating new memo:", error);
    }
  };

  const isAllSelected = memos.length > 0 && selectedMemos.size === memos.length;

  const handleSelectAll = () => {
    closeContextMenu();
    if (isAllSelected) {
      // 전체 선택 해제 및 선택 모드 해제
      toggleSelectionMode(false);
    } else {
      // 선택 모드 활성화 및 모든 메모 선택
      toggleSelectionMode(true);
      memos.forEach(memo => {
        if (!selectedMemos.has(memo.id)) {
          toggleMemoSelection(memo.id);
        }
      });
    }
  };

  const contextMenuOptions: ContextMenuOption[] = useMemo(() => [
    {
      label: '새로운 메모',
      icon: <Plus className="w-5 h-5 -m-0.5" />,
      action: handleCreateNewMemo,
    },
    {
      label: isAllSelected ? '전체 해제' : '전체 선택',
      icon: isAllSelected ? <CircleX className="w-4 h-4" /> : <CircleCheckBig className="w-4 h-4" />,
      action: handleSelectAll,
    },
  ], [isAllSelected, handleCreateNewMemo, handleSelectAll]);

  // 로딩 중
  if (isLoading) {
    return (
      <div className="p-3.5 h-full flex items-center justify-center">
        <div className={`absolute top-0 bottom-0 left-0 right-0 flex justify-center items-center transition-all duration-150`}>
          <div className="transition duration-150 opacity-70">
            <Ring
              size="28"
              speed="2"
              stroke={3}
              color="var(--color-foreground)"
              bgOpacity={0.2}
            />
          </div>
        </div>
      </div>
    );
  }

  // 에러 발생
  if (error) {
    return (
      <div className="p-3.5 h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-2">Error: {error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  // 데이터가 없는 경우
  if (isEmpty) {
    return (
      <div className="p-3.5 h-full flex items-center justify-center" onContextMenu={handleContextMenu}>
        <p className="text-muted-foreground">{emptyMessage}</p>
        <ContextMenu
          isOpen={showContextMenu}
          x={contextMenuPosition.x}
          y={contextMenuPosition.y}
          options={contextMenuOptions}
          onClose={closeContextMenu}
        />
      </div>
    );
  }

  const isVirtualized = virtualItems && virtualItems.length > 0;

  return (
    <div
      className={`overflow-y-auto h-full scrollbar-full fade-in ${hasScrollbar ? 'pr-0' : ''}`}
      ref={scrollContainerRef}
      onContextMenu={handleContextMenu}
      onScroll={handleScroll}
    >
      {isVirtualized ? (
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const item = virtualItems[virtualRow.index];
            const isHeader = item.type === 'header';

            // 그룹 스타일 계산
            let isFirstInCategory = false;
            let isLastInCategory = false;

            if (item.type === 'memo') {
              const prevItem = virtualItems[virtualRow.index - 1];
              const nextItem = virtualItems[virtualRow.index + 1];
              isFirstInCategory = !prevItem || prevItem.type === 'header';
              isLastInCategory = !nextItem || nextItem.type === 'header' || nextItem.type === 'spacer';
            }

            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={rowVirtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {isHeader ? (
                  <h3 className="bg-background text-sm font-regular text-muted-foreground/70 px-5 py-2 z-1">
                    {item.label}
                  </h3>
                ) : item.type === 'memo' ? (
                  <div className={`overflow-hidden mx-4 slide-up border-muted-foreground/20 ${isFirstInCategory ? 'rounded-t-lg border-t border-x mt-0' : ''} ${isLastInCategory ? 'rounded-b-lg border-x mb-4 border-b' : 'border-x border-b'} ${activeMode === 'selection' ? 'border-muted-foreground/50' : 'border-muted-foreground/20'} overflow-hidden`}>
                    <RecentlyUpdatedItem
                      memos={memos}
                      memo={item.data}
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        children
      )}
      <div className='h-40' />
      <ContextMenu
        isOpen={showContextMenu}
        x={contextMenuPosition.x}
        y={contextMenuPosition.y}
        options={contextMenuOptions}
        onClose={closeContextMenu}
      />
    </div>
  );
}