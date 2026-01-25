import { useState, useEffect, useCallback, useMemo } from 'react';
import { UserInfo, CursorPosition } from '@/types';
import { useSession } from 'next-auth/react';
import { useSocketContext } from '@/contexts/SocketContext';
import { useMemo as useMemoHook } from '@/hooks/useMemo';
import { useEditorStore } from '@/store/editorStore';

type RemoteCursor = {
  position: CursorPosition;
  userSocketId: string;
  userId: string;
};

type GroupedRemoteCursors = Record<string, RemoteCursor[]>;

export const useRemoteCursors = () => {
  const { data: memoData } = useMemoHook();
  const currentMemoId = memoData?.id;
  const isLiveShareEnabled = memoData?.isLiveShareEnabled;
  const liveSharePermission = memoData?.liveSharePermission;

  const [remoteCursors, setRemoteCursors] = useState<Record<string, RemoteCursor>>({});
  const { existingUsers, on, off } = useSocketContext();
  const { data: session } = useSession();
  const sessionUserId = session?.user?.id;

  const { currentEditor } = useEditorStore();

  // Handler for cursor updates from other users
  const handleCursorUpdate = useCallback((data: {
    userSocketId: string;
    userId: string;
    position: CursorPosition;
    memoId: string
  }) => {
    // 읽기 전용 모드이거나 자신의 커서인 경우 무시
    if (liveSharePermission === 'readOnly' || data.userId === sessionUserId) return;

    if (data.memoId === currentMemoId) {
      setRemoteCursors(prev => ({
        ...prev,
        [data.userId]: {
          userSocketId: data.userSocketId,
          position: data.position,
          userId: data.userId
        }
      }));
    }
  }, [currentMemoId, sessionUserId, liveSharePermission]);

  // Handler for memo content updates (may contain cursor info)
  const handleMemoContentUpdate = useCallback((data: {
    userSocketId: string;
    userId: string;
    cursorPosition?: CursorPosition;
    memoId: string;
  }) => {
    // 읽기 전용 모드이거나 자신의 업데이트인 경우 무시
    if (liveSharePermission === 'readOnly' || data.userId === sessionUserId) return;

    if (data.memoId === currentMemoId && data.cursorPosition) {
      setRemoteCursors(prev => ({
        ...prev,
        [data.userId]: {
          userSocketId: data.userSocketId,
          position: data.cursorPosition!,
          userId: data.userId
        }
      }));
    }
  }, [currentMemoId, sessionUserId, liveSharePermission]);

  // Handler for user leaving
  const handleUserLeft = useCallback((data: {
    userId: string;
    memoId: string;
    userInfo: UserInfo
  }) => {
    if (data.memoId === currentMemoId) {
      setRemoteCursors(prev => {
        const newCursors = { ...prev };
        delete newCursors[data.userId];
        return newCursors;
      });
    }
  }, [currentMemoId]);

  // Handler for live share disabled
  const handleLiveShareDisabled = useCallback((data: { memoId: string }) => {
    if (data.memoId === currentMemoId) {
      setRemoteCursors({});
    }
  }, [currentMemoId]);

  // Clear cursors if Live Share is disabled, memo changes, or permission becomes read-only
  useEffect(() => {
    if (!isLiveShareEnabled || !currentMemoId || liveSharePermission === 'readOnly') {
      setRemoteCursors({});
    }
  }, [isLiveShareEnabled, currentMemoId, liveSharePermission]);

  // Setup socket listeners
  useEffect(() => {
    if (isLiveShareEnabled && currentMemoId) {
      on('cursor-update', handleCursorUpdate);
      on('memo-content-update', handleMemoContentUpdate);
      on('user-left', handleUserLeft);
      on('live-share-disabled', handleLiveShareDisabled);

      return () => {
        off('cursor-update', handleCursorUpdate);
        off('memo-content-update', handleMemoContentUpdate);
        off('user-left', handleUserLeft);
        off('live-share-disabled', handleLiveShareDisabled);
      };
    }
  }, [isLiveShareEnabled, currentMemoId, on, off, handleCursorUpdate, handleMemoContentUpdate, handleUserLeft, handleLiveShareDisabled]);

  // Group remote cursors by position for display
  const groupedRemoteCursors = useMemo(() => {
    // 읽기 전용 모드에서는 커서를 표시하지 않음
    if (liveSharePermission === 'readOnly') return {};

    const grouped: GroupedRemoteCursors = {};

    Object.values(remoteCursors).forEach(cursor => {
      // Validate cursor position against current document length
      if (cursor.position && currentEditor?.view?.state.doc) {
        const docLength = currentEditor.view.state.doc.content.size;
        // Skip if cursor position is beyond document length
        if (cursor.position.anchor > docLength) {
          return;
        }
        if (cursor.position.head !== undefined && cursor.position.head > docLength) {
          return;
        }
      }

      // Process all cursors including those with null positions
      // For null positions, we'll use a special key
      const key = cursor.position
        ? `${cursor.position.anchor}-${cursor.position.head || cursor.position.anchor}`
        : `null-${cursor.userId}`;

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(cursor);
    });

    return grouped;
  }, [remoteCursors, currentEditor]);

  // Get user info for a remote cursor
  const getUserInfo = useCallback((userId: string) => {
    const userInfo = existingUsers.find(user => user.id === userId);
    return userInfo;
  }, [existingUsers]);

  return {
    remoteCursors,
    groupedRemoteCursors,
    getUserInfo
  };
};