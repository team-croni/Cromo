import { test, expect } from '@playwright/test';
import {
  expectLoginPageVisible,
  clickGoogleLoginButton,
  expectRedirectToLogin,
  setupE2EAuthHeaders,
  navigateWithE2EAuth,
} from './utils/auth-helper';

test.describe('Login Functionality', () => {
  const LOGIN_URL = 'http://localhost:3000/login'; // The login page URL
  const TERMS_URL = 'http://localhost:3000/terms';
  const PRIVACY_URL = 'http://localhost:3000/privacy';

  test.beforeEach(async ({ page }) => {
    await page.goto(LOGIN_URL);
  });

  test.describe('1. Login Page UI', () => {
    test('should display the Google login button', async ({ page }) => {
      await expectLoginPageVisible(page);
    });

    test('should display the terms of service link', async ({ page }) => {
      const termsLink = page.getByRole('link', { name: '이용약관' });
      await expect(termsLink).toBeVisible({ timeout: 15000 });
      await expect(termsLink).toHaveAttribute('href', '/terms');
    });

    test('should display the privacy policy link', async ({ page }) => {
      const privacyLink = page.getByRole('link', { name: '개인정보처리방침' });
      await expect(privacyLink).toBeVisible({ timeout: 15000 });
      await expect(privacyLink).toHaveAttribute('href', '/privacy');
    });
  });

  test.describe('2. Login Flow', () => {
    test('should redirect to Google authentication on clicking Google login button', async ({ page }) => {
      await expectLoginPageVisible(page);

      // Expecting a navigation on the same page, not a popup
      const navigationPromise = page.waitForURL(/^https:\/\/accounts\.google\.com/);
      await clickGoogleLoginButton(page);
      await navigationPromise;

      // Additional assertion to ensure we are on Google's login page
      await expect(page).toHaveURL(/^https:\/\/accounts\.google\.com/);
    });
  });

  test.describe('3. Navigation', () => {
    test('should navigate to terms of service page', async ({ page }) => {
      const termsLink = page.locator('a:has-text("이용약관")');
      await termsLink.click();
      await expect(page).toHaveURL(TERMS_URL, { timeout: 15000 });
    });

    test('should navigate to privacy policy page', async ({ page }) => {
      const privacyLink = page.locator('a:has-text("개인정보처리방침")');
      await privacyLink.click();
      await expect(page).toHaveURL(PRIVACY_URL, { timeout: 15000 });
    });
  });

  test.describe('4. Authentication Redirect', () => {
    test('should redirect to login when accessing protected page without auth', async ({ page }) => {
      await expectRedirectToLogin(page, '/memo');
    });
  });

  test.describe('5. E2E Test Authentication', () => {
    test('should access protected page with E2E auth headers', async ({ page }) => {
      await setupE2EAuthHeaders(page);
      await page.goto('/memo');

      // Should not redirect to login
      await expect(page).toHaveURL('/memo', { timeout: 15000 });
    });
  });
});