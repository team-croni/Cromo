import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { info, warn, error, success } from "./utils/logger.js";

import {
  getPrismaClient,
  getMemoByIdWithSharedAccess,
  resolveMemoId,
} from "./db/index.js";
import { roomData } from "./store/index.js";
import registerHandlers from "./handlers/index.js";

const PORT = process.env.PORT || 8080;
const logger = { info, warn, error, success };

// 서버 시작 정보
logger.info(`시작: PORT=${PORT}, ENV=${process.env.NODE_ENV || "dev"}`);

const app = express();

// 헬스 체크
app.get(["/", "/health"], async (req, res) => {
  try {
    const client = getPrismaClient();
    await client.$queryRaw`SELECT 1`;
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: "connected",
      memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    });
  } catch (error) {
    // 에러 로깅
    logger.error("헬스 체크 실패", req);

    res.status(503).json({ status: "error", database: "disconnected" });
  }
});

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? (process.env.ALLOWED_ORIGINS || "").split(",")
        : ["http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 20000,
  pingInterval: 25000,
  path: "/socket.io",
});

// 인증 미들웨어
io.use(async (socket, next) => {
  try {
    const userId = socket.handshake.query.userId;
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!userId || !uuidRegex.test(userId)) {
      return next(new Error("Authentication required or Invalid ID"));
    }
    socket.userId = userId;
    next();
  } catch (error) {
    next(new Error("Authentication failed"));
  }
});

// 핸들러 등록
registerHandlers(io);

// 주기적 청소 작업 (비활성 방 정리)
setInterval(() => {
  const now = Date.now();
  const INACTIVE_TIME = 10 * 60 * 1000;
  roomData.forEach((roomInfo, memoId) => {
    if (
      now - roomInfo.lastActivity > INACTIVE_TIME &&
      roomInfo.users.size === 0
    ) {
      roomData.delete(memoId);
      logger.info(`비활성 방 정리: ${memoId.substring(0, 8)}...`);
    }
  });
}, 5 * 60 * 1000);

// 서버 시작 전에 Prisma 클라이언트 초기화
getPrismaClient();

server.listen(PORT, (err) => {
  if (err) {
    logger.error("서버 시작 실패", err);
    process.exit(1);
  }
  logger.success(`서버 실행: http://localhost:${PORT}`);
});

// 에러 및 종료 처리
process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception", err);
  process.exit(1);
});
process.on("SIGTERM", () => {
  server.close(() => process.exit(0));
});
