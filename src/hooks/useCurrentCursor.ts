import { useSocketContext } from '@/contexts/SocketContext';
import { useState, useCallback, useEffect } from 'react';
import { CursorPosition, UserInfo } from '@/types';
import { useMemo as useMemoHook } from '@/hooks/useMemo';
import { useEditorStore } from '@/store/editorStore';

export const useCurrentCursor = () => {
  const { data: memoData } = useMemoHook();
  const currentMemoId = memoData?.id;
  const isLiveShareEnabled = memoData?.isLiveShareEnabled;

  const [hasTextSelection, setHasTextSelection] = useState(false);
  const { isConnected, socket, sendCursorMove, on, off } = useSocketContext();
  const { focusIndicatorPosition, setFocusIndicatorPosition, currentEditor: editor, isEditorFocused, setIsEditorFocused } = useEditorStore();
  const socketId = socket?.id;

  // Update the focus indicator position based on editor selection
  const updateFocusIndicatorPosition = useCallback(() => {
    if (!editor) {
      setFocusIndicatorPosition(null);
      return;
    }

    // Get current selection from editor state
    const { state } = editor;
    const { selection } = state;

    // Check if there's a selection
    const hasSelection = selection && !selection.empty;
    setHasTextSelection(hasSelection);

    if (selection) {
      const newPosition: CursorPosition = {
        anchor: selection.from,
        head: selection.to !== selection.from ? selection.to : undefined
      };

      // Only update if position changed
      if (focusIndicatorPosition?.anchor !== newPosition.anchor ||
        focusIndicatorPosition?.head !== newPosition.head) {
        setFocusIndicatorPosition(newPosition);
      }

      // Send cursor position to other users only if editor is focused, live share is enabled, and editor is editable
      if (isEditorFocused && currentMemoId && isConnected && isLiveShareEnabled && editor.isEditable) {
        sendCursorMove({
          memoId: currentMemoId,
          position: newPosition,
          userSocketId: socketId || ''
        });
      }
    } else {
      setFocusIndicatorPosition(null);

      // Send null position to other users
      if (isEditorFocused && currentMemoId && isConnected && isLiveShareEnabled && editor.isEditable) {
        sendCursorMove({
          memoId: currentMemoId,
          position: null,
          userSocketId: socketId || ''
        });
      }
    }
  }, [editor, currentMemoId, isConnected, isLiveShareEnabled, socketId, sendCursorMove, isEditorFocused, focusIndicatorPosition]);

  // Handle user joined event - send current cursor
  const handleUserJoined = useCallback((data: { userSocketId: string; userInfo: UserInfo; memoId: string }) => {
    if (data.memoId === currentMemoId && data.userSocketId !== socketId && isLiveShareEnabled && editor?.isEditable) {
      sendCursorMove({
        memoId: currentMemoId,
        position: focusIndicatorPosition,
        userSocketId: socketId || ''
      });
    }
  }, [currentMemoId, socketId, isLiveShareEnabled, sendCursorMove, focusIndicatorPosition, editor]);

  // Watch for selection changes
  useEffect(() => {
    if (editor?.state.selection) {
      updateFocusIndicatorPosition();
    }
  }, [editor, editor?.state.selection, updateFocusIndicatorPosition]);

  // Listen for user joined
  useEffect(() => {
    if (isLiveShareEnabled && currentMemoId) {
      on('user-joined', handleUserJoined);
      return () => {
        off('user-joined', handleUserJoined);
      };
    }
  }, [isLiveShareEnabled, currentMemoId, on, off, handleUserJoined]);

  // Handle editor focus
  const handleEditorFocus = useCallback(() => {
    setIsEditorFocused(true);
    // Trigger update to send cursor
    updateFocusIndicatorPosition();
  }, [setIsEditorFocused, updateFocusIndicatorPosition]);

  // Handle editor blur
  const handleEditorBlur = useCallback(() => {
    setIsEditorFocused(false);
    // Keep local position for UI if needed, but maybe clear for remote?
    // Actually, usually we want to show where we were last time.
    // But let's send null to others so they don't see a stuck cursor.
    if (currentMemoId && isConnected && isLiveShareEnabled) {
      sendCursorMove({
        memoId: currentMemoId,
        position: null,
        userSocketId: socketId || ''
      });
    }
  }, [currentMemoId, isConnected, isLiveShareEnabled, socketId, sendCursorMove, setIsEditorFocused]);

  return {
    focusIndicatorPosition,
    isEditorFocused,
    hasTextSelection,
    setFocusIndicatorPosition,
    updateFocusIndicatorPosition,
    handleEditorFocus,
    handleEditorBlur
  };
};