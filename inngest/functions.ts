import { inngest } from "./client";
import { permanentlyDeleteOldSoftDeletedUsers } from "@/lib/db/user";
import { logger } from "@/utils/logger";

// Purge deleted users function
export const purgeUsers = inngest.createFunction(
  {
    id: "purge-deleted-users",
    name: "Purge Deleted Users",
  },
  { cron: "0 0 * * *" }, // Run daily at midnight
  async ({ step }) => {
    logger.scheduler("Executing purge deleted users job via cron");
    const result = await permanentlyDeleteOldSoftDeletedUsers();
    logger.scheduler(`Purge deleted users job completed. Result: ${JSON.stringify(result)}`);
    return result;
  }
);

// Purge deleted users function - event triggered
export const purgeUsersEvent = inngest.createFunction(
  {
    id: "purge-deleted-users-event",
    name: "Purge Deleted Users Event",
  },
  { event: "app/run.purge-users-job" }, // Event trigger for manual execution
  async ({ step }) => {
    logger.scheduler("Executing purge deleted users job via event");
    const result = await permanentlyDeleteOldSoftDeletedUsers();
    logger.scheduler(`Purge deleted users job completed. Result: ${JSON.stringify(result)}`);
    return result;
  }
);

// Process embeddings function - event triggered
export const processEmbeddings = inngest.createFunction(
  {
    id: "process-embedding-updates",
    name: "Process Embedding Updates",
  },
  { event: "app/process.embedding-updates" }, // Trigger event for embedding updates
  async ({ step }) => {
    logger.scheduler("Executing process embedding updates job");
    const result = await processPendingEmbeddingUpdates(5); // 배치 크기를 줄여 서버 부하 감소
    logger.scheduler(`Process embedding updates job completed. Processed: ${result.processed}, Success: ${result.success}`);
    return result;
  }
);

// Process embeddings function - scheduled
export const processEmbeddingsScheduled = inngest.createFunction(
  {
    id: "process-embedding-updates-scheduled",
    name: "Process Embedding Updates Scheduled",
  },
  { cron: "0/4 * * * *" },
  async ({ step }) => {
    logger.scheduler("Executing scheduled process embedding updates job");
    const result = await processPendingEmbeddingUpdates(2); // 최대 2개씩 처리
    logger.scheduler(`Scheduled process embedding updates job completed. Processed: ${result.processed}, Success: ${result.success}`);
    return result;
  }
);

// Process tags function
export const processTags = inngest.createFunction(
  {
    id: "process-tag-updates",
    name: "Process Tag Updates",
  },
  { event: "app/process.tag-updates" }, // Trigger event for tag updates
  async ({ step }) => {
    logger.scheduler("Executing process tag updates job");
    const result = await processPendingTagUpdates(5); // 배치 크기를 줄여 서버 부하 감소
    logger.scheduler(`Process tag updates job completed. Processed: ${result.processed}, Success: ${result.success}`);
    return result;
  }
);

// Process tags function - scheduled
export const processTagsScheduled = inngest.createFunction(
  {
    id: "process-tag-updates-scheduled",
    name: "Process Tag Updates Scheduled",
  },
  { cron: "2/4 * * * *" },
  async ({ step }) => {
    logger.scheduler("Executing scheduled process tag updates job");
    const result = await processPendingTagUpdates(5); // 최대 5개씩 처리
    logger.scheduler(`Scheduled process tag updates job completed. Processed: ${result.processed}, Success: ${result.success}`);
    return result;
  }
);

/**
 * 임베딩 업데이트 대기 중인 메모 처리
 */
async function processPendingEmbeddingUpdates(batchSize: number = 5) { // 기본 배치 크기를 줄임
  try {
    // embeddingService를 동적으로 불러와서 임베딩 업데이트 실행
    const embeddingService = await import("@/services/embeddingService");

    // embeddingService의 processBatchEmbeddings 메서드를 사용하여 배치 처리
    const result = await embeddingService.default.processBatchEmbeddings();

    return { processed: result.totalCount, success: result.successCount };
  } catch (error) {
    logger.error("보류 중인 임베딩 업데이트 처리 실패:", error);
    return { processed: 0, success: 0, error };
  }
}

/**
 * 태그 업데이트 대기 중인 메모 처리
 */
async function processPendingTagUpdates(batchSize: number = 5) { // 기본 배치 크기를 줄임
  try {
    const { prisma } = await import("@/lib/db/prisma");

    // isTagsUpToDate가 false인 메모를 가져옴
    const memosToProcess = await prisma.memo.findMany({
      where: {
        isDeleted: false,
        isUserDeleted: false,
        isTagsUpToDate: false,
      },
      take: batchSize,
    });

    if (memosToProcess.length === 0) {
      return { processed: 0, success: 0 };
    }

    // tagService를 동적으로 불러와서 태그 업데이트 실행
    const tagService = await import("@/services/tagService");
    await tagService.default.assignTaggingToMemosBatch(memosToProcess);

    // 처리된 메모들의 플래그 업데이트
    await prisma.memo.updateMany({
      where: {
        id: { in: memosToProcess.map(m => m.id) }
      },
      data: {
        isTagsUpToDate: true,
        tagsUpdatedAt: new Date(),
      },
    });

    return { processed: memosToProcess.length, success: memosToProcess.length };
  } catch (error) {
    logger.error("보류 중인 태그 업데이트 처리 실패:", error);
    return { processed: 0, success: 0, error };
  }
}
