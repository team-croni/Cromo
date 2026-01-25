import { useMemoStore } from "@store/memoStore";
import { RecentlyUpdatedItem } from "@components/memo/recently-updated-item";
import { useMemoHandlers } from "@hooks/useMemoHandlers";
import { useHybridSearch } from "@hooks/useHybridSearch";
import { Ring } from "ldrs/react";

export function HybridSearchResults() {
  const { handleSelectMemo } = useMemoHandlers();
  const { searchTerm } = useMemoStore();

  const {
    hybridSearchResults,
    classifiedResults,
    isLoading,
    isError
  } = useHybridSearch();

  if (!searchTerm) return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
      <p className="text-lg">검색어를 입력하세요</p>
    </div>
  );

  if (isLoading) return (
    <div className="flex items-center justify-center h-full">
      <Ring
        size="28"
        speed="2"
        stroke={3}
        color="var(--color-foreground)"
        bgOpacity={0.2}
      />
    </div>
  );

  if (hybridSearchResults.length === 0) return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
      <p className="text-lg">&quot;{searchTerm}&quot; 결과가 없습니다</p>
    </div>
  );

  return (
    <div className="px-4 pb-4">
      <div className="mb-2 text-sm text-muted-foreground flex justify-between items-center">
        <span>&quot;{searchTerm}&quot; 검색 결과</span>
        <span>{hybridSearchResults.length}개</span>
      </div>
      {isError && <div className="text-sm text-destructive mb-2">검색 중 오류가 발생했습니다.</div>}

      {/* 고정된 UI 구조 유지 */}
      {classifiedResults.high.length > 0 && (
        <div className="mt-4">
          <h3 className="text-md font-semibold mb-2">검색 결과</h3>
          <div className="space-y-2">
            {classifiedResults.high.map((memo) => (
              <RecentlyUpdatedItem
                key={memo.id}
                memos={classifiedResults.high}
                memo={{ ...memo, folder: memo.folderId ? { id: memo.folderId, name: memo.folderName || '' } : null }}
                onSelect={handleSelectMemo}
              />
            ))}
          </div>
        </div>
      )}

      {classifiedResults.low.length > 0 && (
        <div className="mt-6">
          <h3 className="text-md font-semibold mb-2">비슷한 메모</h3>
          <div className="space-y-2">
            {classifiedResults.low.map((memo) => (
              <RecentlyUpdatedItem
                key={memo.id}
                memos={classifiedResults.low}
                memo={{ ...memo, folder: memo.folderId ? { id: memo.folderId, name: memo.folderName || '' } : null }}
                onSelect={handleSelectMemo}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}