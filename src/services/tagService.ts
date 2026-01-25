import { htmlToPlainText } from "@utils/htmlToPlainText";
import { callAIService } from "@lib/ai";
import { prisma } from "@lib/db/prisma";
import { generateBatchEmbeddings } from "@lib/embeddingUtils";
import { createTagPrompt } from "@lib/ai/prompts/tag";

/**
 * 카테고리 자동 할당 서비스
 */
class tagService {
  private isTagEmbeddingProcessing: boolean = false;

  /**
   * 특정 메모에 대한 카테고리 자동 할당
   * @param memoId - 카테고리를 할당할 메모의 ID
   * @param title - 메모 제목
   * @param content - 메모 내용 (HTML)
   * @param currentContentHash - 현재 메모의 콘텐츠 해시 (선택사항)
   */
  async assignTaggingToMemo(memoId: string, title: string, content: string | null) {
    try {
      // 메모 내용을 기반으로 카테고리 생성
      const plainTextContent = content ? htmlToPlainText(content) : "";
      const contentFortag = title === '새로운 메모' ? plainTextContent : `${title} ${plainTextContent}`;

      if (contentFortag.trim().length > 0) {
        const prompt = createTagPrompt(contentFortag);
        const result = await callAIService(prompt, '', {
          services: ['openrouter', 'openai'],
          openrouterTimeout: 8000,
          openaiTimeout: 60000,
          maxTokens: 2000,
          temperature: 0.7
        });

        if (result.success && result.data) {
          try {
            // JSON 배열 파싱
            const categories = JSON.parse(result.data);

            // 새로 생성된 태그 수를 추적
            let newlyCreatedTagsCount = 0;

            // 기존 태그 제거
            await prisma.memo.update({
              where: {
                id: memoId
              },
              data: {
                tags: {
                  set: [] // 모든 태그 연결 해제
                }
              }
            });

            // 새 태그 추가
            if (Array.isArray(categories) && categories.length > 0) {
              const tagConnections = [];

              for (const tagName of categories.slice(0, 5)) { // 최대 5개까지만 추가
                if (typeof tagName === 'string' && tagName.trim().length > 0) {
                  // 태그 생성 또는 가져오기
                  let tag = await prisma.tag.findUnique({
                    where: { name: tagName.trim() }
                  });

                  if (!tag) {
                    tag = await prisma.tag.create({
                      data: { name: tagName.trim() }
                    });
                    // 새로 생성된 태그 수 증가
                    newlyCreatedTagsCount++;
                  }

                  // 연결할 태그 ID 수집
                  tagConnections.push({ id: tag.id });
                }
              }

              // 메모와 모든 태그 일괄 연결
              if (tagConnections.length > 0) {
                await prisma.memo.update({
                  where: {
                    id: memoId
                  },
                  data: {
                    tags: {
                      connect: tagConnections
                    }
                  }
                });
              }
            }

            // 태그 임베딩 즉시 생성
            await this.generateTagEmbeddingForMemo(memoId);

          } catch (parseError) {
            console.error('카테고리 JSON 파싱 오류:', parseError);
          }
        }
      }

      // 카테고리가 없거나 처리되지 않은 경우 새로 생성된 태그 수는 0
      return 0;
    } catch (error) {
      console.error('카테고리 자동 할당 중 오류 발생:', error);
      throw error;
    }
  }

