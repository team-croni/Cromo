import { Logger, AxiomJSTransport } from "@axiomhq/logging";
import axiomClient from "@/lib/axiom/axiom";

// 로그 색상 및 형식 유틸리티
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",

  // 전경색
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",

  // 배경색
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
  bgWhite: "\x1b[47m",
  bgGray: "\x1b[100m",
};

function getTimestamp() {
  return new Date().toISOString();
}

function formatLog(
  level: string,
  levelBgColor: string,
  emoji: string,
  message: string,
  meta: Record<string, any> = {},
  ...args: any[]
) {
  const timestamp = getTimestamp();
  const prefix = `${colors.dim}[${timestamp}]${colors.reset} ${levelBgColor}${colors.white} ${emoji}${level} ${colors.reset}`;

  // 메타데이터를 JSON 문자열로 변환
  const metaString = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';

  console.log(`${prefix} ${message}${metaString}`, ...args);
}

// 로그 레벨 정의
const LOG_LEVELS = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  fatal: 5
};

// 환경 변수에서 로그 레벨 가져오기 (기본값: info)
const currentLogLevel = process.env.LOG_LEVEL || 'info';
const currentLogLevelValue = LOG_LEVELS[currentLogLevel as keyof typeof LOG_LEVELS] ?? LOG_LEVELS.info;

// Axiom 로거 설정
export const axiomLogger =
  process.env.NEXT_PUBLIC_AXIOM_DATASET && process.env.NEXT_PUBLIC_AXIOM_TOKEN
    ? new Logger({
      transports: [
        new AxiomJSTransport({
          axiom: axiomClient,
          dataset: process.env.NEXT_PUBLIC_AXIOM_DATASET,
        }),
      ],
    })
    : null;

// 로그 레벨 체크 함수
const shouldLogToAxiom = (level: string) => {
  const levelValue = LOG_LEVELS[level as keyof typeof LOG_LEVELS] ?? LOG_LEVELS.info;
  return levelValue >= currentLogLevelValue;
};

// API 요청 정보를 표준화된 형식으로 추출하는 함수
interface StandardizedRequestInfo {
  method?: string;
  url?: string;
  path?: string;
  host?: string;
  userAgent?: string;
  ip?: string;
  referer?: string;
  origin?: string;
}

export function extractStandardRequestInfo(request: any): StandardizedRequestInfo {
  // Next.js API Routes에서 request 객체 처리
  if (request && typeof request === 'object') {
    return {
      method: request.method || '-',
      url: request.url || '-',
      path: request.nextUrl?.pathname || new URL(request.url || '', 'http://localhost').pathname || '-',
      host: request.headers?.get('host') || request.headers?.host || '-',
      userAgent: request.headers?.get('user-agent') || request.headers?.['user-agent'] || '-',
      ip: request.headers?.get('x-forwarded-for') || request.connection?.remoteAddress || '-',
      referer: request.headers?.get('referer') || request.headers?.referer || '-',
      origin: request.headers?.get('origin') || request.headers?.origin || '-',
    };
  }

  // Express.js에서 request 객체 처리
  if (request && typeof request === 'object' && request.headers) {
    return {
      method: request.method || '-',
      url: request.url || '-',
      path: request.path || '-',
      host: request.headers.host || '-',
      userAgent: request.headers['user-agent'] || '-',
      ip: request.headers['x-forwarded-for'] || request.connection?.remoteAddress || '-',
      referer: request.headers.referer || '-',
      origin: request.headers.origin || '-',
    };
  }

  // 기본값 반환
  return {
    method: '-',
    url: '-',
    path: '-',
    host: '-',
    userAgent: '-',
    ip: '-',
    referer: '-',
    origin: '-',
  };
}

// 기본 로그 필드
const DEFAULT_LOG_FIELDS = {
  service: 'cromo-app',
  version: '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  timestamp: new Date().toISOString(),
};

// API 로그를 쉽게 작성하기 위한 헬퍼 함수
interface ApiLogFields {
  request?: StandardizedRequestInfo;
  response?: {
    statusCode?: number;
    duration?: number;
    size?: number;
  };
  [key: string]: any; // 추가 필드
}

