import { useFolderHandlers } from '@hooks/useFolderHandlers';
import { useMemos } from '@hooks/useMemos';

import { useMemoBrowserStore } from '@store/memoBrowserStore';
import { Memo } from '@/types';
import { getFilteredMemos } from '@utils/getFilteredItems';
import { categorizeMemos, getCategoryOrder } from '@utils/getCategorizedItems';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useMemo as useReactMemo } from 'react';
import { MemoListContainer } from '@components/memo/memo-list-container';
import { Categorized } from '@components/memo/categorized-memo-list';
import { RecentlyUpdatedItem } from '@components/memo/recently-updated-item';
import { flattenCategorizedMemos, flattenMemos } from '@/utils/virtualListUtils';

export function FoldersTab() {
  const { folderMemos, folderMemosLoading, error, refreshFolderMemos } = useMemos();
  const { folders } = useFolderHandlers();
  const { filterOptions, shouldCategorizeMemos } = useMemoBrowserStore();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const folderId = searchParams.get('folderId');
  const [allMemos, setAllMemos] = useState<Memo[]>([]);
  const [shouldShow, setShouldShow] = useState<boolean>(false);
  const [initFolderId, setInitFolderId] = useState<string>();

  useEffect(() => {
    if (folderMemos.length > 0) {
      setAllMemos(folderMemos);
    }
  }, [folderMemos])

  useEffect(() => {
    if (folderId && !tabParam) {
      setShouldShow(true);
      setInitFolderId(folderId);
    }
    if (tabParam) {
      setShouldShow(false);
    }
  }, [folderId, tabParam])

  // selectedFolderId에 따라 표시할 메모들 필터링
  let displayMemos: Memo[] = [];
  let emptyMessage = "메모가 없습니다.";

  if (initFolderId) {
    if (initFolderId === 'root') {
      // 루트 메모들 표시
      displayMemos = allMemos.filter(memo => memo.folderId === null);
      emptyMessage = "루트 메모가 없습니다.";
    } else {
      // 특정 폴더의 메모들 표시
      displayMemos = allMemos.filter(memo => memo.folderId === initFolderId);
      const folder = folders.find(f => f.id === initFolderId);
      emptyMessage = folder ? `${folder.name}에 메모가 없습니다.` : "메모가 없습니다.";
    }
  } else {
    // 일반 폴더 탭에서는 루트 메모들 표시
    displayMemos = allMemos.filter(memo => memo.folderId === null);
  }

  // 필터링 적용
  const filteredMemos = useReactMemo(() => getFilteredMemos(displayMemos, filterOptions), [displayMemos, filterOptions]);

  // 카테고리 분류 여부 결정
  const shouldCategorize = shouldCategorizeMemos();

  // 메모들을 카테고리별로 분류
  const categorizedMemos = useReactMemo(() =>
    shouldCategorize ? categorizeMemos([...filteredMemos], filterOptions.sortBy, filterOptions.sortDirection, filterOptions.showLiveShareTop, filterOptions.groupBy) : null
    , [shouldCategorize, filteredMemos, filterOptions]);

  // 가상 리스트를 위한 아이템 평탄화
  const virtualItems = useReactMemo(() => {
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
      isLoading={folderMemosLoading}
      error={error}
      isEmpty={folderMemos.length === 0}
      emptyMessage={emptyMessage}
      onRetry={refreshFolderMemos}
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