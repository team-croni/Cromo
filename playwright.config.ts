import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Read from default ".env" file.
dotenv.config({ path: path.resolve(new URL('.', import.meta.url).pathname, '.env'), quiet: true });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI ? 'github' : 'html',

  timeout: 120_000,
  expect: { timeout: 60_000 },

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: 'http://localhost:3000',

    /* 
     * Collect trace when retrying the failed test on CI only.
     * 로컬에서는 trace 수집 끄고 CI에서만 켜서 속도 향상 
     */
    trace: process.env.CI ? 'on-first-retry' : 'off',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      // CI에서는 chromium만 실행하여 속도 향상
      grep: process.env.CI ? /chromium/ : /.*/,
    },
    // 로컬에서만 firefox 테스트 (CI에서는 속도 위해 제외)
    ...(process.env.CI
      ? []
      : [
        {
          name: 'firefox',
          use: { ...devices['Desktop Firefox'] },
        },
      ]),
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    ignoreHTTPSErrors: true,
  },
});
