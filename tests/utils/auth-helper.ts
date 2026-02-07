/**
 * E2E 테스트용 인증 헬퍼 함수
 * 
 * 이 모듈은 Playwright E2E 테스트에서 인증 관련 기능을 테스트하기 위한
 * 헬퍼 함수들을 제공합니다.
 * 
 * 주요 기능:
 * 1. 테스트 사용자 세션 시뮬레이션
 * 2. 로그인/로그아웃 테스트 헬퍼
 */

import { Page, expect } from '@playwright/test';

/**
 * E2E 테스트에서 사용될 더미 사용자 데이터
 */
export const TEST_USER = {
  id: 'test-user-id',
  name: 'Test User',
  email: 'test@cromo.site',
  avatarColor: 'rose',
  avatarType: 'gradient',
};

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
  await page.waitForURL(/\/login/, { timeout: 60000 });
  await expect(page).toHaveURL(/\/login(\?.*)?$/, { timeout: 60000 });
}

/**
 * 테스트용 사용자 세션을 localStorage에 저장합니다.
 * `page.context().addInitScript`를 사용하여 모든 페이지 로드 전에 실행됩니다.
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
  await page.context().addInitScript((data) => {
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
 * `page.context().addInitScript`를 사용하여 모든 페이지 로드 전에 실행됩니다.
 * 
 * @param page - Playwright Page 객체
 */
export async function clearTestUserSession(page: Page): Promise<void> {
  await page.context().addInitScript(() => {
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
  await page.waitForURL(/\/login/, { timeout: 60000 });
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
