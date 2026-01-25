import { create } from 'zustand';

export interface EditingFolder {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface FolderEditModalState {
  editingFolder: EditingFolder | null;

  // 상태 관리 함수들
  setEditingFolder: (folder: EditingFolder | null) => void;
  clearEditingFolder: () => void;
  updateEditingFolder: (updates: Partial<EditingFolder>) => void;
}

export const useFolderEditModalStore = create<FolderEditModalState>((set, get) => ({
  editingFolder: null,

  setEditingFolder: (folder) => {
    set({ editingFolder: folder });
  },

  clearEditingFolder: () => {
    set({ editingFolder: null });
  },

  updateEditingFolder: (updates) => {
    const { editingFolder } = get();
    if (editingFolder) {
      set({
        editingFolder: {
          ...editingFolder,
          ...updates,
        },
      });
    }
  },
}));