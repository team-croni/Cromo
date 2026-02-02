import { useEditorToolbar } from "@hooks/use-editor-toolbar";
import { useMemo } from "@hooks/useMemo";
import { useAutoSaveAttemptStore } from "@store/autoSaveAttemptStore";
import { useAutoSaveFailureStore } from "@store/autoSaveFailureStore";
import { LoaderCircle, AlertCircle } from "lucide-react";
import { memo } from "react";

// 저장 상태 표시를 위한 컴포넌트
export const SaveStatusIndicator = memo(() => {
  const { data: memoData, isCurrentMemoOwner } = useMemo();
  const { } = useMemo();
  const { getAttemptCount } = useAutoSaveAttemptStore();
  const { isAutoSaveFailed } = useAutoSaveFailureStore();
  const { isSaving } = useEditorToolbar();
  const isAutoSaveFailedBool = isAutoSaveFailed(memoData?.id || null);
  const retryCount = getAttemptCount(memoData?.id || null);
  const retryCountText = retryCount > 1 ? ` (${retryCount - 1})` : "";

  if (memoData.isLiveShareEnabled && !isCurrentMemoOwner) return null;

  if (isAutoSaveFailedBool) {
    const displayErrorMessage = "저장 실패";

    return (
      <div className="ml-auto flex items-center text-xs pr-2 text-destructive">
        <p className="text-nowrap fade-in">
          {displayErrorMessage}
        </p>
        <AlertCircle className="w-4 h-4 ml-1.5" />
      </div>
    );
  }

  if (isSaving) {
    return (
      <div className="hidden md:flex ml-auto items-center text-xs pr-2 text-foreground/50 select-none">
        <p className="text-nowrap slide-up">저장 중{retryCountText}</p>
        <LoaderCircle className="w-3.5 h-3.5 ml-1.5 animate-spin" />
      </div>
    );
  } else {
    return (
      <div className="hidden md:flex ml-auto items-center text-xs pr-2 text-foreground/50 select-none">
        <p className="text-nowrap fade-in">저장 완료</p>
        <svg
          className="w-3.5 h-3.5 ml-1.5 check-animation"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            d="M5 13l4 4L19 7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }
})

SaveStatusIndicator.displayName = 'SaveStatusIndicator';
