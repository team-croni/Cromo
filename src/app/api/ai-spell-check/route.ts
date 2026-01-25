import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/utils/logger";
import {
  createSpellCheckJsonPrompt,
} from "@lib/ai/prompts/ai-content";
import { callAIService } from "@/lib/ai";

export async function POST(request: NextRequest) {
  // 요청 정보 로깅 - 수신 시점에 한 번만 기록
  logger.ai.request('AI 오타 수정 요청 수신', request, 'openrouter, openai');

  try {
    const startTime = Date.now();
    const { content } = await request.json();

    // AI 서비스 호출 (OpenRouter → OpenAI)
    const result = await callAIService(createSpellCheckJsonPrompt(content), '', {
      openrouterTimeout: 20000,
      openaiTimeout: 60000,
      maxTokens: 5000,
      services: ['openrouter', 'openai'],
    });

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
        const corrections = JSON.parse(jsonData);

        // 응답이 배열인지 확인
        if (!Array.isArray(corrections)) {
          throw new Error("응답이 배열 형식이 아닙니다.");
        }

        // 각 항목이 올바른 형식인지 확인
        const validCorrections = corrections.filter((item: any) =>
          item && typeof item === 'object' &&
          'delete' in item && 'insert' in item &&
          typeof item.delete === 'string' && typeof item.insert === 'string'
        );

        // 성공 로그 기록
        const duration = Date.now() - startTime;
        logger.ai.success(`AI 오타 수정 성공 (${Math.round(duration / 1000)}sec)`, request, result.provider || 'unknown', {
          model: result.model || 'unknown',
          status: 200,
          duration,
          size: JSON.stringify({ corrections: validCorrections, provider: result.provider }).length
        });

        return NextResponse.json({
          corrections: validCorrections,
          provider: result.provider
        });
      } catch (parseError: any) {
        // JSON 파싱 실패 로그 기록
        const duration = Date.now() - startTime;
        logger.ai.failure('AI 오타 수정 실패', request, result.provider || 'unknown', {
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
    logger.ai.failure('AI 오타 수정 실패', request, result.provider || 'unknown', {
      model: result.model || 'unknown',
      status: 500,
      message: result.error || "AI 오타 수정 서비스가 일시적으로 사용할 수 없습니다.",
      reason: `AI 서비스 호출 실패: ${result.error || '알 수 없는 오류'}`,
      duration
    });

    throw new Error(result.error || "AI 오타 수정 서비스가 일시적으로 사용할 수 없습니다.");

  } catch (error: any) {
    console.error("AI 오타 수정 JSON 오류:", error);

    return NextResponse.json(
      { error: "AI 오타 수정 서비스에 실패했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}