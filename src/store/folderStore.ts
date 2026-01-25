import { create } from 'zustand';
import { Folder } from '@/types';

interface FolderStore {
  folders: Folder[];
  selectedFolderId: string | null;
  expandedFolders: Set<string>;
  setFolders: (folders: Folder[]) => void;
  setSelectedFolderId: (id: string | null) => void;
  toggleFolder: (id: string) => void;
  expandFolder: (id: string) => void;
  collapseFolder: (id: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
}

export const useFolderStore = create<FolderStore>((set, get) => ({
  folders: [],
  selectedFolderId: null,
  expandedFolders: new Set(),
  setFolders: (folders) => set({ folders }),
  setSelectedFolderId: (id) => set({ selectedFolderId: id }),
  toggleFolder: (id) =>
    set((state) => {
      const newExpanded = new Set(state.expandedFolders);
      if (newExpanded.has(id)) {
        newExpanded.delete(id);
      } else {
        newExpanded.add(id);
      }
      return { expandedFolders: newExpanded };
    }),
  expandFolder: (id) =>
    set((state) => {
      // 이미 확장된 폴더는 다시 확장하지 않음
      if (state.expandedFolders.has(id)) {
        return {};
      }
      const newExpanded = new Set(state.expandedFolders);
      newExpanded.add(id);
      return { expandedFolders: newExpanded };
    }),
  collapseFolder: (id) =>
    set((state) => {
      const newExpanded = new Set(state.expandedFolders);
      newExpanded.delete(id);
      return { expandedFolders: newExpanded };
    }),
  expandAll: () =>
    set((state) => {
      const newExpanded = new Set(state.expandedFolders);
      state.folders.forEach((folder) => newExpanded.add(folder.id));
      return { expandedFolders: newExpanded };
    }),
  collapseAll: () => set({ expandedFolders: new Set() }),
}));