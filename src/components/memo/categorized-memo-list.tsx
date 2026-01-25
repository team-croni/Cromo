import { useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { memo } from 'react';
import { useMemoBrowserStore } from '@store/memoBrowserStore';
import { categorizeMemos } from '@utils/getCategorizedItems';
import { RecentlyUpdatedItem } from '@components/memo/recently-updated-item';

interface CategorizedProps {
  _key: string;
  label: string;
  memos: ReturnType<typeof categorizeMemos>;
  sortBy: 'updatedAt' | 'createdAt' | 'title' | 'relevance';
  sortDirection: 'asc' | 'desc';
  allMemos: any[]; // TODO: proper type
}

// Categorized 컴포넌트를 memo로 감싸기
export const Categorized = memo(({ _key, label, memos, sortBy, sortDirection, allMemos }: CategorizedProps) => {
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const searchParams = useSearchParams();
  const params = useParams();
  const urlMemoId = searchParams.get('id') || params.id as string;
  const { activeMode } = useMemoBrowserStore();

  // 선택된 메모가 변경될 때 해당 메모로 스크롤
  useEffect(() => {
    if (urlMemoId) {
      const memoItem = itemRefs.current[urlMemoId];
      if (memoItem) {
        memoItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [urlMemoId]);

  // 각 카테고리의 메모들을 정렬 옵션에 따라 정렬
  const sortedMemos = [...memos[_key as keyof typeof memos]].sort((a, b) => {
    let comparison = 0;

    if (sortBy === 'title') {
      comparison = a.title.localeCompare(b.title);
    } else if (sortBy === 'createdAt') {
      comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (sortBy === 'relevance') {
      // 관련도 순 정렬 - rrfScore 또는 textMatchCount가 있는 경우 사용
      const aRelevance = (a as any).rrfScore || (a as any).textMatchCount || 0;
      const bRelevance = (b as any).rrfScore || (b as any).textMatchCount || 0;
      comparison = bRelevance - aRelevance; // 내림차순 (높은 점수 먼저)
    } else {
      comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  return (
    <div>
      <h3 className="bg-background text-sm font-regular text-muted-foreground/70 px-5 py-2 z-1">{label}</h3>
      <div className={`rounded-lg border mx-4 mb-4 overflow-hidden slide-up ${activeMode === 'selection' ? 'border-muted-foreground/50' : 'border-muted-foreground/20'}`}>
        {sortedMemos.map(memo => (
          <div key={`${_key}-${memo.id}`} ref={(el) => { itemRefs.current[memo.id] = el; }} className="group">
            <RecentlyUpdatedItem memos={allMemos} memo={memo} />
          </div>
        ))}
      </div>
    </div>
  )
});

Categorized.displayName = 'Categorized';