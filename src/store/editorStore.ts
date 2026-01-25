import { create } from 'zustand';
import { Editor } from '@tiptap/react';
import { RefObject } from 'react';
import { CursorPosition } from '@/types';

interface EditorState {
  currentEditor: Editor | null;
  title: string;
  setTitle: (title: string) => void;
  liveSharePermission: "readOnly" | "readWrite" | null;
  setLiveSharePermission: (permission: "readOnly" | "readWrite" | null) => void;
  setCurrentEditor: (editor: Editor | null) => void;
  editorContainerRef: RefObject<HTMLDivElement | null>;
  isLiveShareLoading: boolean;
  setIsLiveShareLoading: (isLoading: boolean) => void;
  allowedUsers: string[];
  setAllowedUsers: (users: string[]) => void;
  scrollY: number;
  setScrollY: (scrollY: number) => void;
  isEditorFocused: boolean;
  setIsEditorFocused: (isFocused: boolean) => void;
  focusIndicatorPosition: CursorPosition;
  setFocusIndicatorPosition: (position: CursorPosition) => void;
  isEditorReady: boolean;
  setIsEditorReady: (isReady: boolean) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  currentEditor: null,
  title: "",
  setTitle: (title: string) => set({ title }),
  liveSharePermission: null,
  setLiveSharePermission: (permission: "readOnly" | "readWrite" | null) => set({ liveSharePermission: permission }),
  setCurrentEditor: (editor: Editor | null) => set({ currentEditor: editor }),
  editorContainerRef: { current: null },
  isLiveShareLoading: false,
  setIsLiveShareLoading: (isLoading: boolean) => set({ isLiveShareLoading: isLoading }),
  allowedUsers: [],
  setAllowedUsers: (users: string[]) => set({ allowedUsers: users }),
  scrollY: 0,
  setScrollY: (scrollY: number) => set({ scrollY }),
  isEditorFocused: false,
  setIsEditorFocused: (isFocused: boolean) => set({ isEditorFocused: isFocused }),
  focusIndicatorPosition: null,
  setFocusIndicatorPosition: (position: CursorPosition) => set({ focusIndicatorPosition: position }),
  isEditorReady: false,
  setIsEditorReady: (isReady: boolean) => set({ isEditorReady: isReady }),
}));