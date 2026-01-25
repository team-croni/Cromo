import { PrismaClient } from "@prisma/client";
import { info, error } from "../utils/logger.js";

let prisma = null;

function getPrismaClient() {
  if (!prisma) {
    info("Prisma 클라이언트 생성 시도...");
    try {
      prisma = new PrismaClient();
      info("Prisma 클라이언트 생성 성공");
    } catch (error) {
      error("Prisma 클라이언트 생성 실패", error);
      throw error;
    }
  }
  return prisma;
}

// 공유된 메모 조회 (UUID 또는 Token)
const getMemoByIdWithSharedAccess = async (id, userId = null) => {
  try {
    const client = getPrismaClient();
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id
      );

    let memo;
    if (isUUID) {
      memo = await client.memo.findUnique({
        where: { id },
        include: { folder: true, tags: true, user: true },
      });
    } else {
      memo = await client.memo.findFirst({
        where: {
          shareToken: id,
          shareExpiresAt: { gt: new Date() },
          isDeleted: false,
        },
        include: { folder: true, tags: true, user: true },
      });
    }

    if (!memo) return null;

    // 권한 필터링 로직
    if (isUUID && (memo.isDeleted || !memo.isLiveShareEnabled)) {
      if (!userId || memo.userId !== userId) return null;
    } else if (isUUID) {
      if (memo.liveShareMode === "private") {
        if (
          !userId ||
          (memo.userId !== userId && !memo.allowedUsers.includes(userId))
        ) {
          return null;
        }
      }
    }

    // shareToken으로 접근하는 경우에도 실시간 공유가 활성화되어 있어야 함
    if (!isUUID && !memo.isLiveShareEnabled) {
      return null;
    }
    return memo;
  } catch (error) {
    error("공유 메모 조회 중 오류 발생", error);
    throw error;
  }
};

// UUID 변환기
const resolveMemoId = async (memoId) => {
  try {
    const client = getPrismaClient();
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        memoId
      );

    if (isUUID) return memoId;

    const memo = await client.memo.findFirst({
      where: {
        shareToken: memoId,
        shareExpiresAt: { gt: new Date() },
        isDeleted: false,
      },
      select: { id: true },
    });
    return memo ? memo.id : null;
  } catch (error) {
    error("메모 ID 변환 중 오류 발생", error);
    throw error;
  }
};

export { getPrismaClient, getMemoByIdWithSharedAccess, resolveMemoId };
