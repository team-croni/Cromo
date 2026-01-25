import { useFolders } from './useFolders';
import { useSearchParams } from 'next/navigation';
import { useFolderEditModalStore } from '@/store/folderEditModalStore';

export const useFolderEditModal = () => {
  const { folders, updateFolder } = useFolders();
  const searchParams = useSearchParams();
  const { editingFolder, setEditingFolder, clearEditingFolder } = useFolderEditModalStore();

  const folderId = searchParams.get('folderId');

  // 선택된 폴더 정보
  const selectedFolder = folderId && folderId !== 'root' ? folders.find(f => f.id === folderId) : null;

  const handleFolderEdit = (folder: { id: string; name: string; icon: string; color: string }) => {
    setEditingFolder(folder);
  };

  const handleCloseModal = () => {
    clearEditingFolder();
  };

  const handleUpdateFolder = async (folderId: string, name: string, icon: string, color: string) => {
    await updateFolder(folderId, name, icon, color);
  };

  // FolderEditModal에 필요한 props들
  const modalProps = {
    folder: editingFolder,
    isOpen: !!editingFolder,
    onClose: handleCloseModal,
    onUpdate: handleUpdateFolder,
  };

  return {
    modalProps,
    handleFolderEdit,
    handleCloseModal,
    handleUpdateFolder,
    selectedFolder,
    editingFolder,
    folderId,
  };
};
