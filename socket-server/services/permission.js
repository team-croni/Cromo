import { getMemoByIdWithSharedAccess } from "../db/index.js";
import { validateMemoId } from "../utils/validation.js";
import { info, warn, error, success } from "../utils/logger.js";
const logger = { info, warn, error, success };

const memoAccessCache = new Map();
const CACHE_TTL = 10 * 60 * 1000;

// 캐시 정리 (15분마다)
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of memoAccessCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) memoAccessCache.delete(key);
  }
}, 15 * 60 * 1000);

async function checkMemoAccess(memoId, userId, requiredPermission = "read") {
  try {
    validateMemoId(memoId);
    if (!userId) throw new Error("Authentication required");

    const cacheKey = `${memoId}-${userId}`;
    let memo = null;

    const cached = memoAccessCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      memo = cached.memo;
    } else {
      memo = await getMemoByIdWithSharedAccess(memoId, userId);
      if (!memo) throw new Error("Memo not found or access denied");

      memoAccessCache.set(cacheKey, {
        memo: {
          id: memo.id,
          userId: memo.userId,
          isLiveShareEnabled: memo.isLiveShareEnabled,
          liveShareMode: memo.liveShareMode,
          liveSharePermission: memo.liveSharePermission,
          allowedUsers: memo.allowedUsers,
        },
        timestamp: Date.now(),
      });
    }

    // 권한 상세 체크
    if (!memo.isLiveShareEnabled) {
      if (memo.userId !== userId)
        throw new Error("Access denied: Live Share is disabled");
    } else {
      if (memo.liveShareMode === "private") {
        if (!memo.allowedUsers.includes(userId) && memo.userId !== userId) {
          throw new Error("Access denied: Not in allowed users list");
        }
      }
      if (
        requiredPermission === "write" &&
        memo.liveSharePermission === "readOnly" &&
        memo.userId !== userId
      ) {
        throw new Error("Access denied: Read-only permission");
      }
    }
    return memo;
  } catch (error) {
    throw error;
  }
}

function invalidateMemoAccessCache(memoId) {
  for (const key of memoAccessCache.keys()) {
    if (key.startsWith(`${memoId}-`)) {
      memoAccessCache.delete(key);
    }
  }
}

export { checkMemoAccess, invalidateMemoAccessCache };
