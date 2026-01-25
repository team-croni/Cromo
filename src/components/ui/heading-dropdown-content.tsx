import React from 'react';
import { useEditorState } from '@tiptap/react';
import { Heading1, Heading2, Heading3, Type } from 'lucide-react';
import { useActiveFormatting } from '@utils/useActiveFormatting';
import { useEditorStore } from '@store/editorStore';
import { useEditorToolbar } from '@hooks/use-editor-toolbar';
import { ToolbarDropdownItem } from '@components/ui/toolbar-dropdown-item';

interface HeadingDropdownContentProps {
  onClose?: () => void;
}

export const HeadingDropdownContent: React.FC<HeadingDropdownContentProps> = ({
  onClose
}) => {
  const { handleClick } = useEditorToolbar();

  const { currentEditor: editor } = useEditorStore();
  const editorState = useEditorState(useActiveFormatting());

  const headingItems = [
    {
      icon: <Heading1 size={18} />,
      label: '제목 1',
      isActive: editorState?.heading1 || false,
      command: () => editor?.commands.toggleHeading({ level: 1 })
    },
    {
      icon: <Heading2 size={18} />,
      label: '제목 2',
      isActive: editorState?.heading2 || false,
      command: () => editor?.commands.toggleHeading({ level: 2 })
    },
    {
      icon: <Heading3 size={18} />,
      label: '제목 3',
      isActive: editorState?.heading3 || false,
      command: () => editor?.commands.toggleHeading({ level: 3 })
    },
    {
      icon: <Type className="w-4.5 h-4.5 p-0.5" />,
      label: '일반 텍스트',
      isActive: !editorState?.heading1 && !editorState?.heading2 && !editorState?.heading3,
      command: () => editor?.commands.setParagraph()
    }
  ];

  return (
    <div className="space-y-0.5">
      {headingItems.map((item, index) => (
        <ToolbarDropdownItem
          key={index}
          icon={item.icon}
          label={item.label}
          isActive={item.isActive}
          onClick={() => handleClick(item.command)}
          onClose={onClose}
        />
      ))}
    </div>
  );
};