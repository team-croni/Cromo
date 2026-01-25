import { useSession } from "next-auth/react";
import { useMemos } from "@/hooks/useMemos";
import { useMemoBrowserStore } from '@/store/memoBrowserStore';
import { useMemoHandlers } from "@/hooks/useMemoHandlers";
import { useFolders } from "@/hooks/useFolders";
import { MEMO_TEMPLATES } from "@/constants/templates";
import { useSearchParams } from "next/navigation";
import { useSidebarState } from "@hooks/use-sidebar-state";
import { NAV_ITEMS } from "@constants/nav-items";

export function useSidebarContext() {
  const { data: session, status } = useSession();
  const { memos, archivedMemos, deletedMemos, folderMemos, recentMemosLoading } = useMemos();
  const { isCreatingMemo, selectedTemplate, setIsCreatingMemo } = useMemoBrowserStore();
  const { handleSelectMemo } = useMemoHandlers();
  const { createMemo: createMemoAPI } = useMemos();
  const { folders, createFolder, updateFolder, deleteFolder, reorderFolder } = useFolders();
  const sidebarState = useSidebarState();
  const searchParams = useSearchParams();
  const folderId = searchParams.get('folderId');

  const handleCreateNewMemo = async () => {
    try {
      setIsCreatingMemo(true);
      const template = MEMO_TEMPLATES.find(t => t.id === selectedTemplate) || MEMO_TEMPLATES[0];

      const newMemo = await createMemoAPI(template.title, template.content, false, folderId || null);

      if (newMemo) {
        // 메모 선택 처리
        handleSelectMemo(newMemo);
      } else {
        console.error("Failed to create new memo");
      }
    } catch (error) {
      console.error("Error creating new memo:", error);
    } finally {
      setIsCreatingMemo(false);
    }
  };

  // 로그인 상태에 따라 네비게이션 항목 필터링
  const filteredNavItems = NAV_ITEMS.filter(item => {
    if (item.requiresAuth) {
      return status === "authenticated";
    }
    return true;
  });

  // 루트 메모 개수 계산 (폴더에 속하지 않은 메모들)
  // useMemos의 folderMemos는 현재 선택된 폴더 기준이므로, 전체 memos와 archivedMemos에서 필터링
  const allMemosCombined = [...(memos || []), ...(archivedMemos || [])];
  const rootMemoCount = allMemosCombined.filter(memo => memo.folderId === null).length;

  const handleCreateFolder = async () => {
    const folderName = "새 폴더";
    await createFolder(folderName, null);
  };

  return {
    // 상태
    session,
    status,
    memos,
    archivedMemos,
    deletedMemos,
    folderMemos,
    folders,
    loading: recentMemosLoading,
    isCreatingMemo,
    filteredNavItems,
    rootMemoCount,

    // 핸들러
    handleCreateNewMemo,
    handleCreateFolder,
    updateFolder,
    deleteFolder,
    reorderFolder,
    setIsCreatingMemo,

    // 사이드바 상태
    ...sidebarState,
  };
}