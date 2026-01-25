import { useCallback } from "react";
import { useEditorStore } from "@/store/editorStore";

interface CursorCoords {
  left: number;
  top: number;
  height: number;
}

interface SelectionRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export const useCursorPosition = () => {
  const { currentEditor: editor, editorContainerRef } = useEditorStore();

  const getCursorCoords = useCallback((pos: number): CursorCoords | null => {
    if (!editor?.view || !editorContainerRef.current) {
      return null;
    }

    try {
      const { view } = editor;
      const containerRect = editorContainerRef.current.getBoundingClientRect();

      // Check if position is within valid range
      if (pos < 0 || pos > view.state.doc.content.size) {
        return null;
      }

      const coords = view.coordsAtPos(pos);

      const left = coords.left - containerRect.left;
      const top = coords.top - containerRect.top;
      let height = coords.bottom - coords.top;

      // Fix for zero height (e.g. empty lines or special nodes)
      if (height <= 0 || !isFinite(height)) {
        try {
          const domPos = view.domAtPos(pos);
          if (domPos.node && domPos.node.nodeType === Node.ELEMENT_NODE) {
            const element = domPos.node as Element;
            const rect = element.getBoundingClientRect();
            if (rect.height > 0) {
              height = rect.height;
              // Adjust top if needed, though coordsAtPos usually handles this
            } else {
              // Fallback to computed style
              const computedStyle = window.getComputedStyle(element);
              const fontSize = parseFloat(computedStyle.fontSize) || 16;
              const lineHeight = parseFloat(computedStyle.lineHeight) || (fontSize * 1.5);
              height = isFinite(lineHeight) ? lineHeight : fontSize * 1.5;
            }
          } else {
            // Fallback to container style
            const computedStyle = window.getComputedStyle(editorContainerRef.current);
            const fontSize = parseFloat(computedStyle.fontSize) || 16;
            const lineHeight = parseFloat(computedStyle.lineHeight) || (fontSize * 1.5);
            height = isFinite(lineHeight) ? lineHeight : fontSize * 1.5;
          }
        } catch (domError) {
          // Final fallback
          height = 20;
        }
      }

      if (left < 50 && height > 500) {
        return null;
      }

      return { left, top, height };

    } catch (e) {
      console.warn('Error getting cursor coords:', e);
      return null;
    }
  }, [editor, editorContainerRef]);

  const getSelectionRects = useCallback((from: number, to: number): SelectionRect[] => {
    if (!editor?.view || !editorContainerRef.current || from === to) {
      return [];
    }

    try {
      const { view } = editor;
      const containerRect = editorContainerRef.current.getBoundingClientRect();
      const range = document.createRange();

      // We need to be careful with mapping logic positions to DOM nodes
      // view.domAtPos might point to a text node or an element
      const startDom = view.domAtPos(from);
      const endDom = view.domAtPos(to);

      // Simple case: use Tiptap/Prosemirror's built-in decoration/coords logic?
      // Actually creating a DOM Range is robust if we have the DOM nodes.
      // However, ProseMirror manages the DOM, so accessing it directly can be tricky if not synced.
      // But for read-only rect calculation it's usually fine.

      try {
        range.setStart(startDom.node, startDom.offset);
        range.setEnd(endDom.node, endDom.offset);
      } catch (rangeError) {
        // Fallback: sometimes offsets are invalid if DOM just changed
        return [];
      }

      const clientRects = range.getClientRects();

      return Array.from(clientRects).map(rect => ({
        left: rect.left - containerRect.left,
        top: rect.top - containerRect.top,
        width: rect.width,
        height: rect.height
      }));

    } catch (e) {
      console.warn('Error getting selection rects:', e);
      return [];
    }
  }, [editor, editorContainerRef]);

  return {
    getCursorCoords,
    getSelectionRects
  };
};