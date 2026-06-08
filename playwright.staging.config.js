// playwright.staging.config.js — Luminal Journeys
//
// Live staging config for E2E tests that hit real Firebase.
// No Vite dev server — tests run directly against admin.luminaljourneys.com.
//
// Required env vars:
//   INTAKE_E2E_LIVE=1          — enables live Firestore writes in intake-e2e.spec.js
//   FIREBASE_API_KEY=<key>     — used by intake-e2e.spec.js to query Firestore REST API
//
// Optional:
//   RUN_PROD_CHECK=1           — also runs the production smoke check
//
// Usage:
//   INTAKE_E2E_LIVE=1 FIREBASE_API_KEY=xxx \
//     npx playwright test tests/intake-e2e.spec.js \
//     --config=playwright.staging.config.js
//
// To also run the production check:
//   INTAKE_E2E_LIVE=1 FIREBASE_API_KEY=xxx RUN_PROD_CHECK=1 \
//     npx playwright test tests/intake-e2e.spec.js \
//     --config=playwright.staging.config.js

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  // Live tests are inherently sequential — one real write at a time
  fullyParallel: false,
  workers: 1,

  // Two retries: network and Firestore can be briefly slow on cold start
  retries: 2,

  // HTML report always; line reporter for live terminal output
  reporter: [['html', { open: 'never', outputFolder: 'playwright-report-staging' }], ['line']],

  use: {
    // All tests navigate to staging — setupPage() handles the goto() internally
    baseURL: 'https://admin.luminaljourneys.com',

    // Full trace on live runs — invaluable for debugging real Firebase failures
    trace: 'on',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on live runs — always, to catch transient UI issues
    video: 'on',

    // Live network is slower — loosen action and navigation timeouts
    actionTimeout:    10_000,
    navigationTimeout: 20_000,
  },

  // Longer global timeout for live Firestore writes + REST API query
  timeout: 45_000,

  // Expect timeout — longer than local because real Firestore can take 2–3 s
  expect: { timeout: 10_000 },

  projects: [
    // Chromium only — no need for browser matrix on staging smoke checks
    {
      name: 'chromium-staging',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // No webServer — admin.luminaljourneys.com is already live
});
