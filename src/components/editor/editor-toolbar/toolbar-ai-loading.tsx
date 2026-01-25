import { useEditorToolbarStore } from "@store/editorToolbarStore";
import { Ring } from "ldrs/react";

// props 제거 - store에서 직접 가져오기
export const ToolbarAILoading = () => {
  const { isAILoading, aiLoadingMessage } = useEditorToolbarStore();

  return (
    <div className={`absolute -top-10 w-full flex justify-center items-center gap-2 p-2 py-3 transition-all ${isAILoading ? 'opacity-100' : 'opacity-0 pointer-events-none translate-y-[16px]'}`}>
      <div className="flex items-center gap-2 px-4 pr-5 py-3.5 bg-popover backdrop-blur-lg border border-popover-border rounded-full shadow-lg/3 dark:shadow-lg/15">
        <div className="w-5 h-5 mr-1 flex items-center justify-center">
          <Ring
            size="20"
            speed="2"
            stroke={2}
            color="var(--color-primary)"
            bgOpacity={0.2}
          />
        </div>
        <span className="text-xs font-medium text-muted-foreground">{aiLoadingMessage}</span>
      </div>
    </div>
  );
};
