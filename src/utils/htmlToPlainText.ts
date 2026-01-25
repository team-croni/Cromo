import { convert } from 'html-to-text';

/**
 * HTML 콘텐츠를 플레인 텍스트로 변환하는 유틸리티 함수
 * 임베딩 생성을 위한 전처리에 사용됨
 * 
 * @param html - 변환할 HTML 문자열
 * @returns 플레인 텍스트 문자열
 */
export function htmlToPlainText(html: string): string {
  if (!html || html === '<p></p>' || html === '') return '';

  return convert(html, {
    wordwrap: false,
    selectors: [
      { selector: 'a', options: { ignoreHref: true } },
      { selector: 'img', format: 'skip' },
      { selector: 'br', format: 'skip' },
      { selector: 'hr', format: 'skip' },
      { selector: 'code', format: 'inlineSurround', options: { prefix: '`', suffix: '`' } },
      { selector: 'pre', format: 'block', options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } },
    ],
  });
}