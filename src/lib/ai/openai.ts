import { AIResult, AITaskOptions } from './types';

/**
 * OpenAI API 호출을 위한 내부 함수
 */
async function fetchOpenAI(
  prompt: string,
  systemPrompt: string,
  options: AITaskOptions,
  timeout: number,
  model: string | undefined
): Promise<AIResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const openaiResponse = await fetch(
      process.env.OPENAI_API_URL || "http://127.0.0.1:1234/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model || "qwen/qwen3-8b",
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: options.maxTokens || 40000,
          temperature: options.temperature || 0.7
        }),
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);

    if (openaiResponse.ok) {
      const data = await openaiResponse.json();
      const result = data.choices?.[0]?.message?.content?.trim();

      if (result) {
        return {
          success: true,
          data: result,
          provider: 'openai',
          model: model || 'unknown'
        };
      } else {
        return {
          success: false,
          error: 'OpenAI가 빈 응답을 반환했습니다.',
          provider: 'openai',
          model: model || 'unknown'
        };
      }
    } else {
      const errorText = await openaiResponse.text();
      return {
        success: false,
        error: `OpenAI API 오류 (${openaiResponse.status}): ${errorText || '응답 없음'}`,
        provider: 'openai',
        model: model || 'unknown'
      };
    }
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      console.log(`OpenAI ${timeout / 1000}초 타임아웃`);
      return {
        success: false,
        error: `OpenAI 호출 시간 초과 (${timeout / 1000}초)`,
        provider: 'openai',
        model: model || 'unknown'
      };
    } else {
      console.log("OpenAI 연결 실패", error);
      return {
        success: false,
        error: `OpenAI 호출 중 오류 발생: ${error.message || '알 수 없는 오류'}`,
        provider: 'openai',
        model: model || 'unknown'
      };
    }
  }
}

/**
 * OpenAI를 호출하여 AI 응답을 가져옵니다. 모델 폴백 기능을 포함합니다.
 */
export async function callOpenAI(
  prompt: string,
  systemPrompt: string,
  options: AITaskOptions,
  timeout: number = 15000,
  preferredModel: 'pro' | 'flash' | null = null
): Promise<AIResult> {
  // preferredModel이 지정된 경우 해당 모델로 먼저 시도
  if (preferredModel === 'pro') {
    let result = await fetchOpenAI(prompt, systemPrompt, options, timeout, process.env.OPENAI_MODEL_PRO);
    if (result.success) {
      return result;
    }

    // 실패하면 FLASH로 재시도 (타임아웃 초기화)
    console.log(`OPENAI_MODEL_PRO failed: ${result.error}, retrying with OPENAI_MODEL_FLASH`);
    result = await fetchOpenAI(prompt, systemPrompt, options, timeout, process.env.OPENAI_MODEL_FLASH);
    return result;
  } else if (preferredModel === 'flash') {
    let result = await fetchOpenAI(prompt, systemPrompt, options, timeout, process.env.OPENAI_MODEL_FLASH);
    if (result.success) {
      return result;
    }

    // 실패하면 PRO로 재시도 (타임아웃 초기화)
    console.log(`OPENAI_MODEL_FLASH failed: ${result.error}, retrying with OPENAI_MODEL_PRO`);
    result = await fetchOpenAI(prompt, systemPrompt, options, timeout, process.env.OPENAI_MODEL_PRO);
    return result;
  } else {
    // 기본 동작: OPENAI_MODEL_PRO로 먼저 시도
    let result = await fetchOpenAI(prompt, systemPrompt, options, timeout, process.env.OPENAI_MODEL_PRO);
    if (result.success) {
      return result;
    }

    // 실패하면 OPENAI_MODEL_FLASH로 재시도 (타임아웃 초기화)
    console.log(`OPENAI_MODEL_PRO failed: ${result.error}, retrying with OPENAI_MODEL_FLASH`);
    result = await fetchOpenAI(prompt, systemPrompt, options, timeout, process.env.OPENAI_MODEL_FLASH);
    return result;
  }
}
