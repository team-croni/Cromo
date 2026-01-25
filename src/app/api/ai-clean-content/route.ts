import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/utils/logger";
import { callAIService, cleanHtmlContent } from "@/lib/ai";
import {
  createCleanContentPrompt,
  CLEAN_CONTENT_SYSTEM_PROMPT
} from "@lib/ai/prompts/ai-content";

export async function POST(request: NextRequest) {
  // 요청 정보 로깅 - 수신 시점에 한 번만 기록
  logger.ai.request('AI 정리 요청 수신', request, 'openrouter, openai');

  try {
    const startTime = Date.now();
    const { content } = await request.json();

    if (!content || typeof content !== 'string') {
      // 실패 로그 기록
      const duration = Date.now() - startTime;
      logger.ai.failure('AI 정리 실패', request, 'openrouter, openai', {
        status: 400,
        message: "정리할 내용이 필요합니다.",
        reason: "요청 본문에 정리할 내용이 누락되었거나 문자열이 아닙니다.",
        duration
      });

      return NextResponse.json(
        { error: "정리할 내용이 필요합니다." },
        { status: 400 }
      );
    }

    // HTML 내용 정제
    const cleanedHtml = cleanHtmlContent(content);

    // AI 정리를 위한 프롬프트 생성
    const prompt = createCleanContentPrompt(cleanedHtml);

    // AI 서비스 호출 (OpenRouter → OpenAI)
    const result = await callAIService(prompt, '', {
      openrouterTimeout: 30000,
      openaiTimeout: 60000,
      maxTokens: 20000,
      temperature: 0.5,
      services: ['openrouter', 'openai']
    });

    if (result.success && result.data) {
      // AI 응답에서 코드 블록 시작과 끝의 백틱 제거
      let rawText = result.data.trim();

      // ``` 코드 블록이 있다면 제거
      if (rawText.startsWith('```')) {
        // 언어 지정이 있는 경우 (예: ```markdown, ```text 등) 제거
        rawText = rawText.replace(/^```[a-zA-Z]*\s*/, '').replace(/\s*```$/, '');
      }

      // 불필요한 빈 줄 제거
      const cleanedText = rawText
        .replace(/\n\s*\n\s*/g, '\n') // 2개 이상 연속된 모든 빈줄을 1개로 축소
        .trim(); // 시작과 끝의 공백 제거

      // JSON 응답인지 확인 (의미 없는 내용일 경우)
      try {
        if (cleanedText.includes('MEANINGLESS') && (cleanedText.startsWith('{') || cleanedText.startsWith('```json'))) {
             // 혹시라도 마크다운 json 블록으로 감싸져 있을 경우 한번 더 제거 시도 (위에서 제거했지만 안전장치)
             const jsonText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
             const parsed = JSON.parse(jsonText);
             if (parsed.message === 'MEANINGLESS') {
                return NextResponse.json({
                    cleanedContent: null,
                    message: 'MEANINGLESS',
                    provider: result.provider
                });
             }
        }
      } catch (e) {
        // JSON 파싱 실패 시 일반 텍스트로 처리
      }

      // 성공 로그 기록
      const duration = Date.now() - startTime;
      logger.ai.success(`AI 정리 성공 (${Math.round(duration / 1000)}sec)`, request, result.provider || 'unknown', {
        model: result.model || 'unknown',
        status: 200,
        duration,
        size: JSON.stringify({ cleanedContent: cleanedText, provider: result.provider }).length
      });

      return NextResponse.json({
        cleanedContent: cleanedText,
        provider: result.provider
      });
    }

    // 모든 서비스 실패시
    const duration = Date.now() - startTime;
    logger.ai.failure('AI 정리 실패', request, result.provider || 'unknown', {
      model: result.model || 'unknown',
      status: 500,
      message: result.error || "AI 정리 서비스가 일시적으로 사용할 수 없습니다.",
      reason: `AI 서비스 호출 실패: ${result.error || '알 수 없는 오류'}`,
      duration
    });

    throw new Error(result.error || "AI 정리 서비스가 일시적으로 사용할 수 없습니다.");

  } catch (error: any) {
    console.error("AI 정리 오류:", error);

    // 예외 로그는 이미 위에서 처리되었으므로 여기서는 추가 로그 기록하지 않음
    // 단, 예외가 발생했는데 위에서 로그가 기록되지 않았다면 여기서 기록

    return NextResponse.json(
      { error: "AI 정리 서비스에 실패했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}