export function createApiLog(message: string, fields: ApiLogFields = {}) {
  return {
    message,
    ...DEFAULT_LOG_FIELDS,
    ...fields,
    timestamp: new Date().toISOString(),
  };
}

export const logger = {
  trace: (message: string, meta: Record<string, any> = {}, ...args: any[]) => {
    formatLog(
      "TRACE",
      colors.bgGray,
      "🔍",
      colors.gray + message + colors.reset,
      { ...DEFAULT_LOG_FIELDS, category: meta.category || 'APP', ...meta },
      ...args
    );

    if (axiomLogger && shouldLogToAxiom('trace')) {
      axiomLogger.log("debug", message, { ...DEFAULT_LOG_FIELDS, category: meta.category || 'APP', ...meta, ...args });
    }
  },
  debug: (message: string, meta: Record<string, any> = {}, ...args: any[]) => {
    formatLog(
      "DEBUG",
      colors.bgGray,
      "🐛",
      colors.gray + message + colors.reset,
      { ...DEFAULT_LOG_FIELDS, category: meta.category || 'APP', ...meta },
      ...args
    );

    if (axiomLogger && shouldLogToAxiom('debug')) {
      axiomLogger.log("debug", message, { ...DEFAULT_LOG_FIELDS, category: meta.category || 'APP', ...meta, ...args });
    }
  },
  info: (message: string, meta: Record<string, any> = {}, ...args: any[]) => {
    formatLog(
      "INFO",
      colors.bgBlue,
      "💡",
      colors.blue + message + colors.reset,
      { ...DEFAULT_LOG_FIELDS, category: meta.category || 'APP', ...meta },
      ...args
    );

    if (axiomLogger && shouldLogToAxiom('info')) {
      axiomLogger.log("info", message, { ...DEFAULT_LOG_FIELDS, category: meta.category || 'APP', ...meta, ...args });
    }
  },
  warn: (message: string, meta: Record<string, any> = {}, ...args: any[]) => {
    formatLog(
      "WARN",
      colors.bgYellow,
      "⚠️",
      colors.yellow + message + colors.reset,
      { ...DEFAULT_LOG_FIELDS, category: meta.category || 'APP', ...meta },
      ...args
    );

    if (axiomLogger && shouldLogToAxiom('warn')) {
      axiomLogger.log("warn", message, { ...DEFAULT_LOG_FIELDS, category: meta.category || 'APP', ...meta, ...args });
    }
  },
  error: (message: string, meta: Record<string, any> = {}, ...args: any[]) => {
    formatLog(
      "ERROR",
      colors.bgRed,
      "❌",
      colors.red + message + colors.reset,
      { ...DEFAULT_LOG_FIELDS, category: meta.category || 'APP', ...meta },
      ...args
    );

    if (axiomLogger && shouldLogToAxiom('error')) {
      axiomLogger.log("error", message, { ...DEFAULT_LOG_FIELDS, category: meta.category || 'APP', ...meta, ...args });
    }
  },
  fatal: (message: string, meta: Record<string, any> = {}, ...args: any[]) => {
    formatLog(
      "FATAL",
      colors.bgRed,
      "💀",
      colors.red + message + colors.reset,
      { ...DEFAULT_LOG_FIELDS, category: meta.category || 'APP', ...meta },
      ...args
    );

    if (axiomLogger && shouldLogToAxiom('fatal')) {
      axiomLogger.log("error", message, { ...DEFAULT_LOG_FIELDS, category: meta.category || 'APP', ...meta, ...args });
    }
  },
  success: (message: string, meta: Record<string, any> = {}, ...args: any[]) => {
    formatLog("SUCCESS", colors.bgGreen, "✅", message, { ...DEFAULT_LOG_FIELDS, category: meta.category || 'APP', ...meta }, ...args);

    if (axiomLogger && shouldLogToAxiom('info')) {
      axiomLogger.log("info", message, { ...DEFAULT_LOG_FIELDS, category: meta.category || 'APP', ...meta, ...args });
    }
  },

  // 서버 시작/종료 관련 특별 로그
  server: (message: string, meta: Record<string, any> = {}, ...args: any[]) => {
    formatLog(
      "SERVER",
      colors.bgGray,
      "🚀",
      colors.green + message + colors.reset,
      { ...DEFAULT_LOG_FIELDS, category: 'SERVER', ...meta },
      ...args
    );

    if (axiomLogger && shouldLogToAxiom('info')) {
      axiomLogger.log("info", message, { ...DEFAULT_LOG_FIELDS, category: 'SERVER', ...meta, ...args });
    }
  },
  db: (message: string, meta: Record<string, any> = {}, ...args: any[]) => {
    formatLog("DB", colors.bgMagenta, "💾", message, { ...DEFAULT_LOG_FIELDS, category: 'DATABASE', ...meta }, ...args);

    if (axiomLogger && shouldLogToAxiom('info')) {
      axiomLogger.log("info", message, { ...DEFAULT_LOG_FIELDS, category: 'DATABASE', ...meta, ...args });
    }
  },
  socket: (message: string, meta: Record<string, any> = {}, ...args: any[]) => {
    formatLog("SOCKET", colors.bgBlue, "🔌", message, { ...DEFAULT_LOG_FIELDS, category: 'SOCKET', ...meta }, ...args);

    if (axiomLogger && shouldLogToAxiom('info')) {
      axiomLogger.log("info", message, { ...DEFAULT_LOG_FIELDS, category: 'SOCKET', ...meta, ...args });
    }
  },
  health: (message: string, meta: Record<string, any> = {}, ...args: any[]) => {
    formatLog("HEALTH", colors.bgGreen, "💓", message, { ...DEFAULT_LOG_FIELDS, category: 'HEALTH', ...meta }, ...args);

    if (axiomLogger && shouldLogToAxiom('info')) {
      axiomLogger.log("info", message, { ...DEFAULT_LOG_FIELDS, category: 'HEALTH', ...meta, ...args });
    }
  },

  // 스케줄러 관련 특별 로그
  scheduler: (message: string, meta: Record<string, any> = {}, ...args: any[]) => {
    formatLog(
      "SCHEDULER",
      colors.bgCyan,
      "⏰",
      colors.cyan + message + colors.reset,
      { ...DEFAULT_LOG_FIELDS, category: 'SCHEDULER', ...meta },
      ...args
    );

    if (axiomLogger && shouldLogToAxiom('info')) {
      axiomLogger.log("info", message, { ...DEFAULT_LOG_FIELDS, category: 'SCHEDULER', ...meta, ...args });
    }
  },

  // API 관련 특별 로그
  api: {
    request: (message: string, request: any, ...args: any[]) => {
      const standardizedRequest = extractStandardRequestInfo(request);
      logger.info(message, {
        ...DEFAULT_LOG_FIELDS,
        category: 'SERVER',
        method: standardizedRequest.method,
        path: standardizedRequest.path,
        host: standardizedRequest.host,
        userAgent: standardizedRequest.userAgent,
        request: standardizedRequest,
        ...args
      });
    },
    response: (message: string, request: any, response: any, ...args: any[]) => {
      const standardizedRequest = extractStandardRequestInfo(request);
      const statusCode = response?.status || response?.statusCode || '-';

      logger.info(message, {
        ...DEFAULT_LOG_FIELDS,
        category: 'SERVER',
        method: standardizedRequest.method,
        path: standardizedRequest.path,
        host: standardizedRequest.host,
        userAgent: standardizedRequest.userAgent,
        statusCode: statusCode,
        request: standardizedRequest,
        response: {
          statusCode: statusCode,
          duration: response?.duration || '-',
          size: response?.size || '-',
        },
        ...args
      });
    },
    error: (message: string, request: any, error: any, ...args: any[]) => {
      const standardizedRequest = extractStandardRequestInfo(request);

      // 에러 객체에서 상태 코드 추출
      let statusCode = 500; // 기본 상태 코드
      if (error?.status) {
        statusCode = error.status;
      } else if (error?.statusCode) {
        statusCode = error.statusCode;
      } else if (error?.response?.status) {
        statusCode = error.response.status;
      }

      logger.error(message, {
        ...DEFAULT_LOG_FIELDS,
        category: 'SERVER',
        method: standardizedRequest.method,
        path: standardizedRequest.path,
        host: standardizedRequest.host,
        userAgent: standardizedRequest.userAgent,
        statusCode: statusCode,
        request: standardizedRequest,
        response: {
          statusCode: statusCode,
        },
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        } : error,
        ...args
      });
    }
  },

  // AI 기능 전용 로그 함수 - 성공/실패 상태 코드와 실패 이유를 명확하게 처리
  ai: {
    // AI 요청 로그
    request: (message: string, request: any, service?: string, ...args: any[]) => {
      const standardizedRequest = extractStandardRequestInfo(request);
      logger.info(message, {
        ...DEFAULT_LOG_FIELDS,
        category: 'APP', // AI 요청도 앱 로직으로 분류
        method: standardizedRequest.method,
        path: standardizedRequest.path,
        host: standardizedRequest.host,
        userAgent: standardizedRequest.userAgent,
        statusCode: 200,
        request: standardizedRequest,
        ai: {
          service: service || '-',
          status: 'requested'
        },
        ...args
      });
    },

    // AI 성공 응답 로그
    success: (message: string, request: any, service: string, response: any, ...args: any[]) => {
      const standardizedRequest = extractStandardRequestInfo(request);
      const statusCode = response?.status || response?.statusCode || 200;

      logger.info(message, {
        ...DEFAULT_LOG_FIELDS,
        category: 'APP', // AI 성공도 앱 로직으로 분류
        method: standardizedRequest.method,
        path: standardizedRequest.path,
        host: standardizedRequest.host,
        userAgent: standardizedRequest.userAgent,
        statusCode: 200,
        request: standardizedRequest,
        ai: {
          service: service,
          model: response?.model || '-',
          status: 'success',
          duration: response?.duration || '-',
          statusCode: statusCode
        },
        response: {
          statusCode: statusCode,
          duration: response?.duration || '-',
          size: response?.size || '-',
        },
        ...args
      });
    },

    // AI 실패 응답 로그
    failure: (message: string, request: any, service: string, error: any, ...args: any[]) => {
      const standardizedRequest = extractStandardRequestInfo(request);
      let statusCode = 500; // 기본 실패 상태 코드

      // 에러 객체에서 상태 코드 추출
      if (error?.status) {
        statusCode = error.status;
      } else if (error?.statusCode) {
        statusCode = error.statusCode;
      } else if (error?.response?.status) {
        statusCode = error.response.status;
      }

      // 실패 이유 메시지 추출
      let failureReason = 'Unknown error';
      if (error instanceof Error) {
        failureReason = error.message;
      } else if (typeof error === 'string') {
        failureReason = error;
      } else if (error?.message) {
        failureReason = error.message;
      } else if (error?.error) {
        failureReason = error.error;
      }

      logger.error(message, {
        ...DEFAULT_LOG_FIELDS,
        category: 'APP', // AI 실패도 앱 로직으로 분류
        method: standardizedRequest.method,
        path: standardizedRequest.path,
        host: standardizedRequest.host,
        userAgent: standardizedRequest.userAgent,
        statusCode: statusCode,
        request: standardizedRequest,
        response: {
          statusCode: statusCode,
        },
        ai: {
          service: service,
          model: error.model || '-',
          status: 'failure',
          statusCode: statusCode,
          reason: failureReason,
          duration: error.duration || '-',
        },
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        } : error,
        ...args
      });
    }
  },

  empty: () => console.log(""),
};

// API 로깅 테스트 함수
export function testApiLogging() {
  // 테스트용 가짜 request 객체
  const fakeRequest = {
    method: 'GET',
    url: 'http://localhost:3000/api/test',
    headers: {
      get: (header: string) => {
        if (header === 'host') return 'localhost:3000';
        if (header === 'user-agent') return 'Mozilla/5.0 Test Agent';
        return undefined;
      },
      host: 'localhost:3000',
      'user-agent': 'Mozilla/5.0 Test Agent'
    },
    nextUrl: {
      pathname: '/api/test'
    }
  };

  // API 요청 로깅 테스트
  logger.api.request('테스트 API 요청', fakeRequest);

  // API 응답 로깅 테스트
  logger.api.response('테스트 API 응답', fakeRequest, {
    status: 200,
    duration: 150,
    size: 1024
  });

  // API 에러 로깅 테스트
  logger.api.error('테스트 API 에러', fakeRequest, new Error('테스트 에러 메시지'));
}