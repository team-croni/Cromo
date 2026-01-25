import { useSocketContext } from "@contexts/SocketContext";
import { useEditorSave } from "@hooks/useEditorSave";
import { useMemo } from "@hooks/useMemo";
import { useEditorStore } from "@store/editorStore";

const EditorTitle = () => {
  const { isCurrentMemoOwner } = useMemo();
  const { effectiveIsConnected } = useSocketContext();
  const { handleTitleChange } = useEditorSave();
  const { title, liveSharePermission } = useEditorStore();

  return (
    <div className="p-4 pb-4 pt-26 z-10">
      <div className="w-full">
        <input
          type="text"
          value={title}
          placeholder="제목 없음"
          onChange={handleTitleChange}
          className={`text-3xl font-bold bg-background border-none focus:outline-none w-full rounded-none px-4 ${(!isCurrentMemoOwner && liveSharePermission === "readOnly") ? 'text-foreground' : 'text-muted-foreground/50'} focus:text-foreground placeholder:text-muted-foreground/30 transition-colors duration-150`}
          readOnly={(!isCurrentMemoOwner && liveSharePermission === "readOnly") || (!isCurrentMemoOwner && !effectiveIsConnected)}
        />
      </div>
    </div>
  )
}

export default EditorTitle;
