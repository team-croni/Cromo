import React from 'react';
import { useEditorState } from '@tiptap/react';
import { AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';
import { useActiveFormatting } from '@utils/useActiveFormatting';
import { useEditorStore } from '@store/editorStore';
import { useEditorToolbar } from '@hooks/use-editor-toolbar';
import { ToolbarDropdownItem } from '@components/ui/toolbar-dropdown-item';

interface AlignDropdownContentProps {
  onClose?: () => void;
}

export const AlignDropdownContent: React.FC<AlignDropdownContentProps> = ({
  onClose
}) => {
  const { currentEditor: editor } = useEditorStore();
  const editorState = useEditorState(useActiveFormatting());

  const { handleClick } = useEditorToolbar();

  const alignItems = [
    {
      icon: <AlignLeft size={16} />,
      label: '좌측 정렬',
      isActive: editorState?.textAlign === 'left' || (!editorState?.textAlign),
      command: () => editor?.commands.setTextAlign('left')
    },
    {
      icon: <AlignCenter size={16} />,
      label: '중앙 정렬',
      isActive: editorState?.textAlign === 'center',
      command: () => editor?.commands.setTextAlign('center')
    },
    {
      icon: <AlignRight size={16} />,
      label: '우측 정렬',
      isActive: editorState?.textAlign === 'right',
      command: () => editor?.commands.setTextAlign('right')
    },
    {
      icon: <AlignJustify size={16} />,
      label: '양쪽 정렬',
      isActive: editorState?.textAlign === 'justify',
      command: () => editor?.commands.setTextAlign('justify')
    }
  ];

  return (
    <div className="flex space-x-1">
      {alignItems.map((item, index) => (
        <ToolbarDropdownItem
          key={index}
          icon={item.icon}
          label={item.label}
          isActive={item.isActive}
          onClick={() => handleClick(item.command)}
          onClose={onClose}
          horizontal
        />
      ))}
    </div>
  );
};