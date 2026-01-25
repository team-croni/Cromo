import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/utils/logger";
import { createFolderTitlePrompt } from "@lib/ai/prompts/folder-title";
import { callAIService } from "@/lib/ai";

// 허용된 아이콘과 색상 목록 (임시로 정의)
const AVAILABLE_ICON_NAMES = [
  "folder", "document", "book", "note", "archive", "box", "briefcase",
  "calendar", "clipboard", "database", "file", "folder-open", "inbox",
  "layers", "package", "stack", "tag", "target", "terminal", "users"
];

const AVAILABLE_COLOR_NAMES = [
  "blue", "green", "red", "yellow", "purple", "pink", "indigo",
  "gray", "orange", "teal", "cyan", "lime", "emerald", "rose",
  "amber", "violet", "fuchsia", "sky", "slate", "stone"
];

export async function POST(request: NextRequest) {
  // 요청 정보 로깅 - 수신 시점에 한 번만 기록
  logger.ai.request('AI 폴더 제목 생성 요청 수신', request, 'openrouter, openai');

  try {
    const startTime = Date.now();
    const { memos } = await request.json();

    if (!memos || !Array.isArray(memos) || memos.length === 0) {
      // 실패 로그 기록
      const duration = Date.now() - startTime;
      logger.ai.failure('AI 폴더 제목 생성 실패', request, 'openrouter, openai', {
        status: 400,
        message: "메모 목록이 필요합니다.",
        reason: "요청 본문에 메모 목록이 누락되었습니다.",
        duration
      });

      return NextResponse.json(
        { error: "메모 목록이 필요합니다." },
        { status: 400 }
      );
    }

    // 메모 내용을 하나의 문자열로 결합
    const combinedContent = memos.map((memo: { title: string | null; content: string | null }) => {
      const title = memo.title || "제목 없음";
      const content = memo.content || "";
      return `제목: ${title}\n내용: ${content}`;
    }).join('\n\n---\n\n');

    if (combinedContent.length < 50) {
      // 실패 로그 기록
      const duration = Date.now() - startTime;
      logger.ai.failure('AI 폴더 제목 생성 실패', request, 'openrouter, openai', {
        status: 400,
        message: "메모 내용이 너무 짧습니다. 최소 50자 이상이어야 합니다.",
        reason: `메모 내용 길이가 부족합니다. 현재 길이: ${combinedContent.length}자`,
        duration
      });

      return NextResponse.json(
        { error: "메모 내용이 너무 짧습니다. 최소 50자 이상이어야 합니다." },
        { status: 400 }
      );
    }

    const prompt = createFolderTitlePrompt(combinedContent);

    // AI 서비스 호출 (OpenRouter → OpenAI)
    const result = await callAIService(
      prompt,
      '',
      {
        openrouterTimeout: 30000,
        openaiTimeout: 60000,
        maxTokens: 2000,
        temperature: 0.7,
        services: ['openrouter', 'openai'],
      }
    );

    if (result.success && result.data) {
      try {
        // AI 응답에서 JSON 코드 블록 제거 및 정제
        let jsonData = result.data.trim();

        // ```json 코드 블록이 있다면 제거
        if (jsonData.startsWith('```json')) {
          jsonData = jsonData.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (jsonData.startsWith('```')) {
          jsonData = jsonData.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        // 앞뒤 공백 제거
        jsonData = jsonData.trim();

        // JSON 응답 파싱
        const parsed = JSON.parse(jsonData);

        // 따옴표 제거: 앞뒤에 있는 따옴표("") 또는 작은따옴표('') 제거
        let title = parsed.title?.toString().trim() || "";
        if (title.startsWith('"') && title.endsWith('"')) {
          title = title.slice(1, -1);
        } else if (title.startsWith("'") && title.endsWith("'")) {
          title = title.slice(1, -1);
        }

        const icon = parsed.icon?.toString().trim() || "";
        const color = parsed.color?.toString().trim() || "";

        // 허용된 아이콘과 색상인지 검증
        const isValidIcon = AVAILABLE_ICON_NAMES.includes(icon);
        const isValidColor = AVAILABLE_COLOR_NAMES.includes(color);

        if (title && icon && color && isValidIcon && isValidColor) {
          // 성공 로그 기록
          const duration = Date.now() - startTime;
          logger.ai.success(`AI 폴더 제목 생성 성공 (${Math.round(duration / 1000)}sec)`, request, result.provider || 'unknown', {
            model: result.model || 'unknown',
            status: 200,
            duration,
            size: JSON.stringify({ title, icon, color, provider: result.provider }).length
          });

          return NextResponse.json({
            title,
            icon,
            color,
            provider: result.provider,
            memoCount: memos.length
          });
        } else {
          // 실패 로그 기록
          const duration = Date.now() - startTime;
          logger.ai.failure('AI 폴더 제목 생성 실패', request, result.provider || 'unknown', {
            model: result.model || 'unknown',
            status: 500,
            message: "AI가 유효하지 않은 응답을 반환했습니다.",
            reason: `AI 응답 검증 실패: title=${title}, icon=${icon}, color=${color}, iconValid=${isValidIcon}, colorValid=${isValidColor}`,
            duration
          });

          throw new Error("AI가 유효하지 않은 응답을 반환했습니다.");
        }
      } catch (parseError: any) {
        console.error("JSON 파싱 오류:", parseError);
        console.error('원본 AI 응답:', result.data);

        // JSON 파싱 실패 로그 기록
        const duration = Date.now() - startTime;
        logger.ai.failure('AI 폴더 제목 생성 실패', request, result.provider || 'unknown', {
          model: result.model || 'unknown',
          status: 500,
          message: "AI 응답의 JSON 형식이 올바르지 않습니다.",
          reason: `JSON 파싱 오류: ${parseError.message || '알 수 없는 오류'}`,
          duration
        });

        throw new Error("AI 응답의 JSON 형식이 올바르지 않습니다.");
      }
    }

    // 모든 서비스 실패시
    const duration = Date.now() - startTime;
    logger.ai.failure('AI 폴더 제목 생성 실패', request, result.provider || 'unknown', {
      model: result.model || 'unknown',
      status: 500,
      message: result.error || "AI 폴더 제목 생성 서비스가 일시적으로 사용할 수 없습니다.",
      reason: `AI 서비스 호출 실패: ${result.error || '알 수 없는 오류'}`,
      duration
    });

    throw new Error(result.error || "AI 폴더 제목 생성 서비스가 일시적으로 사용할 수 없습니다.");

  } catch (error: any) {
    console.error("AI 폴더명 생성 오류:", error);

    return NextResponse.json(
      { error: "AI 폴더명 생성에 실패했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}