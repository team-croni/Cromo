import { test, expect } from '@playwright/test';
import { TEST_USER } from './utils/auth-helper';

test.describe('UI Login Functionality with Test Account', () => {
  const LOGIN_URL = 'http://localhost:3000/login';
  const PROTECTED_URL = 'http://localhost:3000/memo';

  test.beforeEach(async ({ page }) => {
    // Ensure we start from a clean state for UI login tests
    await page.context().clearCookies(); // Clear all cookies
    // Clear localStorage for all subsequent navigations in this context
    await page.context().addInitScript(() => {
      localStorage.clear();
    });
    await page.goto(LOGIN_URL);
  });

  test('should successfully log in with TEST_USER_EMAIL and TEST_USER_PASSWORD', async ({ page }) => {
    const testEmail = process.env.TEST_USER_EMAIL || 'test@cromo.site';
    const testPassword = process.env.TEST_USER_PASSWORD || 'cromo1234';

    // Assuming there are input fields for email and password
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);

    // Wait for the submit button to be enabled before clicking
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeEnabled({ timeout: 5000 });
    await submitButton.click();

    // Debugging steps
    page.on('console', msg => console.log('PAGE CONSOLE:', msg.text()));
    await page.screenshot({ path: 'debug-login-after-submit.png' });
    console.log('Current URL after submit:', page.url());
    console.log('Page content after submit:', await page.content());

    // Assert that the invalid credentials error message is NOT visible
    await expect(page.locator('text=이메일 또는 비밀번호가 올바르지 않습니다.')).not.toBeVisible();

    // After successful login, expect to be redirected to a protected page (e.g., /memo)
    await page.waitForURL(PROTECTED_URL, { timeout: 20000 });
    await expect(page).toHaveURL(PROTECTED_URL);

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

    // Expect to remain on the login page and see the specific Korean error message
    await expect(page).toHaveURL(LOGIN_URL);
    await expect(page.locator('text=이메일 또는 비밀번호가 올바르지 않습니다.')).toBeVisible();
  });
});
