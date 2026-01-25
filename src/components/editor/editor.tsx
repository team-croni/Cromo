"use client";

import { EditorContent } from "@tiptap/react";
import EditorLoading from "@components/editor/editor-loading";
import EditorTitle from "@components/editor/editor-title";
import { ScrollFadeOverlay } from "@components/layout/scroll-fade-overlay";
import useEditorHook from "@hooks/useEditorHook";
import { ErrorDisplay } from "@components/ui/error-display";
import { EditorToolbarWrapper } from "@components/editor/editor-toolbar/editor-toolbar-wrapper";
import { CursorDisplay } from "@components/collaboration/cursor-display";
import { LiveShareStatus } from "@components/collaboration/live-share-status";

export function Editor() {
  const {
    editor,
    isMarkdownMode,
    markdownContent,
    editorContainerRef,
  } = useEditorHook();

  if (!editor) {
    return null;
  }

  return (
    <div className="flex-1 flex flex-col w-full max-w-195 mx-auto fade-in">
      <ErrorDisplay />
      <EditorTitle />
      <ScrollFadeOverlay />
      <EditorToolbarWrapper />

      <div className="relative flex-1" ref={editorContainerRef}>
        {/* Markdown 모드일 때는 읽기 전용으로 표시, 그렇지 않으면 Tiptap 에디터 표시 */}
        {isMarkdownMode ? (
          <div
            className="overflow-visible w-full p-4 font-mono text-sm resize-none focus:outline-none bg-background text-foreground"
          >
            {markdownContent}
          </div>
        ) : (
          <div
            className="relative flex flex-col min-h-full prose max-w-none focus:outline-none bg-background text-foreground"
          >
            <EditorContent editor={editor} className="flex flex-col flex-1" />

            <CursorDisplay />
          </div>
        )}
      </div>

      <LiveShareStatus />
      <EditorLoading />
    </div>
  );
}
