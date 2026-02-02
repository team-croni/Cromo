import { EditorToolbar } from "@components/editor/editor-toolbar/editor-toolbar";

export function EditorToolbarWrapper() {
  return (
    <div className="absolute bottom-20 w-full md:w-[calc(100%-8px)] flex justify-center left-1/2 md:left-[calc(50%-6px)] -translate-x-1/2 px-2 md:px-4 z-20 fade-in">
      <EditorToolbar />
    </div>
  );
}