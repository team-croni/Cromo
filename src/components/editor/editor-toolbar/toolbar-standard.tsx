import { useEditorState } from "@tiptap/react";
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Code,
  Heading1,
  Heading2,
  Heading3,
  MessageSquareQuote,
  Underline as UnderlineIcon,
  ListTodo,
  Quote,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Wand2,
} from "lucide-react";
import { ToolbarButton } from "@components/ui/toolbar-button";
import { ToolbarDropdown } from "@components/ui/toolbar-dropdown";
import { HeadingDropdownContent } from "@components/ui/heading-dropdown-content";
import { AlignDropdownContent } from "@components/ui/align-dropdown-content";
import { AIDropdownContent } from "@components/ai/ai-dropdown-content";
import { ListDropdownContent } from "@components/ui/list-dropdown-content";
import { SaveStatusIndicator } from "@components/editor/save-status-indicator";
import { useEditorStore } from "@store/editorStore";
import { useActiveFormatting } from "@utils/useActiveFormatting";
import { useEditorToolbar } from "@hooks/use-editor-toolbar";

export const ToolbarStandard = () => {
  const { currentEditor: editor } = useEditorStore();

  const editorState = useEditorState(useActiveFormatting());

  const {
    isAILoading,
    hasAIGeneratedContent,
    isDisabledToolbarButton,
    handleClick,
  } = useEditorToolbar();

  const { shouldShowToolbar } = useEditorToolbar();

  if (!editor) return null;

  return (
    <div className={`absolute left-1/2 -translate-x-1/2 w-full flex items-center p-2 py-3 transition-all ${(!shouldShowToolbar || hasAIGeneratedContent || isAILoading) ? 'opacity-0 pointer-events-none translate-y-4' : 'opacity-100'}`}>
      <div className="flex-1 bg-popover rounded-xl border border-popover-border p-1.5 flex flex-wrap gap-1 shadow-lg/3 dark:shadow-lg/10">
        <ToolbarDropdown
          title="AI 기능"
          disabled={isDisabledToolbarButton}
          triggerIcon={<Wand2 size={18} strokeWidth={1.5} className="text-primary" />}
          titleShow
          isLoading={isAILoading}
        >
          <AIDropdownContent />
        </ToolbarDropdown>
        <div className="border-popover-border border-r mx-1 h-6 self-center" />
        <ToolbarDropdown
          isActive={editorState?.heading1 || editorState?.heading2 || editorState?.heading3}
          title="Headings"
          disabled={isDisabledToolbarButton}
          triggerIcon={
            editorState?.heading1 ? (
              <Heading1 size={18} />
            ) : editorState?.heading2 ? (
              <Heading2 size={18} />
            ) : editorState?.heading3 ? (
              <Heading3 size={18} />
            ) : (
              <Type className="w-4.5 h-4.5 p-0.5" />
            )
          }
        >
          <HeadingDropdownContent />
        </ToolbarDropdown>
        <ToolbarDropdown
          isActive={!!(editorState?.bulletList || editorState?.orderedList || editorState?.taskList)}
          title="리스트"
          disabled={isDisabledToolbarButton}
          triggerIcon={
            editorState?.bulletList ? (
              <List size={16} />
            ) : editorState?.orderedList ? (
              <ListOrdered size={16} />
            ) : editorState?.taskList ? (
              <ListTodo size={16} />
            ) : (
              <List size={16} />
            )
          }
        >
          <ListDropdownContent />
        </ToolbarDropdown>
        <div className="border-popover-border border-r mx-1 h-6 self-center" />
        <ToolbarButton
          onClick={() => handleClick(() => editor.commands.toggleBold())}
          isActive={editorState?.bold}
          title="Bold"
          disabled={isDisabledToolbarButton}
        >
          <Bold size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => handleClick(() => editor.commands.toggleItalic())}
          isActive={editorState?.italic}
          title="Italic"
          disabled={isDisabledToolbarButton}
        >
          <Italic size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => handleClick(() => editor.commands.toggleUnderline())}
          isActive={editorState?.underline}
          title="Underline"
          disabled={isDisabledToolbarButton}
        >
          <UnderlineIcon size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => handleClick(() => editor.commands.toggleStrike())}
          isActive={editorState?.strike}
          title="Strikethrough"
          disabled={isDisabledToolbarButton}
        >
          <Strikethrough size={14} />
        </ToolbarButton>
        <div className="border-popover-border border-r mx-1 h-6 self-center" />
        <ToolbarDropdown
          isActive={!!(editorState?.textAlign && editorState?.textAlign !== 'left')}
          title="Text Alignment"
          disabled={isDisabledToolbarButton}
          triggerIcon={
            editorState?.textAlign === 'center' ? (
              <AlignCenter size={14} />
            ) : editorState?.textAlign === 'right' ? (
              <AlignRight size={14} />
            ) : editorState?.textAlign === 'justify' ? (
              <AlignJustify size={14} />
            ) : (
              <AlignLeft size={14} />
            )
          }
        >
          <AlignDropdownContent />
        </ToolbarDropdown>
        <div className="border-popover-border border-r mx-1 h-6 self-center" />
        <ToolbarButton
          onClick={() => handleClick(() => editor.commands.toggleCode())}
          isActive={editorState?.code}
          title="Inline Code"
          disabled={isDisabledToolbarButton}
        >
          <MessageSquareQuote size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => handleClick(() => editor.commands.toggleCodeBlock())}
          isActive={editorState?.codeBlock}
          title="Code Block"
          disabled={isDisabledToolbarButton}
        >
          <Code size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => handleClick(() => editor.commands.toggleBlockquote())}
          isActive={editorState?.blockquote}
          title="Blockquote"
          disabled={isDisabledToolbarButton}
        >
          <Quote size={14} />
        </ToolbarButton>
        <div className="border-popover-border border-r mx-1 mr-10 h-6 self-center" />
        <SaveStatusIndicator />
      </div>
    </div>
  );
};
