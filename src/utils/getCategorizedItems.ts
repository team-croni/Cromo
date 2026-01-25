import { Memo } from "@/types";

// 메모들을 시간대별로 분류하는 함수
export const categorizeMemos = (memos: Memo[], sortBy: 'updatedAt' | 'createdAt' | 'title' | 'relevance' = 'updatedAt', sortDirection: 'asc' | 'desc' = 'desc', showLiveShareTop: boolean = false, groupBy: 'none' | 'monthly' = 'none') => {
  if (groupBy === 'monthly') {
    const categorized: { [key: string]: Memo[] } = {};
    const liveShare: Memo[] = [];

    // If sortBy is 'relevance', don't group by months
    if (sortBy === 'relevance') {
      // Sort all memos by relevance
      const sortedMemos = [...memos].sort((a, b) => {
        // Live Share 메모 상단 표시 처리
        if (showLiveShareTop && a.isLiveShareEnabled && !b.isLiveShareEnabled) return -1;
        if (showLiveShareTop && !a.isLiveShareEnabled && b.isLiveShareEnabled) return 1;

        // 관련도 순 정렬
        const aRelevance = (a as any).rrfScore || (a as any).textMatchCount || 0;
        const bRelevance = (b as any).rrfScore || (b as any).textMatchCount || 0;
        const comparison = bRelevance - aRelevance; // 내림차순 (높은 점수 먼저)

        return sortDirection === 'asc' ? comparison : -comparison;
      });

      return {
        today: [],
        thisWeek: [],
        thisMonth: [],
        earlier: sortedMemos, // 모든 메모를 earlier 카테고리에 넣음
        liveShare: [] // Live Share 메모 카테고리 추가
      };
    }

    memos.forEach(memo => {
      if (showLiveShareTop && memo.isLiveShareEnabled) {
        liveShare.push(memo);
        return;
      }

      const dateToCheck = sortBy === 'createdAt' ? new Date(memo.createdAt) : new Date(memo.updatedAt);
      const yearMonth = `${dateToCheck.getFullYear()}-${String(dateToCheck.getMonth() + 1).padStart(2, '0')}`;

      if (!categorized[yearMonth]) {
        categorized[yearMonth] = [];
      }
      categorized[yearMonth].push(memo);
    });

    // Sort categories by date
    const sortedCategories = Object.keys(categorized).sort((a, b) => {
      return sortDirection === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
    });

    const result: { [key: string]: Memo[] } = {};
    if (showLiveShareTop && liveShare.length > 0) {
      result.liveShare = liveShare;
    }
    sortedCategories.forEach(cat => {
      result[cat] = categorized[cat].sort((a, b) => {
        const dateA = sortBy === 'createdAt' ? new Date(a.createdAt) : new Date(a.updatedAt);
        const dateB = sortBy === 'createdAt' ? new Date(b.createdAt) : new Date(b.updatedAt);
        return sortDirection === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
      });
    });

    return result;
  }

  // 'title' or 'relevance' 정렬 옵션일 경우 카테고리 분류하지 않음
  if (sortBy === 'title' || sortBy === 'relevance') {
    // 제목순 또는 관련도순 정렬 적용
    const sortedMemos = [...memos].sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortBy === 'relevance') {
        // 관련도 순 정렬 - rrfScore 또는 textMatchCount가 있는 경우 사용
        const aRelevance = (a as any).rrfScore || (a as any).textMatchCount || 0;
        const bRelevance = (b as any).rrfScore || (b as any).textMatchCount || 0;
        comparison = bRelevance - aRelevance; // 내림차순 (높은 점수 먼저)
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return {
      today: [],
      thisWeek: [],
      thisMonth: [],
      earlier: sortedMemos, // 모든 메모를 earlier 카테고리에 넣음
      liveShare: [] // Live Share 메모 카테고리 추가
    };
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeek = new Date(today);
  thisWeek.setDate(today.getDate() - today.getDay());
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const categorized = {
    today: [] as Memo[],
    thisWeek: [] as Memo[],
    thisMonth: [] as Memo[],
    earlier: [] as Memo[],
    liveShare: [] as Memo[] // Live Share 메모 카테고리 추가
  };

  memos.forEach(memo => {
    // Live Share 메모 상단 표시 옵션이 활성화되고, 메모가 Live Share 상태인 경우
    if (showLiveShareTop && memo.isLiveShareEnabled) {
      categorized.liveShare.push(memo);
      return; // Live Share 메모는 다른 카테고리에 포함되지 않음
    }

    // 정렬 옵션에 따라 날짜 기준 선택 (relevance는 날짜 기반 분류에서 제외됨)
    const dateToCheck = sortBy === 'createdAt' ? new Date(memo.createdAt) : new Date(memo.updatedAt);

    if (dateToCheck >= today) {
      categorized.today.push(memo);
    } else if (dateToCheck >= thisWeek) {
      categorized.thisWeek.push(memo);
    } else if (dateToCheck >= thisMonth) {
      categorized.thisMonth.push(memo);
    } else {
      categorized.earlier.push(memo);
    }
  });

  // 각 카테고리 내에서 정렬 적용
  const sortCategory = (items: Memo[]) => {
    return [...items].sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'createdAt') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else {
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  categorized.today = sortCategory(categorized.today);
  categorized.thisWeek = sortCategory(categorized.thisWeek);
  categorized.thisMonth = sortCategory(categorized.thisMonth);
  categorized.earlier = sortCategory(categorized.earlier);
  categorized.liveShare = sortCategory(categorized.liveShare); // Live Share 메모 정렬

  return categorized;
};

// 카테고리 순서를 정렬 방향에 따라 반환하는 함수
export const getCategoryOrder = (sortDirection: 'asc' | 'desc' = 'desc', showLiveShareTop: boolean = false) => {
  // Live Share 메모 상단 표시 옵션이 활성화된 경우
  if (showLiveShareTop) {
    // Live Share 메모를 가장 먼저 표시하고, 그 다음 기존 순서
    return ['liveShare', ...getBaseCategoryOrder(sortDirection)];
  }

  // 기본 순서 반환
  return getBaseCategoryOrder(sortDirection);
};

// 기본 카테고리 순서를 반환하는 함수
const getBaseCategoryOrder = (sortDirection: 'asc' | 'desc' = 'desc') => {
  // 오름차순일 경우: earlier -> thisMonth -> thisWeek -> today
  // 내림차순일 경우: today -> thisWeek -> thisMonth -> earlier
  return sortDirection === 'asc'
    ? ['earlier', 'thisMonth', 'thisWeek', 'today']
    : ['today', 'thisWeek', 'thisMonth', 'earlier'];
};