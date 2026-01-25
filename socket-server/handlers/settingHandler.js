import { resolveMemoId, getMemoByIdWithSharedAccess } from "../db/index.js";
import { validateMemoId } from "../utils/validation.js";
import { isRateLimited } from "../utils/rateLimit.js";
import { roomData } from "../store/index.js";
import { info, warn, error, success } from "../utils/logger.js";
import { invalidateMemoAccessCache } from "../services/permission.js";
const logger = { info, warn, error, success };

export default (io, socket) => {
  // Live Share 설정 변경
  socket.on("live-share-settings-changed", async (data) => {
    try {
      validateMemoId(data.memoId);
      if (isRateLimited(socket.id, "live-share-settings-changed")) return;

      const memo = await getMemoByIdWithSharedAccess(
        data.memoId,
        socket.userId
      );
      if (!memo || memo.userId !== socket.userId) {
        throw new Error("Permission denied");
      }

      // 캐시 무효화
      invalidateMemoAccessCache(data.memoId);

      const roomId = await resolveMemoId(data.memoId);
      if (roomData.has(roomId)) roomData.get(roomId).lastActivity = Date.now();

      socket.to(roomId).emit("live-share-settings-changed", {
        ...data,
        userId: socket.userId,
      });
    } catch (error) {
      logger.error("설정 변경 오류", error);
      socket.emit("error", { message: error.message });
    }
  });

  // 소유자가 Live Share 종료
  socket.on("owner-live-share-disabled", async (data, callback) => {
    try {
      validateMemoId(data.memoId);
      const memo = await getMemoByIdWithSharedAccess(
        data.memoId,
        socket.userId
      );
      if (!memo || memo.userId !== socket.userId) {
        throw new Error("Permission denied");
      }

      const roomId = await resolveMemoId(data.memoId);
      if (callback) callback({ status: "ok" });

      // 캐시 무효화
      invalidateMemoAccessCache(data.memoId);

      io.to(roomId).emit("live-share-disabled", {
        ...data,
        userId: socket.userId,
      });

      // 방 폭파 로직
      const room = io.sockets.adapter.rooms.get(roomId);
      if (room) {
        room.forEach((socketId) => {
          const clientSocket = io.sockets.sockets.get(socketId);
          if (clientSocket) {
            clientSocket.disconnect(true);
            clientSocket.leave(roomId);
          }
        });
      }
      roomData.delete(roomId);
    } catch (error) {
      logger.error("Live Share 종료 오류", error);
      if (callback) callback({ status: "error", message: error.message });
    }
  });
};
