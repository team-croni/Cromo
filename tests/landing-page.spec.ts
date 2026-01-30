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
    test('Primary CTA should navigate to /memo', async ({ page }) => {
      const startNowBtn = page.getByRole('button', { name: '지금 시작하기' });
      await expect(startNowBtn).toBeVisible();

      const link = page.getByRole('link', { name: '지금 시작하기' });
      await expect(link).toHaveAttribute('href', '/memo');
    });

    test('Visual Assets should be visible', async ({ page }) => {
      const heroImage = page.locator('img[alt="Hero Screenshot"]');
      await expect(heroImage).toBeVisible();
    });
  });

  test.describe('3. Beta Test Section', () => {
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