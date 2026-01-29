import { prisma } from "@lib/db/prisma";
import { generateBatchEmbeddings } from "@lib/embeddingUtils";
import crypto from "crypto";
import { htmlToPlainText } from "@utils/htmlToPlainText";

/**
 * 변경된 메모들의 임베딩을 일괄 생성하는 서비스
 */
class EmbeddingService {
  private isProcessing: boolean = false;

  /**
   * 메모 내용을 기반으로 해시 생성
   * HTML을 텍스트로 변환하여 의미 있는 내용만으로 해시를 생성합니다.
   * tags 정보도 포함합니다.
   */
  private generateContentHash(title: string, content: string | null) {
    const plainTextContent = content ? htmlToPlainText(content) : "";
    const contentString = `${title} ${plainTextContent}`;
    return crypto.createHash('md5').update(contentString).digest('hex');
  }

  /**
   * 배치 임베딩 처리 작업 실행
   */
  async processBatchEmbeddings(batchSize: number): Promise<{ successCount: number; totalCount: number; updatedCount: number }> {
    // 이미 처리 중이면 건너뛰기
    if (this.isProcessing) {
      return { successCount: 0, totalCount: 0, updatedCount: 0 };
    }

    this.isProcessing = true;

    let successCount = 0;
    let totalCount = 0;
    let updatedCount = 0;

    try {
      // 아직 임베딩이 생성되지 않았거나 최신화가 필요한 메모들 조회
      const memos = await prisma.memo.findMany({
        where: {
          isDeleted: false,
          isUserDeleted: false,
          OR: [
            { isEmbeddingUpToDate: false },
            { embeddingUpdatedAt: null },
          ],
        },
        include: {
          tags: true,
        },
        take: batchSize,
      });

      totalCount = memos.length;

      if (totalCount === 0) {
        return { successCount, totalCount, updatedCount };
      }

      // 실제 내용이 변경된 메모만 필터링
      const memosWithChangedContent: typeof memos = [];
      const contentHashes: string[] = [];
      const memosToUpdateFlagOnly: string[] = [];

      for (const memo of memos) {
        const currentHash = this.generateContentHash(memo.title, memo.content);

        // contentHash가 존재하고 같으면 업데이트 불필요 (플래그만 갱신)
        if (memo.contentHash && currentHash === memo.contentHash) {
          memosToUpdateFlagOnly.push(memo.id);
        } else {
          memosWithChangedContent.push(memo);
          contentHashes.push(currentHash);
        }
      }

      // 내용 변경 없이 플래그만 업데이트해야 하는 메모들 처리
      if (memosToUpdateFlagOnly.length > 0) {
        await prisma.memo.updateMany({
          where: {
            id: { in: memosToUpdateFlagOnly }
          },
          data: {
            isEmbeddingUpToDate: true
          }
        });
      }

      // 내용이 변경된 메모가 없으면 종료
      if (memosWithChangedContent.length === 0) {
        return { successCount, totalCount: memos.length, updatedCount: 0 };
      }

      // 메모의 제목과 내용을 결합하여 텍스트 배열 생성
      // HTML을 텍스트로 변환하여 의미 있는 내용만으로 임베딩을 생성합니다.
      // tags 정보도 포함합니다.
      const textsForEmbedding = memosWithChangedContent.map(
        (memo) => {
          const plainTextContent = memo.content ? htmlToPlainText(memo.content) : "";
          const tagsString = memo.tags.map(tag => tag.name).join(" ");
          return memo.title === '새로운 메모' ? `${plainTextContent} ${tagsString}` : `${memo.title} ${plainTextContent} ${tagsString}`;
        }
      );

      // 배치 임베딩 생성
      const embeddings = await generateBatchEmbeddings(textsForEmbedding);

      // 각 메모에 대해 임베딩 업데이트
      for (let i = 0; i < memosWithChangedContent.length; i++) {
        const memo = memosWithChangedContent[i];
        const embedding = embeddings[i];
        const contentHash = contentHashes[i];

        try {
          if (embedding) {
            // Raw query로 embedding 업데이트
            // pgvector는 1차원 배열만 허용하므로 JSON.stringify로 변환
            const embeddingArrayString = JSON.stringify(embedding);

            await prisma.$executeRaw`
              UPDATE "Memo"
              SET embedding = ${embeddingArrayString}::vector,
                  "embeddingUpdatedAt" = ${new Date()},
                  "contentHash" = ${contentHash},
                  "isEmbeddingUpToDate" = true
              WHERE id = ${memo.id}
            `;

            successCount++;
          }
        } catch (error) {
          // 에러 처리는 상위 호출자에게 위임
          throw error;
        }
      }

      // 각 메모에 대해 카테고리 자동 할당 (새로운 서비스 사용)
      // 업데이트된 메모 수 계산 (embeddingUpdatedAt이 방금 업데이트된 메모 수)
      updatedCount = successCount;

      return { successCount, totalCount: memos.length, updatedCount };
    } catch (error) {
      // 에러 처리는 상위 호출자에게 위임
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 모든 메모의 임베딩을 강제로 다시 생성
   * isEmbeddingUpToDate와 contentHash를 무시하고 모든 임베딩을 재생성합니다.
   */
  async forceRegenerateEmbeddings(limit?: number): Promise<{ successCount: number; totalCount: number; updatedCount: number }> {
    // 이미 처리 중이면 건너뛰기
    if (this.isProcessing) {
      return { successCount: 0, totalCount: 0, updatedCount: 0 };
    }

    this.isProcessing = true;

    let successCount = 0;
    let totalCount = 0;
    let updatedCount = 0;

    try {
      // 삭제되지 않은 모든 메모 조회 (강제 업데이트이므로 플래그 무시)
      const memos = await prisma.memo.findMany({
        where: {
          isDeleted: false,
          isUserDeleted: false,
        },
        include: {
          tags: true,
        },
        take: limit || 50,
      });

      totalCount = memos.length;

      if (totalCount === 0) {
        return { successCount, totalCount, updatedCount };
      }

      // 모든 메모의 임베딩을 재생성
      const contentHashes: string[] = [];

      for (const memo of memos) {
        const currentHash = this.generateContentHash(memo.title, memo.content);
        contentHashes.push(currentHash);
      }

      // 메모의 제목과 내용을 결합하여 텍스트 배열 생성
      const textsForEmbedding = memos.map(
        (memo) => {
          const plainTextContent = memo.content ? htmlToPlainText(memo.content) : "";
          const tagsString = memo.tags.map(tag => tag.name).join(" ");
          return memo.title === '새로운 메모' ? `${plainTextContent} ${tagsString}` : `${memo.title} ${plainTextContent} ${tagsString}`;
        }
      );

      // 배치 임베딩 생성
      const embeddings = await generateBatchEmbeddings(textsForEmbedding);

      // 각 메모에 대해 임베딩 업데이트
      for (let i = 0; i < memos.length; i++) {
        const memo = memos[i];
        const embedding = embeddings[i];
        const contentHash = contentHashes[i];

        try {
          if (embedding) {
            // Raw query로 embedding 업데이트
            const embeddingArrayString = JSON.stringify(embedding);

            await prisma.$executeRaw`
              UPDATE "Memo"
              SET embedding = ${embeddingArrayString}::vector,
                  "embeddingUpdatedAt" = ${new Date()},
                  "contentHash" = ${contentHash},
                  "isEmbeddingUpToDate" = true
              WHERE id = ${memo.id}
            `;

            successCount++;
          }
        } catch (error) {
          // 개별 메모 업데이트 실패는 로그만 남기고 계속 진행
          console.error(`임베딩 강제 업데이트 실패 (memoId: ${memo.id}):`, error);
        }
      }

      updatedCount = successCount;

      return { successCount, totalCount, updatedCount };
    } catch (error) {
      // 에러 처리는 상위 호출자에게 위임
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }
}

export default new EmbeddingService();
