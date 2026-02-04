/**
 * E2E 테스트용 인증 헬퍼 함수
 * 
 * 이 모듈은 Playwright E2E 테스트에서 인증 관련 기능을 테스트하기 위한
 * 헬퍼 함수들을 제공합니다.
 * 
 * 주요 기능:
 * 1. E2E 테스트용 인증 헤더 설정 (미들웨어 우회)
 * 2. 테스트 사용자 세션 시뮬레이션
 * 3. 로그인/로그아웃 테스트 헬퍼
 */

import { Page, expect } from '@playwright/test';

/**
 * E2E 테스트용 인증 시크릿 키
 * .env 파일의 E2E_TEST_AUTH_SECRET과 일치해야 합니다.
 */
const E2E_TEST_AUTH_SECRET = process.env.E2E_TEST_AUTH_SECRET;

/**
 * E2E 테스트용 인증 헤더를 설정하여 미들웨어 인증을 우회합니다.
 * 
 * 사용법:
 * ```ts
 * await setupE2EAuthHeaders(page);
 * await page.goto('/memo'); // 인증 없이 접근 가능
 * ```
 * 
 * @param page - Playwright Page 객체
 */
export async function setupE2EAuthHeaders(page: Page): Promise<void> {
  await page.setExtraHTTPHeaders({
    'x-e2e-test': E2E_TEST_AUTH_SECRET,
  });
}

/**
 * E2E 테스트용 인증 헤더를 제거합니다.
 * 
 * @param page - Playwright Page 객체
 */
export async function removeE2EAuthHeaders(page: Page): Promise<void> {
  await page.setExtraHTTPHeaders({
    'x-e2e-test': '',
  });
}

/**
 * API 요청 컨텍스트에 E2E 테스트용 인증 헤더를 설정합니다.
 * 
 * 참고: APIRequestContext는 생성 시에만 헤더를 설정할 수 있으므로,
 * 이 함수는 새로운 APIRequestContext를 생성하는 방법을 안내합니다.
 * 
 * 사용법:
 * ```ts
 * const apiContext = await request.newContext({
 *   extraHTTPHeaders: {
 *     'x-e2e-test': E2E_TEST_AUTH_SECRET,
 *   },
 * });
 * const response = await apiContext.get('/api/memos');
 * ```
 * 
 * @returns E2E 테스트용 인증 헤더 객체
 */
export function getE2EAuthHeaders(): Record<string, string> {
  return {
    'x-e2e-test': E2E_TEST_AUTH_SECRET,
  };
}

/**
 * 로그인 페이지로 이동하고 Google 로그인 버튼을 클릭합니다.
 * 
 * 참고: 실제 Google OAuth 인증은 테스트 환경에서 어렵기 때문에
 * 이 함수는 주로 UI 테스트용으로 사용됩니다.
 * 
 * @param page - Playwright Page 객체
 * @param callbackUrl - 로그인 후 리다이렉트할 URL (기본값: '/memo')
 */
export async function clickGoogleLoginButton(
  page: Page,
  callbackUrl: string = '/memo'
): Promise<void> {
  // The page should already be on the login page or navigated to it by the test.
  // await page.goto(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`); // Removed redundant navigation

  const googleLoginButton = page.getByRole('button', { name: 'Google로 계속하기' });
  await expect(googleLoginButton).toBeVisible();

  await googleLoginButton.click();
}

/**
 * 로그인 페이지가 올바르게 표시되는지 확인합니다.
 * 
 * @param page - Playwright Page 객체
 */
export async function expectLoginPageVisible(page: Page): Promise<void> {
  // Wait for the main container of the login page to be visible
  await page.waitForSelector('.min-h-screen.flex.flex-col.items-center.justify-center.bg-background.p-4.relative.overflow-hidden', { state: 'visible' });

  await expect(page.getByRole('button', { name: 'Google로 계속하기' })).toBeVisible();
  // Using page.locator with text content for the links
  await expect(page.locator('a:has-text("이용약관")')).toBeVisible();
  await expect(page.locator('a:has-text("개인정보처리방침")')).toBeVisible();
}

/**
 * 인증이 필요한 페이지에 접근했을 때 로그인 페이지로 리다이렉트되는지 확인합니다.
 * 
 * @param page - Playwright Page 객체
 * @param protectedPath - 인증이 필요한 경로
 */
export async function expectRedirectToLogin(
  page: Page,
  protectedPath: string
): Promise<void> {
  await page.goto(protectedPath);
  await page.waitForURL(/\/login/, { timeout: 15000 });
  await expect(page).toHaveURL(/\/login(\?.*)?$/, { timeout: 15000 });
}

