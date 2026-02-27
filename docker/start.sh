#!/bin/bash
set -e

# .env 파일이 없으면 .env.example에서 복사
if [ ! -f .env ]; then
  echo ".env file not found. Copying from .env.example..."
  cp .env.example .env
  echo ".env file created from .env.example"
  echo "Please update the .env file with your actual values!"
fi

# docker-compose에서 이미 로드된 DATABASE_URL 환경 변수 사용
echo "Waiting for PostgreSQL to be ready..."

# DATABASE_URL에서 호스트, 유저, 비밀번호, DB명 추출
DB_URL=${DATABASE_URL#postgresql://}
DB_USER=$(echo $DB_URL | cut -d':' -f1)
DB_REST=$(echo $DB_URL | cut -d'@' -f2)
DB_HOST=$(echo $DB_REST | cut -d':' -f1)
DB_PORT_DB=$(echo $DB_REST | cut -d':' -f2)
DB_PORT=$(echo $DB_PORT_DB | cut -d'/' -f1)
DB_NAME=$(echo $DB_PORT_DB | cut -d'/' -f2 | cut -d'?' -f1)
DB_PASS=$(echo $DB_URL | cut -d':' -f2 | cut -d'@' -f1)

echo "Connecting to: host=$DB_HOST, port=$DB_PORT, user=$DB_USER, db=$DB_NAME"

# 포트 체크 함수 (nc, wget, curl 순서로 시도)
check_port() {
    local host=$1
    local port=$2
    
    # nc (netcat) 사용 시도
    if command -v nc &> /dev/null; then
        nc -z -w 1 "$host" "$port" 2>/dev/null
        return $?
    fi
    
    # wget 사용 시도
    if command -v wget &> /dev/null; then
        wget -q -O /dev/null --timeout=1 "http://$host:$port" 2>/dev/null
        return $?
    fi
    
    # curl 사용 시도
    if command -v curl &> /dev/null; then
        curl -s -o /dev/null --max-time 1 "http://$host:$port" 2>/dev/null
        return $?
    fi
    
    # bash /dev/tcp 사용 시도 (마지막 대안)
    (echo > /dev/tcp/$host/$port) 2>/dev/null
    return $?
}

# PostgreSQL이 준비될 때까지 대기
echo "Checking if PostgreSQL port $DB_PORT is open..."
attempt=0
until check_port "$DB_HOST" "$DB_PORT"; do
    attempt=$((attempt + 1))
    echo "PostgreSQL port is not ready (attempt $attempt) - sleeping"
    sleep 3
done

echo "PostgreSQL port is open!"

# 추가 대기: PostgreSQL이 완전히 초기화될 때까지
sleep 2

# psql이 사용 가능한지 확인하고 마이그레이션 상태 확인
if command -v psql &> /dev/null; then
  echo "Checking database migration status..."
  TABLE_EXISTS=$(PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = '_prisma_migrations';" 2>/dev/null || echo "0")
  
  if [ "$TABLE_EXISTS" -eq "0" ]; then
    echo "Database is empty. Running db:setup..."
    pnpm db:setup
  else
    echo "Database already initialized. Skipping db:setup."
  fi
else
  echo "psql not available. Skipping database check. Starting Next.js..."
fi

# Next.js 서버 시작 (개발 모드)
exec pnpm dev
