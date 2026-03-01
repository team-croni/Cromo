import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"
import { AVATAR_GRADIENT_OPTIONS, DEFAULT_AVATAR_GRADIENT } from "@constants/avatar-gradients"

const prisma = new PrismaClient()

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      profile(profile) {
        // 랜덤한 그라데이션 색상 선택 (이미지 타입이 아닐 때를 대비한 fallback)
        const randomGradient = AVATAR_GRADIENT_OPTIONS[Math.floor(Math.random() * AVATAR_GRADIENT_OPTIONS.length)].value;

        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          avatarColor: randomGradient,
          avatarType: "gradient",
        };
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // 테스트 계정 정보 (환경 변수에서 가져오거나 기본값 사용)
        const TEST_EMAIL = process.env.TEST_USER_EMAIL || "test@cromo.site";
        const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || "cromo1234";

        if (credentials.email === TEST_EMAIL && credentials.password === TEST_PASSWORD) {
          // 데이터베이스에서 테스트 사용자 확인 또는 생성
          let user = await prisma.user.findUnique({
            where: { email: TEST_EMAIL }
          });

          if (!user) {
            const randomGradient = AVATAR_GRADIENT_OPTIONS[Math.floor(Math.random() * AVATAR_GRADIENT_OPTIONS.length)].value;
            user = await prisma.user.create({
              data: {
                email: TEST_EMAIL,
                name: "Test User",
                avatarColor: randomGradient,
                avatarType: "gradient",
              }
            });
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            avatarColor: user.avatarColor,
            avatarType: user.avatarType,
          };
        }

        return null;
      }
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account, profile }: { user: any; account: any; profile?: any }) {
      // OAuthAccountNotLinked 오류를 해결하기 위해 soft delete된 사용자가 다시 로그인할 때 계정 복구
      if (account?.provider === 'google' && profile?.email) {
        // soft delete된 사용자 찾기
        const deletedUser = await prisma.user.findFirst({
          where: {
            email: profile.email,
            deletedAt: { not: null }, // soft delete된 사용자만 검색
          },
          include: { accounts: true }
        });

        if (deletedUser) {
          // 90일 이내에 재로그인한 경우 계정 복구
          const ninetyDaysAgo = new Date();
          ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

          if (deletedUser.deletedAt && deletedUser.deletedAt > ninetyDaysAgo) {
            // 계정 복구: deletedAt 필드를 null로 설정
            await prisma.user.update({
              where: { id: deletedUser.id },
              data: { deletedAt: null }
            });

            /*
            // 연관된 메모와 폴더 복구
            await prisma.memo.updateMany({
              where: { userId: deletedUser.id },
              data: {
                isUserDeleted: false,
                deletedAt: null,
              },
            });

            await prisma.folder.updateMany({
              where: { userId: deletedUser.id },
              data: {
                isDeleted: false,
                deletedAt: null,
              },
            });
            */

            // OAuth 계정 연결 확인
            const existingAccount = await prisma.account.findFirst({
              where: {
                userId: deletedUser.id,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              }
            });

            // 기존 OAuth 계정이 없다면 생성
            if (!existingAccount) {
              await prisma.account.create({
                data: {
                  userId: deletedUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  access_token: account.access_token,
                  expires_at: account.expires_at,
                  refresh_token: account.refresh_token,
                  scope: account.scope,
                  token_type: account.token_type,
                  id_token: account.id_token,
                }
              });
            }

            // 계정 복구 후 로그인 허용
            return true;
          }
        }
      }

      return true;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        session.user.id = token.sub;
        session.user.avatarColor = token.avatarColor;
        session.user.avatarType = token.avatarType;

        // 세션에 사용자 삭제 여부 추가
        session.user.isDeleted = !!token.isDeleted;

        // soft delete된 사용자는 세션을 차단
        if (token.isDeleted) {
          return {};
        }
      }
      return session;
    },
    async jwt({ token, user, account, profile }: { token: any; user: any; account?: any; profile?: any }) {
      if (user) {
        // soft delete된 사용자인 경우 로그인 거부
        if (user.deletedAt) {
          // soft delete된 사용자임을 토큰에 표시
          token.isDeleted = true;
          return token;
        }

        token.sub = user.id;
        token.avatarColor = user.avatarColor || DEFAULT_AVATAR_GRADIENT;
        token.avatarType = user.avatarType || "gradient";
        token.isDeleted = false;
      }

      // 토큰 갱신 로직: 토큰이 30일 이내에 만료된다면 갱신
      const isTokenExpired = (token.exp as number) * 1000 < Date.now();
      if (isTokenExpired) {
        return { ...token, exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60 };
      }

      return token;
    },
  },
  events: {
    async signOut({ session, token }: { session: any; token: any }) {
      // 로그아웃 이벤트 처리
      console.log('User signed out:', session, token);
    },
  },
  pages: {
    signIn: '/login',
    error: '/login', // 인증 에러 발생 시 로그인 페이지로 리다이렉트
  },
}