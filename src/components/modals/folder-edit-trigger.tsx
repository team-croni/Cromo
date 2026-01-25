import { useEffect, useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { Pencil } from 'lucide-react';
import { useFolders } from '@hooks/useFolders';
import { useSearchParams } from 'next/navigation';
import { useFolderEditModal } from '@hooks/useFolderEditModal';
import { Folder } from '@/types';

// 색상 이름에서 해당하는 Tailwind 색상 클래스 찾기
const getTextColorClass = (colorName: string): string => {
  const colorMap = {
    gray: 'text-gray-500',
    red: 'text-red-500',
    orange: 'text-orange-500',
    yellow: 'text-yellow-500',
    green: 'text-green-500',
    blue: 'text-blue-500',
    indigo: 'text-indigo-500',
    purple: 'text-purple-500',
    pink: 'text-pink-500',
    cyan: 'text-cyan-500',
    teal: 'text-teal-500',
    emerald: 'text-emerald-500',
  };

  return colorMap[colorName as keyof typeof colorMap] || 'text-gray-500';
};

export const FolderEditTrigger = () => {
  const [selectedFolder, setSelectedFolder] = useState<Folder | null | undefined>();
  const { folders } = useFolders();
  const { handleFolderEdit } = useFolderEditModal();
  const searchParams = useSearchParams();
  const folderId = searchParams.get('folderId');

  const SelectedIconComponent = (LucideIcons as any)[selectedFolder?.icon || 'Folder'] || LucideIcons.Folder;

  useEffect(() => {
    if (folderId && folderId !== 'root') {
      setSelectedFolder(folders.find(f => f.id === folderId));
    }
  }, [folderId, folders])

  const handleClick = () => {
    if (!selectedFolder) return;
    handleFolderEdit(selectedFolder);
  };

  if (!selectedFolder) {
    return null;
  }

  return (
    <div
      onClick={handleClick}
      className="group flex items-center cursor-pointer rounded-lg px-2 -ml-2 mr-auto"
    >
      <SelectedIconComponent className={`flex items-center justify-center w-9 h-9 p-2 -ml-2 mr-0 ${getTextColorClass(selectedFolder.color || 'yellow')}`} />
      <span className="mr-2.5">{selectedFolder.name}</span>
      <div className="group-hover:text-muted-foreground disabled:opacity-50 text-muted-foreground/50">
        <Pencil className="w-4 h-4" />
      </div>
    </div>
  );
}

FolderEditTrigger.displayName = 'FolderEditTrigger';
