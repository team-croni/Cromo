import { ChevronRight } from "lucide-react";
import { useEditorStore } from "@store/editorStore";
import { useCurrentCursor } from "@hooks/useCurrentCursor";
import { useCursorPosition } from "@hooks/useCursorPosition";
import { useMemo } from "@hooks/useMemo";
import { useSocketContext } from "@contexts/SocketContext";

export function CurrentCursor() {
  const { isEditorFocused } = useEditorStore();
  const { isCurrentMemoOwner: isOwner } = useMemo();
  const { isConnected } = useSocketContext();

  const {
    focusIndicatorPosition,
    hasTextSelection,
  } = useCurrentCursor();

  const { getCursorCoords } = useCursorPosition();

  if (!focusIndicatorPosition || !focusIndicatorPosition.anchor) {
    return null;
  }

  const coords = getCursorCoords(focusIndicatorPosition.anchor);

  if (!coords) {
    return null;
  }

  const { left, top, height } = coords;

  const shouldRender = (isOwner || isConnected) && isEditorFocused;

  if (!shouldRender) {
    return null;
  }

  return (
    <>
      {/* Caret indicator for current user - hide during text selection */}
      {!hasTextSelection && (
        <div
          className="absolute w-0.5 bg-foreground rounded-full transition-all ease-out duration-50 select-none custom-caret scale-y-115 z-10 pointer-events-none"
          style={{
            left: `${left}px`,
            top: `${top}px`,
            height: `${height}px`,
          }}
        />
      )}
      {/* Current user indicator (User label/icon) */}
      <div
        className="absolute flex items-center left-5.5 md:left-3 top-0 text-right -translate-x-full transition-all ease-out duration-25 text-xs text-muted-foreground/60 dark:text-muted-foreground/40 slide-right select-none z-10"
        style={{
          top: `${top}px`,
          height: `${height}px`,
        }}
      >
        <ChevronRight className="w-5 h-5 stroke-1.5" />
      </div>
    </>
  );
}