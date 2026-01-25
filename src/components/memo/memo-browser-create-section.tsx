import { Plus } from "lucide-react";
import { MEMO_TEMPLATES } from '@constants/templates';
import { useMemoBrowserStore } from '@store/memoBrowserStore';
import { useMemos } from '@hooks/useMemos';
import { useMemoHandlers } from '@hooks/useMemoHandlers';
import { Ring } from "ldrs/react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { TemplateSelect } from "@components/modals/template-select";

export function MemoBrowserCreateSection() {
  const { activeMode, isCreatingMemo, selectedTemplate, setIsCreatingMemo } = useMemoBrowserStore();
  const { createMemo: createMemoAPI } = useMemos();
  const { handleSelectMemo } = useMemoHandlers();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab');
  const { status } = useSession();

  // 로그인하지 않은 경우 아무것도 표시하지 않음
  if (status !== "authenticated") return null;

  if (activeMode === 'selection' || activeTab === 'trash') return null;

  const handleCreateNewMemo = async () => {
    try {
      setIsCreatingMemo(true);
      const template = MEMO_TEMPLATES.find(t => t.id === selectedTemplate) || MEMO_TEMPLATES[0];

      const newMemo = await createMemoAPI(template.title, template.content, activeTab === 'archived', null);

      if (newMemo) {
        // 메모 선택 처리
        handleSelectMemo(newMemo);
      } else {
        console.error("Failed to create new memo");
      }
    } catch (error) {
      console.error("Error creating new memo:", error);
    } finally {
      setIsCreatingMemo(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 justify-start mx-4 h-27">
      <div className="relative flex gap-2 slide-up">
        <button
          onClick={handleCreateNewMemo}
          disabled={isCreatingMemo}
          className={`flex flex-1 items-center gap-3 px-4.5 py-3 transition-colors duration-75 text-popover-foreground bg-primary/15 border border-foreground/10 hover:bg-primary/25 hover:border-foreground/15 rounded-xl shine-border ${isCreatingMemo ? 'pointer-events-none' : ''}`}
          title="새 메모 추가"
        >
          {isCreatingMemo ? (
            <div className="w-6 h-6 flex items-center justify-center">
              <Ring
                size="20"
                speed="2"
                stroke={2}
                color="var(--color-foreground)"
                bgOpacity={0.2}
              />
            </div>
          ) : (
            <Plus className="w-6 h-6" />
          )}
          <span className="text-sm">
            {isCreatingMemo ? '생성 중...' : '새로운 메모'}
          </span>
        </button>

        <TemplateSelect />
      </div>
      <div className="flex items-center justify-between text-sm px-1 fade-in">
        <p className="text-sm text-muted-foreground/50">
          {new Date().toLocaleString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
        </p>
        <p>
          <span className="text-[0.625rem] text-muted-foreground/50 font-semibold rounded-full px-1.5 py-0.5 mr-2 border border-popover-border">FREE</span>
          <span className="text-muted-foreground/50"><span className="text-muted-foreground">11.8K</span> / 500K limit</span>
        </p>
      </div>
    </div>
  );
}