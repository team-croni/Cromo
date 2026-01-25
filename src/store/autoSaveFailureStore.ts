import { create } from 'zustand';

// 에러 타입 정의
export type AutoSaveErrorType = 'NETWORK_ERROR' | 'SERVER_ERROR' | 'UNKNOWN_ERROR';

interface AutoSaveFailureState {
  failedMemoIds: Set<string>;
  // 각 메모 ID별 에러 메시지와 에러 타입을 저장하는 Map 추가
  errorDetails: Map<string, { message: string; type: AutoSaveErrorType }>;
  isAutoSaveFailed: (memoId: string | null) => boolean;
  setAutoSaveFailed: (memoId: string, failed: boolean, errorMessage?: string, errorType?: AutoSaveErrorType) => void;
  clearAutoSaveFailure: (memoId: string) => void;
  clearAllAutoSaveFailures: () => void;
  // 특정 메모의 에러 메시지와 타입을 가져오는 함수 추가
  getErrorDetails: (memoId: string | null) => { message: string; type: AutoSaveErrorType } | null;
}

export const useAutoSaveFailureStore = create<AutoSaveFailureState>((set, get) => ({
  failedMemoIds: new Set<string>(),
  // 에러 상세 정보 Map 초기화
  errorDetails: new Map<string, { message: string; type: AutoSaveErrorType }>(),

  isAutoSaveFailed: (memoId) => {
    if (!memoId) return false;
    const result = get().failedMemoIds.has(memoId);
    return result;
  },

  setAutoSaveFailed: (memoId, failed, errorMessage, errorType) => {
    set((state) => {
      const newFailedIds = new Set(state.failedMemoIds);
      const newErrorDetails = new Map(state.errorDetails);

      if (failed) {
        newFailedIds.add(memoId);
        // 에러 메시지와 타입이 제공되면 저장
        if (errorMessage) {
          newErrorDetails.set(memoId, {
            message: errorMessage,
            type: errorType || 'UNKNOWN_ERROR'
          });
        }
      } else {
        newFailedIds.delete(memoId);
        // 실패 상태가 해제되면 에러 상세 정보도 제거
        newErrorDetails.delete(memoId);
      }

      return { failedMemoIds: newFailedIds, errorDetails: newErrorDetails };
    });
  },

  clearAutoSaveFailure: (memoId) => {
    set((state) => {
      const newFailedIds = new Set(state.failedMemoIds);
      const newErrorDetails = new Map(state.errorDetails);

      newFailedIds.delete(memoId);
      newErrorDetails.delete(memoId);

      return { failedMemoIds: newFailedIds, errorDetails: newErrorDetails };
    });
  },

  clearAllAutoSaveFailures: () => {
    set({
      failedMemoIds: new Set<string>(),
      errorDetails: new Map<string, { message: string; type: AutoSaveErrorType }>()
    });
  },

  // 특정 메모의 에러 상세 정보를 가져오는 함수
  getErrorDetails: (memoId) => {
    if (!memoId) return null;
    const result = get().errorDetails.get(memoId) || null;
    return result;
  }
}));