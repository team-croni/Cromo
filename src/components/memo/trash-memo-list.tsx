import { useMemos } from '@hooks/useMemos';
import { categorizeMemos, getCategoryOrder } from '@utils/getCategorizedItems';
import { useSearchParams } from 'next/navigation';
import { useMemoBrowserStore } from '@store/memoBrowserStore';
import { MemoListContainer } from '@components/memo/memo-list-container';
import { Categorized } from '@components/memo/categorized-memo-list';
import { RecentlyUpdatedItem } from '@components/memo/recently-updated-item';
import { useMemo } from 'react';
import { flattenCategorizedMemos, flattenMemos } from '@/utils/virtualListUtils';

export function TrashMemoList() {
  const { deletedMemos, deletedMemosLoading, error, refreshDeletedMemos } = useMemos();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const { filterOptions, shouldCategorizeMemos } = useMemoBrowserStore();

  // 카테고리 분류 여부 결정 (정렬 옵션에 따라 결정)
  const shouldCategorize = shouldCategorizeMemos();

  // 메모들을 카테고리별로 분류
  const categorizedMemos = useMemo(() => 
    shouldCategorize ? categorizeMemos([...deletedMemos], filterOptions.sortBy, filterOptions.sortDirection, false, filterOptions.groupBy) : null
  , [shouldCategorize, deletedMemos, filterOptions]);

  // 가상 리스트를 위한 아이템 평탄화
  const virtualItems = useMemo(() => {
    if (shouldCategorize && categorizedMemos) {
      const categoryOrder = filterOptions.groupBy === 'monthly'
        ? Object.keys(categorizedMemos)
        : getCategoryOrder(filterOptions.sortDirection);
      
      return flattenCategorizedMemos(categorizedMemos, categoryOrder, filterOptions.groupBy);
    }
    return flattenMemos(deletedMemos);
  }, [shouldCategorize, categorizedMemos, deletedMemos, filterOptions]);

  if (tabParam !== 'trash') return null;

  return (
    <MemoListContainer
      isLoading={deletedMemosLoading}
      error={error}
      isEmpty={deletedMemos.length === 0}
      emptyMessage="휴지통이 비어 있습니다."
      onRetry={refreshDeletedMemos}
      memos={deletedMemos}
      virtualItems={virtualItems}
    >
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
                  allMemos={deletedMemos}
                />
              ) : null;
            })
          ) : (
            getCategoryOrder(filterOptions.sortDirection).map(tag => {
              const tagKey = tag as keyof typeof categorizedMemos;
              return categorizedMemos[tagKey].length > 0 ? (
                <Categorized
                  key={tagKey}
                  _key={tag}
                  label={tag === 'today' ? 'Today' :
                    tag === 'thisWeek' ? 'This week' :
                      tag === 'thisMonth' ? 'This month' : 'Older'}
                  memos={categorizedMemos}
                  sortBy={filterOptions.sortBy}
                  sortDirection={filterOptions.sortDirection}
                  allMemos={deletedMemos}
                />
              ) : null;
            })
          )}
        </div>
      ) : (
        <div>
          {deletedMemos.map(memo => (
            <RecentlyUpdatedItem key={memo.id} memos={deletedMemos} memo={memo} />
          ))}
        </div>
      )}
    </MemoListContainer>
  );
}