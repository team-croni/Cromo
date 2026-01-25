import { useEffect, useRef, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Ring } from 'ldrs/react';
import { useMemos } from '@hooks/useMemos';
import { useMemoBrowserStore } from '@store/memoBrowserStore';
import { CircleCheckBig, CircleX, Plus } from 'lucide-react';
import { ContextMenu, ContextMenuOption } from '@components/ui/context-menu';

interface MemoListContainerProps {
  children: React.ReactNode;
  isLoading?: boolean;
  error?: string | null;
  isEmpty?: boolean;
  emptyMessage: string;
  onRetry?: () => void;
  memos?: any[]; // 메모 리스트 (전체 선택용)
}

export function MemoListContainer({
  children,
  isLoading = false,
  error = null,
  isEmpty = false,
  emptyMessage,
  onRetry,
  memos = []
}: MemoListContainerProps) {
  const [hasScrollbar, setHasScrollbar] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const folderId = searchParams.get('folderId');
  const { createMemo } = useMemos();
  const { toggleSelectionMode, toggleMemoSelection, selectedMemos } = useMemoBrowserStore();

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
  }, [searchParams, children]);

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

  return (
    <div className={`overflow-y-auto h-full scrollbar-full fade-in ${hasScrollbar ? 'pr-0' : ''}`} ref={scrollContainerRef} onContextMenu={handleContextMenu}>
      {children}
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