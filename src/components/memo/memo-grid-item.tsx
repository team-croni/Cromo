"use client";

import { Memo, Tag } from '@/types';
import { convert } from 'html-to-text';
import { formatDate } from '@utils/dateUtils';
import { useMemoHandlers } from '@hooks/useMemoHandlers';
import { useSession } from 'next-auth/react';
import { memo, useState, useRef, useEffect } from 'react';
import { Calendar, Ellipsis, Archive, Trash2, ArchiveX, FileText, CircleCheckBig, CircleX, Radio, Square } from 'lucide-react';
import { ContextMenu, ContextMenuOption } from '@components/ui/context-menu';
import classNames from 'classnames';
import { Ring } from 'ldrs/react';
import { useMemoStore } from '@store/memoStore';
import { extractContextAroundMatch, getHighlightTokens } from '@utils/searchHighlightUtils';
import { useMemoBrowserStore } from '@store/memoBrowserStore';

interface MemoGridItemProps {
  memo: Memo;
}

export const MemoGridItem = memo(({ memo: memoData }: MemoGridItemProps) => {
  const {
    handleSelectMemo,
    handleToggleArchiveMemo,
    handleMoveMemoToTrash,
    handleToggleLiveShareMemo
  } = useMemoHandlers();
  const { data: session } = useSession();
  const { processingMemos, searchTerm } = useMemoStore();
  const { activeMode, selectedMemos, toggleMemoSelection, toggleSelectionMode, isMultiDragging, setIsMultiDragging } = useMemoBrowserStore();
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [visibleTagCount, setVisibleTagCount] = useState(3); // Default to 3 tags
  const [isDragging, setIsDragging] = useState(false);
  const tagContainerRef = useRef<HTMLDivElement>(null);
  const dragPreviewRef = useRef<HTMLDivElement>(null);

  const isProcessing = processingMemos.has(memoData.id);
  const isSelected = selectedMemos.has(memoData.id);

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

  // 검색어가 있을 경우 검색어와 일치하는 내용만 표시
  const displayContent = (): string => {
    if (!searchTerm) {
      // 검색어가 없을 경우 기존 방식으로 텍스트 변환
      return session?.user?.id !== memoData.userId && memoData.userId && !memoData.isLiveShareEnabled ?
        '실시간 공유가 종료된 메모입니다.' :
        convertHtmlToText(memoData.content);
    }

    // 검색어가 있을 경우 검색어와 일치하는 부분 주위의 내용을 추출
    const plainTextContent = convertHtmlToText(memoData.content);
    if (plainTextContent === '내용 없음') {
      return plainTextContent;
    }

    return extractContextAroundMatch(plainTextContent, searchTerm, 100);
  };

  // 검색어가 있을 경우 하이라이트된 내용을 렌더링
  const renderHighlightedContent = () => {
    const contentToDisplay = displayContent();

    if (!searchTerm || contentToDisplay === '내용 없음' ||
      (session?.user?.id !== memoData.userId && memoData.userId && !memoData.isLiveShareEnabled)) {
      return contentToDisplay;
    }

    // 검색어가 포함된 내용에 대해 하이라이트 토큰을 생성하고 렌더링
    const tokens = getHighlightTokens(contentToDisplay, searchTerm);

    return (
      <span className="inline">
        {tokens.map((token, index) =>
          token.isHighlighted ? (
            <mark
              key={index}
              className="bg-yellow-200 dark:bg-black/50 text-foreground px-0.5 rounded-xs"
            >
              {token.text}
            </mark>
          ) : (
            <span key={index}>{token.text}</span>
          )
        )}
      </span>
    );
  };

  // 검색어가 있을 경우 하이라이트된 제목을 렌더링
  const renderHighlightedTitle = () => {
    if (!searchTerm) {
      return memoData.title || '제목 없음';
    }

    // 검색어가 포함된 제목에 대해 하이라이트 토큰을 생성하고 렌더링
    const tokens = getHighlightTokens(memoData.title || '제목 없음', searchTerm);

    return (
      <span className="inline">
        {tokens.map((token, index) =>
          token.isHighlighted ? (
            <mark
              key={index}
              className="bg-yellow-200 dark:bg-black/50 text-foreground px-0.5 rounded-xs"
            >
              {token.text}
            </mark>
          ) : (
            <span key={index}>{token.text}</span>
          )
        )}
      </span>
    );
  };

  // 검색어가 있을 경우 하이라이트된 태그를 렌더링
  const renderHighlightedTag = (tagName: string) => {
    if (!searchTerm) {
      return tagName;
    }

    // 검색어가 포함된 태그 이름에 대해 하이라이트 토큰을 생성하고 렌더링
    const tokens = getHighlightTokens(tagName, searchTerm);

    return (
      <span className="inline">
        {tokens.map((token, index) =>
          token.isHighlighted ? (
            <mark
              key={index}
              className="bg-yellow-200 dark:bg-black/50 px-0.5 text-foreground rounded-xs"
            >
              {token.text}
            </mark>
          ) : (
            <span key={index}>{token.text}</span>
          )
        )}
      </span>
    );
  };

  // Calculate how many tags can fit in the available space
  useEffect(() => {
    if (!memoData.tags || memoData.tags.length === 0) {
      setVisibleTagCount(0);
      return;
    }

    const calculateVisibleTags = () => {
      if (!tagContainerRef.current) return;

      const container = tagContainerRef.current;
      const containerWidth = container.clientWidth;
      let totalWidth = 0;
      let count = 0;

      // Calculate the width of the archived indicator if present
      if (memoData.isArchived) {
        const archivedElement = document.createElement('span');
        archivedElement.className = "text-[11px] px-2 py-0.5 rounded bg-secondary/8 border border-secondary/18 text-secondary whitespace-nowrap";
        archivedElement.style.position = 'absolute'; // So it doesn't affect layout
        archivedElement.textContent = '보관함';
        document.body.appendChild(archivedElement);

        totalWidth += archivedElement.offsetWidth + 6; // 6px for gap
        document.body.removeChild(archivedElement);
      }

      // Calculate the width of each tag element
      for (let i = 0; i < memoData.tags!.length; i++) {
        const tag = memoData.tags![i];
        const tagElement = document.createElement('span');
        tagElement.className = "text-[11px] px-2 py-0.5 bg-blue-300/13 text-blue-300 rounded border border-transparent whitespace-nowrap";
        tagElement.style.position = 'absolute'; // So it doesn't affect layout
        tagElement.textContent = tag.name;
        document.body.appendChild(tagElement);

        const tagWidth = tagElement.offsetWidth + 6; // 6px for gap
        document.body.removeChild(tagElement);

        if (totalWidth + tagWidth > containerWidth) {
          break;
        }

        totalWidth += tagWidth;
        count++;
      }

      if (count < memoData.tags!.length && count > 0) {
        const plusElement = document.createElement('span');
        plusElement.className = "text-[11px] px-2 py-0.5 bg-muted-foreground/15 text-muted-foreground rounded border border-transparent";
        plusElement.style.position = 'absolute';
        plusElement.textContent = `+${memoData.tags!.length - count}`;
        document.body.appendChild(plusElement);

        const plusWidth = plusElement.offsetWidth + 6;
        document.body.removeChild(plusElement);

        if (totalWidth + plusWidth > containerWidth) {
          count = Math.max(0, count - 1);
        }
      }

      setVisibleTagCount(count);
    };

    // Run calculation after component renders
    const timeoutId = setTimeout(calculateVisibleTags, 0);

    // Also set up a resize observer to recalculate when the window resizes
    let resizeObserver: ResizeObserver | null = null;
    if (typeof window !== 'undefined' && window.ResizeObserver && tagContainerRef.current) {
      resizeObserver = new ResizeObserver(calculateVisibleTags);
      resizeObserver.observe(tagContainerRef.current.parentElement!);
    }

    return () => {
      clearTimeout(timeoutId);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [memoData.tags, memoData.isArchived]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const closeContextMenu = () => {
    setShowContextMenu(false);
  };

  const handleClick = () => {
    handleSelectMemo(memoData);
  };

  const handleArchiveToggle = () => {
    closeContextMenu();
    handleToggleArchiveMemo(memoData.id, memoData.isArchived || false);
  };

  const handleMoveToTrash = () => {
    closeContextMenu();
    handleMoveMemoToTrash(memoData.id);
  };

  const handleLiveShareToggle = () => {
    closeContextMenu();
    handleToggleLiveShareMemo(memoData.id, memoData.isLiveShareEnabled || false);
  };

  const handleDragStart = (e: React.DragEvent) => {
    // 처리 중이거나 삭제된 메모인 경우 드래그 불가
    if (isProcessing || memoData.isDeleted) {
      e.preventDefault();
      return;
    }

    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';

    // 선택된 메모가 있고, 현재 드래그 중인 메모가 선택된 메모 중 하나라면 다중 드래그로 처리
    const isMultiDrag = activeMode === 'selection' && selectedMemos.has(memoData.id);
    const draggingMemos = isMultiDrag
      ? Array.from(selectedMemos).map(id => ({
        ...memoData,
        id
      }))
      : [memoData];

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
        : (memoData.title || '제목 없음');

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
        memoId: memoData.id,
        currentFolderId: memoData.folderId,
        title: memoData.title
      });
      e.dataTransfer.setData('application/cromo-memo', dragData);
      e.dataTransfer.setData('text/plain', memoData.title || '제목 없음');
    }
  };

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
    // Command(Mac) 또는 Ctrl(Windows) 키와 함께 클릭한 경우
    if ((e.metaKey || e.ctrlKey)) {
      e.stopPropagation();

      // 선택 모드가 아니라면 선택 모드 활성화
      if (activeMode !== 'selection') {
        toggleSelectionMode();
      }

      // 클릭한 메모 선택/해제
      toggleMemoSelection(memoData.id);
      return;
    }

    // 선택 모드일 때는 선택 토글만 실행
    if (activeMode === 'selection' && toggleMemoSelection) {
      e.stopPropagation();
      toggleMemoSelection(memoData.id);
    } else {
      // 일반 모드일 때는 메모 선택
      handleSelectMemo(memoData);
    }
  };

  const contextMenuOptions: ContextMenuOption[] = [
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
        toggleMemoSelection(memoData.id);
      },
    },
    {
      type: "separator" as const,
      label: ""
    },
    {
      label: memoData.isArchived ? '보관 해제' : '보관하기',
      icon: memoData.isArchived ? <ArchiveX className="w-4 h-4" /> : <Archive className="w-4 h-4" />,
      action: handleArchiveToggle,
    },
    {
      label: memoData.isLiveShareEnabled ? '라이브 종료' : '라이브 시작',
      icon: memoData.isLiveShareEnabled ? <Square className="w-4 h-4 p-0.5 fill-foreground" /> : <Radio className="w-4 h-4 fill-foreground" />,
      action: handleLiveShareToggle,
    },
    {
      type: "separator" as const,
      label: ""
    },
    {
      label: '휴지통으로 이동',
      icon: <Trash2 className="w-4 h-4" />,
      action: handleMoveToTrash,
      color: 'destructive'
    }
  ];

  return (
    <div
      onClick={handleItemClick}
      onContextMenu={handleContextMenu}
      draggable={!isProcessing && !memoData.isDeleted}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDrag={handleDrag}
      className={classNames(
        "group relative flex flex-col p-4 h-46 border cursor-pointer select-none rounded-xl overflow-hidden",
        {
          'bg-popover/40 hover:bg-popover/80 border-muted-foreground/10 hover:border-muted-foreground/18': !showContextMenu,
          'bg-popover/80 border-muted-foreground/18': showContextMenu,
          'opacity-30': isDragging || (activeMode === 'selection' && isSelected && isMultiDragging),
          'bg-popover/100 border-muted-foreground/40 hover:border-muted-foreground/40 hover:bg-popover/100': activeMode === 'selection' && isSelected,
        }
      )}
    >
      <div className="flex justify-between items-start relative mb-2">
        <div className={`flex items-center text-xs text-muted-foreground group-hover:opacity-100 ${showContextMenu ? 'opacity-100' : 'opacity-70'}`}>
          <Calendar className="w-4 h-4 mr-1.5 opacity-50" />
          {formatDate(memoData.updatedAt)}

        </div>

        <div className="flex items-center gap-1.5">

          <button
            className={`p-2 -m-1 -mt-2 -mr-2 rounded-full hover:bg-foreground/5 hover:text-foreground group-hover:opacity-100 ${showContextMenu ? 'opacity-100 bg-foreground/5 text-foreground' : 'opacity-0 text-muted-foreground'}`}
            onClick={(e) => {
              e.stopPropagation();
              handleContextMenu(e as any);
            }}
          >
            <Ellipsis className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-sm text-popover-foreground mb-2 line-clamp-1">
          {renderHighlightedTitle()}
        </h3>

        <p className="text-xs text-muted-foreground leading-5 line-clamp-3 h-15">
          {renderHighlightedContent()}
        </p>
      </div>

      <div
        ref={tagContainerRef}
        className="mt-3 border-muted-foreground/5 flex flex-nowrap gap-1.5 relative z-10 overflow-hidden"
        style={{ maxHeight: '24px' }} // Limit height to prevent wrapping
      >
        {memoData.isArchived && (
          <span className="text-[11px] px-2 py-0.5 rounded bg-secondary/8 border border-secondary/18 text-secondary whitespace-nowrap shrink-0">
            보관함
          </span>
        )}
        {memoData.isLiveShareEnabled && (
          <span className="text-[10px] px-2 py-0.5 rounded bg-transparent border border-destructive/50 text-destructive font-medium uppercase tracking-tight whitespace-nowrap shrink-0">
            LIVE
          </span>
        )}
        {memoData.tags && memoData.tags.length > 0 && (
          <>
            {memoData.tags.slice(0, visibleTagCount).map((tag: Tag) => (
              <span
                key={tag.id}
                className="text-[11px] px-2 py-0.5 bg-blue-300/13 text-blue-300 rounded border border-transparent whitespace-nowrap shrink-0"
              >
                {renderHighlightedTag(tag.name)}
              </span>
            ))}
            {memoData.tags.length > visibleTagCount && visibleTagCount > 0 && (
              <span className="text-[11px] px-2 py-0.5 bg-muted-foreground/15 text-muted-foreground rounded border border-transparent shrink-0">
                +{memoData.tags.length - visibleTagCount}
              </span>
            )}
          </>
        )}
        {(!memoData.tags || memoData.tags.length === 0) && !memoData.isArchived && !memoData.isLiveShareEnabled && (
          <div className="h-5 shrink-0" />
        )}
      </div>

      <div className={`absolute top-0 bottom-0 left-0 right-0 z-50 flex justify-center items-center transition-all duration-150 ${isProcessing ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <div className='absolute top-0 left-0 w-full h-full bg-background/70' />
        <div className={`transition duration-150 ${isProcessing ? 'opacity-100' : 'opacity-0'}`}>
          <Ring
            size="28"
            speed="2"
            stroke={3}
            color="var(--color-foreground)"
            bgOpacity={0.2}
          />
        </div>
      </div>

      <ContextMenu
        isOpen={showContextMenu}
        x={contextMenuPosition.x}
        y={contextMenuPosition.y}
        options={contextMenuOptions}
        onClose={closeContextMenu}
      />

      {/* 드래그 미리보기용 숨겨진 요소 */}
      <div
        ref={dragPreviewRef}
        className="absolute -top-2500 -left-2500 px-3 py-2 bg-inverse/70 text-foreground rounded-md text-xs pointer-events-none whitespace-nowrap z-50 w-auto flex items-center"
      >
        <FileText className="w-3 h-3 mr-1.5" />
        {memoData.title || '제목 없음'}
      </div>
    </div>
  );
});

MemoGridItem.displayName = 'MemoGridItem';