import { withAuth, NextRequestWithAuth } from "next-auth/middleware"
import { NextRequest, NextFetchEvent, NextResponse } from "next/server"
import { logger } from "@/lib/axiom/server"
import { transformMiddlewareRequest } from "@axiomhq/nextjs"

export default async function middleware(request: NextRequest, event: NextFetchEvent) {
  // E2E Test Bypass - 보안을 위해 production이 아닐 때와 비밀 키가 일치할 때만 허용
  const e2eSecret = process.env.E2E_TEST_AUTH_SECRET;
  if (
    process.env.NODE_ENV !== 'production' &&
    e2eSecret &&
    request.headers.get('x-e2e-test') === e2eSecret
  ) {
    return NextResponse.next();
  }

  // 루트 경로('/') 및 법적 고지 페이지들, 문의 페이지, Inngest 웹훅에 대해서는 인증 없이 접근 허용
  const publicPaths = ['/', '/terms', '/privacy', '/cookies', '/contact'];
  if (publicPaths.includes(request.nextUrl.pathname)) {
    return;
  }

  // Inngest 웹훅 경로는 인증 미들웨어를 통과시킴
  if (request.nextUrl.pathname.startsWith('/api/inngest')) {
    return;
  }


  try {
    // 그 외의 경로는 기존 인증 미들웨어 적용
    return withAuth({
      pages: {
        signIn: "/login",
      },
      callbacks: {
        authorized: ({ token }) => !!token
      }
    })(request as NextRequestWithAuth, event);
  } catch (error) {
    // 에러 발생 시에만 Axiom으로 로그 전송
    const [message, report] = transformMiddlewareRequest(request);

    // 필요한 request 정보만 추출
    const requestData = {
      method: request.method,
      url: request.url,
      headers: {
        host: request.headers.get('host'),
        userAgent: request.headers.get('user-agent'),
      },
      nextUrl: request.nextUrl.pathname,
    };

    logger.error(`Middleware error: ${message}`, {
      request: requestData,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      ...report
    });

    throw error;
  }
}

export const config = {
  matcher: [
    // API 경로 중 인증이 필요한 경로들만 포함
    // 공개 API (auth, 특정 공개 엔드포인트, inngest webhook)는 제외
    '/((?!_next/static|_next/image|favicon.ico|auth|manifest.json|icon-192x192.png|icon-512x512.png|sitemap.xml|robots.txt|images|svgs|fonts|login|api/inngest).*)',
  ],
}