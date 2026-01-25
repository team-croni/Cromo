import { AIResult, AITaskOptions } from './types';
import { callOpenRouter } from './openrouter';
import { callOpenAI } from './openai';

export * from './types';
export * from './clean-html';
export * from './openrouter';
export * from './openai';

/**
 * AI 서비스 순차 호출 (options.services 기반)
 * 설정된 서비스 목록을 순서대로 시도하며 성공할 때까지 실행합니다.
 */
export async function callAIService(
  prompt: string,
  systemPrompt: string = '',
  options: AITaskOptions = {},
): Promise<AIResult> {
  const {
    openrouterTimeout = 20000,
    openaiTimeout = 10000,
    services = ['openrouter', 'openai']
  } = options;

  const errors: string[] = [];
  const attemptedModels: string[] = [];

  // 서비스 순차 실행
  for (const service of services) {
    let result: AIResult;

    if (service === 'openrouter') {
      result = await callOpenRouter(prompt, systemPrompt, options, openrouterTimeout);
    } else if (service === 'openai:pro') {
      result = await callOpenAI(prompt, systemPrompt, options, openaiTimeout, 'pro');
    } else if (service === 'openai:flash') {
      result = await callOpenAI(prompt, systemPrompt, options, openaiTimeout, 'flash');
    } else { // 'openai'
      result = await callOpenAI(prompt, systemPrompt, options, openaiTimeout, null);
    }

    if (result.success) {
      return result;
    }

    // 실패 시 정보 수집
    errors.push(`${service} 실패: ${result.error || '알 수 없는 오류'}`);
    if (result.model) {
      attemptedModels.push(result.model);
    }
  }

  // 모든 서비스 실패 시
  return {
    success: false,
    error: errors.join(' | '),
    model: attemptedModels.join(', ')
  };
}
