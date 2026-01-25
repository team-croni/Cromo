import { useCallback, useEffect } from 'react';
import { useEditorState } from '@tiptap/react';
import { useEditorToolbarStore } from '@/store/editorToolbarStore';
import { useActiveFormatting } from '@/utils/useActiveFormatting';
import { useSocketContext } from '@/contexts/SocketContext';
import { useMemo } from '@/hooks/useMemo';
import { useAICorrection } from '@/hooks/use-ai-correction';
import { useEditorStore } from '@/store/editorStore';
import { useEditorSave } from '@/hooks/useEditorSave';

export const useEditorToolbar = () => {
  const { currentEditor: editor } = useEditorStore();

  // AI correction 로직 (실제 editor 조작 담당)
  const {
    isAILoading: hookAILoading,
    hasAIGeneratedContent: hookHasAIGeneratedContent,
    aiLoadingMessage: hookAiLoadingMessage,
    correctionCount: hookCorrectionCount,
    currentCorrectionIndex: hookCurrentCorrectionIndex,
    handleAIStart: hookHandleAIStart,
    handleAIComplete: hookHandleAIComplete,
    handleAIFailed: hookHandleAIFailed,
    handleCorrectionsFound: hookHandleCorrectionsFound,
    handlePrevCorrection,
    handleNextCorrection,
    handleApplySingleCorrection,
    handleCancelSingleCorrection,
    handleRestoreContent,
    handleApplyContent
  } = useAICorrection();

  // Store에서 UI 상태들 가져오기
  const {
    isDisabledToolbarButton,
    hasUnsavedChanges,
    setAILoading,
    setAIGeneratedContent,
    setAICorrectionData,
    setDisabledToolbarButton,
    setUnsavedChanges,
    isCorrectionMode,
    previousContent,
  } = useEditorToolbarStore();

  const { liveSharePermission } = useEditorStore();

  const { isCurrentMemoSaving } = useEditorSave();

  // 기존 hook들
  const editorState = useEditorState(useActiveFormatting());
  const { effectiveIsConnected } = useSocketContext();
  const { data: memoData, isCurrentMemoOwner } = useMemo();

  // 동적으로 계산되는 상태들
  const calculatedIsDisabledToolbarButton = (!effectiveIsConnected || liveSharePermission === "readOnly") && !isCurrentMemoOwner;

  // 툴바 표시 여부 결정
  const shouldShowToolbar = !calculatedIsDisabledToolbarButton;

  // Event Handler
  const handleClick = useCallback((command: () => void) => {
    if (editor) {
      editor.commands.focus();
      command();
    }
  }, [editor]);

  // useAICorrection hook의 상태를 store에 동기화
  useEffect(() => {
    setAILoading(hookAILoading, hookAiLoadingMessage);
  }, [hookAILoading, hookAiLoadingMessage, setAILoading]);

  useEffect(() => {
    setAIGeneratedContent(hookHasAIGeneratedContent);
  }, [hookHasAIGeneratedContent, setAIGeneratedContent]);

  // store의 disabled 버튼 상태 업데이트
  useEffect(() => {
    setDisabledToolbarButton(calculatedIsDisabledToolbarButton);
  }, [calculatedIsDisabledToolbarButton, setDisabledToolbarButton]);

  // Store에 UI 상태 반영
  useEffect(() => {
    if (hasUnsavedChanges !== undefined) {
      setUnsavedChanges(hasUnsavedChanges);
    }
  }, [hasUnsavedChanges, setUnsavedChanges]);

  // AI 관련 핸들러들을 store와 동기화
  const handleAIStart = useCallback((message?: string) => {
    hookHandleAIStart(message);
    setAILoading(true, message || 'AI가 처리 중입니다...');
    setAIGeneratedContent(false);
  }, [hookHandleAIStart, setAILoading, setAIGeneratedContent]);

  const handleAIComplete = useCallback(() => {
    hookHandleAIComplete();
    setAILoading(false, '');
  }, [hookHandleAIComplete, setAILoading]);

  const handleAIFailed = useCallback(() => {
    hookHandleAIFailed();
    setAILoading(false, '');
  }, [hookHandleAIFailed, setAILoading]);

  const handleCorrectionsFound = useCallback((corrections: any[]) => {
    hookHandleCorrectionsFound(corrections);
    setAICorrectionData(corrections);
    setAILoading(false, '');
  }, [hookHandleCorrectionsFound, setAICorrectionData, setAILoading]);

  // 최종 반환 상태 (hook의 상태를 우선적으로 사용)
  return {
    // AI 관련 상태들 (hook에서 가져옴 - 실제 로직 담당)
    isAILoading: hookAILoading,
    hasAIGeneratedContent: hookHasAIGeneratedContent,
    aiLoadingMessage: hookAiLoadingMessage,
    correctionCount: hookCorrectionCount,
    currentCorrectionIndex: hookCurrentCorrectionIndex,

    // UI 관련 상태들 (store에서 가져옴)
    isDisabledToolbarButton,
    hasUnsavedChanges,
    isCorrectionMode,
    previousContent,
    isSaving: isCurrentMemoSaving(),

    // 계산된 상태들
    editorState,

    // 핸들러 함수들
    handleClick,

    // AI 관련 핸들러들 (동기화된 버전)
    onAIStart: handleAIStart,
    onAIComplete: handleAIComplete,
    onAIFailed: handleAIFailed,
    onCorrectionsFound: handleCorrectionsFound,
    onPrevCorrection: handlePrevCorrection,
    onNextCorrection: handleNextCorrection,
    onCancelSingleCorrection: handleCancelSingleCorrection,
    onApplySingleCorrection: handleApplySingleCorrection,
    onRestoreContent: handleRestoreContent,
    onApplyContent: handleApplyContent,

    // 유틸리티 함수들
    setUnsavedChanges,
    setDisabledToolbarButton,
    shouldShowToolbar, // 툴바 표시 여부 추가
  };
};