import { useMemos } from '@hooks/useMemos';
import { categorizeMemos, getCategoryOrder } from '@utils/getCategorizedItems';
import { useSearchParams } from 'next/navigation';
import { MemoListContainer } from '@components/memo/memo-list-container';
import { useMemoBrowserStore } from '@store/memoBrowserStore';
import { Categorized } from '@components/memo/categorized-memo-list';
import { useEffect, useState, useMemo } from 'react';
import { Memo } from '@/types';
import { getFilteredMemos } from '@utils/getFilteredItems';
import { RecentlyUpdatedItem } from '@components/memo/recently-updated-item';
import { flattenCategorizedMemos, flattenMemos } from '@/utils/virtualListUtils';

export function ArchivedMemoList() {
  const { archivedMemos, archivedMemosLoading, error, refreshArchivedMemos } = useMemos();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const folderId = searchParams.get('folderId');
  const { filterOptions, shouldCategorizeMemos } = useMemoBrowserStore();
  const [allMemos, setAllMemos] = useState<Memo[]>([]);
  const [shouldShow, setShouldShow] = useState<boolean>(false);

  useEffect(() => {
    if (archivedMemos.length > 0) {
      setAllMemos(archivedMemos);
    }
  }, [archivedMemos])

  useEffect(() => {
    if (tabParam) {
      if (tabParam === 'archived') {
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

  // 메모들을 카테고리별로 분류
  const categorizedMemos = useMemo(() => 
    shouldCategorize ? categorizeMemos([...filteredMemos], filterOptions.sortBy, filterOptions.sortDirection, false, filterOptions.groupBy) : null
  , [shouldCategorize, filteredMemos, filterOptions]);

  // 가상 리스트를 위한 아이템 평탄화
  const virtualItems = useMemo(() => {
    if (shouldCategorize && categorizedMemos) {
      const categoryOrder = filterOptions.groupBy === 'monthly'
        ? Object.keys(categorizedMemos)
        : getCategoryOrder(filterOptions.sortDirection);
      
      return flattenCategorizedMemos(categorizedMemos, categoryOrder, filterOptions.groupBy);
    }
    return flattenMemos(filteredMemos);
  }, [shouldCategorize, categorizedMemos, filteredMemos, filterOptions]);

  if (!shouldShow) return null;

  return (
    <MemoListContainer
      isLoading={archivedMemosLoading}
      error={error}
      isEmpty={archivedMemos.length === 0}
      emptyMessage="보관된 메모가 없습니다."
      onRetry={refreshArchivedMemos}
      memos={filteredMemos}
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
                  allMemos={allMemos}
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