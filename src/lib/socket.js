const socketio = require("socket.io");
const { PrismaClient } = require("@prisma/client");

// PrismaClient 싱글톤 패턴
let prisma = null;

function getPrismaClient() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

// 메모 조회 함수
const getMemoById = async (id, userId = null) => {
  try {
    const client = getPrismaClient();
    const memo = await client.memo.findUnique({
      where: {
        id,
        // userId가 제공되면 해당 사용자의 메모만 조회
        ...(userId !== null && { userId }),
      },
      include: {
        folder: true,
        tags: true,
      },
    });
    return memo;
  } catch (error) {
    console.error("Error fetching memo:", error);
    throw error;
  }
};

// 속도 제한을 위한 Map (사용자별 이벤트 카운트)
const userEventCounts = new Map();
// 방 관련 데이터를 저장하는 Map
const roomData = new Map();
// 사용자별 커서 위치를 저장하는 Map
const userCursors = new Map();
// 사용자 정보를 저장하는 Map
const userInfos = new Map();

// 개선된 속도 제한 설정 (이벤트별 제한)
const RATE_LIMITS = {
  "join-memo-room": { max: 10, window: 60000 }, // 1분에 10회
  "memo-content-change": { max: 100, window: 1000 }, // 1초에 100회
  "cursor-move": { max: 200, window: 1000 }, // 1초에 200회
  "live-share-settings-changed": { max: 20, window: 60000 }, // 1분에 20회
  "leave-memo-room": { max: 30, window: 60000 }, // 1분에 30회
  default: { max: 50, window: 1000 }, // 기본 제한
};

// 속도 제한 확인 함수 (이벤트별 제한)
function isRateLimited(socketId, eventName) {
  const now = Date.now();
  const limits = RATE_LIMITS[eventName] || RATE_LIMITS.default;
  const userKey = `${socketId}-${eventName}`;
  const userEvents = userEventCounts.get(userKey);

  // 새로운 사용자 또는 시간 윈도우가 지난 경우
  if (!userEvents || now > userEvents.resetTime) {
    userEventCounts.set(userKey, { count: 1, resetTime: now + limits.window });
    return false;
  }

  // 이벤트 카운트 증가
  userEvents.count++;
  userEventCounts.set(userKey, userEvents);

  // 속도 제한 초과 여부 반환
  return userEvents.count > limits.max;
}

// 입력 데이터 검증 함수들
function validateMemoId(memoId) {
  if (!memoId || typeof memoId !== "string" || memoId.length !== 36) {
    throw new Error("Invalid memo ID");
  }
  // UUID v4 형식 검증 (기본적인 검증)
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(memoId)) {
    throw new Error("Invalid memo ID format");
  }
}

function validateUserInfo(userInfo) {
  if (!userInfo || typeof userInfo !== "object") {
    throw new Error("Invalid user info");
  }
  if (
    !userInfo.id ||
    typeof userInfo.id !== "string" ||
    userInfo.id.length !== 36
  ) {
    throw new Error("Invalid user ID");
  }
  if (
    !userInfo.name ||
    typeof userInfo.name !== "string" ||
    userInfo.name.length > 100
  ) {
    throw new Error("Invalid user name");
  }
  if (
    !userInfo.email ||
    typeof userInfo.email !== "string" ||
    userInfo.email.length > 255
  ) {
    throw new Error("Invalid user email");
  }
}

function validateCursorData(data) {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid cursor data");
  }
  validateMemoId(data.memoId);
  // position은 null일 수 있음 (처음 입장시)
  if (
    data.position !== null &&
    data.position !== undefined &&
    typeof data.position !== "object"
  ) {
    throw new Error("Invalid cursor position");
  }
}

function validateMemoContentData(data) {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid memo content data");
  }
  validateMemoId(data.memoId);
  if (typeof data.content !== "string" || data.content.length > 1000000) {
    // 1MB 제한
    throw new Error("Invalid content");
  }
  if (
    !data.title ||
    typeof data.title !== "string" ||
    data.title.length > 200
  ) {
    throw new Error("Invalid title");
  }
}

// 메모 접근 권한 검증 함수 (최적화된 캐시 적용)
const memoAccessCache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10분 (더 긴 캐시 시간)

