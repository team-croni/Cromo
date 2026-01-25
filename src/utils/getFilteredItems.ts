import { FilterOptions, Folder, Memo } from "@/types";
import { htmlToPlainText } from "@/utils/htmlToPlainText";

// 빈 메모 또는 거의 비어있는 메모인지 확인하는 함수
const isEmptyMemo = (memo: Memo): boolean => {
  // 제목이 '새로운 메모'이고 내용이 비어있거나 빈 태그만 있는 경우
  if (memo.title === '새로운 메모') {
    const plainTextContent = htmlToPlainText(memo.content || '');
    // 내용이 비어있거나 공백 문자만 있는 경우
    if (!plainTextContent || plainTextContent.trim().length === 0) {
      return true;
    }
  }
  return false;
};

// 검색어가 일반적인 단어인지 확인하는 함수 ('메모'와 같은 일반적인 단어)
const isCommonWord = (term: string): boolean => {
  const commonWords = ['메모'];
  return commonWords.includes(term.toLowerCase());
};

// 필터링된 메모 계산
export const getFilteredMemos = (memos: Memo[], filterOptions: FilterOptions) => {
  let result = [...memos];

  // 아카이브 필터링 - showArchived가 false인 경우 아카이브된 메모 제외
  if (!filterOptions.showArchived) {
    result = result.filter(memo => !memo.isArchived);
  }

  // 날짜 필터링 (항상 수정일 기준)
  if (filterOptions.dateFrom || filterOptions.dateTo) {
    result = result.filter(memo => {
      const memoDate = new Date(memo.updatedAt);
      const memoDateStr = `${memoDate.getFullYear()}-${String(memoDate.getMonth() + 1).padStart(2, '0')}-${String(memoDate.getDate()).padStart(2, '0')}`;

      if (filterOptions.dateFrom) {
        if (memoDateStr < filterOptions.dateFrom) return false;
      }

      if (filterOptions.dateTo) {
        if (memoDateStr > filterOptions.dateTo) return false;
      }

      return true;
    });
  }

  // 정렬
  result.sort((a, b) => {
    let comparison = 0;

    if (filterOptions.sortBy === 'title') {
      comparison = a.title.localeCompare(b.title);
    } else if (filterOptions.sortBy === 'createdAt') {
      comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (filterOptions.sortBy === 'relevance') {
      // 관련도 순 정렬 - rrfScore 또는 textMatchCount가 있는 경우 사용
      const aRelevance = (a as any).rrfScore || (a as any).textMatchCount || 0;
      const bRelevance = (b as any).rrfScore || (b as any).textMatchCount || 0;
      comparison = aRelevance - bRelevance; // 내림차순 (높은 점수 먼저)
    } else {
      comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    }

    // sortDirection이 'desc'인 경우 결과를 반전시킴
    return filterOptions.sortDirection === 'asc' ? comparison : -comparison;
  });

  return result;
};

// 필터링된 폴더 계산
export const getFilteredFolders = (folders: Folder[], searchTerm: string) => {
  // searchTerm이 undefined일 경우 빈 문자열로 처리
  if (!searchTerm || searchTerm === "") return folders;

  return folders.filter(
    folder =>
      folder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      folder.memos.some(memo =>
        memo.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );
};