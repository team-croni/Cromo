import { useMemos } from '@hooks/useMemos';
import { useSearchParams } from 'next/navigation';
import { useMemoBrowserStore } from '@store/memoBrowserStore';
import { Memo } from '@/types';
import { useEffect, useState, useMemo } from 'react';
import { MemoListContainer } from '@components/memo/memo-list-container';
import { Categorized } from '@components/memo/categorized-memo-list';
import { RecentlyUpdatedItem } from '@components/memo/recently-updated-item';
import { flattenMemos, VirtualListItem } from '@/utils/virtualListUtils';

export function SharedMemoList() {
  const { sharedMemos, sharedMemosLoading, error, refreshSharedMemos } = useMemos();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const folderId = searchParams.get('folderId');
  const { filterOptions, shouldCategorizeMemos } = useMemoBrowserStore();
  const [shouldShow, setShouldShow] = useState<boolean>(false);

  useEffect(() => {
    if (tabParam) {
      if (tabParam === 'shared') {
        setShouldShow(true);
      } else {
        setShouldShow(false);
      }
    } else if (folderId) {
      setShouldShow(false);
    }
  }, [folderId, tabParam])

  // 카테고리 분류 여부 결정 (정렬 옵션에 따라 결정)
  const shouldCategorize = shouldCategorizeMemos();

  // 메모들을 LIVE ON과 LIVE OFF로 분류
  const categorizedMemos = useMemo(() => {
    if (!shouldCategorize) return null;
    const liveOnMemos = sharedMemos.filter(memo => memo.isLiveShareEnabled);
    const liveOffMemos = sharedMemos.filter(memo => !memo.isLiveShareEnabled);
    return {
      'LIVE ON': liveOnMemos,
      'LIVE OFF': liveOffMemos,
    };
  }, [shouldCategorize, sharedMemos]);

  // 가상 리스트를 위한 아이템 평탄화
  const virtualItems = useMemo(() => {
    if (shouldCategorize && categorizedMemos) {
      const items: VirtualListItem[] = [];
      Object.keys(categorizedMemos).forEach(tag => {
        const memos = (categorizedMemos as any)[tag];
        if (memos.length > 0) {
          items.push({ type: 'header', id: `header-${tag}`, label: tag });
          memos.forEach((memo: Memo) => {
            items.push({ type: 'memo', id: memo.id, data: memo });
          });
        }
      });
      return items;
    }
    return flattenMemos(sharedMemos);
  }, [shouldCategorize, categorizedMemos, sharedMemos]);

  if (!shouldShow) return null;

  return (
    <MemoListContainer
      isLoading={sharedMemosLoading}
      error={error}
      isEmpty={sharedMemos.length === 0}
      emptyMessage="공유된 메모가 없습니다."
      onRetry={refreshSharedMemos}
      memos={sharedMemos}
      virtualItems={virtualItems}
    >
      {shouldCategorize && categorizedMemos ? (
        <div>
          {Object.keys(categorizedMemos).map(tag => {
            return (categorizedMemos as any)[tag].length > 0 ? (
              <Categorized
                key={tag}
                _key={tag}
                label={tag}
                memos={categorizedMemos}
                sortBy={filterOptions.sortBy}
                sortDirection={filterOptions.sortDirection}
                allMemos={sharedMemos}
              />
            ) : null;
          })}
        </div>
      ) : (
        <div>
          {sharedMemos.map((memo: Memo) => (
            <RecentlyUpdatedItem key={memo.id} memos={sharedMemos} memo={memo} />
          ))}
        </div>
      )}
    </MemoListContainer>
  );
}