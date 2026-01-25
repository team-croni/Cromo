import { create } from 'zustand';
import { Editor } from '@tiptap/react';
import { RefObject } from 'react';

interface EditorSaveState {
  isMarkdownMode: boolean;
  setIsMarkdownMode: (isMarkdownMode: boolean) => void;
  markdownContent: string;
  lastSaved: Date | null;
  setLastSaved: (lastSaved: Date | null) => void;
  currentMemoId: string | null;
  prevMemoIdRef: RefObject<string | null>,
  isInitializingRef: RefObject<boolean>,
  initialTitleRef: RefObject<string>,
  initialContentRef: RefObject<string>,
  saveTimeoutRef: RefObject<NodeJS.Timeout | null>,
  isUpdatingFromSocket: RefObject<boolean>,
  memoSaveStatesRef: RefObject<Map<string, {
    isSaving: boolean;
    title: string;
    content: string;
  }>>;
  pendingSaveRequests: RefObject<Map<string, {
    title: string;
    content: string;
  }>>;
  isSaving: boolean;
  setIsSaving: (isSaving: boolean) => void;
  setCurrentMemoId: (memoId: string | null) => void;
  setMarkdownContent: (markdownContent: string) => void;
}

export const useEditorSaveStore = create<EditorSaveState>((set) => ({
  markdownContent: "",
  lastSaved: null,
  setLastSaved: (lastSaved) => set({ lastSaved }),
  isMarkdownMode: false,
  setIsMarkdownMode: (isMarkdownMode) => set({ isMarkdownMode }),
  currentMemoId: null,
  prevMemoIdRef: { current: null },
  isInitializingRef: { current: false },
  initialTitleRef: { current: "" },
  initialContentRef: { current: "" },
  saveTimeoutRef: { current: null },
  isUpdatingFromSocket: { current: false },
  memoSaveStatesRef: { current: new Map() },
  pendingSaveRequests: { current: new Map() },
  isSaving: false,
  setIsSaving: (isSaving) => set({ isSaving }),
  setCurrentMemoId: (memoId: string | null) => set({ currentMemoId: memoId }),
  setMarkdownContent: (markdownContent: string) => set({ markdownContent }),
}));