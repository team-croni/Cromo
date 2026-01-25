import { Plus } from "lucide-react";
import { useMemos } from "@hooks/useMemos";
import { useMemoBrowserStore } from "@store/memoBrowserStore";
import { useMemoHandlers } from "@hooks/useMemoHandlers";
import { MEMO_TEMPLATES } from "@constants/templates";
import { Ring } from "ldrs/react";

export function CreateMemoButton() {
  const { setIsCreatingMemo, selectedTemplate, isCreatingMemo } = useMemoBrowserStore();
  const { createMemo } = useMemos();
  const { handleSelectMemo } = useMemoHandlers();

  const handleCreateNewMemo = async () => {
    try {
      setIsCreatingMemo(true);
      const template = MEMO_TEMPLATES.find(t => t.id === selectedTemplate) || MEMO_TEMPLATES[0];
      const newMemo = await createMemo(template.title, template.content, false, null);
      if (newMemo) {
        handleSelectMemo(newMemo);
      }
    } catch (error) {
      console.error("Error creating new memo:", error);
    } finally {
      setIsCreatingMemo(false);
    }
  };

  return (
    <button
      onClick={handleCreateNewMemo}
      className="group relative flex flex-col items-center justify-center p-5 h-46 border-2 border-dashed border-muted-foreground/15 rounded-2xl hover:border-primary/60 hover:bg-primary/5 overflow-hidden disabled:pointer-events-none"
      disabled={isCreatingMemo}
    >
      <div className="relative flex flex-col items-center">
        {isCreatingMemo ?
          <div className="w-4.5 h-4.5 flex items-center justify-center">
            <Ring
              size="28"
              speed="2"
              stroke={2.5}
              color="var(--color-foreground)"
              bgOpacity={0.2}
            />
          </div>
          :
          <>
            <div className="rounded-2xl mb-4">
              <Plus className="w-10 h-10 text-muted-foreground group-hover:text-foreground" strokeWidth={1.5} />
            </div>
            <span className="text-sm font-medium text-muted-foreground/60 group-hover:text-muted-foreground">새로운 메모 추가</span>
          </>
        }
      </div>
    </button>
  );
}