import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: 1,
  reporter: [['list']],
  timeout: 20_000,
  expect: { timeout: 6_000 },
  use: {
    baseURL: 'https://staging.luminaljourneys.com',
    ignoreHTTPSErrors: true,
    actionTimeout: 8_000,
    navigationTimeout: 15_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
