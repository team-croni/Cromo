import { test, expect } from '@playwright/test';

test.describe('Landing Page E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('1. Header Navigation', () => {
    test('Logo Link should return to top', async ({ page }) => {
      const logoLink = page.locator('header a[href="/"]');
      await expect(logoLink).toBeVisible();
      await expect(logoLink).toHaveAttribute('href', '/');
    });

    test('Navigation Menu items should exist (Desktop)', async ({ page }) => {
      const nav = page.locator('header nav');
      await expect(nav).toBeVisible();

      const expectedLinks = [
        { name: '홈', href: '#home' },
        { name: '기능', href: '#features' },
        { name: 'BETA', href: '#beta-test' },
        { name: '가격', href: '#pricing' },
        { name: 'FAQ', href: '#faq' },
      ];

      for (const link of expectedLinks) {
        const navLink = nav.getByRole('link', { name: link.name });
        await expect(navLink).toBeVisible();
        await expect(navLink).toHaveAttribute('href', link.href);
      }
    });

    test('Clicking nav links should scroll to section', async ({ page }) => {
      // Test '기능' link
      await page.locator('header nav').getByRole('link', { name: '기능' }).click();
      await expect(page).toHaveURL(/#features/);
      // Wait for scroll (optional, but good for verification if we check intersection)
      await expect(page.locator('#features')).toBeInViewport();

      // Test '가격' link
      await page.locator('header nav').getByRole('link', { name: '가격' }).click();
      await expect(page).toHaveURL(/#pricing/);
      await expect(page.locator('#pricing')).toBeInViewport();
    });

    test('Header CTA Button should navigate to /memo', async ({ page }) => {
      const ctaButton = page.locator('header').getByRole('button', { name: '시작하기' });
      await expect(ctaButton).toBeVisible();

      const link = page.locator('header').getByRole('link', { name: '시작하기' });
      await expect(link).toHaveAttribute('href', '/memo');

      await link.click();
      await expect(page).toHaveURL(/(\/memo|\/login)/);
    });
  });

  test.describe('2. Hero Section', () => {
    test('Headlines should be correct', async ({ page }) => {
      await expect(page.getByText('AI와 함께하는 스마트한 메모 관리')).toBeVisible();
      await expect(page.getByText('당신의 아이디어를 더 가치있게 만드세요')).toBeVisible();
    });

    test('Primary CTA should navigate to /memo', async ({ page }) => {
      const startNowBtn = page.getByRole('button', { name: '지금 시작하기' });
      await expect(startNowBtn).toBeVisible();

      const link = page.getByRole('link', { name: '지금 시작하기' });
      await expect(link).toHaveAttribute('href', '/memo');
    });

    test('Secondary CTA should scroll to #features', async ({ page }) => {
      const exploreBtn = page.getByRole('button', { name: '기능 살펴보기' });
      await expect(exploreBtn).toBeVisible();

      await exploreBtn.click();
      await expect(page).toHaveURL(/#features/);
      await expect(page.locator('#features')).toBeInViewport();
    });

    test('Visual Assets should be visible', async ({ page }) => {
      const heroImage = page.locator('img[alt="Hero Screenshot"]');
      await expect(heroImage).toBeVisible();
    });
  });

  test.describe('3. Beta Test Section', () => {
    test('Content should be visible', async ({ page }) => {
      // Scroll to section to ensure it renders (if lazy loaded) or just check presence
      const betaSection = page.locator('#beta-test');
      await betaSection.scrollIntoViewIfNeeded();

      await expect(page.getByText('Beta version')).toBeVisible();
      await expect(page.getByText('Cromo의 시작을')).toBeVisible();
      await expect(page.getByText('프리미엄 기능', { exact: true })).toBeVisible();
    });

    test('Beta CTA should navigate to /memo', async ({ page }) => {
      const betaSection = page.locator('#beta-test');
      await betaSection.scrollIntoViewIfNeeded();

      const ctaBtn = betaSection.getByRole('button', { name: '지금 무료로 시작하기' });
      await expect(ctaBtn).toBeVisible();

      // Find the link wrapping the button
      const link = betaSection.getByRole('link', { name: '지금 무료로 시작하기' });
      await expect(link).toHaveAttribute('href', '/memo');
    });
  });

  test.describe('4. General Structure', () => {
    test('All main sections should be present', async ({ page }) => {
      const sections = ['#home', '#features', '#beta-test', '#pricing', '#faq'];

      for (const selector of sections) {
        await expect(page.locator(selector)).toBeAttached();
      }

      // Footer might not have an ID, check by role contentinfo
      await expect(page.locator('footer')).toBeVisible();
    });
  });
});