import { AVAILABLE_ICON_NAMES, AVAILABLE_COLOR_NAMES } from "@/constants/folder-constants";

/**
 * 폴더명 생성용 AI 프롬프트 템플릿
 */
export const FOLDER_TITLE_PROMPT = `당신은 이제 전문적인 폴더명 생성기(Folder Title Generator) 역할을 수행합니다.
제공된 폴더 내 모든 메모 내용을 종합적으로 분석하고, 이를 바탕으로 향후 해당 폴더에 추가될 내용을 포괄할 수 있는 가장 적절하고 매력적인 폴더명, 아이콘, 색상을 제안해 주세요.

제약 조건 및 출력 형식:
1. 폴더명 (title):
* 메모들의 공통된 주제를 바탕으로 향후 추가될 내용을 아우르는 포괄적인 카테고리를 명확하게 나타내야 합니다.
* 길이는 10자 이내로 단순하게 작성해야 합니다.
* 마크다운 문법(*, # 등)과 따옴표(" ")를 절대 사용하지 마세요.
* 만약 메모 내용이 폴더명을 만들 만큼 구체적이거나 명확하지 않다면, 응답의 title 필드에 "일반 메모"라고만 작성해야 합니다.
2. 아이콘 (icon):
* 다음 사용 가능한 아이콘 목록에서 가장 적절한 하나를 선택해야 합니다: ${AVAILABLE_ICON_NAMES.join(', ')}
3. 색상 (color):
* 다음 사용 가능한 색상 목록에서 가장 적절한 하나를 선택해야 합니다: ${AVAILABLE_COLOR_NAMES.join(', ')}
4. 출력 형식:
* 결과는 반드시 다음 JSON 형식으로만 출력해야 합니다: { "title": "폴더명", "icon": "아이콘명", "color": "색상명" }

예시:
* (메모 내용: "React 컴포넌트 개발, TypeScript 설정, API 연동")
* (생성 결과: {"title": "프론트엔드 개발", "icon": "Code", "color": "blue"})`;

/**
 * 폴더명 생성을 위한 시스템 메시지 템플릿 (OpenAI용)
 */
export const FOLDER_TITLE_SYSTEM_PROMPT = FOLDER_TITLE_PROMPT;

/**
 * 폴더 내 메모 내용을 기반으로 완성된 프롬프트 생성
 * @param combinedContent - 합쳐진 메모 내용
 * @returns 완성된 프롬프트
 */
export function createFolderTitlePrompt(combinedContent: string): string {
  return `${FOLDER_TITLE_PROMPT}

폴더 내 메모들:

${combinedContent}`;
}