  /**
   * 특정 메모에 대한 태그 임베딩 생성
   * @param memoId - 태그 임베딩을 생성할 메모의 ID
   */
  async generateTagEmbeddingForMemo(memoId: string): Promise<boolean> {
    try {
      // 메모와 태그 정보 조회
      const memo = await prisma.memo.findUnique({
        where: { id: memoId, isUserDeleted: false },
        include: { tags: true }
      });

      // 메모가 존재하고 태그가 있는 경우에만 처리
      if (memo && memo.tags.length > 0) {
        // 태그 이름들을 텍스트로 변환하여 임베딩 생성
        const tagNames = memo.tags.map((tag: { name: string }) => tag.name);
        const textForEmbedding = tagNames.join(" ");
        const embeddings = await generateBatchEmbeddings([textForEmbedding]);

        if (embeddings.length > 0 && embeddings[0]) {
          // Raw query로 tagEmbedding 업데이트
          const embeddingArrayString = JSON.stringify(embeddings[0]);

          await prisma.$executeRaw`
            UPDATE "Memo"
            SET "tagEmbedding" = ${embeddingArrayString}::vector
            WHERE id = ${memoId}
          `;

          return true;
        }
      }
      return false;
    } catch (error) {
      console.error(`태그 임베딩 생성 실패 (memoId: ${memoId}):`, error);
      // 에러가 발생한 경우, 해당 메모의 임베딩 정보를 제거하여 다음 주기에 다시 시도할 수 있도록 함
      try {
        await prisma.$executeRaw`
          UPDATE "Memo"
          SET "tagEmbedding" = NULL
          WHERE id = ${memoId}
        `;
      } catch (cleanupError) {
        console.error(`태그 임베딩 실패 후 정리 작업 실패 (memoId: ${memoId}):`, cleanupError);
      }
      // 에러가 발생해도 전체 프로세스가 중단되지 않도록 함
      return false;
    }
  }

  /**
   * 여러 메모에 대한 카테고리 일괄 할당 및 배치 임베딩 생성 (최적화 버전)
   */
  async assignTaggingToMemosBatch(
    memos: { id: string; title: string; content: string | null }[]
  ): Promise<void> {
    if (memos.length === 0) return;

    // 1. 모든 메모에 대해 AI 태깅 수행 (병렬)
    const taggingPromises = memos.map(async (memo) => {
      try {
        const plainTextContent = memo.content ? htmlToPlainText(memo.content) : "";
        const contentFortag = memo.title === '새로운 메모' ? plainTextContent : `${memo.title} ${plainTextContent}`;

        if (contentFortag.trim().length > 0) {
          const prompt = createTagPrompt(contentFortag);
          const result = await callAIService(prompt, '', {
            services: ['openrouter', 'openai'],
            openrouterTimeout: 8000,
            openaiTimeout: 60000,
            maxTokens: 2000,
            temperature: 0.7
          });

          if (result.success && result.data) {
            const categories = JSON.parse(result.data);

            // 기존 태그 제거 및 새 태그 연결
            await prisma.memo.update({
              where: { id: memo.id },
              data: { tags: { set: [] } }
            });

            if (Array.isArray(categories) && categories.length > 0) {
              const tagConnections = [];
              for (const tagName of categories.slice(0, 5)) {
                if (typeof tagName === 'string' && tagName.trim().length > 0) {
                  let tag = await prisma.tag.findUnique({ where: { name: tagName.trim() } });
                  if (!tag) {
                    tag = await prisma.tag.create({ data: { name: tagName.trim() } });
                  }
                  tagConnections.push({ id: tag.id });
                }
              }

              if (tagConnections.length > 0) {
                await prisma.memo.update({
                  where: { id: memo.id },
                  data: { tags: { connect: tagConnections } }
                });
              }
              return { id: memo.id, tagNames: categories.slice(0, 5) };
            }
          }
        }
      } catch (error) {
        console.error(`Batch tagging error for memo ${memo.id}:`, error);
      }
      return null;
    });

    const taggedResults = await Promise.all(taggingPromises);
    const validResults = taggedResults.filter((r): r is { id: string, tagNames: string[] } => r !== null && r.tagNames.length > 0);

    if (validResults.length > 0) {
      // 2. 태그 임베딩을 위한 배치 텍스트 생성
      const textsForEmbedding = validResults.map(r => r.tagNames.join(" "));

      // 3. 배치 임베딩 생성
      const embeddings = await generateBatchEmbeddings(textsForEmbedding);

      // 4. 태그 임베딩 일괄 업데이트
      const updatePromises = validResults.map((result, index) => {
        const embedding = embeddings[index];
        if (embedding) {
          const embeddingArrayString = JSON.stringify(embedding);
          return prisma.$executeRaw`
            UPDATE "Memo"
            SET "tagEmbedding" = ${embeddingArrayString}::vector
            WHERE id = ${result.id}
          `;
        }
        return Promise.resolve();
      });

      await Promise.all(updatePromises);
    }
  }

