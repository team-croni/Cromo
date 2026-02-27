# 1. Base Image
# 가볍고 안정적인 Node.js 20 Alpine 버전을 기반 이미지로 사용합니다.
FROM node:20-alpine AS base

# 2. Set Working Directory
# 컨테이너 내 작업 디렉토리를 설정합니다.
WORKDIR /app

# 3. Install Dependencies
# 루트 디렉토리의 package.json을 사용하여 종속성을 설치합니다.
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml* ./
COPY prisma ./prisma/
RUN pnpm install --frozen-lockfile --prod --ignore-scripts
RUN pnpm prisma generate

# 4. Copy Application Code
# socket-server 디렉토리의 소스 코드를 컨테이너에 복사합니다.
COPY socket-server/ ./socket-server/
WORKDIR /app/socket-server

# 5. Expose Port
# Socket.IO 서버가 사용할 포트를 명시적으로 알립니다. (일반적으로 4000 사용)
EXPOSE 4000

# 6. Start Command
# 컨테이너가 시작될 때 실행할 명령어를 정의합니다.
CMD ["node", "app.js"]
