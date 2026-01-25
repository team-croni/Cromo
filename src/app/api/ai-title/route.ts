import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/utils/logger";
import { createTitlePrompt } from "@lib/ai/prompts/title";
import { callAIService } from "@/lib/ai";

export async function POST(request: NextRequest) {
  // 요청 정보 로깅 - 수신 시점에 한 번만 기록
  logger.ai.request('AI 제목 생성 요청 수신', request, 'openai:flash, openrouter');

  try {
    const startTime = Date.now();
    const { content } = await request.json();

    // AI 서비스 호출 (OpenRouter → OpenAI)
    const result = await callAIService(
      createTitlePrompt(content), '',
      {
        openrouterTimeout: 10000,
        openaiTimeout: 30000,
        maxTokens: 2000,
        temperature: 0.7,
        services: ['openai:flash', 'openrouter'],
      }
    );

    if (result.success && result.data) {
      try {
        // 생성된 제목 추출 및 정제
        let generatedTitle = result.data.trim();

        // 앞뒤 공백 제거
        generatedTitle = generatedTitle.trim();

        // 따옴표 제거: 앞뒤에 있는 따옴표("") 또는 작은따옴표('') 제거
        if (generatedTitle.startsWith('"') && generatedTitle.endsWith('"')) {
          generatedTitle = generatedTitle.slice(1, -1);
        } else if (generatedTitle.startsWith("'") && generatedTitle.endsWith("'")) {
          generatedTitle = generatedTitle.slice(1, -1);
        }

        if (!generatedTitle) {
          // 실패 로그 기록
          const duration = Date.now() - startTime;
          logger.ai.failure('AI 제목 생성 실패', request, result.provider || 'unknown', {
            model: result.model || 'unknown',
            status: 500,
            message: "유효한 응답을 생성할 수 없습니다.",
            reason: "AI가 빈 응답을 반환했습니다.",
            duration
          });

          throw new Error("유효한 응답을 생성할 수 없습니다.");
        }

        // 성공 로그 기록
        const duration = Date.now() - startTime;
        logger.ai.success(`AI 제목 생성 성공 (${Math.round(duration / 1000)}sec)`, request, result.provider || 'unknown', {
          model: result.model || 'unknown',
          status: 200,
          duration,
          size: JSON.stringify({ title: generatedTitle, provider: result.provider }).length
        });

        return NextResponse.json({
          title: generatedTitle,
          provider: result.provider
        });
      } catch (parseError: any) {
        console.error("제목 생성 오류:", parseError);

        // 실패 로그 기록
        const duration = Date.now() - startTime;
        logger.ai.failure('AI 제목 생성 실패', request, result.provider || 'unknown', {
          model: result.model || 'unknown',
          status: 500,
          message: "AI 응답 처리 중 오류가 발생했습니다.",
          reason: `제목 생성 오류: ${parseError.message || '알 수 없는 오류'}`,
          duration
        });

        throw new Error("AI 응답 처리 중 오류가 발생했습니다.");
      }
    }

    // 모든 서비스 실패시
    const duration = Date.now() - startTime;
    logger.ai.failure('AI 제목 생성 실패', request, result.provider || 'unknown', {
      model: result.model || 'unknown',
      status: 500,
      message: result.error || "AI 제목 생성 서비스가 일시적으로 사용할 수 없습니다.",
      reason: `AI 서비스 호출 실패: ${result.error || '알 수 없는 오류'}`,
      duration
    });

    throw new Error(result.error || "AI 제목 생성 서비스가 일시적으로 사용할 수 없습니다.");

  } catch (error: any) {
    console.error("AI 제목 생성 오류:", error);

    return NextResponse.json(
      { error: "AI 제목 생성에 실패했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}