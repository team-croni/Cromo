"use client";

import { Memo, Tag } from '@/types';
import { convert } from 'html-to-text';
import { useMemoHandlers } from '@hooks/useMemoHandlers';
import { useMemoStore } from '@store/memoStore';
import { Archive, Ellipsis, Trash2, Undo2, ArchiveX, CircleCheckBig, Square, Radio, ListX, CircleX, FileText, Calendar } from 'lucide-react';
import { useState, memo, useEffect, useRef, useCallback } from 'react';
import { formatDate } from '@utils/dateUtils';
import { useParams, useSearchParams } from 'next/navigation';
import { useMemoBrowserStore } from '@store/memoBrowserStore';
import classNames from 'classnames';
import { useMemo } from '@hooks/useMemo';
import { Ring } from 'ldrs/react';
import { useSession } from 'next-auth/react';
import { ContextMenu, ContextMenuOption } from '@components/ui/context-menu';

interface MemoTagsProps {
  memo: Memo;
  initTabParams?: string;
  initFolderId?: string;
}

const MemoTags = ({ memo, initTabParams, initFolderId }: MemoTagsProps) => {
  // 태그 컨테이너 ref
  const tagContainerRef = useRef<HTMLDivElement>(null);
  const [visibleTagCount, setVisibleTagCount] = useState(3);

  // 태그 수를 동적으로 계산하는 효과
  useEffect(() => {
    if (!memo.tags || memo.tags.length === 0) {
      setVisibleTagCount(0);
      return;
    }

    // 미리 정의된 스타일 클래스에 대한 너비 캐싱
    const widthCache = new Map();

    const calculateVisibleTags = () => {
      if (!tagContainerRef.current) return;

      const container = tagContainerRef.current;
      const containerWidth = container.clientWidth;
      let totalWidth = 0;

      // Calculate the width of special tags (archived, live share) if they exist
      if (memo.isArchived && (initTabParams === 'recent' || initFolderId)) {
        const cacheKey = `archived_${initTabParams}_${initFolderId}`;
        let archivedWidth = widthCache.get(cacheKey);

        if (archivedWidth === undefined) {
          const archivedElement = document.createElement('span');
          archivedElement.className = "text-xs px-2 py-0.5 rounded bg-secondary/8 border border-secondary/18 text-secondary whitespace-nowrap flex-shrink-0";
          archivedElement.style.position = 'absolute'; // So it doesn't affect layout
          archivedElement.textContent = '보관함';
          document.body.appendChild(archivedElement);

          archivedWidth = archivedElement.offsetWidth + 6; // 6px for gap
          document.body.removeChild(archivedElement);
          widthCache.set(cacheKey, archivedWidth);
        }

        totalWidth += archivedWidth;
      }

      if (initTabParams === 'shared' || memo.isLiveShareEnabled) {
        const liveText = initTabParams === 'shared'
          ? (memo.isLiveShareEnabled ? 'LIVE ON' : 'LIVE OFF')
          : 'LIVE';
        const cacheKey = `live_${liveText}`;
        let liveWidth = widthCache.get(cacheKey);

        if (liveWidth === undefined) {
          const liveElement = document.createElement('span');
          liveElement.className = `text-xs px-2 py-0.5 rounded ${memo.isLiveShareEnabled ? 'text-destructive border-destructive/50' : 'text-muted-foreground/70'} whitespace-nowrap flex-shrink-0`;
          liveElement.style.position = 'absolute';
          liveElement.textContent = liveText;
          document.body.appendChild(liveElement);

          liveWidth = liveElement.offsetWidth + 6; // 6px for gap
          document.body.removeChild(liveElement);
          widthCache.set(cacheKey, liveWidth);
        }

        totalWidth += liveWidth;
      }

      let count = 0;

      // Calculate the width of each tag element
      for (let i = 0; i < memo.tags!.length; i++) {
        const tag = memo.tags![i];
        const cacheKey = `tag_${tag.name}`;
        let tagWidth = widthCache.get(cacheKey);

        if (tagWidth === undefined) {
          const tagElement = document.createElement('span');
          tagElement.className = "text-xs px-2 py-0.5 bg-blue-300/13 text-blue-300 rounded border border-transparent whitespace-nowrap flex-shrink-0";
          tagElement.style.position = 'absolute'; // So it doesn't affect layout
          tagElement.textContent = tag.name;
          document.body.appendChild(tagElement);

          tagWidth = tagElement.offsetWidth + 6; // 6px for gap
          document.body.removeChild(tagElement);
          widthCache.set(cacheKey, tagWidth);
        }

        if (totalWidth + tagWidth > containerWidth) {
          break;
        }

        totalWidth += tagWidth;
        count++;
      }

      // Check if we need to make room for the '+N' indicator
      if (count < memo.tags!.length && count > 0) {
        const plusText = `+${memo.tags!.length - count}`;
        const cacheKey = `plus_${plusText}`;
        let plusWidth = widthCache.get(cacheKey);

        if (plusWidth === undefined) {
          const plusElement = document.createElement('span');
          plusElement.className = "text-xs px-2 py-0.5 bg-muted-foreground/15 text-muted-foreground rounded border border-transparent whitespace-nowrap flex-shrink-0";
          plusElement.style.position = 'absolute';
          plusElement.textContent = plusText;
          document.body.appendChild(plusElement);

          plusWidth = plusElement.offsetWidth + 6;
          document.body.removeChild(plusElement);
          widthCache.set(cacheKey, plusWidth);
        }

        if (totalWidth + plusWidth > containerWidth) {
          count = Math.max(0, count - 1);
        }
      }

      setVisibleTagCount(count);
    };

    // Run calculation after component renders
    const timeoutId = setTimeout(calculateVisibleTags, 0);

    // Also set up a resize observer to recalculate when the container resizes
    let resizeObserver: ResizeObserver | null = null;
    if (typeof window !== 'undefined' && window.ResizeObserver && tagContainerRef.current) {
      resizeObserver = new ResizeObserver(calculateVisibleTags);
      resizeObserver.observe(tagContainerRef.current);
    }

    return () => {
      clearTimeout(timeoutId);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [memo.tags, memo.isArchived, memo.isLiveShareEnabled, initTabParams, initFolderId]);

  // 특별 태그 (보관함, LIVE 등) 먼저 수집
  const specialTags = [];
  if (memo.isArchived && (initTabParams === 'recent' || initFolderId)) {
    specialTags.push({ id: 'archived', name: '보관함', type: 'special' });
  }
  if (initTabParams === 'shared') {
    specialTags.push({ id: 'live', name: memo.isLiveShareEnabled ? 'LIVE ON' : 'LIVE OFF', type: 'special' });
  } else if (memo.isLiveShareEnabled) {
    specialTags.push({ id: 'live', name: 'LIVE', type: 'special' });
  }

  // 일반 태그는 동적으로 계산된 수량만큼만 표시
  const visibleNormalTags = memo.tags ? memo.tags.slice(0, visibleTagCount) : [];

  // 전체 표시할 태그들
  const visibleTags = [...specialTags, ...visibleNormalTags];

  // 숨겨야 할 태그 수 계산
  const hiddenCount = Math.max(0, (memo.tags ? memo.tags.length : 0) - visibleTagCount);

  return (
    <div
      ref={tagContainerRef}
      className="flex flex-nowrap gap-1.5 mt-3 overflow-x-auto no-scrollbar relative w-full"
      style={{ maxWidth: '100%', maxHeight: '24px' }}
    >
      {visibleTags.map((tag: any) => {
        if (tag.type === 'special') {
          return (
            <span
              key={tag.id}
              className={`text-xs px-2 py-0.5 rounded border ${tag.name.includes('LIVE') ? (tag.name === 'LIVE ON' || tag.name === 'LIVE' ? 'text-destructive border-destructive/50' : 'text-muted-foreground/70') : 'bg-secondary/8 border-secondary/18 text-secondary'} shrink-0 whitespace-nowrap`}
            >
              {tag.name}
            </span>
          );
        }
        return (
          <span
            key={tag.id}
            className="text-xs px-2 py-0.5 bg-blue-300/13 text-blue-300 rounded border border-transparent shrink-0 whitespace-nowrap"
          >
            {tag.name}
          </span>
        );
      })}
      {hiddenCount > 0 && (
        <span className="text-xs px-2 py-0.5 bg-muted-foreground/15 text-muted-foreground rounded border border-transparent shrink-0 whitespace-nowrap">
          +{hiddenCount}
        </span>
      )}
    </div>
  );
};

interface RecentlyUpdatedItemProps {
  memos: Memo[];
  memo: Memo;
  onSelect?: (memo: Memo) => void;
}

export const RecentlyUpdatedItem = memo(({
  memos,
  memo,
  onSelect,
}: RecentlyUpdatedItemProps) => {
  const {
    handleSelectMemo,
    handleToggleArchiveMemo,
    handleToggleLiveShareMemo,
    handleMoveMemoToTrash,
    handleRestoreMemoFromTrash,
    handlePermanentlyDeleteMemo,
    handleRemoveFromSharedList
  } = useMemoHandlers();
  const { processingMemos } = useMemoStore();
  const { data: memoData } = useMemo();
  const { activeMode, selectedMemos, toggleMemoSelection, toggleSelectionMode, isMultiDragging, setIsMultiDragging } = useMemoBrowserStore();
  const { data: session } = useSession();
  const [initTabParams, setInitTabParams] = useState<string>();
  const [initFolderId, setInitFolderId] = useState<string>();
  const dragPreviewRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const params = useParams();
  const urlMemoId = searchParams.get('id') || params.id as string;
  const tabParams = searchParams.get('tab');
  const folderId = searchParams.get('folderId');

  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });

  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (tabParams) {
      setInitTabParams(tabParams);
    }
    if (folderId) {
      setInitFolderId(folderId);
    }
  }, [tabParams, folderId])

  const isCurrentlySelected = (urlMemoId === memo.id || urlMemoId === memo.shareToken) && activeMode !== 'selection';

  const isSelected = selectedMemos.has(memo.id);
  const isProcessing = processingMemos.has(memo.id);

  const convertHtmlToText = (html: string): string => {
    if (html === '<p></p>' || html === '') return '내용 없음';
    return convert(html, {
      wordwrap: false,
      selectors: [
        { selector: 'a', options: { ignoreHref: true } },
        { selector: 'img', format: 'skip' },
      ],
    });
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const closeContextMenu = () => {
    setShowContextMenu(false);
  };

  const handleArchiveToggle = () => {
    closeContextMenu();
    handleToggleArchiveMemo(memo.id, memo.isArchived || false);
  };

  // 라이브 종료 핸들러
  const handleLiveShareToggle = async () => {
    closeContextMenu();
    handleToggleLiveShareMemo(memo.id, memo.isLiveShareEnabled || false);
  };


  const handleMoveToTrash = () => {
    closeContextMenu();
    handleMoveMemoToTrash(memo.id);
  };

  const handleRestoreFromTrash = () => {
    closeContextMenu();
    handleRestoreMemoFromTrash(memo.id);
  };

  const handlePermanentDelete = () => {
    closeContextMenu();
    handlePermanentlyDeleteMemo(memo.id);
  };

  // 드래그 시작 핸들러
  const handleDragStart = (e: React.DragEvent) => {
    // 처리 중이거나 삭제된 메모인 경우 드래그 불가
    if (isProcessing || memo.isDeleted) {
      e.preventDefault();
      return;
    }

    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';

    // 선택된 메모가 있고, 현재 드래그 중인 메모가 선택된 메모 중 하나라면 다중 드래그로 처리
    const isMultiDrag = activeMode === 'selection' && selectedMemos.has(memo.id);
    const draggingMemos = isMultiDrag
      ? memos.filter(m => selectedMemos.has(m.id))
      : [memo];

    // 다중 선택 드래그인 경우 전역 상태 업데이트
    if (isMultiDrag) {
      setIsMultiDragging(true);
    } else {
      setIsMultiDragging(false);
    }

    // 컴포넌트로 렌더링된 미리보기 요소 사용
    if (dragPreviewRef.current) {
      const previewText = draggingMemos.length > 1
        ? `${draggingMemos[0].title || '제목 없음'} 외 ${draggingMemos.length - 1}개`
        : (memo.title || '제목 없음');

      // 미리보기 텍스트 업데이트를 위해 DOM 직접 조작 (React 상태 업데이트보다 빠름)
      const textNode = dragPreviewRef.current.lastChild;
      if (textNode) {
        textNode.textContent = previewText;
      }

      e.dataTransfer.setDragImage(dragPreviewRef.current, dragPreviewRef.current.clientWidth / 2, dragPreviewRef.current.clientHeight / 2);
    }

    if (draggingMemos.length > 1) {
      const dragData = JSON.stringify({
        type: 'memos',
        items: draggingMemos.map(m => ({
          memoId: m.id,
          currentFolderId: m.folderId
        }))
      });
      e.dataTransfer.setData('application/cromo-memo', dragData);
      e.dataTransfer.setData('text/plain', `${draggingMemos.length}개의 메모`);
    } else {
      const dragData = JSON.stringify({
        type: 'memo',
        memoId: memo.id,
        currentFolderId: memo.folderId,
        title: memo.title
      });
      e.dataTransfer.setData('application/cromo-memo', dragData);
      e.dataTransfer.setData('text/plain', memo.title || '제목 없음');
    }
  };

  // 드래그 종료 핸들러
  const handleDragEnd = () => {
    setIsDragging(false);
    setIsMultiDragging(false);
  };

  const handleDrag = (e: React.DragEvent) => {
    if (e.clientX === 0 && e.clientY === 0) {
      setIsDragging(false);
      setIsMultiDragging(false);
    }
  };

  const handleItemClick = (e: React.MouseEvent) => {
    // Shift 키와 함께 클릭한 경우
    if (e.shiftKey && memoData) {
      e.stopPropagation();

      // 선택 모드가 아니면 활성화
      if (activeMode !== 'selection') {
        toggleSelectionMode();
      }

      // 현재 선택된 메모와 클릭한 메모 사이의 모든 메모 선택
      const currentIndex = memos.findIndex(m => m.id === memo.id);
      const selectedMemoIndex = memos.findIndex(m => m.id === (memoData as Memo).id);

      if (currentIndex !== -1 && selectedMemoIndex !== -1) {
        const startIndex = Math.min(currentIndex, selectedMemoIndex);
        const endIndex = Math.max(currentIndex, selectedMemoIndex);

        // 사이에 있는 모든 메모 선택 (이미 선택된 경우는 제외)
        for (let i = startIndex; i <= endIndex; i++) {
          if (!selectedMemos.has(memos[i].id) && toggleMemoSelection) {
            toggleMemoSelection(memos[i].id);
          }
        }
      }

      return;
    }

    // Command(Mac) 또는 Ctrl(Windows) 키와 함께 클릭한 경우
    if ((e.metaKey || e.ctrlKey)) {
      e.stopPropagation();

      // 선택 모드가 아니라면 선택 모드 활성화
      if (activeMode !== 'selection') {
        toggleSelectionMode();
        // 기존에 선택된 메모가 있다면 함께 선택
        if (memoData) {
          toggleMemoSelection((memoData as Memo).id);
        }
      }

      // 클릭한 메모 선택/해제
      toggleMemoSelection(memo.id);
      return;
    }

    // 선택 모드일 때는 선택 토글만 실행
    if (activeMode === 'selection' && toggleMemoSelection) {
      e.stopPropagation();
      toggleMemoSelection(memo.id);
    } else {
      // 일반 모드일 때는 메모 선택
      if (onSelect) {
        onSelect(memo);
      } else {
        handleSelectMemo(memo);
      }
    }
  };

  // 컨텍스트 메뉴 옵션 설정
  let contextMenuOptions: ContextMenuOption[] = [];

  if (initTabParams === 'shared') {
    // 공유 탭인 경우
    contextMenuOptions = [
      {
        label: isSelected ? '선택 해제' : '선택',
        icon: isSelected ? (
          <CircleX className="w-4 h-4" />
        ) : (
          <CircleCheckBig className='w-4 h-4' />
        ),
        action: () => {
          closeContextMenu();
          // 선택 모드가 아닌 경우, 먼저 선택 모드를 활성화
          if (activeMode !== 'selection') {
            toggleSelectionMode();
          }
          // 메모 선택 토글
          toggleMemoSelection(memo.id);
        },
      },
      {
        type: "separator" as const,
        label: ""
      },
      {
        label: '공유에서 제거',
        icon: <ListX className="w-4 h-4" />,
        action: () => {
          closeContextMenu();
          // 공유 리스트에서 제거하는 함수 호출
          handleRemoveFromSharedList(memo.id);
        },
        color: 'destructive'
      }
    ];
  } else if (initTabParams === 'trash') {
    // 휴지통 탭인 경우
    contextMenuOptions = [
      {
        label: isSelected ? '선택 해제' : '선택',
        icon: isSelected ? (
          <CircleX className="w-4 h-4" />
        ) : (
          <CircleCheckBig className='w-4 h-4' />
        ),
        action: () => {
          closeContextMenu();
          // 선택 모드가 아닌 경우, 먼저 선택 모드를 활성화
          if (activeMode !== 'selection') {
            toggleSelectionMode();
          }
          // 메모 선택 토글
          toggleMemoSelection(memo.id);
        },
      },
      {
        type: "separator" as const,
        label: ""
      },
      {
        label: '복원하기',
        icon: <Undo2 className="w-4 h-4 mb-1" />,
        action: handleRestoreFromTrash,
      },
      {
        type: "separator" as const,
        label: ""
      },
      {
        label: '영구 삭제',
        icon: <Trash2 className="w-4 h-4" />,
        action: handlePermanentDelete,
        color: 'destructive'
      }
    ];
  } else {
    // 일반 탭 또는 보관함 탭인 경우
    contextMenuOptions = [
      {
        label: isSelected ? '선택 해제' : '선택',
        icon: isSelected ? (
          <CircleX className="w-4 h-4" />
        ) : (
          <CircleCheckBig className='w-4 h-4' />
        ),
        action: () => {
          closeContextMenu();
          // 선택 모드가 아닌 경우, 먼저 선택 모드를 활성화
          if (activeMode !== 'selection') {
            toggleSelectionMode();
          }
          // 메모 선택 토글
          toggleMemoSelection(memo.id);
        },
      },
      {
        type: "separator" as const,
        label: ""
      },
      ...(!memo.isArchived && !memo.isDeleted
        ? [{
          label: '보관하기',
          icon: <Archive className="w-4 h-4" />,
          action: handleArchiveToggle,
        }]
        : []),
      ...(memo.isArchived && !memo.isDeleted
        ? [{
          label: '보관 해제',
          icon: <ArchiveX className="w-4 h-4" />,
          action: handleArchiveToggle,
        }]
        : []),
      ...(memo.isLiveShareEnabled
        ? [{
          label: '라이브 종료',
          icon: <Square className="w-4 h-4 p-0.5 fill-foreground" />,
          action: handleLiveShareToggle,
        }]
        : [{
          label: '라이브 시작',
          icon: <Radio className="w-4 h-4 fill-foreground" />,
          action: handleLiveShareToggle,
        }]),
      ...(!memo.isDeleted
        ? [
          {
            type: "separator" as const,
            label: ""
          },
          {
            label: '휴지통으로 이동',
            icon: <Trash2 className="w-4 h-4" />,
            action: handleMoveToTrash,
            color: 'destructive'
          }]
        : []),
    ];
  }

  return (
    <div
      data-testid="memo-item"
      className={classNames(
        'group flex flex-col relative h-38 select-none group-last:border-b-0',
        {
          'opacity-70 hover:opacity-100': activeMode === 'selection' && !isSelected,
          'bg-popover': activeMode === 'selection' && isSelected,
          'bg-sidebar text-foreground': isCurrentlySelected,
          'bg-popover/40 hover:bg-popover/80': !(isCurrentlySelected || (activeMode === 'selection' && isSelected)),
          'bg-popover/80': showContextMenu,
          'opacity-30': isDragging || (activeMode === 'selection' && isSelected && isMultiDragging),
          '': !isDragging && !isProcessing && !memo.isDeleted,
        }
      )}
      onClick={handleItemClick}
      onContextMenu={handleContextMenu}
      draggable={!isProcessing && !memo.isDeleted}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDrag={handleDrag}
      style={isProcessing ? { pointerEvents: 'none' } : {}}
    >
      <div className="flex px-3.5 pb-2 pt-3.5 items-center justify-between cursor-pointer">
        <div className="flex items-center">
          {initTabParams === 'shared' ? (
            <>
              <span className="text-xs text-secondary/50 whitespace-nowrap">
                {memo.user?.name}님의 메모입니다
              </span>
            </>
          ) : (
            <div className="flex items-center text-xs text-muted-foreground whitespace-nowrap">
              <Calendar className="w-3.5 h-3.5 mr-1.5 opacity-50" />
              {formatDate(memo.updatedAt)}
            </div>
          )}
        </div>
        {activeMode === 'selection' ? (
          <div
            className={`absolute right-3 top-3.5 flex items-center justify-center w-5 h-5 rounded-full border ${isSelected
              ? "border-foreground/50"
              : "border-popover-border"
              }`}
            onClick={(e) => {
              e.stopPropagation();
              toggleMemoSelection && toggleMemoSelection(memo.id);
            }}
          >
            <div className={`w-3 h-3 rounded-full bg-foreground/50 transition-all duration-75 ${isSelected ? 'scale-100' : 'scale-0'}`} />
          </div>
        ) : (
          <button
            className={`absolute right-1.5 top-1.5 opacity-0 hover:text-foreground p-1.5 rounded-full hover:bg-foreground/5 group-hover:opacity-100 ${showContextMenu ? 'opacity-100 bg-foreground/5 text-foreground' : 'text-muted-foreground'}`}
            onClick={(e) => {
              e.stopPropagation();
              handleContextMenu(e as any);
            }}
          >
            <Ellipsis className="h-5 w-5" />
          </button>
        )}
      </div>
      <div className="flex-1 px-3.5 pb-3.5 min-w-0 cursor-pointer">
        <div className="flex items-center">
          <p className="text-sm text-popover-foreground truncate">{memo.title || '제목 없음'}</p>
        </div>
        <div className="mt-1.5">
          <p className="text-xs text-muted-foreground leading-5 line-clamp-2 h-10">
            {session?.user?.id !== memo.userId && memo.userId && !memo.isLiveShareEnabled ? (
              <span className='text-muted-foreground/50'>실시간 공유가 종료된 메모입니다.</span>
            ) : (
              convertHtmlToText(memo.content)
            )}
          </p>
        </div>
        <MemoTags memo={memo} initTabParams={initTabParams} initFolderId={initFolderId} />
      </div>
      <ContextMenu
        dataTestid={`context-menu-${memo.id}`}
        isOpen={showContextMenu}
        x={contextMenuPosition.x}
        y={contextMenuPosition.y}
        options={contextMenuOptions}
        onClose={closeContextMenu}
      />
      <div className={`absolute top-0 bottom-0 left-0 right-0 flex justify-center items-center transition-all duration-150 ${isProcessing ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <div className='absolute top-0 left-0 w-full h-full bg-background/70' />
        <div className={`transition duration-150 ${isProcessing ? 'opacity-70' : 'opacity-0'}`}>
          <Ring
            size="28"
            speed="2"
            stroke={3}
            color="var(--color-foreground)"
            bgOpacity={0.2}
          />
        </div>
      </div>

      {/* 드래그 미리보기용 숨겨진 요소 */}
      <div
        ref={dragPreviewRef}
        className="absolute -top-2500 -left-2500 px-3 py-2 bg-inverse/70 text-foreground rounded-md text-xs pointer-events-none whitespace-nowrap z-50 w-auto flex items-center"
      >
        <FileText className="w-3 h-3 mr-1.5" />
        {memo.title || '제목 없음'}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (prevProps.memo === nextProps.memo)
});

RecentlyUpdatedItem.displayName = 'RecentlyUpdatedItem';