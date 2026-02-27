import { categorizeMemos, getCategoryOrder } from '@/utils/getCategorizedItems';
import { useSearchParams } from 'next/navigation';
import { useMemos } from '@/hooks/useMemos';
import { useMemoBrowserStore } from "@/store/memoBrowserStore";
import { getFilteredMemos } from "@/utils/getFilteredItems";
import { useEffect, useState, useMemo } from "react";
import { MemoListContainer } from '@/components/memo/memo-list-container';
import { Categorized } from '@/components/memo/categorized-memo-list';
import { RecentlyUpdatedItem } from '@/components/memo/recently-updated-item';
import { flattenCategorizedMemos, flattenMemos } from '@/utils/virtualListUtils';

export function RecentMemoList() {
  const { recentMemosLoading, error, memos, archivedMemos, refreshMemos } = useMemos();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const folderId = searchParams.get('folderId');
  const { filterOptions, shouldCategorizeMemos } = useMemoBrowserStore();
  const [shouldShow, setShouldShow] = useState<boolean>(false);

  // memos와 archivedMemos를 합침
  const allMemos = useMemo(() => [...(memos || []), ...(archivedMemos || [])], [memos, archivedMemos]);

  useEffect(() => {
    if (tabParam) {
      if (tabParam === 'recent') {
        setShouldShow(true);
      } else {
        setShouldShow(false);
      }
    } else if (folderId) {
      setShouldShow(false);
    }
  }, [folderId, tabParam])

  const filteredMemos = useMemo(() => getFilteredMemos(allMemos, filterOptions), [allMemos, filterOptions]);

  // 카테고리 분류 여부 결정 (정렬 옵션에 따라 결정)
  const shouldCategorize = shouldCategorizeMemos();

  // 메모들을 카테고리별로 분류 (정렬 옵션에 따라 결정)
  const categorizedMemos = useMemo(() =>
    shouldCategorize ? categorizeMemos([...filteredMemos], filterOptions.sortBy, filterOptions.sortDirection, filterOptions.showLiveShareTop, filterOptions.groupBy) : null
    , [shouldCategorize, filteredMemos, filterOptions]);

  // 가상 리스트를 위한 아이템 평탄화
  const virtualItems = useMemo(() => {
    if (shouldCategorize && categorizedMemos) {
      const categoryOrder = filterOptions.groupBy === 'monthly'
        ? Object.keys(categorizedMemos)
        : getCategoryOrder(filterOptions.sortDirection, filterOptions.showLiveShareTop);

      return flattenCategorizedMemos(categorizedMemos, categoryOrder, filterOptions.groupBy);
    }
    return flattenMemos(filteredMemos);
  }, [shouldCategorize, categorizedMemos, filteredMemos, filterOptions]);

  if (!shouldShow) return null;

  return (
    <MemoListContainer
      isLoading={recentMemosLoading}
      error={error}
      isEmpty={allMemos.length === 0}
      emptyMessage="최근 메모가 없습니다."
      onRetry={refreshMemos}
      memos={filteredMemos}
      virtualItems={virtualItems}
    >
      {/* 가상 리스트가 활성화되면 아래 children은 무시됩니다. 하위 호환성을 위해 유지합니다. */}
      {shouldCategorize && categorizedMemos ? (
        <div>
          {filterOptions.groupBy === 'monthly' ? (
            Object.keys(categorizedMemos).map(tag => {
              const tagLabel = tag === 'liveShare' ? 'Live Share' : tag;
              return (categorizedMemos as any)[tag].length > 0 ? (
                <Categorized
                  key={tag}
                  _key={tag}
                  label={tagLabel}
                  memos={categorizedMemos}
                  sortBy={filterOptions.sortBy}
                  sortDirection={filterOptions.sortDirection}
                  allMemos={allMemos}
                />
              ) : null;
            })
          ) : (
            getCategoryOrder(filterOptions.sortDirection, filterOptions.showLiveShareTop).map(tag => {
              const tagKey = tag as keyof typeof categorizedMemos;
              // Live Share 카테고리 레이블 설정
              const tagLabel = tagKey === 'liveShare' ? 'Live Share' :
                tagKey === 'today' ? 'Today' :
                  tagKey === 'thisWeek' ? 'This week' :
                    tagKey === 'thisMonth' ? 'This month' : 'Older';

              return categorizedMemos[tagKey].length > 0 ? (
                <Categorized
                  key={tagKey}
                  _key={tag}
                  label={tagLabel}
                  memos={categorizedMemos}
                  sortBy={filterOptions.sortBy}
                  sortDirection={filterOptions.sortDirection}
                  allMemos={allMemos}
                />
              ) : null;
            })
          )}
        </div>
      ) : (
        <div>
          {filteredMemos.map(memo => (
            <RecentlyUpdatedItem key={memo.id} memos={allMemos} memo={memo} />
          ))}
        </div>
      )}
    </MemoListContainer>
  );
}