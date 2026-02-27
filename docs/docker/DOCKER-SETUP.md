# Docker 설정 가이드

이 문서는 Cromo 프로젝트의 Docker 설정에 대해 설명합니다.

## 개요

Cromo 프로젝트는 다음 Docker 서비스들로 구성됩니다:

- **PostgreSQL** (with pgvector): 벡터 검색을 지원하는 데이터베이스
- **Next.js**: 메인 애플리케이션 서버
- **Socket.IO Server**: 실시간 협업 기능 제공

## 파일 구조

```
cromo/
├── Dockerfile              # 프로덕션용 Next.js 이미지
├── Dockerfile.dev        # 개발용 Next.js 이미지
├── docker-compose.yml    # 프로덕션/개발 공통 서비스 정의
├── docker-compose.override.yml  # 개발 환경용 오버라이드
├── docker/
│   └── start.sh         # 개발 환경 시작 스크립트
└── socket-server/
    └── Dockerfile       # Socket.IO 서버 이미지
```

## 서비스 상세

### 1. PostgreSQL (데이터베이스)

```yaml
postgres:
  image: pgvector/pgvector:0.8.2-pg18-trixie
  ports:
    - "5432:5432"
  volumes:
    - db-data:/var/lib/postgresql
```

- **이미지**: pgvector가 포함된 PostgreSQL 18
- **포트**: 5432 (호스트)
- **볼륨**: 데이터 지속성을 위한 named volume

### 2. Next.js Application

```yaml
nextjs-app:
  build:
    context: .
    dockerfile: Dockerfile # 또는 Dockerfile.dev (개발 시)
  ports:
    - "3000:3000"
  environment:
    - SOCKET_SERVER_URL=http://socket-server:4000
    - INNGEST_BASE_URL=http://host.docker.internal:8288
```

- **포트**: 3000 (호스트)
- **환경 변수**:
  - `SOCKET_SERVER_URL`: Socket.IO 서버 연결 주소
  - `INNGEST_BASE_URL`: Inngest 개발 서버 (로컬 개발 시)

### 3. Socket.IO Server

```yaml
socket-server:
  build:
    context: .
    dockerfile: socket-server/Dockerfile
  ports:
    - "4001:4000"
  environment:
    - PORT=4000
```

- **포트**: 4001 (호스트) → 4000 (컨테이너)
- **기능**: 실시간 메모 협업, 커서 공유

## 사용법

### 프로덕션 실행

```bash
# 빌드 및 실행
docker-compose up --build

# 백그라운드 실행
docker-compose up --build -d
```

### 개발 환경 실행

```bash
# 개발 모드로 실행 (볼륨 마운트, hot reload)
docker-compose -f docker-compose.yml -f docker-compose.override.yml up --build
```

### 빌드 인자

Dockerfile 빌드 시 DATABASE_URL을 인자로 전달해야 합니다:

```bash
# 직접 빌드 시
docker build --build-arg DATABASE_URL=$DATABASE_URL -t cromo .

# docker-compose 사용 시
# .env 파일의 DATABASE_URL이 자동으로 전달됩니다
docker-compose build
```

## 시작 스크립트 (docker/start.sh)

개발 환경에서 사용되는 시작 스크립트입니다:

1. `.env` 파일이 없으면 `.env.example`에서 복사
2. PostgreSQL 준비 완료 대기 (포트 체크)
3. 데이터베이스 마이그레이션 상태 확인
4. 필요시 `db:setup` 자동 실행
5. Next.js 개발 서버 시작

## 주요 명령어

```bash
# 개발 서버 시작
docker-compose -f docker-compose.yml -f docker-compose.override.yml up --build

# 프로덕션 빌드
docker-compose build

# 로그 확인
docker-compose logs -f nextjs-app
docker-compose logs -f socket-server
docker-compose logs -f postgres

# 컨테이너 정지
docker-compose down

# 볼륨 포함 완전 삭제
docker-compose down -v
```

## 문제 해결

### 데이터베이스 연결 오류

```bash
# PostgreSQL 컨테이너 상태 확인
docker-compose ps

# 로그 확인
docker-compose logs postgres

# 데이터베이스 초기화
docker-compose exec nextjs-app pnpm db:setup
```

### 빌드 오류

```bash
# 캐시 없이 다시 빌드
docker-compose build --no-cache
```

### 볼륨 문제

```bash
# 볼륨 확인
docker volume ls | grep cromo

# 볼륨 삭제 (데이터 초기화)
docker volume rm cromo_db-data
```

## 볼륨 마운트 (개발 환경)

`docker-compose.override.yml`에서 개발 환경의 볼륨 마운트 설정:

```yaml
volumes:
  - .:/app # 현재 디렉토리를 /app에 마운트
  - /app/node_modules # node_modules는 별도 볼륨
  - /app/.next # Next.js 캐시
```

이렇게 하면 호스트의 코드 변경이 컨테이너에 즉시 반영됩니다.
