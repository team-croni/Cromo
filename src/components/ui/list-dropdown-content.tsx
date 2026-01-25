import React from 'react';
import { useEditorState } from '@tiptap/react';
import { List, ListOrdered, ListTodo } from 'lucide-react';
import { useActiveFormatting } from '@utils/useActiveFormatting';
import { useEditorStore } from '@store/editorStore';
import { useEditorToolbar } from '@hooks/use-editor-toolbar';
import { ToolbarDropdownItem } from '@components/ui/toolbar-dropdown-item';

interface ListDropdownContentProps {
  onClose?: () => void;
}

export const ListDropdownContent: React.FC<ListDropdownContentProps> = ({
  onClose
}) => {
  const { currentEditor: editor } = useEditorStore();
  const editorState = useEditorState(useActiveFormatting());

  const { handleClick } = useEditorToolbar();

  const listItems = [
    {
      icon: <List size={16} />,
      label: '일반 목록',
      isActive: editorState?.bulletList || false,
      command: () => editor?.commands.toggleBulletList()
    },
    {
      icon: <ListOrdered size={16} />,
      label: '번호 목록',
      isActive: editorState?.orderedList || false,
      command: () => editor?.commands.toggleOrderedList()
    },
    {
      icon: <ListTodo size={16} />,
      label: '할 일 목록',
      isActive: editorState?.taskList || false,
      command: () => editor?.commands.toggleTaskList()
    }
  ];

  return (
    <div className="space-y-1">
      {listItems.map((item, index) => (
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