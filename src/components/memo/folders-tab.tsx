import { useTabStore } from '@store/tabStore';
import { useFolderHandlers } from '@hooks/useFolderHandlers';
import { useMemos } from '@hooks/useMemos';

import { useMemoBrowserStore } from '@store/memoBrowserStore';
import { Memo } from '@/types';
import { getFilteredMemos } from '@utils/getFilteredItems';
import { categorizeMemos, getCategoryOrder } from '@utils/getCategorizedItems';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MemoListContainer } from '@components/memo/memo-list-container';
import { Categorized } from '@components/memo/categorized-memo-list';
import { RecentlyUpdatedItem } from '@components/memo/recently-updated-item';

export function FoldersTab() {
  const { activeTab } = useTabStore();
  const { folderMemos, folderMemosLoading } = useMemos();
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

  if (!shouldShow) return null;

  // 필터링 적용
  const filteredMemos = getFilteredMemos(displayMemos, filterOptions);

  // 카테고리 분류 여부 결정
  const shouldCategorize = shouldCategorizeMemos();

  // 메모들을 카테고리별로 분류
  const categorizedMemos = shouldCategorize ? categorizeMemos([...filteredMemos], filterOptions.sortBy, filterOptions.sortDirection, filterOptions.showLiveShareTop, filterOptions.groupBy) : null;

  return (
    <MemoListContainer
      isLoading={folderMemosLoading}
      isEmpty={folderMemos.length === 0}
      emptyMessage={emptyMessage}
      memos={filteredMemos}
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