import TurndownService from 'turndown';

// Turndown 서비스 인스턴스 생성
export const turndownService = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  strongDelimiter: '**',
  linkStyle: 'inlined',
  linkReferenceStyle: 'full',
});

// 마크다운인지 감지하는 함수
export const isMarkdown = (text: string): boolean => {
  // 텍스트가 너무 짧으면 마크다운으로 판단하지 않음
  if (text.length < 10) {
    console.log('마크다운이 아닌 이유: 텍스트가 너무 짧음');
    return false;
  }

  // 마크다운 형식의 특징적인 패턴을 검사
  const markdownPatterns = [
    { pattern: /^\s*#{1,6}\s/m, name: '헤딩' },
    { pattern: /\*\*[^*]+\*\*/g, name: '볼드' },
    { pattern: /\[.*?\]\(.*?\)/g, name: '링크' },
    { pattern: /`{3}[\s\S]*?`{3}/, name: '코드 블록' },
    { pattern: /`[^`]+`/, name: '인라인 코드' },
  ];

  // 각 패턴이 일치하는 횟수를 계산
  let matchCount = 0;
  const matchedPatterns: string[] = [];

  for (const { pattern, name } of markdownPatterns) {
    if (pattern.global) {
      // 전역 검색 패턴의 경우
      const matches = text.match(pattern);
      if (matches) {
        matchCount += matches.length;
        matchedPatterns.push(`${name} (${matches.length}개 발견)`);
      }
    } else {
      // 단일 검색 패턴의 경우
      if (pattern.test(text)) {
        matchCount += 1;
        matchedPatterns.push(name);
      }
    }
  }

  console.log(`마크다운 패턴 매칭 결과: ${matchCount}개 매칭됨`, matchedPatterns);

  // 일치하는 패턴이 2개 이상이면 마크다운으로 판단
  const isMd = matchCount >= 2;
  if (isMd) {
    console.log('마크다운인 이유:', matchedPatterns);
  } else {
    console.log('마크다운이 아닌 이유: 매칭된 패턴이 2개 미만');
  }

  return isMd;
};