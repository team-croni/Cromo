import {
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Undo2,
  CheckCheck,
} from "lucide-react";
import { useEditorToolbar } from "@hooks/use-editor-toolbar";

export const ToolbarAIControl = () => {
  const {
    isAILoading,
    correctionCount,
    currentCorrectionIndex,
    onCancelSingleCorrection,
    onApplySingleCorrection,
    onRestoreContent,
    onApplyContent,
    hasAIGeneratedContent,
    onPrevCorrection, onNextCorrection
  } = useEditorToolbar();

  // 제목 생성 컨트롤 표시 조건
  const showContentControls = hasAIGeneratedContent && !isAILoading;

  return (
    <>
      {/* 기존 콘텐츠 제어 */}
      <div className={`absolute -top-10 w-full flex justify-center items-center gap-2 p-2 py-3 transition-all ${showContentControls ? 'opacity-100' : 'opacity-0 pointer-events-none translate-y-4'}`}>
        {correctionCount > 0 ? (
          <div className="flex items-center gap-3">
            {/* Group 1: Navigation & Single Actions */}
            <div className="flex items-center gap-2 p-1.5 px-2 bg-popover border border-muted-foreground/25 rounded-full shadow-lg/5 dark:shadow-xl/15">
              {/* 네비게이션 및 카운트 */}
              <div className="flex items-center gap-1">
                <button
                  onClick={onPrevCorrection}
                  className="p-1.5 hover:bg-muted-foreground/10 rounded-full text-muted-foreground disabled:opacity-30"
                  disabled={correctionCount <= 1}
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-medium min-w-8 text-center text-muted-foreground">
                  {currentCorrectionIndex + 1} / {correctionCount}
                </span>
                <button
                  onClick={onNextCorrection}
                  className="p-1.5 hover:bg-muted-foreground/10 rounded-full text-muted-foreground disabled:opacity-30"
                  disabled={correctionCount <= 1}
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="w-px h-6 bg-border" />

              <div className="flex items-center">
                {/* 개별 취소 */}
                <button
                  onClick={onCancelSingleCorrection}
                  title="현재 항목 취소"
                  className="flex items-center justify-center p-2 hover:bg-muted-foreground/10 text-destructive rounded-full"
                >
                  <X size={16} />
                </button>

                {/* 개별 적용 */}
                <button
                  onClick={onApplySingleCorrection}
                  title="현재 항목 적용"
                  className="flex items-center justify-center p-2 hover:bg-muted-foreground/10 text-muted-foreground hover:text-foreground rounded-full"
                >
                  <Check size={16} />
                </button>
              </div>
            </div>

            {/* Group 2: Bulk Actions */}
            <div className="flex items-center gap-1 p-1.5 bg-popover backdrop-blur-lg border border-muted-foreground/25 rounded-full shadow-lg/5 dark:shadow-xl/15">
              {/* 전체 취소 */}
              <button
                onClick={onRestoreContent}
                title="전체 취소"
                className="flex items-center px-3 py-2 hover:bg-muted-foreground/10 text-muted-foreground hover:text-foreground rounded-full font-medium text-xs"
              >
                <Undo2 size={14} className="mr-1.5" />
                <span>취소</span>
              </button>

              {/* 적용 */}
              <button
                onClick={onApplyContent}
                title="적용"
                className="flex items-center px-3 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full font-medium text-xs"
              >
                <CheckCheck size={14} className="mr-1.5" />
                <span>전체 적용</span>
              </button>
            </div>
          </div>
        ) : (
          /* 기존 UI (단순 복원/적용 - 오타 외 다른 AI 기능용) */
          <div className="flex items-center gap-1 p-1.5 bg-popover backdrop-blur-lg border border-muted-foreground/25 rounded-full shadow-lg/5 dark:shadow-xl/15">
            {/* 전체 취소 */}
            <button
              onClick={onRestoreContent}
              title="원래 내용으로 복원"
              className="flex items-center px-3 py-2 hover:bg-muted-foreground/10 text-muted-foreground hover:text-foreground rounded-full font-medium text-xs"
            >
              <Undo2 size={14} className="mr-1.5" />
              <span>취소</span>
            </button>

            {/* 적용 */}
            <button
              onClick={onApplyContent}
              title="적용"
              className="flex items-center px-3 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full font-medium text-xs"
            >
              <Check size={14} className="mr-1.5" />
              <span>적용</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
};