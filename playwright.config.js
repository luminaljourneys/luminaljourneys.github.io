// playwright.config.js — Luminal Journeys
//
// Fast-by-default: fullyParallel, Chromium only for `make qa`
// Full browser matrix only when explicitly requested (`make qa-all`)
//
// Firebase is mocked at the network layer in tests/helpers/mock-firebase.js
// so tests NEVER wait on Firestore — pure JS speed.
//
// Env vars that control visual / watch behaviour:
//   PW_SLOW_MO=800   — ms delay between every action (human-pace watching)
//   PW_HEADED=1      — show browser window (set automatically by make qa-watch)

import { defineConfig, devices } from '@playwright/test';

const slowMo  = process.env.PW_SLOW_MO  ? parseInt(process.env.PW_SLOW_MO)  : 0;
const headed  = !!process.env.PW_HEADED || !!process.env.PWDEBUG;

export default defineConfig({
  testDir: './tests',

  // Every test file runs in parallel; tests within a file also parallel
  fullyParallel: true,

  // Use 75% of CPU cores locally; 2 workers in CI
  workers: process.env.CI ? 2 : '75%',

  // One retry on CI to catch flakes; zero locally for speed
  retries: process.env.CI ? 1 : 0,

  // HTML report always; line reporter for live terminal output
  reporter: [['html', { open: 'never' }], ['line']],

  use: {
    baseURL: 'http://localhost:5173',

    // Capture trace only when retrying (keeps reports lean)
    trace: 'on-first-retry',

    // Screenshot only on failure
    screenshot: 'only-on-failure',

    // Video: record every test — viewable in the HTML report after `make qa-report`
    video: 'on',

    // Global timeout per action (click, fill, etc.)
    // Loosen when slowMo is active so assertions don't time out mid-animation
    actionTimeout:    slowMo ? 15_000 : 5_000,

    // Navigation timeout
    navigationTimeout: slowMo ? 30_000 : 10_000,

    // Human-pace delay between every action — set via PW_SLOW_MO env var
    launchOptions: {
      slowMo,
      headless: !headed,
    },
  },

  // Global test timeout — no test should take more than 15s
  timeout: 15_000,

  // Expect timeout — assertions fail fast
  expect: { timeout: 4_000 },

  projects: [
    // ── Default: Chromium desktop ───────────────────────────────────────────
    // Used by `make qa` — covers 95% of issues in a single fast pass
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // ── Mobile viewports — opt-in via `make qa-all` ─────────────────────────
    {
      name: 'iPhone 12',
      use: { ...devices['iPhone 12'] },
    },
    {
      name: 'Pixel 5',
      use: { ...devices['Pixel 5'] },
    },
  ],

  // Starts Vite dev server before tests; reuses if already running locally
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    // Silence Vite output during test runs
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