  /**
   * 여러 메모에 대한 카테고리 일괄 할당 (비동기적으로 처리)
   * @param memos - 카테고리를 할당할 메모들의 배열
   * @param onMemoProcessed - (옵션) 각 메모 처리 시 호출되는 콜백 함수
   */
  async assignTaggingToMemosAsync(
    memos: { id: string; title: string; content: string | null; contentHash?: string | null }[],
  ): Promise<void> {
    // Promise.all을 사용하여 모든 메모에 대한 카테고리 할당을 병렬로 처리
    const promises = memos.map(memo =>
      this.assignTaggingToMemo(memo.id, memo.title, memo.content)
        .catch(error => {
          console.error(`메모 ${memo.id}에 대한 카테고리 할당 중 오류 발생:`, error);
          // 개별 메모의 오류로 전체 프로세스가 중단되지 않도록 함
        })
    );

    await Promise.all(promises);
  }

  /**
   * 여러 메모에 대한 카테고리 일괄 할당 (순차적으로 처리)
   * @param memos - 카테고리를 할당할 메모들의 배열
   * @param onMemoProcessed - (옵션) 각 메모 처리 시 호출되는 콜백 함수
   */
  async assignTaggingToMemos(
    memos: { id: string; title: string; content: string | null; contentHash?: string | null }[],
  ): Promise<void> {
    for (const memo of memos) {
      try {
        await this.assignTaggingToMemo(memo.id, memo.title, memo.content);
      } catch (error) {
        console.error(`메모 ${memo.id}에 대한 카테고리 할당 중 오류 발생:`, error);
        // 개별 메모의 오류로 전체 프로세스가 중단되지 않도록 함
      }
    }
  }

  /**
   * 태그 임베딩 배치 처리 작업 실행
   */
  async processBatchTagEmbeddings(): Promise<{ successCount: number; totalCount: number }> {
    // 이미 처리 중이면 건너뛰기
    if (this.isTagEmbeddingProcessing) {
      return { successCount: 0, totalCount: 0 };
    }

    this.isTagEmbeddingProcessing = true;

    let successCount = 0;
    let totalCount = 0;

    try {
      // 태그가 있는 모든 메모 조회
      const memos = await prisma.memo.findMany({
        where: {
          isDeleted: false,
          isUserDeleted: false,
          tags: {
            some: {} // 태그가 하나 이상 있는 메모
          }
        },
        include: {
          tags: true
        }
      });

      totalCount = memos.length;

      if (totalCount === 0) {
        return { successCount, totalCount };
      }

      // 태그 이름들을 텍스트로 변환하여 임베딩 생성
      const textsForEmbedding = memos.map(memo => {
        return memo.tags.map((tag: { name: string }) => tag.name).join(" ");
      });

      // 배치 임베딩 생성
      const embeddings = await generateBatchEmbeddings(textsForEmbedding);

      // 각 메모에 대해 태그 임베딩 업데이트
      for (let i = 0; i < memos.length; i++) {
        const memo = memos[i];
        const embedding = embeddings[i];

        try {
          if (embedding) {
            // Raw query로 tagEmbedding 업데이트
            const embeddingArrayString = JSON.stringify(embedding);

            await prisma.$executeRaw`
              UPDATE "Memo"
              SET "tagEmbedding" = ${embeddingArrayString}::vector
              WHERE id = ${memo.id}
            `;

            successCount++;
          }
        } catch (error) {
          console.error(`태그 임베딩 업데이트 실패 (memoId: ${memo.id}):`, error);
          // 실패한 경우 해당 메모의 임베딩 정보를 제거하여 다음 주기에 다시 시도할 수 있도록 함
          try {
            await prisma.$executeRaw`
              UPDATE "Memo"
              SET "tagEmbedding" = NULL
              WHERE id = ${memo.id}
            `;
          } catch (cleanupError) {
            console.error(`태그 임베딩 실패 후 정리 작업 실패 (memoId: ${memo.id}):`, cleanupError);
          }
        }
      }

      return { successCount, totalCount: memos.length };
    } catch (error) {
      console.error('태그 임베딩 배치 처리 중 오류 발생:', error);
      throw error;
    } finally {
      this.isTagEmbeddingProcessing = false;
    }
  }

