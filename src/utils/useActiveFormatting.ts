import { useEditorStore } from "@/store/editorStore";
import { Editor } from "@tiptap/react";

export const useActiveFormatting = () => {
  const { currentEditor: editor } = useEditorStore();
  return (
    {
      editor,
      selector: ({ editor }: { editor: Editor | null }) => {
        if (!editor) return null;

        return {
          heading1: editor.isActive("heading", { level: 1 }),
          heading2: editor.isActive("heading", { level: 2 }),
          heading3: editor.isActive("heading", { level: 3 }),
          bold: editor.isActive("bold"),
          italic: editor.isActive("italic"),
          underline: editor.isActive("underline"),
          strike: editor.isActive("strike"),
          bulletList: editor.isActive("bulletList"),
          orderedList: editor.isActive("orderedList"),
          taskList: editor.isActive("taskList"),
          code: editor.isActive("code"),
          codeBlock: editor.isActive("codeBlock"),
          blockquote: editor.isActive("blockquote"),
          paragraph: editor.isActive("paragraph"),
          textAlign: editor.isActive({ textAlign: 'left' }) ? 'left' :
            editor.isActive({ textAlign: 'center' }) ? 'center' :
              editor.isActive({ textAlign: 'right' }) ? 'right' :
                editor.isActive({ textAlign: 'justify' }) ? 'justify' :
                  'left',
        };
      },
    }
  )
}