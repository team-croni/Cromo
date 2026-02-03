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
  Link as LinkIcon,
} from "lucide-react";
import { ToolbarButton } from "@components/ui/toolbar-button";
import { ToolbarDropdown } from "@components/ui/toolbar-dropdown";
import { HeadingDropdownContent } from "@components/ui/heading-dropdown-content";
import { AlignDropdownContent } from "@components/ui/align-dropdown-content";
import { AIDropdownContent } from "@components/ai/ai-dropdown-content";
import { ListDropdownContent } from "@components/ui/list-dropdown-content";
import { SaveStatusIndicator } from "@components/editor/save-status-indicator";
import { LinkModal } from "@components/modals/link-modal";
import { useEditorStore } from "@store/editorStore";
import { useActiveFormatting } from "@utils/useActiveFormatting";
import { useEditorToolbar } from "@hooks/use-editor-toolbar";
import { useState, useRef, useEffect } from "react";

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

  const [showGradient, setShowGradient] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const checkScrollPosition = () => {
      const { scrollLeft, scrollWidth, offsetWidth } = scrollContainer;
      const needsScrolling = scrollWidth > offsetWidth; // Check if scrolling is actually needed
      const maxScroll = scrollWidth - offsetWidth;
      setShowGradient(needsScrolling && scrollLeft < maxScroll - 1); // Show gradient only if scrolling is needed and not scrolled to the end
    };

    // Initial check
    checkScrollPosition();

    // Add scroll listener
    scrollContainer.addEventListener('scroll', checkScrollPosition);

    // Also observe resize to check if scrolling becomes needed or not needed
    let resizeObserver: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(checkScrollPosition);
      resizeObserver.observe(scrollContainer);
    }

    // Cleanup listener on unmount
    return () => {
      scrollContainer.removeEventListener('scroll', checkScrollPosition);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  const handleLinkSave = (url: string) => {
    if (!editor) return;

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    let finalUrl = url;
    // URL이 프로토콜로 시작하지 않고, 내부 링크(/)도 아니며, mailto:도 아닌 경우 https:// 추가
    if (!/^https?:\/\//i.test(url) && !url.startsWith('/') && !url.startsWith('mailto:')) {
      finalUrl = `https://${url}`;
    }

    // update
    editor.chain().focus().extendMarkRange('link').setLink({ href: finalUrl }).run();
  };

  if (!editor) return null;

  return (
    <>
      <div className={`absolute left-1/2 -translate-x-1/2 w-full flex items-center p-2 py-3 transition-all ${(!shouldShowToolbar || hasAIGeneratedContent || isAILoading) ? 'opacity-0 pointer-events-none translate-y-4' : 'opacity-100'}`}>
        <div className="w-full flex justify-between gap-4 items-center flex-1 bg-popover rounded-xl border border-popover-border p-1.5 shadow-lg/3 dark:shadow-lg/10">
          <div className="relative min-w-0 flex-1 flex items-center gap-1">
            <div ref={scrollContainerRef} className="flex items-center gap-1 overflow-x-auto no-scrollbar w-full">
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
              <ToolbarButton
                onClick={() => handleClick(() => setIsLinkModalOpen(true))}
                isActive={editor.isActive('link')}
                title="Link"
                disabled={isDisabledToolbarButton}
              >
                <LinkIcon size={14} />
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
            </div>
            <div className={`scroll-gradient-container absolute right-0 top-0 bottom-0 w-16 pointer-events-none z-10 transition ${showGradient ? '' : 'opacity-0'}`}>
              <div className="scroll-gradient absolute right-0 top-0 h-full w-24 bg-linear-to-l from-popover to-transparent"></div>
            </div>
          </div>
          <SaveStatusIndicator />
        </div>
      </div>

      <LinkModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onSave={handleLinkSave}
        initialUrl={editor.getAttributes('link').href}
      />
    </>
  );
};