  /**
   * 모든 메모의 태그 임베딩을 강제로 다시 생성
   * tagHash를 무시하고 모든 태그 임베딩을 재생성합니다.
   */
  async forceRegenerateTagEmbeddings(limit?: number): Promise<{ successCount: number; totalCount: number }> {
    // 이미 처리 중이면 건너뛰기
    if (this.isTagEmbeddingProcessing) {
      return { successCount: 0, totalCount: 0 };
    }

    this.isTagEmbeddingProcessing = true;

    let successCount = 0;
    let totalCount = 0;

    try {
      // 태그가 있는 모든 메모 조회 (강제 업데이트이므로 tagHash 무시)
      const memos = await prisma.memo.findMany({
        where: {
          isDeleted: false,
          isUserDeleted: false,
          tags: {
            some: {} // 태그가 하나 이상 있는 메모
          }
        },
        include: {
          tags: true
        },
        take: limit || 50,
      });

      totalCount = memos.length;

      if (totalCount === 0) {
        return { successCount, totalCount };
      }

      // 태그 이름들을 텍스트로 변환하여 임베딩 생성
      const textsForEmbedding = memos.map(memo => {
        return memo.tags.map((tag: { name: string }) => tag.name).join(" ");
      });

      // 배치 임베딩 생성
      const embeddings = await generateBatchEmbeddings(textsForEmbedding);

      // 각 메모에 대해 태그 임베딩 업데이트
      for (let i = 0; i < memos.length; i++) {
        const memo = memos[i];
        const embedding = embeddings[i];

        try {
          if (embedding) {
            // Raw query로 tagEmbedding 업데이트
            const embeddingArrayString = JSON.stringify(embedding);

            await prisma.$executeRaw`
              UPDATE "Memo"
              SET "tagEmbedding" = ${embeddingArrayString}::vector
              WHERE id = ${memo.id}
            `;

            successCount++;
          }
        } catch (error) {
          // 개별 메모 업데이트 실패는 로그만 남기고 계속 진행
          console.error(`태그 임베딩 강제 업데이트 실패 (memoId: ${memo.id}):`, error);
          // 실패한 경우 해당 메모의 임베딩 정보를 제거하여 다음 주기에 다시 시도할 수 있도록 함
          try {
            await prisma.$executeRaw`
              UPDATE "Memo"
              SET "tagEmbedding" = NULL
              WHERE id = ${memo.id}
            `;
          } catch (cleanupError) {
            console.error(`태그 임베딩 실패 후 정리 작업 실패 (memoId: ${memo.id}):`, cleanupError);
          }
        }
      }

      return { successCount, totalCount };
    } catch (error) {
      console.error('태그 임베딩 강제 재생성 중 오류 발생:', error);
      throw error;
    } finally {
      this.isTagEmbeddingProcessing = false;
    }
  }

  /**
   * 단일 메모에 대한 태그 업데이트를 비동기적으로 처리
   * @param memo - 태그를 업데이트할 메모 객체
   */
  async updateMemoTagsAsync(memo: { id: string; title: string; content: string | null }) {
    try {
      // 태그 업데이트 비동기적으로 처리
      setTimeout(async () => {
        try {
          await this.assignTaggingToMemo(memo.id, memo.title, memo.content);
        } catch (error) {
          console.error('비동기 태그 업데이트 실패:', error);
        }
      }, 0);
    } catch (error) {
      console.error('태그 업데이트 예약 실패:', error);
    }
  }
}

export default new tagService();