async function checkMemoAccess(memoId, userId, requiredPermission = "read") {
  try {
    validateMemoId(memoId);

    // 기본 검증: userId 필수
    if (!userId) {
      throw new Error("Authentication required");
    }

    const cacheKey = `${memoId}-${userId}`;
    let memo = null;

    // 캐시 확인 (빠른 조회)
    const cached = memoAccessCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      memo = cached.memo;
    } else {
      // 캐시 미스: 최소한의 데이터만 조회
      memo = await getMemoById(memoId);
      if (!memo) {
        throw new Error("Memo not found");
      }

      // 캐시에 필요한 정보만 저장 (메모리 절약)
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

    // 권한 검증 (캐시된 데이터로 수행)
    if (!memo.isLiveShareEnabled) {
      // Live Share 비활성화: 소유자만
      if (memo.userId !== userId) {
        throw new Error("Access denied: Live Share is disabled");
      }
    } else {
      // Live Share 활성화
      if (memo.liveShareMode === "private") {
        if (!memo.allowedUsers.includes(userId) && memo.userId !== userId) {
          throw new Error("Access denied: Not in allowed users list");
        }
      }
      // public 모드: 모든 사용자 접근 가능

      // 쓰기 권한 검증
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
    console.error("Memo access check failed:", error);
    throw error;
  }
}

// 캐시 정리 (더 긴 간격으로)
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of memoAccessCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      memoAccessCache.delete(key);
    }
  }
}, 15 * 60 * 1000); // 15분마다 정리

// 소켓 서버 인스턴스를 저장할 변수
let io = null;

