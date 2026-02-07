import { test, expect } from '@playwright/test';
import { TEST_USER } from './utils/auth-helper';

test.describe('UI Authentication (Login/Logout) Functionality with Test Account', () => {
  const LOGIN_PATH = '/login';
  const PROTECTED_PATH = '/memo';

  test.beforeEach(async ({ page }) => {
    // Ensure we start from a clean state for UI login tests
    await page.context().clearCookies(); // Clear all cookies
    // Clear localStorage for all subsequent navigations in this context
    await page.context().addInitScript(() => {
      localStorage.clear();
    });
    await page.goto(LOGIN_PATH);
  });

  test('should successfully log in with TEST_USER_EMAIL and TEST_USER_PASSWORD', async ({ page }) => {
    const testEmail = process.env.TEST_USER_EMAIL || 'test@cromo.site';
    const testPassword = process.env.TEST_USER_PASSWORD || 'cromo1234';

    // Assuming there are input fields for email and password
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);

    // Wait for the submit button to be enabled before clicking
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeEnabled({ timeout: 60000 });
    await submitButton.click();

    // After successful login, expect to be redirected to a protected page (e.g., /memo)
    await page.waitForURL(new RegExp(PROTECTED_PATH), { timeout: 60000 });
    await expect(page).toHaveURL(new RegExp(PROTECTED_PATH));

    // Verify that the user is logged in by checking for some user-specific element
    // This will likely need to be adjusted based on the actual UI for a logged-in user
    await expect(page.locator(`text=${TEST_USER.name}`)).toBeVisible();
  });

  test('should show error message with invalid credentials', async ({ page }) => {
    const invalidEmail = 'invalid@example.com';
    const invalidPassword = 'invalidpassword';

    await page.fill('input[type="email"]', invalidEmail);
    await page.fill('input[type="password"]', invalidPassword);
    await page.click('button[type="submit"]');

    // Wait for the error message to be visible
    const errorMessageLocator = page.locator('text=이메일 또는 비밀번호가 올바르지 않습니다.');
    await errorMessageLocator.waitFor({ state: 'visible', timeout: 60000 });

    // Expect to remain on the login page and see the specific Korean error message
    await expect(page).toHaveURL(new RegExp(LOGIN_PATH));
    await expect(errorMessageLocator).toBeVisible();
  });

  test('should successfully log out', async ({ page }) => {
    // First, log in the user
    const testEmail = process.env.TEST_USER_EMAIL || 'test@cromo.site';
    const testPassword = process.env.TEST_USER_PASSWORD || 'cromo1234';

    await page.goto(LOGIN_PATH);
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeEnabled({ timeout: 60000 });
    await submitButton.click();
    await page.waitForURL(new RegExp(PROTECTED_PATH), { timeout: 60000 });
    await expect(page).toHaveURL(new RegExp(PROTECTED_PATH));

    // Navigate to settings page and click logout
    await page.goto('/settings', { timeout: 60000 });
    const logoutButton = page.locator('button:has-text("로그아웃")');
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();

    // Verify redirection to login page after logout
    await page.waitForURL(new RegExp(LOGIN_PATH), { timeout: 60000 });
    await expect(page).toHaveURL(new RegExp(LOGIN_PATH));

    // Optionally, try to access a protected page to confirm logged out state
    await page.goto(PROTECTED_PATH, { timeout: 60000 });
    await page.waitForURL(new RegExp(LOGIN_PATH), { timeout: 60000 });
    await expect(page).toHaveURL(new RegExp(LOGIN_PATH));
  });
});
