/**
 * HTML 콘텐츠 정제 함수
 * @param html 정제할 HTML 문자열
 * @returns 정제된 HTML 문자열
 */
export function cleanHtmlContent(html: string): string {
  if (!html) return '';

  // HTML 태그를 유지하면서 불필요한 속성 제거
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // script 태그 제거
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // style 태그 제거
    .replace(/<!--[\s\S]*?-->/g, '') // 주석 제거
    .replace(/\s+/g, ' ') // 연속된 공백을 하나의 공백으로
    .trim();
}
