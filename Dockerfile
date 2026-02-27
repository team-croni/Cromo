# 1. Base Image
# 가볍고 안정적인 Node.js 20 Alpine 버전을 기반 이미지로 사용합니다.
FROM node:20-alpine AS base

# 2. Set Working Directory
# 컨테이너 내 작업 디렉토리를 설정합니다.
WORKDIR /app

# 3. Install Dependencies
# pnpm을 설치하고, 종속성 파일과 Prisma 스키마를 먼저 복사하여 Docker의 레이어 캐시를 활용합니다.
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml* ./
COPY prisma ./prisma/
# 빌드 시 DATABASE_URL 설정 (Prisma generate에만 사용)
# docker build --build-arg DATABASE_URL=... 로 전달 필요
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}
RUN pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm prisma generate
# 참고: 데이터베이스 마이그레이션은 컨테이너 실행 후 적용하세요:
# docker-compose exec nextjs-app pnpm prisma db push

# 4. Copy Application Code
# 나머지 소스 코드를 컨테이너에 복사합니다.
COPY . .

# 5. Build Application
# Next.js 애플리케이션을 프로덕션 모드로 빌드합니다.
RUN pnpm build

# 7. Expose Port
# 애플리케이션이 사용할 포트를 명시적으로 알립니다.
EXPOSE 3000

# 8. Start Command
# 컨테이너가 시작될 때 실행할 명령어를 정의합니다.
CMD ["pnpm", "start"]
