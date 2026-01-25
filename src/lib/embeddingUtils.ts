import { logger } from "../utils/logger";

/**
 * 임베딩 함수
 */
async function generateOpenRouterEmbedding(text: string | string[]): Promise<any> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    logger.error("OpenRouter API 키가 설정되지 않았습니다. 환경 변수(OPENROUTER_API_KEY)를 확인해주세요.");
    return null;
  }

  const model = process.env.OPENROUTER_EMBEDDING_MODEL || "openai/text-embedding-3-large";
  // 데이터베이스 스키마가 1536 차원을 요구하므로 dimensions 파라미터 지정
  const dimensions = 1536;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10초 타임아웃

    const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL,
        "X-Title": "Cromo",
      },
      body: JSON.stringify({
        model,
        input: text,
        dimensions: dimensions,
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API 오류 (${response.status}): ${errorText || '응답 없음'}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      logger.error("OpenRouter 임베딩 생성 시간 초과");
    } else {
      logger.error("OpenRouter 임베딩 생성 중 오류 발생:", {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    return null;
  }
}

/**
 * 단일 텍스트 임베딩 생성 함수
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  // OpenRouter만 사용
  const data = await generateOpenRouterEmbedding(text);
  if (data?.data?.[0]?.embedding) {
    return data.data[0].embedding;
  }

  // OpenRouter 실패 시 null 반환 (다음 주기에 재시도)
  return null;
}

/**
 * 배치 임베딩 생성 함수
 */
export async function generateBatchEmbeddings(texts: string[]): Promise<Array<number[] | null>> {
  if (texts.length === 0) {
    return [];
  }

  // OpenRouter만 사용한 배치 임베딩 시도
  try {
    const data = await generateOpenRouterEmbedding(texts);

    if (data && data.data) {
      const embeddings: Array<number[] | null> = new Array(texts.length).fill(null);

      data.data.forEach((item: any) => {
        if (item.index < embeddings.length) {
          embeddings[item.index] = item.embedding;
        }
      });

      return embeddings;
    }
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      logger.warn("OpenRouter 배치 임베딩 생성 시간 초과");
    } else {
      logger.warn("OpenRouter 배치 임베딩 생성 실패", {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // OpenRouter 실패 시 null 배열 반환 (다음 주기에 재시도)
  return new Array(texts.length).fill(null);
}