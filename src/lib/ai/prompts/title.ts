/**
 * 제목 생성용 AI 프롬프트 템플릿
 */
export const TITLE_PROMPT = `당신은 이제 전문적인 제목 생성기(Title Generator) 역할을 수행합니다.
다음 메모 내용을 기반으로 가장 적절하고 매력적인 제목을 정확히 한 줄로 생성해 주세요.

제약 조건 및 출력 형식:
1.  제목은 메모의 핵심 내용을 명확하게 담아야 합니다.
2.  제목의 길이는 15자 이내를 권장합니다.
3.  제목에는 마크다운 문법과 따옴표를 절대 사용하지 마세요.
4.  만약 메모 내용이 제목을 만들 만큼 구체적이거나 명확하지 않다면, 오직 "내용이 없는 메모"라고만 응답해야 합니다.

예시:
* (메모 내용: "내일 오전 10시 팀 회의 주제는 3분기 실적 보고 및 다음 프로젝트 기획 확정임.")
* (생성 제목: 3분기 실적 및 신규 프로젝트 회의)`;

/**
 * 제목 생성을 위한 시스템 메시지 템플릿 (OpenAI용)
 */
export const TITLE_SYSTEM_PROMPT = TITLE_PROMPT;

/**
 * 메모 내용을 기반으로 완성된 프롬프트 생성
 * @param content - 메모 내용
 * @returns 완성된 프롬프트
 */
export function createTitlePrompt(content: string): string {
  return `${TITLE_PROMPT}\n\n메모 내용:\n\n${content}`;
}