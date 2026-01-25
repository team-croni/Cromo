"use client";

import { memo } from "react";
import { ToolbarStandard } from "@components/editor/editor-toolbar/toolbar-standard";
import { ToolbarAILoading } from "@components/editor/editor-toolbar/toolbar-ai-loading";
import { ToolbarAIControl } from "@components/editor/editor-toolbar/toolbar-ai-control";
import { useEditorStore } from "@store/editorStore";

export const EditorToolbar = memo(() => {
  const { currentEditor: editor } = useEditorStore();

  if (!editor) {
    return null;
  }

  return (
    <div className={`relative w-full max-w-200 duration-150`}>
      <ToolbarStandard />
      <ToolbarAILoading />
      <ToolbarAIControl />
    </div>
  );
});

EditorToolbar.displayName = "EditorToolbar";