/**
 * 주어진 날짜 문자열을 포맷하여 반환합니다.
 * 
 * @param dateString - ISO 형식의 날짜 문자열
 * @returns 포맷된 날짜 문자열
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();

  // 시간 차이 계산 (밀리초)
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

  // 오늘 날짜인지 확인
  if (date.toDateString() === now.toDateString()) {
    if (diffInMinutes < 1) {
      return '방금';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}분 전`;
    } else {
      return `${diffInHours}시간 전`;
    }
  }

  // 올해인지 확인
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric'
    });
  }

  // 다른 연도인 경우
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  }).replace(/\./g, '.').replace(/\s/g, ' ');
}

/**
 * 주어진 날짜 문자열을 포맷하여 반환합니다.
 * 
 * @param dateString - ISO 형식의 날짜 문자열
 * @returns 포맷된 날짜 문자열
 */
export function formatDateForSave(dateString: string | undefined): string {
  if (!dateString) {
    return '';
  }

  const date = new Date(dateString);
  const now = new Date();

  // 시간 차이 계산 (밀리초)
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

  // 오늘 날짜인지 확인
  if (date.toDateString() === now.toDateString()) {
    if (diffInMinutes < 1) {
      return '방금 전 - 저장 완료';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}분 전 - 저장 완료`;
    } else {
      return `${diffInHours}시간 전 - 저장 완료`;
    }
  }

  // 올해인지 확인
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric'
    });
  }

  // 다른 연도인 경우
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  }).replace(/\./g, '.').replace(/\s/g, ' ');
}