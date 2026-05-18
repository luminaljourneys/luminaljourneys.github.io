# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: navigation.spec.js >> Navigation & Routing >> dynamic page route shows top bar with logo
- Location: tests/navigation.spec.js:49:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /luminal journeys/i }).first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('button', { name: /luminal journeys/i }).first()

```

# Test source

```ts
  1  | // tests/navigation.spec.js — Luminal Journeys
  2  | // Covers: SPA routing, dynamic page rendering, 404 state, mobile nav
  3  | 
  4  | import { test, expect } from '@playwright/test';
  5  | 
  6  | test.describe('Navigation & Routing', () => {
  7  | 
  8  |   // ─── Home Route ──────────────────────────────────────────────────────────────
  9  | 
  10 |   test('/ renders the landing page', async ({ page }) => {
  11 |     await page.goto('/');
  12 |     await expect(page.getByText(/luminal journeys/i).first()).toBeVisible();
  13 |   });
  14 | 
  15 |   // ─── Intake Route ────────────────────────────────────────────────────────────
  16 | 
  17 |   test('/intake renders the intake form', async ({ page }) => {
  18 |     await page.goto('/intake');
  19 |     await expect(page.getByText('New Client Intake')).toBeVisible();
  20 |   });
  21 | 
  22 |   // ─── Dynamic Page Route ──────────────────────────────────────────────────────
  23 | 
  24 |   test('unknown slug shows page-not-found state gracefully', async ({ page }) => {
  25 |     await page.goto('/this-page-definitely-does-not-exist-xyz123');
  26 |     // Either the 404 component or a loading state — no JS crash
  27 |     await expect(page.locator('body')).toBeVisible();
  28 |     // Should NOT show the intake form
  29 |     await expect(page.getByText('New Client Intake')).not.toBeVisible();
  30 |   });
  31 | 
  32 |   test('page-not-found state has "Back" button linking to home', async ({ page }) => {
  33 |     await page.goto('/this-page-definitely-does-not-exist-xyz123');
  34 |     // Wait for loading to resolve
  35 |     await page.waitForTimeout(2000);
  36 |     const notFoundText = page.getByText(/page not found/i);
  37 |     const isNotFound = await notFoundText.isVisible();
  38 |     if (isNotFound) {
  39 |       const backBtn = page.getByRole('button', { name: /back to home/i });
  40 |       await expect(backBtn).toBeVisible();
  41 |       await backBtn.click();
  42 |       await expect(page).toHaveURL('/');
  43 |     }
  44 |     // If still loading (Firestore slow), just confirm no crash
  45 |   });
  46 | 
  47 |   // ─── Dynamic page from Firestore ─────────────────────────────────────────────
  48 | 
  49 |   test('dynamic page route shows top bar with logo', async ({ page }) => {
  50 |     // Any slug: if page exists in Firestore, renders DynamicPage with top bar
  51 |     await page.goto('/about');
  52 |     await page.waitForTimeout(2000); // wait for Firestore
  53 |     const logo = page.getByRole('button', { name: /luminal journeys/i }).first();
> 54 |     await expect(logo).toBeVisible();
     |                        ^ Error: expect(locator).toBeVisible() failed
  55 |   });
  56 | 
  57 |   test('dynamic page "← Home" button navigates to /', async ({ page }) => {
  58 |     await page.goto('/about');
  59 |     await page.waitForTimeout(2000);
  60 |     // Either Home button (DynamicPage) or Back to home (404)
  61 |     const homeBtn = page.getByRole('button', { name: /home|back to home/i }).first();
  62 |     await expect(homeBtn).toBeVisible();
  63 |     await homeBtn.click();
  64 |     await expect(page).toHaveURL('/');
  65 |   });
  66 | 
  67 |   // ─── Deep-link / hard refresh ─────────────────────────────────────────────────
  68 | 
  69 |   test('/intake is accessible by direct URL (no 404 from SPA)', async ({ page }) => {
  70 |     await page.goto('/intake');
  71 |     await expect(page.getByText('New Client Intake')).toBeVisible();
  72 |   });
  73 | 
  74 |   // ─── Mobile Nav (iPhone 12 / Pixel 5) ─────────────────────────────────────────
  75 | 
  76 |   test('mobile viewport: logo visible and tappable', async ({ page }) => {
  77 |     // Test works across all configured devices in playwright.config.js
  78 |     await page.goto('/');
  79 |     const logo = page.getByRole('button', { name: /luminal journeys/i }).first();
  80 |     await expect(logo).toBeVisible();
  81 |   });
  82 | 
  83 |   test('mobile: intake form is usable (no viewport overflow)', async ({ page }) => {
  84 |     await page.goto('/intake');
  85 |     const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  86 |     const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  87 |     expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  88 |   });
  89 | 
  90 | });
  91 | 
```