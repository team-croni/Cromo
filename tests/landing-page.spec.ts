import { test, expect } from '@playwright/test';

test.describe('Landing Page E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('1. Navigation & Structure', () => {
    test('Header elements and Main CTA', async ({ page }) => {
      // 로고 및 네비게이션 메뉴 확인
      await expect(page.locator('header a[href="/"]')).toBeVisible();
      await expect(page.locator('header nav')).toBeVisible();

      // 핵심 CTA 버튼 작동 확인
      const startBtn = page.locator('header').getByRole('link', { name: '시작하기' });
      await startBtn.click();
      await page.waitForURL(/(\/memo|\/login)/, { timeout: 10000 });
      await expect(page).toHaveURL(/(\/memo|\/login)/);
    });

    test('All main sections should be present', async ({ page }) => {
      const sections = ['#home', '#features', '#beta-test', '#pricing', '#faq'];
      for (const selector of sections) {
        await expect(page.locator(selector)).toBeAttached();
      }
      await expect(page.locator('footer')).toBeVisible();
    });
  });
});