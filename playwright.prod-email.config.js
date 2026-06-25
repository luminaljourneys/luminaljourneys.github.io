/**
 * playwright.prod-email.config.js — Luminal Journeys
 *
 * Config for production email QA runs.
 * Hits luminaljourneys.com directly (no Vite dev server).
 *
 * Usage:
 *   INTAKE_PROD_EMAIL_E2E=1 FIREBASE_API_KEY=AIzaSyBr7fy8CAIUg5ab4Gc_ZnXtZOVn4CpCMD8 \
 *     npx playwright test tests/intake-prod-email-e2e.spec.js \
 *     --config=playwright.prod-email.config.js \
 *     --headed
 *
 * NOTE: Deploy the worker FIRST before running this test:
 *   cd workers/intake-mailer && npx wrangler deploy
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  // One test at a time — one real write to production
  fullyParallel: false,
  workers: 1,
  retries: 1,

  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report-prod-email' }],
    ['line'],
  ],

  use: {
    baseURL: 'https://luminaljourneys.com',

    // Full trace for debugging real-world issues
    trace: 'on',
    screenshot: 'on',
    video: 'on',

    // Production network can be slower — generous timeouts
    actionTimeout:     15_000,
    navigationTimeout: 30_000,
  },

  // Long global timeout — email worker is fire-and-forget, needs time to settle
  timeout: 60_000,

  expect: { timeout: 15_000 },

  projects: [
    {
      name: 'chromium-prod',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // No webServer — hitting luminaljourneys.com directly
});
