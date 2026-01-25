import { useFolderStore } from '@/store/folderStore';
import { useFolders } from "@/hooks/useFolders";
import { useMemos } from "@/hooks/useMemos";

export const useFolderHandlers = () => {
  const { folders, toggleFolder, expandFolder, setSelectedFolderId } = useFolderStore();
  const { refreshFolders } = useFolders();
  const { refreshMemos } = useMemos();

  const handleFolderSelect = (folderId: string | null) => {
    setSelectedFolderId(folderId);
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm("정말 이 폴더를 삭제하시겠습니까? 폴더 내부의 모든 메모도 함께 삭제됩니다.")) {
      return;
    }

    try {
      // 여기에 실제 폴더 삭제 로직을 구현해야 합니다.
      // 현재는 예시로 주석 처리합니다.
      /*
      const success = await deleteFolderAPI(folderId);

      if (success) {
        // 최신 데이터로 갱신
        refreshFolders();
        refreshMemos();

        alert("폴더가 성공적으로 삭제되었습니다!");
      } else {
        alert("폴더 삭제에 실패했습니다");
      }
      */
    } catch (error) {
      console.error("Error deleting folder:", error);
      alert("폴더 삭제 중 오류가 발생했습니다");
    }
  };

  return {
    folders,
    handleFolderSelect,
    handleDeleteFolder,
    refreshFolders,
    refreshMemos,
    toggleFolder,
    expandFolder
  };
};