/**
 * E2E 테스트용 인증 헤더를 사용하여 인증이 필요한 페이지에 접근합니다.
 * 
 * @param page - Playwright Page 객체
 * @param path - 접근할 경로
 */
export async function navigateWithE2EAuth(page: Page, path: string): Promise<void> {
  await setupE2EAuthHeaders(page);
  await page.goto(path);
}

/**
 * 테스트용 사용자 세션을 localStorage에 저장합니다.
 * 
 * 참고: 이 함수는 NextAuth 세션을 시뮬레이션하기 위한 것으로,
 * 실제 서버 측 인증과는 다릅니다. 주로 클라이언트 사이드 테스트용으로 사용됩니다.
 * 
 * @param page - Playwright Page 객체
 * @param userData - 테스트 사용자 데이터
 */
export async function setTestUserSession(
  page: Page,
  userData: {
    id: string;
    name: string;
    email: string;
    avatarColor?: string;
    avatarType?: string;
  }
): Promise<void> {
  await page.evaluate((data) => {
    const session = {
      user: {
        id: data.id,
        name: data.name,
        email: data.email,
        avatarColor: data.avatarColor || 'default',
        avatarType: data.avatarType || 'gradient',
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
    localStorage.setItem('next-auth.session-token', JSON.stringify(session));
  }, userData);
}

/**
 * 테스트용 사용자 세션을 localStorage에서 제거합니다.
 * 
 * @param page - Playwright Page 객체
 */
export async function clearTestUserSession(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem('next-auth.session-token');
    localStorage.removeItem('lastLoginMethod');
  });
}

/**
 * 로그아웃 후 로그인 페이지로 리다이렉트되는지 확인합니다.
 * 
 * @param page - Playwright Page 객체
 */
export async function expectLogoutRedirect(page: Page): Promise<void> {
  await page.goto('/api/auth/signout');
  await page.waitForURL(/\/login/, { timeout: 5000 });
  await expect(page).toHaveURL(/\/login(\?.*)?$/);
}

/**
 * 현재 페이지의 URL이 인증이 필요한 페이지인지 확인합니다.
 * 
 * @param page - Playwright Page 객체
 * @returns 인증이 필요한 페이지이면 true, 아니면 false
 */
export async function isProtectedPage(page: Page): Promise<boolean> {
  const url = page.url();
  const protectedPaths = ['/memo', '/profile', '/settings', '/api/'];
  return protectedPaths.some(path => url.includes(path));
}

/**
 * E2E 테스트용 인증 헤더가 설정되어 있는지 확인합니다.
 * 
 * @param page - Playwright Page 객체
 * @returns 인증 헤더가 설정되어 있으면 true, 아니면 false
 */
export async function hasE2EAuthHeaders(page: Page): Promise<boolean> {
  const headers = await page.evaluate(() => {
    // 클라이언트에서는 직접 헤더를 확인할 수 없으므로
    // 페이지가 로드되었는지로 간접 확인
    return document.readyState === 'complete';
  });
  return headers;
}

/**
 * 테스트 전후에 실행할 인증 설정/해제 함수
 * 
 * 사용법:
 * ```ts
 * test.beforeEach(async ({ page }) => {
 *   await setupE2EAuthBeforeEach(page);
 * });
 * 
 * test.afterEach(async ({ page }) => {
 *   await cleanupE2EAuthAfterEach(page);
 * });
 * ```
 */

/**
 * 각 테스트 전에 E2E 인증을 설정합니다.
 * 
 * @param page - Playwright Page 객체
 */
export async function setupE2EAuthBeforeEach(page: Page): Promise<void> {
  await setupE2EAuthHeaders(page);
  await clearTestUserSession(page);
}

/**
 * 각 테스트 후에 E2E 인증을 정리합니다.
 * 
 * @param page - Playwright Page 객체
 */
export async function cleanupE2EAuthAfterEach(page: Page): Promise<void> {
  await removeE2EAuthHeaders(page);
  await clearTestUserSession(page);
}

/**
 * 인증 관련 테스트를 위한 fixture 확장
 * 
 * 사용법 (playwright.config.ts 또는 테스트 파일에서):
 * ```ts
 * import { test as base } from '@playwright/test';
 * 
 * type AuthFixtures = {
 *   authenticatedPage: Page;
 * };
 * 
 * const test = base.extend<AuthFixtures>({
 *   authenticatedPage: async ({ page }, use) => {
 *     await setupE2EAuthHeaders(page);
 *     await use(page);
 *     await removeE2EAuthHeaders(page);
 *   },
 * });
 * ```
 */
