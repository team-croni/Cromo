import { Memo } from "@/types";

export type VirtualListItem =
  | { type: 'header'; id: string; label: string }
  | { type: 'memo'; id: string; data: Memo }
  | { type: 'spacer'; id: string; height: number };

/**
 * 카테고리화된 메모들을 가상 리스트를 위한 평탄화된 배열로 변환합니다.
 */
export const flattenCategorizedMemos = (
  categorizedMemos: Record<string, Memo[]>,
  categoryOrder: string[],
  groupBy: 'none' | 'monthly' = 'none'
): VirtualListItem[] => {
  const items: VirtualListItem[] = [];

  categoryOrder.forEach(tag => {
    const memos = categorizedMemos[tag];
    if (memos && memos.length > 0) {
      // 카테고리 레이블 설정
      let label = tag;
      if (groupBy !== 'monthly') {
        label = tag === 'liveShare' ? 'Live Share' :
                tag === 'today' ? 'Today' :
                tag === 'thisWeek' ? 'This week' :
                tag === 'thisMonth' ? 'This month' : 'Older';
      } else if (tag === 'liveShare') {
        label = 'Live Share';
      }

      items.push({ type: 'header', id: `header-${tag}`, label });
      
      memos.forEach(memo => {
        items.push({ type: 'memo', id: memo.id, data: memo });
      });
    }
  });

  return items;
};

/**
 * 일반 메모 리스트를 가상 리스트를 위한 평탄화된 배열로 변환합니다.
 */
export const flattenMemos = (memos: Memo[]): VirtualListItem[] => {
  return memos.map(memo => ({ type: 'memo', id: memo.id, data: memo }));
};
