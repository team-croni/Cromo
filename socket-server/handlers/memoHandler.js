import { resolveMemoId } from "../db/index.js";
import { checkMemoAccess } from "../services/permission.js";
import {
  validateCursorData,
  validateMemoContentData,
} from "../utils/validation.js";
import { isRateLimited } from "../utils/rateLimit.js";
import { userCursors, roomData } from "../store/index.js";
import { info, warn, error, success } from "../utils/logger.js";
const logger = { info, warn, error, success };

export default (io, socket) => {
  // 메모 내용 변경
  socket.on("memo-content-change", async (data) => {
    try {
      validateMemoContentData(data);
      if (isRateLimited(socket.id, "memo-content-change")) {
        socket.emit("error", { message: "요청이 너무 많습니다." });
        return;
      }

      await checkMemoAccess(data.memoId, socket.userId, "write");
      const roomId = await resolveMemoId(data.memoId);

      if (roomData.has(roomId)) roomData.get(roomId).lastActivity = Date.now();

      socket.to(roomId).emit("memo-content-update", {
        ...data,
        memoId: roomId,
        userId: socket.userId,
        userSocketId: socket.id,
      });
    } catch (error) {
      socket.emit("error", { message: error.message });
    }
  });

  // 커서 이동
  socket.on("cursor-move", async (data) => {
    try {
      validateCursorData(data);
      if (isRateLimited(socket.id, "cursor-move")) return;

      await checkMemoAccess(data.memoId, socket.userId, "read");
      const roomId = await resolveMemoId(data.memoId);

      userCursors.set(socket.id, { position: data.position, memoId: roomId });
      if (roomData.has(roomId)) roomData.get(roomId).lastActivity = Date.now();

      // 자신 제외 방송
      socket.to(roomId).emit("cursor-update", {
        ...data,
        memoId: roomId,
        userSocketId: socket.id,
        userId: socket.userId,
      });
      // 자신 포함 필요한 경우 (여기선 자신에게도 보냈었음)
      // io.to(roomId).emit(...)
    } catch (error) {
      // 커서 에러는 로깅만 하고 사용자에게 알리지 않는 것이 UX상 좋을 수 있음
      logger.error("커서 오류", error);
    }
  });
};
