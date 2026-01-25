import { useState, useEffect } from "react";
import { Memo } from '@/types';
import { useMemos } from "@/hooks/useMemos";
import { useAutoSaveAttemptStore } from '@/store/autoSaveAttemptStore';
import { useAutoSaveFailureStore } from '@/store/autoSaveFailureStore';
import { useErrorDisplayStore } from '@/store/errorDisplayStore';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { autoSaveMaxRetries } from "@/constants/save";
import { memoService } from "@/services/memoService";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useEditorStore } from '@/store/editorStore';
import { getCleanHTMLForSave } from "@/utils/editorExtensions";
import { useEditorToolbarStore } from "@/store/editorToolbarStore";
import { useMemoCacheUpdate } from "@/hooks/useMemoCacheUpdate";
import { useSocketContext } from "@/contexts/SocketContext";
import { useCurrentCursor } from "@/hooks/useCurrentCursor";
import { useMemo as useMemoData } from "@/hooks/useMemo";
import { useEditorSaveStore } from "@/store/editorSaveStore";

export const useEditorSave = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: memoData } = useMemoData();
  const { title, setTitle, setIsLiveShareLoading } = useEditorStore();
  const { getAttemptCount, incrementAttemptCount, resetAttemptCount } = useAutoSaveAttemptStore();
  const { setAutoSaveFailed, clearAutoSaveFailure, isAutoSaveFailed } = useAutoSaveFailureStore();
  const { showError, hideError } = useErrorDisplayStore();
  const { deleteMemo: deleteMemoAPI, refreshMemos } = useMemos();
  const { currentEditor: editor, setAllowedUsers, setLiveSharePermission } = useEditorStore();
  const { setUnsavedChanges } = useEditorToolbarStore();
  const { updateMemoInCache } = useMemoCacheUpdate();
  const { isCurrentMemoOwner } = useMemoData();
  const { focusIndicatorPosition } = useCurrentCursor();

  const {
    setLastSaved,
    currentMemoId,
    setCurrentMemoId,
    prevMemoIdRef,
    initialTitleRef,
    initialContentRef,
    saveTimeoutRef,
    isUpdatingFromSocket,
    memoSaveStatesRef,
    pendingSaveRequests,
    isSaving,
    setIsSaving
  } = useEditorSaveStore();

  const {
    effectiveIsConnected,
    isConnected,
    sendMemoContentChange,
    sendOwnerLiveShareDisabled,
    sendOwnerLiveShareSettings,
  } = useSocketContext();

  const [isSaveSuccess, setIsSaveSuccess] = useState<boolean>(true);

  // Helper: Get save state for a memo
  const getMemoSaveState = (memoId: string | null) => {
    if (!memoId) return null;
    return memoSaveStatesRef.current.get(memoId);
  };

  // Helper: Set save state for a memo
  const setMemoSaveState = (memoId: string, state: { isSaving: boolean; title: string; content: string }) => {
    memoSaveStatesRef.current.set(memoId, state);
  };

  // Helper: Check if current memo is saving
  // We use the store's reactive isSaving for UI, but internal logic checks the ref for the specific memo to be safe,
  // or we can rely on the global isSaving if we assume one active editor.
  // For safety and UI sync, we'll return the store's isSaving.
  const isCurrentMemoSaving = () => isSaving;

  /**
   * Internal function to execute the save operation.
   * This function should NOT be called directly for auto-saving updates.
   * Use triggerAutoSave which handles queuing.
   */
  const executeSave = async (memoId: string | null, titleToSave: string, contentToSave: string, isAutoSave: boolean = true) => {
    if (!titleToSave) return;

    if (memoId) {
      setMemoSaveState(memoId, { isSaving: true, title: titleToSave, content: contentToSave });
    }
    // Update reactive state
    setIsSaving(true);

    try {
      let finalContent = contentToSave;
      const { isAILoading, hasAIGeneratedContent, isCorrectionMode } = useEditorToolbarStore.getState();
      if (isAILoading || (hasAIGeneratedContent && !isCorrectionMode)) {
        finalContent = initialContentRef.current || "";
      }

      if (memoId) {
        // --- UPDATE Existing Memo ---

        // Guard: Check permissions before saving to prevent 403 errors
        // Use getState() to get the most current permission, bypassing potential stale closures
        const currentLiveSharePermission = useEditorStore.getState().liveSharePermission;
        if (!isCurrentMemoOwner && memoData?.isLiveShareEnabled && currentLiveSharePermission === 'readOnly') {
          console.warn('[AutoSave] Save aborted: User has read-only permission');
          return;
        }

        const updatedMemo = await memoService.updateMemo({ id: memoId, title: titleToSave, content: finalContent });

        if (updatedMemo) {
          setLastSaved(new Date());
          resetAttemptCount(memoId);
          clearAutoSaveFailure(memoId);
          hideError();

          updateMemoInCache(updatedMemo);

          initialTitleRef.current = titleToSave;
          initialContentRef.current = finalContent;

          setIsSaveSuccess(true);
          updateHasUnsavedChanges(titleToSave);
        }
      } else {
        // --- CREATE New Memo ---
        const newMemo = await memoService.createMemo({ title: titleToSave, content: finalContent });

        if (newMemo) {
          setCurrentMemoId(newMemo.id);
          setLastSaved(new Date());
          resetAttemptCount(newMemo.id);
          clearAutoSaveFailure(newMemo.id);
          hideError();

          queryClient.setQueryData(['memo', newMemo.id], newMemo);
          queryClient.setQueryData<Memo[]>(['memos', 'recent'], (oldMemos = []) => [newMemo, ...oldMemos]);

          initialTitleRef.current = titleToSave;
          initialContentRef.current = finalContent;

          setIsSaveSuccess(true);
        }
      }
    } catch (error) {
      console.error(`[AutoSave] Error saving memo ${memoId}:`, error);

      if (memoId) {
        incrementAttemptCount(memoId);
        const attemptCount = getAttemptCount(memoId);
        const { errorType, errorMessage } = getErrorMessage(error);

        if (isAutoSave && attemptCount <= autoSaveMaxRetries) {
          // Re-queue the save
          triggerAutoSave(titleToSave, contentToSave);
        } else {
          showError(errorMessage, errorType);
          setAutoSaveFailed(memoId, true, errorMessage, errorType);

          if (errorType === 'NETWORK_ERROR' && isAutoSave) {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = setTimeout(() => {
              if (isAutoSaveFailed(memoId)) {
                triggerAutoSave(titleToSave, contentToSave);
              }
            }, 5000);
          }
          resetAttemptCount(memoId);
        }
      }
    } finally {
      if (memoId) {
        setMemoSaveState(memoId, { isSaving: false, title: titleToSave, content: contentToSave });
      }
      // Update reactive state - but check if more are pending first?
      // Actually, processSaveQueue will call executeSave which sets it to true again.
      // So setting false here is fine, it will flicker briefly or stay true if immediate next call.
      // To avoid flicker, we can check queue.
      if (memoId && pendingSaveRequests.current.has(memoId)) {
        // Don't set false, just process next
        processSaveQueue(memoId);
      } else {
        setIsSaving(false);
      }
    }
  };

  /**
   * Processes the pending save queue for a specific memo.
   */
  const processSaveQueue = (memoId: string) => {
    const nextRequest = pendingSaveRequests.current.get(memoId);
    if (nextRequest) {
      pendingSaveRequests.current.delete(memoId);
      executeSave(memoId, nextRequest.title, nextRequest.content, true);
    }
  };

  /**
   * Triggers an auto-save.
   */
  const triggerAutoSave = (changedTitle: string, content: string = "") => {
    // Note: We DO NOT clear saveTimeoutRef here anymore. 
    // This function is the *destination* of the timeout.

    if (!changedTitle) return;

    if (currentMemoId) {
      pendingSaveRequests.current.set(currentMemoId, { title: changedTitle, content });

      // Check fresh state directly to avoid stale closures in callbacks
      const currentIsSaving = useEditorSaveStore.getState().isSaving;

      // If not currently saving, start processing the queue
      if (!currentIsSaving) {
        processSaveQueue(currentMemoId);
      }
    } else {
      executeSave(null, changedTitle, content, true);
    }
  };

  const handleSave = async (changedTitle: string, content: string = "") => {
    triggerAutoSave(changedTitle, content);
  };

  // --- Other Helpers ---

  const handleDelete = async () => {
    if (!currentMemoId) throw new Error("No memo selected");
    const success = await deleteMemoAPI(currentMemoId);
    if (success) {
      resetAttemptCount(currentMemoId);
      refreshMemos();
      router.push('/memo');
    }
    return success;
  };

  const updateHasUnsavedChanges = (changedTitle?: string) => {
    if (!editor) return;
    const currentTitle = changedTitle !== undefined ? changedTitle : title;
    let currentContent = getCleanHTMLForSave(editor);

    const { isAILoading, hasAIGeneratedContent, isCorrectionMode } = useEditorToolbarStore.getState();
    if (isAILoading || (hasAIGeneratedContent && !isCorrectionMode)) {
      currentContent = initialContentRef.current || "";
    }

    const titleChanged = currentTitle !== initialTitleRef.current;
    const contentChanged = currentContent !== initialContentRef.current;
    setUnsavedChanges(changedTitle ? titleChanged || contentChanged : contentChanged);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    updateHasUnsavedChanges(newTitle);

    if (currentMemoId) {
      const cleanContent = editor ? getCleanHTMLForSave(editor) : "";

      if (effectiveIsConnected && !isUpdatingFromSocket.current) {
        sendMemoContentChange({
          memoId: currentMemoId,
          content: editor?.getHTML() || "",
          title: newTitle,
          cursorPosition: focusIndicatorPosition
        });
      }

      if (!isUpdatingFromSocket.current) {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

        if (initialTitleRef.current !== newTitle) {
          saveTimeoutRef.current = setTimeout(() => {
            const { isAILoading, hasAIGeneratedContent, isCorrectionMode } = useEditorToolbarStore.getState();
            const effectiveContent = (isAILoading || (hasAIGeneratedContent && !isCorrectionMode))
              ? (initialContentRef.current || "")
              : cleanContent;
            if (isCurrentMemoOwner || isConnected) {
              triggerAutoSave(newTitle, effectiveContent);
            }
          }, 1000);
        }

        if (memoData) {
          updateMemoInCache({ ...memoData, title: newTitle, content: cleanContent });
        }
      }
    }
  };

  const updateLiveShareSettings = async (settings: {
    isLiveShareEnabled?: boolean;
    liveShareMode?: "public" | "private";
    allowedUsers?: string[];
    liveSharePermission?: "readOnly" | "readWrite";
  }) => {
    if (!currentMemoId) return;
    if (memoData?.userId && !isCurrentMemoOwner) {
      alert('라이브 공유 설정은 메모 소유자만 변경할 수 있습니다.');
      return;
    }
    setIsLiveShareLoading(true);

    try {
      if (settings.isLiveShareEnabled !== false) {
        updateMemoInCache({ ...memoData!, ...settings });
      }

      const response = await fetch(`/api/memos/${currentMemoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update live share settings');
      }

      const updatedMemo = await response.json();

      if (settings.isLiveShareEnabled !== undefined) {
        if (settings.isLiveShareEnabled === false && isCurrentMemoOwner) {
          sendOwnerLiveShareDisabled({ memoId: currentMemoId });
          updateMemoInCache({ ...updatedMemo, isLiveShareEnabled: false });
        }
      }
      if (settings.allowedUsers) setAllowedUsers(settings.allowedUsers);
      if (settings.liveSharePermission) {
        setLiveSharePermission(settings.liveSharePermission);
        sendOwnerLiveShareSettings({ memoId: currentMemoId, settings });
      }

      return updatedMemo;
    } catch (error) {
      console.error('Error updating live share settings:', error);
      alert(`라이브 공유 설정 업데이트에 실패했습니다: ${(error as Error).message}`);
    } finally {
      setIsLiveShareLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [saveTimeoutRef]);

  return {
    saveTimeoutRef,
    triggerAutoSave,
    handleSave,
    isCurrentMemoSaving,
    handleDelete,
    deleteMemoAPI,
    getAttemptCount,
    isSaveSuccess,
    setIsSaveSuccess,
    updateHasUnsavedChanges,
    handleTitleChange,
    updateLiveShareSettings
  };
};