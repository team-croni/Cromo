"use client";

import Link from "next/link";
import * as LucideIcons from "lucide-react";
import { FolderRoot, Plus, Pencil, Trash2, FolderPlus, Folder, FolderIcon } from "lucide-react";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Ring } from "ldrs/react";
import { useMemoBrowserStore } from "@store/memoBrowserStore";
import { useFolderEditModal } from "@hooks/useFolderEditModal";
import { useMemoMove } from "@hooks/useMemoMove";
import { useSidebarContext } from "@hooks/use-sidebar-context";
import { ContextMenu, ContextMenuOption } from "@components/ui/context-menu";
import { useIsMobile } from "@hooks/useMediaQuery";

export function FolderSection() {
  const router = useRouter();
  const {
    folders,
    memos,
    archivedMemos, // 추가: 보관된 메모 목록
    rootMemoCount,
    activeHref,
    isCollapsed,
    getHrefWithId,
    setIsOpen,
    handleCreateFolder,
    handleCreateNewMemo,
    deleteFolder,
    reorderFolder
  } = useSidebarContext();

  const isMobile = useIsMobile();

  // 모바일 환경에서는 isCollapsed 상태를 무시
  const actualIsCollapsed = isMobile ? false : isCollapsed;
  const { toggleMemoBrowser } = useMemoBrowserStore();
  const { handleFolderEdit } = useFolderEditModal();
  const { moveMemo, moveMemos, isMoving } = useMemoMove();

  // 컨텍스트 메뉴 상태
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    folder?: typeof folders[0];
  }>({ isOpen: false, x: 0, y: 0 });

  // 삭제 중 폴더 ID 상태
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);

  // 새 폴더 생성 중 상태
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  // 드래그 관련 상태
  const [draggedFolderId, setDraggedFolderId] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [dragOverInfo, setDragOverInfo] = useState<{ folderId: string | null, position: 'above' | 'below' | null }>({ folderId: null, position: null });
  const dragPreviewRef = useRef<HTMLDivElement>(null);
  const [draggedFolderData, setDraggedFolderData] = useState<{ title: string } | null>(null);

  // 컨텍스트 메뉴 열기
  const handleContextMenu = (event: React.MouseEvent, folder?: typeof folders[0]) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      isOpen: true,
      x: event.clientX,
      y: event.clientY,
      folder
    });
  };

  // 컨텍스트 메뉴 닫기
  const handleCloseContextMenu = () => {
    setContextMenu({ isOpen: false, x: 0, y: 0 });
  };

  // 드래그 시작
  const handleDragStart = (event: React.DragEvent, folder: typeof folders[0]) => {
    if (!isReordering) {
      setDraggedFolderId(folder.id);
      setDraggedFolderData({ title: folder.name });
      event.dataTransfer.effectAllowed = 'move';

      // 드래그 미리보기 텍스트 업데이트를 위해 DOM 직접 조작 (React 상태 업데이트보다 빠름)
      const textNode = dragPreviewRef.current?.lastChild;
      if (textNode && dragPreviewRef.current) {
        textNode.textContent = folder.name || '이름 없음';
      }

      // 드래그 이미지 설정
      if (dragPreviewRef.current) {
        event.dataTransfer.setDragImage(dragPreviewRef.current, dragPreviewRef.current.clientWidth / 2, dragPreviewRef.current.clientHeight / 2);
      }

      event.dataTransfer.setData('text/plain', folder.id);
    }
  };

  // 드래그 종료
  const handleDragEnd = () => {
    setDraggedFolderId(null);
    setDraggedFolderData(null);
    setDragOverInfo({ folderId: null, position: null });
  };

  // 드래그 오버 (드롭 가능 영역 표시) - 개별 폴더 아이템용
  const handleDragOver = (event: React.DragEvent, folderId: string) => {
    if (!isReordering) {
      event.preventDefault();
      event.stopPropagation();
      event.dataTransfer.dropEffect = 'move';
      const rect = event.currentTarget.getBoundingClientRect();
      const y = event.clientY - rect.top;
      const isAbove = y < rect.height / 2;
      setDragOverInfo({ folderId, position: isAbove ? 'above' : 'below' });
    }
  };

  // 드래그 오버 (nav 컨테이너용) - 빈 공간에서의 드롭 처리
  const handleNavDragOver = (event: React.DragEvent) => {
    if (!isReordering) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';

      const target = event.target as HTMLElement;
      const folderItem = target.closest('[data-folder-id]');

      // 폴더 아이템 위에서 드래그 중인 경우, 개별 handleDragOver가 처리하므로 여기서는 무시
      if (folderItem) {
        return;
      }

      const navRect = event.currentTarget.getBoundingClientRect();
      const mouseY = event.clientY;

      let foundPosition = false;

      // 루트 폴더 항목 처리
      const rootFolderElement = event.currentTarget.querySelector('[data-folder-id="root"]');
      if (rootFolderElement) {
        const rootRect = rootFolderElement.getBoundingClientRect();
        // 루트 폴더 위 (루트 폴더와 첫 번째 폴더 사이)
        if (mouseY < rootRect.top + rootRect.height / 2) {
          setDragOverInfo({ folderId: 'root', position: 'above' });
          foundPosition = true;
        } else if (mouseY < rootRect.bottom + 4) { // 루트 폴더 바로 아래 여백
          setDragOverInfo({ folderId: 'root', position: 'below' });
          foundPosition = true;
        }
      }

      if (!foundPosition) {
        for (let i = 0; i < rootFolders.length; i++) {
          const folder = rootFolders[i];
          const element = event.currentTarget.querySelector(`[data-folder-id="${folder.id}"]`);

          if (element) {
            const rect = element.getBoundingClientRect();
            const itemCenterY = rect.top + rect.height / 2;

            // 폴더 아이템 위 또는 폴더 사이의 여백
            if (mouseY < itemCenterY) {
              setDragOverInfo({ folderId: folder.id, position: 'above' });
              foundPosition = true;
              break;
            }
            // 마지막 폴더이고, 폴더 아래 여백에 있는 경우
            else if (i === rootFolders.length - 1 && mouseY > itemCenterY) {
              setDragOverInfo({ folderId: folder.id, position: 'below' });
              foundPosition = true;
              break;
            }
          }
        }
      }

      // 모든 폴더를 순회한 후에도 위치를 찾지 못했고, nav 영역 내에 있다면 마지막 폴더 아래로
      if (!foundPosition && rootFolders.length > 0 && mouseY > navRect.top && mouseY < navRect.bottom) {
        const lastFolder = rootFolders[rootFolders.length - 1];
        setDragOverInfo({ folderId: lastFolder.id, position: 'below' });
      } else if (!foundPosition && rootFolders.length === 0 && mouseY > navRect.top && mouseY < navRect.bottom) {
        // 폴더가 하나도 없고, nav 영역 내에 있다면 루트 아래로
        setDragOverInfo({ folderId: 'root', position: 'below' });
      } else if (!foundPosition) {
        // 유효한 드롭 위치가 아닌 경우 초기화
        setDragOverInfo({ folderId: null, position: null });
      }
    }
  };

  // 드래그 리브 (nav 컨테이너용)
  const handleNavDragLeave = (event: React.DragEvent) => {
    if (!isReordering) {
      // nav 영역을 완전히 벗어났는지 확인
      const relatedTarget = event.relatedTarget as HTMLElement;
      const currentTarget = event.currentTarget as HTMLElement;

      if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
        setDragOverInfo({ folderId: null, position: null });
      }
    }
  };

  // 메모 드롭 처리
  const handleMemoDrop = async (event: React.DragEvent, targetFolderId: string) => {
    try {
      const dragData = event.dataTransfer.getData('application/cromo-memo');
      if (!dragData) return false;
      const parsedData = JSON.parse(dragData);

      // 다중 메모 이동 처리
      if (parsedData.type === 'memos') {
        const items = parsedData.items as { memoId: string, currentFolderId: string | null }[];

        // 이동할 대상 메모 ID들 추출 (이미 같은 폴더에 있는 메모 제외)
        const memoIdsToMove = items
          .filter(item => item.currentFolderId !== targetFolderId)
          .map(item => item.memoId);

        if (memoIdsToMove.length === 0) {
          return true; // 이동할 필요가 없음
        }

        const success = await moveMemos({
          memoIds: memoIdsToMove,
          targetFolderId: targetFolderId === 'root' ? null : targetFolderId,
        });

        return success;
      }

      // 단일 메모 이동 처리
      if (parsedData.type !== 'memo') {
        return false;
      }

      const { memoId, currentFolderId } = parsedData;

      // 동일한 폴더로 이동하는 경우 무시
      if (currentFolderId === targetFolderId) {
        return true;
      }

      const success = await moveMemo({
        memoId,
        targetFolderId: targetFolderId === 'root' ? null : targetFolderId,
        currentFolderId,
      });

      return success;
    } catch (error) {
      console.error('Error handling memo drop:', error);
      return false;
    }
  };

  // 드롭 처리 - dragOverInfo 기반으로 위치 결정
  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();

    const memoData = event.dataTransfer.getData('application/cromo-memo');
    const { folderId: targetFolderId, position } = dragOverInfo;

    // 메모 드롭인지 확인
    if (memoData) {
      try {
        const dragData = JSON.parse(memoData);
        if (dragData.type === 'memo' || dragData.type === 'memos') {
          // 메모 드롭 처리
          await handleMemoDrop(event, targetFolderId || 'root');
          setDraggedFolderId(null);
          setDragOverInfo({ folderId: null, position: null });
          return;
        }
      } catch (e) {
        console.error('Failed to parse memo drop data', e);
      }
    }

    const draggedId = event.dataTransfer.getData('text/plain');

    // 드래그 정보가 없거나 자기 자신에게 드롭하는 경우
    if (!draggedId || !targetFolderId || draggedId === targetFolderId) {
      setDraggedFolderId(null);
      setDragOverInfo({ folderId: null, position: null });
      return;
    }

    // 루트 폴더 아래로 드롭하는 경우 - 맨 앞으로 이동
    if (targetFolderId === 'root' && position === 'below') {
      setIsReordering(true);
      try {
        await reorderFolder(draggedId, 0);
      } finally {
        setIsReordering(false);
        setDraggedFolderId(null);
        setDragOverInfo({ folderId: null, position: null });
      }
      return;
    }

    // 루트 폴더 자체에 드롭하는 경우 (위치 정보 없음)
    if (targetFolderId === 'root') {
      setDraggedFolderId(null);
      setDragOverInfo({ folderId: null, position: null });
      return;
    }

    // 폴더를 드래그한 경우 순서 변경
    const targetFolder = rootFolders.find(folder => folder.id === targetFolderId);
    if (targetFolder) {
      setIsReordering(true);
      try {
        const currentIndex = rootFolders.findIndex(folder => folder.id === draggedId);
        let targetIndex = rootFolders.findIndex(folder => folder.id === targetFolderId);

        // 드롭 위치에 따라 인덱스 조정
        if (position === 'below') {
          targetIndex = targetIndex + 1;
        }
        // 'above'인 경우 targetIndex 그대로 사용

        // 드래그된 폴더가 원래 위치에서 제거될 경우 인덱스 조정
        if (currentIndex < targetIndex) {
          targetIndex -= 1;
        }

        // 유효한 인덱스 범위 확인
        targetIndex = Math.max(0, Math.min(targetIndex, rootFolders.length - 1));

        if (currentIndex !== -1 && targetIndex !== -1 && currentIndex !== targetIndex) {
          await reorderFolder(draggedId, targetIndex);
        }
      } finally {
        setIsReordering(false);
        setDraggedFolderId(null);
        setDragOverInfo({ folderId: null, position: null });
      }
    } else {
      setDraggedFolderId(null);
      setDragOverInfo({ folderId: null, position: null });
    }
  };

  // 새 폴더 생성 함수 (로딩 상태 관리)
  const handleCreateFolderWithLoading = async () => {
    setIsCreatingFolder(true);
    try {
      await handleCreateFolder();
    } catch (error) {
      console.error('새 폴더 생성 중 오류가 발생했습니다:', error);
    } finally {
      setIsCreatingFolder(false);
    }
  };

  // 폴더 삭제 함수
  const handleDeleteFolder = async (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    const folderName = folder?.name || '이 폴더';

    // 사용자에게 삭제 확인 받기
    const confirmed = window.confirm(`"${folderName}" 폴더를 삭제하시겠습니까?\n\n삭제된 폴더의 메모들은 "루트" 폴더로 이동됩니다.`);

    if (!confirmed) {
      handleCloseContextMenu();
      return;
    }

    // 로딩 상태 시작
    setDeletingFolderId(folderId);
    handleCloseContextMenu();

    try {
      const success = await deleteFolder(folderId);
      if (success) {
        console.log('폴더가 성공적으로 삭제되었습니다:', folderId);
      } else {
        console.error('폴더 삭제에 실패했습니다');
        alert('폴더 삭제에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('폴더 삭제 중 오류가 발생했습니다:', error);
      alert('폴더 삭제 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      // 로딩 상태 종료
      setDeletingFolderId(null);
    }
  };

  // 새 메모 생성 함수 (folderId 직접 전달 지원)
  const handleCreateMemoForFolder = async (targetFolderId?: string) => {
    try {
      // URL 파라미터를 임시로 수정하여 특정 폴더에 메모 생성
      const currentUrl = new URL(window.location.href);
      const originalFolderId = currentUrl.searchParams.get('folderId');

      if (targetFolderId) {
        currentUrl.searchParams.set('folderId', targetFolderId);
        window.history.replaceState({}, '', currentUrl.toString());
      }

      await handleCreateNewMemo();

      // 원래 URL로 복원
      if (originalFolderId) {
        currentUrl.searchParams.set('folderId', originalFolderId);
      } else {
        currentUrl.searchParams.delete('folderId');
      }
      window.history.replaceState({}, '', currentUrl.toString());

    } catch (error) {
      console.error('메모 생성 중 오류가 발생했습니다:', error);
    }
  };

  // 컨텍스트 메뉴 옵션 생성
  const getContextMenuOptions = (folder?: typeof folders[0]): ContextMenuOption[] => {
    if (!folder) {
      // 루트 레벨 메뉴 (Home)
      return [
        {
          label: '새 폴더',
          icon: <FolderPlus className="w-4 h-4" />,
          action: () => {
            handleCreateFolderWithLoading();
            handleCloseContextMenu();
          }
        },
        {
          label: '새 메모',
          icon: <Plus className="w-5 h-5 -m-0.5" />,
          action: () => {
            handleCreateMemoForFolder(undefined);
            handleCloseContextMenu();
          }
        }
      ];
    }

    // 폴더별 메뉴
    return [
      {
        label: '새 메모',
        icon: <Plus className="w-5 h-5 -m-0.5" />,
        action: () => {
          handleCreateMemoForFolder(folder.id);
          handleCloseContextMenu();
        }
      },
      {
        label: '폴더 수정',
        icon: <Pencil className="w-4 h-4" />,
        action: () => {
          // 해당 폴더로 이동하여 memo-browser-header의 folder-edit 사용
          router.replace(`/memo?folderId=${folder.id}`);
          handleFolderEdit(folder);
          handleCloseContextMenu();
        }
      },
      {
        label: '',
        type: 'separator'
      },
      {
        label: '폴더 삭제',
        icon: <Trash2 className="w-4 h-4" />,
        action: () => handleDeleteFolder(folder.id),
        color: 'destructive'
      }
    ];
  };

  // 루트 레벨 폴더만 표시 (order로 정렬)
  const rootFolders = folders
    .filter(folder => folder.parentId === null)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // 폴더 아이콘 컴포넌트 가져오기
  const getFolderIcon = (folder: typeof folders[0]) => {
    const IconComponent = (LucideIcons as any)[folder.icon] || Folder;
    return IconComponent;
  };

  // 폴더 색상 클래스 가져오기
  const getTextColorClass = (colorName: string): string => {
    const colorMap: Record<string, string> = {
      'gray': 'text-gray-500',
      'red': 'text-red-500',
      'orange': 'text-orange-500',
      'yellow': 'text-yellow-500',
      'green': 'text-green-500',
      'blue': 'text-blue-500',
      'indigo': 'text-indigo-500',
      'purple': 'text-purple-500',
      'pink': 'text-pink-500',
      'cyan': 'text-cyan-500',
      'teal': 'text-teal-500',
      'emerald': 'text-emerald-500'
    };
    return colorMap[colorName] || 'text-gray-500';
  };

  const activeIsRoot = activeHref === '/memo?folderId=root';

  // 전체 메모 목록 (보관된 메모 포함)
  const allMemosCombined = [...(memos || []), ...(archivedMemos || [])];

  return (
    <>
      <div className="mx-3 mb-1 border-t border-popover-border" />
      {!actualIsCollapsed && <div className="px-5 py-2 overflow-hidden">
        <div className={`flex items-center justify-between ${actualIsCollapsed ? 'px-2' : ''}`}>
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium text-muted-foreground/70 whitespace-nowrap ${actualIsCollapsed ? 'hidden' : ''}`}>폴더 목록</span>
            {isReordering && (
              <div className="flex items-center justify-center w-3 h-3">
                <Ring size="12" speed="2" stroke={1.5} color="currentColor" bgOpacity={0.2} />
              </div>
            )}
          </div>
          <button
            onClick={handleCreateFolderWithLoading}
            disabled={isCreatingFolder}
            className="flex items-center -mr-1 px-2 py-1 text-sm whitespace-nowrap text-secondary/60 hover:text-secondary disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
            title="새 폴더 추가"
          >
            {isCreatingFolder ? (
              <div className='w-5 h-5 text-foreground '>
                <Ring size="12" speed="1.5" stroke={1.5} color="currentColor" bgOpacity={0.2} />
              </div>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 mr-0.5" />
                새 폴더
              </>
            )}
          </button>
        </div>
      </div>}
      <div
        className="flex-1 flex flex-col min-h-0"
        onContextMenu={(e) => {
          // 이 컨테이너에서 컨텍스트 메뉴 허용
          e.stopPropagation();
          handleContextMenu(e); // folder 없이 호출하여 루트 레벨 메뉴 표시
        }}
      >
        <div className={`flex-1 overflow-y-auto overflow-x-hidden scrollbar-full p-3 ${actualIsCollapsed ? 'pt-3' : 'pt-0'}`}>
          <nav
            className="pt-px pb-7 space-y-2 min-h-full"
            onContextMenu={(e) => handleContextMenu(e)}
            onDragOver={handleNavDragOver}
            onDragLeave={handleNavDragLeave}
            onDrop={handleDrop}
          >
            {/* 루트 메모 항목 */}
            <div
              data-folder-id="root"
              onContextMenu={(e) => handleContextMenu(e)}
              draggable={false}
              onDragOver={(e) => {
                if (!isReordering) {
                  e.preventDefault();
                  e.stopPropagation();
                  e.dataTransfer.dropEffect = 'move';
                  setDragOverInfo({ folderId: 'root', position: 'below' });
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleMemoDrop(e, 'root');
                setDragOverInfo({ folderId: null, position: null });
              }}
              onDragLeave={(e) => {
                if (!isReordering) {
                  const relatedTarget = e.relatedTarget as HTMLElement;
                  const currentTarget = e.currentTarget as HTMLElement;

                  if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
                    setDragOverInfo({ folderId: null, position: null });
                  }
                }
              }}
              className={`transition-transform duration-75 ${!draggedFolderId && dragOverInfo.folderId === 'root' ? 'hover:cursor-pointer outline outline-primary/70 rounded-lg outline-offset-0' : ''
                }`}
            >
              <Link
                href={getHrefWithId("/memo?folderId=root")}
                draggable={false}
                className={`flex items-center px-3 h-11 rounded-lg overflow-hidden ${activeIsRoot
                  ? "bg-primary text-primary-foreground"
                  : `hover:text-foreground hover:bg-muted-foreground/10 ${contextMenu.isOpen && !contextMenu.folder ? 'bg-muted-foreground/10 text-foreground' : 'text-muted-foreground  bg-popover active:bg-popover'}`
                  }`}
                onClick={() => {
                  setIsOpen(false);
                  toggleMemoBrowser(true);
                }}
              >
                <FolderRoot className="shrink-0 h-5 w-5" />
                <span className={`ml-3 text-sm whitespace-nowrap ${actualIsCollapsed ? 'hidden' : ''}`}>Home</span>
                {rootMemoCount > 0 && (
                  <span className={`ml-auto text-[0.625rem] text-center px-2 py-1 rounded font-medium fade-in ${activeIsRoot ? 'bg-foreground text-inverse' : 'bg-muted-foreground/10 text-muted-foreground'} ${actualIsCollapsed ? 'hidden' : ''}`}>
                    {rootMemoCount}
                  </span>
                )}
              </Link>
            </div>

            {/* 드래그 가능한 폴더 목록 */}
            {rootFolders.map((folder) => {
              const folderHref = `/memo?folderId=${folder.id}`;
              const hrefWithId = getHrefWithId(folderHref);
              const isActive = activeHref === folderHref;
              const isDeleting = deletingFolderId === folder.id;
              const IconComponent = getFolderIcon(folder);
              const folderMemoCount = allMemosCombined ? allMemosCombined.filter(m => m.folderId === folder.id).length : 0;

              return (
                <div key={folder.id} className="relative">
                  {dragOverInfo.folderId === folder.id && dragOverInfo.position === 'above' && draggedFolderId && (
                    <div className="absolute left-0 right-0 h-0.5 bg-primary rounded" style={{ top: '-4px' }} />
                  )}
                  <div
                    data-folder-id={folder.id}
                    onContextMenu={(e) => handleContextMenu(e, folder)}
                    onDragStart={(e) => handleDragStart(e, folder)}
                    onDragOver={(e) => handleDragOver(e, folder.id)}
                    onDrop={(e) => {
                      e.stopPropagation();
                      handleDrop(e);
                    }}
                    onDragEnd={handleDragEnd}
                    draggable={!isReordering}
                    className={`transition-transform duration-75
                      ${isDeleting || isReordering ? 'opacity-50 pointer-events-none' : ''}
                      ${draggedFolderId === folder.id ? 'opacity-50' : ''}
                      ${!draggedFolderId && dragOverInfo.folderId === folder.id ? 'hover:cursor-pointer outline outline-primary/70 rounded-lg outline-offset-0' : ''}
                    `}
                  >
                    <Link
                      href={hrefWithId}
                      draggable={!isDeleting && !isReordering}
                      className={`flex items-center px-3 h-11 rounded-lg overflow-hidden ${isActive
                        ? "bg-primary text-primary-foreground"
                        : isDeleting
                          ? "text-muted-foreground"
                          : `hover:text-foreground hover:bg-muted-foreground/10 ${contextMenu.folder === folder ? 'bg-muted-foreground/10 text-foreground' : 'text-muted-foreground  bg-popover active:bg-popover'}`
                        }`}
                      onClick={() => {
                        setIsOpen(false);
                        toggleMemoBrowser(true);
                      }}
                    >
                      {isDeleting ? (
                        <div className='w-5 h-5 text-foreground'>
                          <Ring
                            size="20"
                            speed="2"
                            stroke={2}
                            color="currentColor"
                            bgOpacity={0.2}
                          />
                        </div>
                      ) : (
                        <IconComponent className={`shrink-0 h-5 w-5 ${isActive ? 'text-primary-foreground' : getTextColorClass(folder.color)}`} />
                      )}
                      <span className={`ml-3 text-sm whitespace-nowrap ${actualIsCollapsed ? 'hidden' : ''}`}>
                        {isDeleting ? '삭제 중...' : folder.name}
                      </span>
                      {!isDeleting && folderMemoCount > 0 && (
                        <span className={`ml-auto text-[0.625rem] text-center px-2 py-1 rounded font-medium fade-in ${isActive ? 'bg-foreground text-inverse' : 'bg-muted-foreground/10 text-muted-foreground'} ${actualIsCollapsed ? 'hidden' : ''}`}>
                          {folderMemoCount}
                        </span>
                      )}
                    </Link>
                  </div>
                  {dragOverInfo.folderId === folder.id && dragOverInfo.position === 'below' && draggedFolderId && (
                    <div className="absolute left-0 right-0 h-0.5 bg-primary rounded" style={{ top: 'calc(100% + 4px)' }} />
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>

      {/* 컨텍스트 메뉴 */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
        options={getContextMenuOptions(contextMenu.folder)}
        onClose={handleCloseContextMenu}
      />

      {/* 드래그 미리보기용 숨겨진 요소 */}
      <div
        ref={dragPreviewRef}
        className="absolute -top-2500 -left-2500 px-3 py-2 bg-inverse/70 text-foreground rounded-md text-xs pointer-events-none whitespace-nowrap z-50 w-auto flex items-center"
      >
        <FolderIcon className="w-3 h-3 mr-1.5" />
        {draggedFolderData?.title || '이름 없음'}
      </div>
    </>
  );
}
