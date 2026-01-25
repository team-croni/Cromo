import { info, warn, error, success } from "../utils/logger.js";
import { resolveMemoId } from "../db/index.js";
import { checkMemoAccess } from "../services/permission.js";
import { validateMemoId, validateUserInfo } from "../utils/validation.js";
import { isRateLimited } from "../utils/rateLimit.js";
import {
  roomData,
  userInfos,
  userCursors,
  userEventCounts,
} from "../store/index.js";
import { getPrismaClient } from "../db/index.js";

const logger = { info, warn, error, success };

export default (io, socket) => {
  // 메모 방 참여
  socket.on("join-memo-room", async (data) => {
    try {
      let memoId, userInfo;
      if (typeof data === "string") {
        memoId = data;
        userInfo = null;
      } else {
        memoId = data.memoId;
        userInfo = data.userInfo;
      }

      validateMemoId(memoId);
      if (userInfo) validateUserInfo(userInfo);

      if (isRateLimited(socket.id, "join-memo-room")) {
        socket.emit("error", { message: "요청이 너무 많습니다." });
        return;
      }

      await checkMemoAccess(memoId, socket.userId, "read");
      const roomId = await resolveMemoId(memoId);
      if (!roomId) throw new Error("Invalid memo ID");

      socket.join(roomId);
      logger.info(
        `JOIN MEMO_ID: ${roomId.substring(
          0,
          8
        )} | USER_ID: ${socket.userId.substring(0, 8)}`
      );

      if (!roomData.has(roomId)) {
        roomData.set(roomId, { users: new Set(), lastActivity: Date.now() });
      }
      const roomInfo = roomData.get(roomId);
      roomInfo.users.add(socket.id);
      roomInfo.lastActivity = Date.now();

      // 클라이언트에서 받은 userInfo를 우선 사용하되, 없을 경우 DB에서 최신 사용자 정보 가져오기
      let finalUserInfo;
      const DEFAULT_AVATAR_COLOR = "from-purple-600 via-pink-600 to-rose-600";
      const DEFAULT_AVATAR_TYPE = "gradient";

      if (userInfo) {
        // 클라이언트에서 받은 정보가 있으면 그대로 사용 (업데이트된 아바타 정보 포함)
        finalUserInfo = {
          ...userInfo,
          avatarColor: userInfo.avatarColor || DEFAULT_AVATAR_COLOR,
          avatarType: userInfo.avatarType || DEFAULT_AVATAR_TYPE,
        };
      } else {
        // userInfo가 없을 경우 DB에서 최신 사용자 정보 가져오기
        try {
          const client = getPrismaClient();
          const dbUser = await client.user.findUnique({
            where: { id: socket.userId },
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              avatarColor: true,
              avatarType: true,
            },
          });

          finalUserInfo = dbUser
            ? {
                id: dbUser.id,
                name: dbUser.name || `User ${dbUser.id.substring(0, 4)}`,
                email: dbUser.email || "",
                image: dbUser.image || null,
                avatarColor: dbUser.avatarColor || DEFAULT_AVATAR_COLOR,
                avatarType: dbUser.avatarType || DEFAULT_AVATAR_TYPE,
              }
            : {
                id: socket.userId,
                name: `User ${socket.userId.substring(0, 4)}`,
                email: "",
                image: null,
                avatarColor: DEFAULT_AVATAR_COLOR,
                avatarType: DEFAULT_AVATAR_TYPE,
              };
        } catch (dbError) {
          logger.error("DB에서 사용자 정보 조회 실패", dbError);
          // DB 조회 실패 시 기본 정보 사용
          finalUserInfo = {
            id: socket.userId,
            name: `User ${socket.userId.substring(0, 4)}`,
            email: "",
            image: null,
            avatarColor: DEFAULT_AVATAR_COLOR,
            avatarType: DEFAULT_AVATAR_TYPE,
          };
        }
      }

      userInfos.set(socket.id, finalUserInfo);

      socket.to(roomId).emit("user-joined", {
        userSocketId: socket.id,
        memoId: roomId,
        userInfo: finalUserInfo,
      });

      // 기존 커서 정보 전송 로직
      userCursors.forEach((cursorData, userSocketId) => {
        if (userSocketId !== socket.id && cursorData.memoId === roomId) {
          socket.emit("cursor-update", {
            ...cursorData,
            userSocketId,
            userId: userInfos.get(userSocketId)?.id,
          });
        }
      });

      // 기존 사용자 정보 전송
      const roomUsers = Array.from(roomInfo.users).filter(
        (id) => id !== socket.id
      );
      const existingUsersInfo = roomUsers.map((userId) =>
        userInfos.get(userId)
      );
      socket.emit("existing-users-info", {
        users: existingUsersInfo,
        memoId: roomId,
      });
    } catch (error) {
      socket.emit("error", { message: error.message || "오류 발생" });
    }
  });

  // 사용자 아바타 업데이트 이벤트
  socket.on("user-avatar-updated", async (updatedUserInfo) => {
    try {
      // 현재 소켓에 연결된 사용자 본인의 정보만 업데이트 가능
      if (updatedUserInfo.id !== socket.userId) {
        socket.emit("error", { message: "권한이 없습니다." });
        return;
      }

      // 사용자 정보 업데이트
      const updatedInfo = {
        id: updatedUserInfo.id,
        name: updatedUserInfo.name,
        email: updatedUserInfo.email,
        image: updatedUserInfo.image,
        avatarColor: updatedUserInfo.avatarColor,
        avatarType: updatedUserInfo.avatarType,
      };

      userInfos.set(socket.id, updatedInfo);

      // 현재 소켓이 속한 모든 방에 아바타 업데이트 알림
      roomData.forEach((roomInfo, roomId) => {
        if (roomInfo.users.has(socket.id)) {
          socket.to(roomId).emit("user-avatar-updated", updatedInfo);
        }
      });
    } catch (error) {
      socket.emit("error", {
        message: error.message || "아바타 업데이트 실패",
      });
    }
  });

  // 방 나가기
  socket.on("leave-memo-room", async (memoId) => {
    try {
      validateMemoId(memoId);
      if (isRateLimited(socket.id, "leave-memo-room")) return;

      const roomId = await resolveMemoId(memoId);
      if (!roomId) return;

      socket.leave(roomId);
      logger.info(
        `LEAVE MEMO_ID: ${roomId.substring(
          0,
          8
        )} | USER_ID: ${socket.userId.substring(0, 8)}`
      );

      if (roomData.has(roomId)) {
        const roomInfo = roomData.get(roomId);
        const wasInRoom = roomInfo.users.has(socket.id);
        roomInfo.users.delete(socket.id);

        if (wasInRoom) {
          socket.to(roomId).emit("user-left", {
            userSocketId: socket.id,
            memoId: roomId,
            userInfo: userInfos.get(socket.id),
            userId: socket.userId,
          });
        }
        if (roomInfo.users.size === 0) roomData.delete(roomId);
      }
      userCursors.delete(socket.id);
      userInfos.delete(socket.id);

      // Rate Limit 카운터 정리
      for (const key of userEventCounts.keys()) {
        if (key.startsWith(`${socket.id}-`)) userEventCounts.delete(key);
      }
    } catch (error) {
      logger.error("퇴장 오류", error);
    }
  });

  // 연결 해제
  socket.on("disconnect", () => {
    try {
      roomData.forEach((roomInfo, memoId) => {
        if (roomInfo.users.has(socket.id)) {
          roomInfo.users.delete(socket.id);
          socket.to(memoId).emit("user-left", {
            userSocketId: socket.id,
            memoId,
            userInfo: userInfos.get(socket.id),
            userId: socket.userId,
          });
          if (roomInfo.users.size === 0) roomData.delete(memoId);
        }
      });
      userCursors.delete(socket.id);
      userInfos.delete(socket.id);
      // Rate Limit 정리
      for (const key of userEventCounts.keys()) {
        if (key.startsWith(`${socket.id}-`)) userEventCounts.delete(key);
      }
    } catch (error) {
      logger.error("연결 해제 오류", error);
    }
  });
};
