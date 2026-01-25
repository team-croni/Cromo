import { AIResult, AITaskOptions } from './types';

/**
 * OpenRouter를 호출하여 AI 응답을 가져옵니다.
 */
export async function callOpenRouter(
  prompt: string,
  systemPrompt: string = '',
  options: AITaskOptions,
  timeout: number = 20000
): Promise<AIResult> {
  const modelName = options.openrouterModel || process.env.OPENROUTER_MODEL || 'qwen/qwen3-235b-a22b-2507';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // API 키 확인
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: 'OpenRouter API 키가 설정되지 않았습니다. 환경 변수(OPENROUTER_API_KEY)를 확인해주세요.',
        model: modelName
      };
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://cromo.app", // 사이트 URL
        "X-Title": "Cromo", // 사이트 이름
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        max_tokens: options.maxTokens || 4000,
        temperature: options.temperature || 0.7,
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const result = data.choices?.[0]?.message?.content?.trim();

      if (result) {
        return {
          success: true,
          data: result,
          provider: 'openrouter',
          model: modelName
        };
      } else {
        return {
          success: false,
          error: 'OpenRouter가 빈 응답을 반환했습니다.',
          provider: 'openrouter',
          model: modelName
        };
      }
    } else {
      const errorText = await response.text();
      return {
        success: false,
        error: `OpenRouter API 오류 (${response.status}): ${errorText || '응답 없음'}`,
        provider: 'openrouter',
        model: modelName
      };
    }
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      console.log(`OpenRouter ${timeout / 1000}초 타임아웃`);
      return {
        success: false,
        error: `OpenRouter 호출 시간 초과 (${timeout / 1000}초)`,
        model: modelName
      };
    } else {
      console.log("OpenRouter 연결 실패", error);
      return {
        success: false,
        error: `OpenRouter 호출 중 오류 발생: ${error.message || '알 수 없는 오류'}`,
        model: modelName
      };
    }
  }
}
