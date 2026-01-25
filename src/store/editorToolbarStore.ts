import { create } from 'zustand';

interface EditorToolbarState {
  // AI 관련 상태
  isAILoading: boolean;
  hasAIGeneratedContent: boolean;
  aiLoadingMessage: string;

  // AI 교정 관련 상태
  correctionCount: number;
  currentCorrectionIndex: number;
  previousContent: string;
  isCorrectionMode: boolean;

  // UI 상태
  isDisabledToolbarButton: boolean;
  hasUnsavedChanges: boolean;

  // AI 관련 액션
  setAILoading: (isAILoading: boolean, message?: string) => void;
  setAIGeneratedContent: (hasAIGeneratedContent: boolean) => void;
  setAICorrectionData: (corrections: any[]) => void;
  setCorrectionCount: (count: number) => void;
  setCurrentCorrectionIndex: (index: number) => void;
  setPreviousContent: (content: string) => void;
  setIsCorrectionMode: (isCorrectionMode: boolean) => void;
  setDisabledToolbarButton: (disabled: boolean) => void;
  setUnsavedChanges: (hasUnsavedChanges: boolean) => void;

  // AI 관련 핸들러 (외부에서 사용할 수 있도록 public)
  handleAIStart: (message?: string) => void;
  handleAIComplete: () => void;
  handleAIFailed: () => void;
  handleCorrectionsFound: (corrections: any[]) => void;
  handlePrevCorrection: () => void;
  handleNextCorrection: () => void;
  handleCancelSingleCorrection: () => void;
  handleApplySingleCorrection: () => void;
  handleRestoreContent: () => void;
  handleApplyContent: () => void;

  // 컴포넌트에서 사용할 수 있는 alias 함수들
  onAIStart: (message?: string) => void;
  onAIComplete: () => void;
  onAIFailed: () => void;
  onCorrectionsFound: (corrections: any[]) => void;
  onPrevCorrection: () => void;
  onNextCorrection: () => void;
  onCancelSingleCorrection: () => void;
  onApplySingleCorrection: () => void;
  onRestoreContent: () => void;
  onApplyContent: () => void;
}

export const useEditorToolbarStore = create<EditorToolbarState>()((set, get) => ({
  // 초기 상태
  isAILoading: false,
  hasAIGeneratedContent: false,
  aiLoadingMessage: '',
  correctionCount: 0,
  currentCorrectionIndex: 0,
  previousContent: '',
  isCorrectionMode: false,
  isDisabledToolbarButton: false,
  hasUnsavedChanges: false,

  // 상태 설정 함수들
  setAILoading: (isAILoading, message = '') =>
    set({ isAILoading, aiLoadingMessage: message }),

  setAIGeneratedContent: (hasAIGeneratedContent) =>
    set({ hasAIGeneratedContent }),

  setAICorrectionData: (corrections) =>
    set({
      correctionCount: corrections.length,
      currentCorrectionIndex: 0,
      hasAIGeneratedContent: true
    }),

  setCorrectionCount: (count) =>
    set({ correctionCount: count }),

  setCurrentCorrectionIndex: (index) =>
    set({ currentCorrectionIndex: index }),

  setPreviousContent: (content) =>
    set({ previousContent: content }),

  setIsCorrectionMode: (isCorrectionMode) =>
    set({ isCorrectionMode }),

  setDisabledToolbarButton: (disabled) =>
    set({ isDisabledToolbarButton: disabled }),

  setUnsavedChanges: (hasUnsavedChanges) =>
    set({ hasUnsavedChanges }),

  // AI 관련 핸들러들
  handleAIStart: (message = 'AI가 처리 중입니다...') => {
    set({
      isAILoading: true,
      aiLoadingMessage: message,
      hasAIGeneratedContent: false
    });
  },

  handleAIComplete: () => {
    set({ isAILoading: false, aiLoadingMessage: '' });
  },

  handleAIFailed: () => {
    set({ isAILoading: false, aiLoadingMessage: '' });
  },

  handleCorrectionsFound: (corrections) => {
    get().setAICorrectionData(corrections);
    get().setAILoading(false, '');
  },

  handlePrevCorrection: () => {
    const { currentCorrectionIndex, correctionCount } = get();
    if (currentCorrectionIndex > 0) {
      set({ currentCorrectionIndex: currentCorrectionIndex - 1 });
    }
  },

  handleNextCorrection: () => {
    const { currentCorrectionIndex, correctionCount } = get();
    if (currentCorrectionIndex < correctionCount - 1) {
      set({ currentCorrectionIndex: currentCorrectionIndex + 1 });
    }
  },

  handleCancelSingleCorrection: () => {
    // 현재 교정 항목 제거 로직
    const { currentCorrectionIndex, correctionCount } = get();
    if (correctionCount > 1) {
      set({
        correctionCount: correctionCount - 1,
        currentCorrectionIndex: Math.min(currentCorrectionIndex, correctionCount - 2)
      });
    } else {
      // 마지막 교정 항목이면 전체 복원
      get().handleRestoreContent();
    }
  },

  handleApplySingleCorrection: () => {
    // 현재 교정 항목 적용 로직
    get().handleNextCorrection();
  },

  handleRestoreContent: () => {
    set({
      hasAIGeneratedContent: false,
      correctionCount: 0,
      currentCorrectionIndex: 0
    });
  },

  handleApplyContent: () => {
    set({
      hasAIGeneratedContent: false,
      correctionCount: 0,
      currentCorrectionIndex: 0
    });
  },

  // Alias 함수들 (컴포넌트에서 더 직관적으로 사용하기 위해)
  onAIStart: (message?: string) => {
    get().handleAIStart(message);
  },

  onAIComplete: () => {
    get().handleAIComplete();
  },

  onAIFailed: () => {
    get().handleAIFailed();
  },

  onCorrectionsFound: (corrections: any[]) => {
    get().handleCorrectionsFound(corrections);
  },

  onPrevCorrection: () => {
    get().handlePrevCorrection();
  },

  onNextCorrection: () => {
    get().handleNextCorrection();
  },

  onCancelSingleCorrection: () => {
    get().handleCancelSingleCorrection();
  },

  onApplySingleCorrection: () => {
    get().handleApplySingleCorrection();
  },

  onRestoreContent: () => {
    get().handleRestoreContent();
  },

  onApplyContent: () => {
    get().handleApplyContent();
  },
}));