// 소켓 서버 초기화 함수
function initSocketServer(server) {
  if (io) {
    // 이미 초기화된 경우 기존 인스턴스 반환
    return io;
  }

  // 소켓 서버 생성
  io = new socketio.Server(server, {
    cors: {
      origin:
        process.env.NODE_ENV === "production"
          ? process.env.ALLOWED_ORIGINS?.split(",") || [
              "https://yourdomain.com",
            ]
          : ["http://localhost:3000", "http://127.0.0.1:3000"], // 개발 환경에서는 localhost 허용
      methods: ["GET", "POST"],
      credentials: true,
    },
    // 연결 타임아웃 설정
    pingTimeout: 20000,
    pingInterval: 25000,
  });

  // 사용자 인증 미들웨어
  io.use(async (socket, next) => {
    try {
      // 클라이언트에서 보낸 userId 검증
      const userId = socket.handshake.query.userId;

      if (!userId) {
        return next(new Error("Authentication required"));
      }

      // 기본적인 UUID 형식 검증
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        return next(new Error("Invalid user ID format"));
      }

      // 소켓에 사용자 정보 저장
      socket.userId = userId;
      next();
    } catch (error) {
      console.error("Socket authentication failed:", error);
      next(new Error("Authentication failed"));
    }
  });

  // 연결 이벤트 처리
  io.on("connection", (socket) => {
    console.log(
      `사용자가 소켓에 연결되었습니다: ${socket.id} (User: ${socket.userId})`
    );

    // 연결 오류 이벤트 처리
    socket.on("error", (err) => {
      console.error(`소켓 ${socket.id}에서 오류 발생:`, err);
    });

    // 소유자 Live Share 종료 이벤트
    socket.on("owner-live-share-disabled", async (data, callback) => {
      try {
        // 입력 데이터 검증
        validateMemoId(data.memoId);

        console.log(
          `소유자 ${socket.id} (${socket.userId})가 메모 ${data.memoId}의 Live Share를 종료했습니다.`
        );

        // 메모 소유자 권한 검증
        const memo = await getMemoById(data.memoId);
        if (!memo) {
          throw new Error("Memo not found");
        }
        if (memo.userId !== socket.userId) {
          throw new Error("Only memo owner can disable Live Share");
        }

        // ACK 전송
        if (callback) callback({ status: "ok" });

        // 방에 있는 모든 사용자에게 연결 종료 메시지 전송 (재시도 로직 포함)
        const broadcastWithRetry = (eventName, eventData, retries = 3) => {
          try {
            io.to(data.memoId).emit(eventName, eventData);
            console.log(`이벤트 ${eventName} 방송 성공:`, eventData);
          } catch (broadcastError) {
            console.error(
              `이벤트 ${eventName} 방송 실패 (시도 ${4 - retries}/3):`,
              broadcastError
            );
            if (retries > 1) {
              // 재시도 간격을 두고 다시 시도
              setTimeout(
                () => broadcastWithRetry(eventName, eventData, retries - 1),
                1000
              );
            } else {
              console.error(`이벤트 ${eventName} 방송 최종 실패`);
            }
          }
        };

        // live-share-disabled 이벤트 방송
        broadcastWithRetry("live-share-disabled", {
          ...data,
          userId: socket.userId, // 소유자 ID 추가
        });

        // 방에서 모든 사용자 제거 및 소켓 연결 해제
        const room = io.sockets.adapter.rooms.get(data.memoId);
        if (room) {
          room.forEach((socketId) => {
            const clientSocket = io.sockets.sockets.get(socketId);
            if (clientSocket) {
              // 소켓 연결 해제
              clientSocket.disconnect(true);

              // 방에서 사용자 제거
              clientSocket.leave(data.memoId);
            }
          });
        }

        // 방 데이터 정리
        roomData.delete(data.memoId);
        console.log(
          `메모 방 ${data.memoId}의 Live Share가 종료되어 데이터가 정리되었습니다.`
        );
      } catch (error) {
        console.error(
          `소유자 ${socket.id}의 Live Share 종료 처리 중 오류 발생:`,
          error
        );
        // 오류 발생 시에도 ACK 전송
        if (callback) callback({ status: "error", message: error.message });
      }
    });

    // 메모 방 참여 이벤트
    socket.on("join-memo-room", async (data) => {
      try {
        let memoId, userInfo;

        // 이전 방식과 새로운 방식 모두 지원
        if (typeof data === "string") {
          memoId = data;
          userInfo = null;
        } else {
          memoId = data.memoId;
          userInfo = data.userInfo;
        }

        // 입력 데이터 검증
        validateMemoId(memoId);
        if (userInfo) {
          validateUserInfo(userInfo);
        }

        // 속도 제한 확인
        if (isRateLimited(socket.id, "join-memo-room")) {
          socket.emit("error", {
            message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
          });
          return;
        }

        // 메모 접근 권한 검증
        await checkMemoAccess(memoId, socket.userId, "read");

        socket.join(memoId);
        console.log(
          `사용자 ${socket.id} (${socket.userId})가 메모 방 ${memoId}에 참여했습니다.`
        );

        // 방 데이터 초기화 (처음 참여하는 경우)
        if (!roomData.has(memoId)) {
          roomData.set(memoId, {
            users: new Set(),
            lastActivity: Date.now(),
          });
        }

        // 방 사용자 목록에 추가
        const roomInfo = roomData.get(memoId);
        roomInfo.users.add(socket.id);
        roomInfo.lastActivity = Date.now();

        // 사용자 정보 저장 (소켓의 userId를 우선 사용)
        const finalUserInfo = userInfo || {
          id: socket.userId,
          name: `User ${socket.userId.substring(0, 4)}`,
          email: "",
          image: null,
        };
        userInfos.set(socket.id, finalUserInfo);

        // 현재 방에 있는 다른 사용자들에게 새 사용자 참여 알림 (사용자 정보 포함)
        socket.to(memoId).emit("user-joined", {
          userSocketId: socket.id,
          memoId,
          userInfo: finalUserInfo,
        });

        // 현재 방에 있는 다른 사용자들의 커서 위치 전송
        userCursors.forEach((cursorData, userSocketId) => {
          if (userSocketId !== socket.id && cursorData.memoId === memoId) {
            socket.emit("cursor-update", {
              ...cursorData,
              userSocketId,
              userId: userInfos.get(userSocketId)?.id,
            });
          }
        });

        // 새로 참여한 사용자에게 기존 사용자들의 전체 정보 전송
        const roomUsers = Array.from(roomInfo.users).filter(
          (id) => id !== socket.id
        );

        // 기존 사용자들의 정보를 가져옴
        const existingUsersInfo = roomUsers.map((userId) => {
          return (
            userInfos.get(userId) || {
              id: userId,
              name: `User ${userId.substring(0, 4)}`,
              email: "",
              image: null,
            }
          );
        });

        socket.emit("existing-users-info", {
          users: existingUsersInfo,
          memoId,
        });

        // 기존 사용자들에게 새로 참여한 사용자의 정보 전송 (커서 위치 포함)
        // 새로 참여한 사용자에게는 아직 커서 위치가 없으므로 전송하지 않음
      } catch (error) {
        console.error(
          `사용자 ${socket.id}의 메모 방 ${
            memoId || "unknown"
          } 참여 중 오류 발생:`,
          error
        );
        socket.emit("error", {
          message: error.message || "방 참여 중 오류가 발생했습니다.",
        });
      }
    });

    // 메모 내용 변경 이벤트
    socket.on("memo-content-change", async (data) => {
      try {
        // 입력 데이터 검증
        validateMemoContentData(data);

        // 속도 제한 확인
        if (isRateLimited(socket.id, "memo-content-change")) {
          socket.emit("error", {
            message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
          });
          return;
        }

        // 메모 접근 권한 검증 (쓰기 권한 필요)
        await checkMemoAccess(data.memoId, socket.userId, "write");

        // 방 데이터 업데이트
        if (roomData.has(data.memoId)) {
          const roomInfo = roomData.get(data.memoId);
          roomInfo.lastActivity = Date.now();
        }

        // 같은 메모 방에 있는 다른 사용자들에게 변경 내용 전송
        socket.to(data.memoId).emit("memo-content-update", {
          ...data,
          userId: socket.userId, // 변경한 사용자 ID 추가
        });
      } catch (error) {
        console.error(
          `사용자 ${socket.id}의 메모 내용 변경 중 오류 발생:`,
          error
        );
        socket.emit("error", {
          message: error.message || "내용 변경 중 오류가 발생했습니다.",
        });
      }
    });

    // 커서 위치 변경 이벤트
    socket.on("cursor-move", async (data) => {
      try {
        // 입력 데이터 검증
        validateCursorData(data);

        // 속도 제한 확인
        if (isRateLimited(socket.id, "cursor-move")) {
          socket.emit("error", {
            message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
          });
          return;
        }

        // 메모 접근 권한 검증 (읽기 권한만 필요)
        await checkMemoAccess(data.memoId, socket.userId, "read");

        // 사용자 커서 위치 저장
        userCursors.set(socket.id, {
          position: data.position,
          memoId: data.memoId,
        });

        // 방 데이터 업데이트
        if (roomData.has(data.memoId)) {
          const roomInfo = roomData.get(data.memoId);
          roomInfo.lastActivity = Date.now();
        }

        // 같은 메모 방에 있는 다른 사용자들에게 커서 위치 전송
        socket.to(data.memoId).emit("cursor-update", {
          ...data,
          userSocketId: socket.id,
          userId: socket.userId, // 인증된 사용자 ID 사용
        });

        // 같은 메모 방에 있는 모든 사용자에게 커서 위치 전송 (새로 참여한 사용자 포함)
        io.to(data.memoId).emit("cursor-update", {
          ...data,
          userSocketId: socket.id,
          userId: socket.userId, // 인증된 사용자 ID 사용
        });
      } catch (error) {
        console.error(
          `사용자 ${socket.id}의 커서 위치 변경 중 오류 발생:`,
          error
        );
        socket.emit("error", {
          message: error.message || "커서 위치 변경 중 오류가 발생했습니다.",
        });
      }
    });

    // Live Share 권한 변경 이벤트
    socket.on("live-share-settings-changed", async (data) => {
      console.log("live-share-settings-changed", data);
      try {
        // 입력 데이터 검증
        validateMemoId(data.memoId);
        if (!data.settings || typeof data.settings !== "object") {
          throw new Error("Invalid settings data");
        }

        // 속도 제한 확인
        if (isRateLimited(socket.id, "live-share-settings-changed")) {
          socket.emit("error", {
            message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
          });
          return;
        }

        // 메모 소유자 권한 검증 (Live Share 설정은 소유자만 변경 가능)
        const memo = await getMemoById(data.memoId);
        if (!memo) {
          throw new Error("Memo not found");
        }
        if (memo.userId !== socket.userId) {
          throw new Error("Only memo owner can change Live Share settings");
        }

        // 방 데이터 업데이트
        if (roomData.has(data.memoId)) {
          const roomInfo = roomData.get(data.memoId);
          roomInfo.lastActivity = Date.now();
        }

        // 같은 메모 방에 있는 다른 사용자들에게 권한 변경 내용 전송
        socket.to(data.memoId).emit("live-share-settings-changed", {
          ...data,
          userId: socket.userId, // 변경한 사용자 ID 추가
        });
      } catch (error) {
        console.error(
          `사용자 ${socket.id}의 Live Share 권한 변경 중 오류 발생:`,
          error
        );
        socket.emit("error", {
          message: error.message || "권한 변경 중 오류가 발생했습니다.",
        });
      }
    });

    // 방 나가기 이벤트
    socket.on("leave-memo-room", (memoId) => {
      try {
        // 입력 데이터 검증
        validateMemoId(memoId);

        // 속도 제한 확인
        if (isRateLimited(socket.id, "leave-memo-room")) {
          socket.emit("error", {
            message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
          });
          return;
        }

        socket.leave(memoId);
        console.log(
          `사용자 ${socket.id} (${socket.userId})가 메모 방 ${memoId}에서 나갔습니다.`
        );

        // 방 사용자 목록에서 제거
        if (roomData.has(memoId)) {
          const roomInfo = roomData.get(memoId);
          const wasInRoom = roomInfo.users.has(socket.id);
          roomInfo.users.delete(socket.id);

          // 사용자가 실제로 방에 있었다면 다른 사용자들에게 알림
          if (wasInRoom) {
            // 현재 방에 있는 사용자들에게 사용자 퇴장 알림
            socket.to(memoId).emit("user-left", {
              userSocketId: socket.id,
              memoId,
              userInfo: userInfos.get(socket.id),
              userId: socket.userId, // 인증된 사용자 ID 추가
            });
          }

          // 방에 사용자가 없으면 방 데이터 정리
          if (roomInfo.users.size === 0) {
            roomData.delete(memoId);
          }
        }

        // 사용자 커서 위치 제거
        userCursors.delete(socket.id);

        // 사용자 정보 제거
        userInfos.delete(socket.id);

        // 사용자 이벤트 카운트 정리 (이벤트별로 정리)
        Object.keys(userEventCounts).forEach((key) => {
          if (key.startsWith(`${socket.id}-`)) {
            userEventCounts.delete(key);
          }
        });
      } catch (error) {
        console.error(
          `사용자 ${socket.id}의 메모 방 ${
            memoId || "unknown"
          } 나가기 중 오류 발생:`,
          error
        );
        socket.emit("error", {
          message: error.message || "방 나가기 중 오류가 발생했습니다.",
        });
      }
    });

    // 연결 해제 이벤트
    socket.on("disconnect", (reason) => {
      console.log(
        `사용자의 소켓 연결이 해제되었습니다: ${socket.id} (${
          socket.userId || "unknown"
        }) 이유: ${reason}`
      );

      try {
        let userRemovedFromRoom = false;

        // 방 데이터에서 사용자 제거 및 다른 사용자들에게 알림
        // roomData를 순회하면서 사용자가 속한 방을 찾음
        roomData.forEach((roomInfo, memoId) => {
          if (roomInfo.users.has(socket.id)) {
            const wasInRoom = roomInfo.users.has(socket.id);
            roomInfo.users.delete(socket.id);
            userRemovedFromRoom = true;

            // 사용자가 실제로 방에 있었다면 다른 사용자들에게 알림
            if (wasInRoom) {
              // 현재 방에 있는 사용자들에게 사용자 퇴장 알림
              socket.to(memoId).emit("user-left", {
                userSocketId: socket.id,
                memoId,
                userInfo: userInfos.get(socket.id),
                userId: socket.userId, // 인증된 사용자 ID 추가
              });
            }

            // 방에 사용자가 없으면 방 데이터 정리
            if (roomInfo.users.size === 0) {
              roomData.delete(memoId);
            }
          }
        });

        // 사용자 커서 위치 제거
        userCursors.delete(socket.id);

        // 사용자 정보 제거
        userInfos.delete(socket.id);

        // 사용자 이벤트 카운트 정리 (이벤트별로 정리)
        Object.keys(userEventCounts).forEach((key) => {
          if (key.startsWith(`${socket.id}-`)) {
            userEventCounts.delete(key);
          }
        });
      } catch (error) {
        console.error(
          `사용자 ${socket.id}의 연결 해제 처리 중 오류 발생:`,
          error
        );
      }
    });
  });

  // 주기적으로 비활성 방 정리 (10분마다)
  setInterval(() => {
    const now = Date.now();
    const INACTIVE_TIME = 10 * 60 * 1000; // 10분

    roomData.forEach((roomInfo, memoId) => {
      if (
        now - roomInfo.lastActivity > INACTIVE_TIME &&
        roomInfo.users.size === 0
      ) {
        roomData.delete(memoId);
        console.log(`비활성 메모 방 ${memoId}의 데이터가 정리되었습니다.`);
      }
    });
  }, 5 * 60 * 1000); // 5분마다 실행

  // 소켓 서버 시작 로그
  console.log("소켓 서버가 초기화되었습니다.");

  return io;
}

// 소켓 서버 인스턴스 가져오기 함수
function getSocketServer() {
  return io;
}

module.exports = {
  initSocketServer,
  getSocketServer,
};
