// 소켓 서버용 로깅 유틸리티 (Axiom과 통합)
const LogLevel = {
  INFO: "INFO",
  WARN: "WARN",
  ERROR: "ERROR",
  SUCCESS: "SUCCESS",
};

// Axiom API로 로그 전송
async function sendToAxiom(level, message, meta = {}) {
  if (!process.env.AXIOM_TOKEN || !process.env.AXIOM_DATASET) {
    // Axiom 설정이 없으면 콘솔에만 출력
    return;
  }

  const logEntry = {
    level,
    message,
    ...meta,
    timestamp: new Date().toISOString(),
    service: "socket-server",
    env: process.env.NODE_ENV || "development",
  };

  try {
    await fetch(
      `https://api.axiom.co/v1/datasets/${process.env.AXIOM_DATASET}/ingest`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.AXIOM_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([logEntry]),
      }
    );
  } catch (error) {
    // Axiom 전송 실패 시 콘솔에 에러 출력
    console.error("Axiom 로그 전송 실패:", error);
  }
}

function formatDate(date) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSeconds: 3,
  }).format(date);
}

function log(level, message, meta = {}) {
  const timestamp = formatDate(new Date());

  // Axiom에 로그 전송
  sendToAxiom(level, message, meta);

  // 콘솔에도 출력 (디버깅용)
  const logObject = {
    timestamp,
    level,
    message,
    ...meta,
    service: "socket-server",
    env: process.env.NODE_ENV || "development",
  };

  const logMessage = JSON.stringify(logObject, null, 2);
  console.log(logMessage);
}

function info(message, meta = {}) {
  log(LogLevel.INFO, message, meta);
}

function warn(message, meta = {}) {
  log(LogLevel.WARN, message, meta);
}

function error(message, meta = {}) {
  log(LogLevel.ERROR, message, meta);
}

function success(message, meta = {}) {
  log(LogLevel.SUCCESS, message, meta);
}

export { info, warn, error, success };
