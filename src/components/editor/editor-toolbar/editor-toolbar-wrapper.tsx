"use client";

import { EditorToolbar } from "@components/editor/editor-toolbar/editor-toolbar";
import { useEditorToolbar } from "@hooks/use-editor-toolbar";

export function EditorToolbarWrapper() {
  return (
    <div className="absolute bottom-20 w-[calc(100%-8px)] flex justify-center left-[calc(50%-6px)] -translate-x-1/2 px-4 z-20 fade-in">
      <EditorToolbar />
    </div>
  );
}