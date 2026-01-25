/**
 * 검색 키워드를 하이라이트 처리하는 유틸리티 함수들
 */

/**
 * 주어진 텍스트에서 검색어를 찾아 하이라이트 처리된 HTML 문자열을 반환
 * @param text 원본 텍스트
 * @param searchTerm 검색어
 * @returns 하이라이트 처리된 HTML 문자열
 */
export const highlightSearchTermsAsHtml = (text: string, searchTerm: string): string => {
  if (!searchTerm || !text) {
    return text || '';
  }

  // 대소문자 구분 없이 검색
  const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-700 px-0.5 rounded">$1</mark>');
};

/**
 * 정규식 특수문자를 이스케이프 처리
 * @param str 이스케이프 처리할 문자열
 * @returns 이스케이프 처리된 문자열
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 검색어와 일치하는 텍스트의 첫 번째 위치를 찾음
 * @param text 원본 텍스트
 * @param searchTerm 검색어
 * @returns 일치하는 위치의 인덱스, 없으면 -1
 */
export const findFirstMatchIndex = (text: string, searchTerm: string): number => {
  if (!searchTerm || !text) {
    return -1;
  }

  return text.toLowerCase().indexOf(searchTerm.toLowerCase());
};

/**
 * 검색어와 일치하는 텍스트 주위의 컨텐츠를 추출
 * @param text 원본 텍스트
 * @param searchTerm 검색어
 * @param contextLength 앞뒤로 포함할 문자 수
 * @returns 컨텍스트와 함께 추출된 텍스트
 */
export const extractContextAroundMatch = (text: string, searchTerm: string, contextLength: number = 50): string => {
  if (!searchTerm || !text) {
    return text || '';
  }

  const matchIndex = findFirstMatchIndex(text, searchTerm);
  if (matchIndex === -1) {
    // 일치하는 항목이 없으면 원본 텍스트의 처음부터 contextLength만큼 반환
    return text.length <= contextLength ? text : text.substring(0, contextLength) + '...';
  }

  // 일치하는 위치 주위의 컨텍스트를 계산
  const startIndex = Math.max(0, matchIndex - contextLength);
  const endIndex = Math.min(text.length, matchIndex + searchTerm.length + contextLength);

  let result = text.substring(startIndex, endIndex);

  // 시작이나 끝이 텍스트의 중간이면 ...을 추가
  if (startIndex > 0) {
    result = '...' + result;
  }
  if (endIndex < text.length) {
    result = result + '...';
  }

  return result;
};

/**
 * 텍스트에서 검색어와 일치하는 부분을 하이라이트 처리할 수 있도록 토큰 배열로 분할
 * @param text 원본 텍스트
 * @param searchTerm 검색어
 * @returns 텍스트 토큰과 하이라이트 여부를 포함한 객체 배열
 */
export function getHighlightTokens(text: string, searchTerm: string): Array<{ text: string; isHighlighted: boolean }> {
  if (!searchTerm || !text) {
    return [{ text: text || '', isHighlighted: false }];
  }

  // HTML 태그를 임시로 대체하여 검색 시 문제를 방지
  const tempReplacements: { [key: string]: string } = {};
  let tempText = text;

  // HTML 태그들을 임시 식별자로 대체
  tempText = tempText.replace(/<[^>]*>/g, (match) => {
    const placeholder = `__HTML_TAG_${Object.keys(tempReplacements).length}__`;
    tempReplacements[placeholder] = match;
    return placeholder;
  });

  // 대소문자 구분 없이 검색
  const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
  const parts = tempText.split(regex);

  const tokens: Array<{ text: string; isHighlighted: boolean }> = [];

  parts.forEach((part, index) => {
    // 임시 식별자를 원래 HTML 태그로 복원
    let restoredPart = part;
    Object.entries(tempReplacements).forEach(([placeholder, original]) => {
      restoredPart = restoredPart.replace(new RegExp(placeholder, 'g'), original);
    });

    if (restoredPart.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !restoredPart.startsWith('__HTML_TAG_')) {
      // 실제 검색어와 일치하는 부분만 분할하여 하이라이트 처리
      const subParts = restoredPart.split(new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi'));
      subParts.forEach(subPart => {
        if (subPart.toLowerCase() === searchTerm.toLowerCase()) {
          tokens.push({ text: subPart, isHighlighted: true });
        } else {
          tokens.push({ text: subPart, isHighlighted: false });
        }
      });
    } else {
      tokens.push({ text: restoredPart, isHighlighted: false });
    }
  });

  return tokens;
}