"use client";

import { useSocketContext } from "@contexts/SocketContext";
import { useEditorToolbar } from "@hooks/use-editor-toolbar";
import { useMemo } from "@hooks/useMemo";
import { useEditorStore } from "@store/editorStore";

export function ScrollFadeOverlay() {
  const {
    isAILoading,
    hasAIGeneratedContent,
  } = useEditorToolbar();
  const { effectiveIsConnected } = useSocketContext();
  const { liveSharePermission } = useEditorStore();
  const { isCurrentMemoOwner } = useMemo();

  const showContentControls = hasAIGeneratedContent && !isAILoading;
  const isDisabledToolbarButton = (!effectiveIsConnected || liveSharePermission === "readOnly") && !isCurrentMemoOwner;
  const shouldShowToolbar = !isDisabledToolbarButton;

  return (
    <div className={`absolute left-0 bottom-0 w-full md:w-[calc(100%-18px)] z-20 pointer-events-none transition-all duration-150 ${showContentControls ? 'h-70' : shouldShowToolbar ? 'h-50' : 'h-10'}`}>
      <div
        className="absolute w-full h-full"
        style={{
          background: "linear-gradient(to bottom, transparent 0%, var(--background) 100%)",
          opacity: 0.98,
        }}
      >
      </div>
    </div>
  );
}