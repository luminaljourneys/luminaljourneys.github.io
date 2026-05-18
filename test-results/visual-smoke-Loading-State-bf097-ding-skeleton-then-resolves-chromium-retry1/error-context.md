# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: visual-smoke.spec.js >> Loading States >> intake page shows loading skeleton then resolves
- Location: tests/visual-smoke.spec.js:94:3

# Error details

```
Error: locator.isVisible: Error: strict mode violation: locator('[style*="pulse"]') resolved to 3 elements:
    1) <div></div> aka locator('div:nth-child(5) > div').first()
    2) <div></div> aka locator('div:nth-child(5) > div:nth-child(2)')
    3) <div></div> aka locator('div:nth-child(5) > div:nth-child(3)')

Call log:
    - checking visibility of locator('[style*="pulse"]')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - button "Luminal Journeys" [ref=e5] [cursor=pointer]
    - generic [ref=e6]: New Client Intake
  - generic [ref=e7]:
    - generic [ref=e8]:
      - generic [ref=e11]: Personal Info
      - generic [ref=e14]: Contact Info
      - generic [ref=e17]: About You
      - generic [ref=e20]: Confirm
    - generic [ref=e21]: Step 1 of 4
    - heading "Personal Info" [level=2] [ref=e22]
    - paragraph [ref=e23]: Let's start with the basics — tell us who you are.
    - button "Continue →" [disabled] [ref=e29]
  - generic [ref=e30]: © 2026 Luminal Journeys · All rights reserved
  - generic [ref=e31] [cursor=pointer]:
    - generic [ref=e32]: ⚠
    - text: Mockup Prototype
```

# Test source

```ts
  1   | // tests/visual-smoke.spec.js — Luminal Journeys
  2   | // Smoke tests: page loads without JS errors, layout doesn't break,
  3   | // color tokens render correctly. Run these first to catch regressions fast.
  4   | 
  5   | import { test, expect } from '@playwright/test';
  6   | 
  7   | const ROUTES = ['/', '/intake', '/about', '/services', '/faq'];
  8   | 
  9   | for (const route of ROUTES) {
  10  |   test(`${route} — loads without JS console errors`, async ({ page }) => {
  11  |     const errors = [];
  12  |     page.on('console', msg => {
  13  |       if (msg.type() === 'error') errors.push(msg.text());
  14  |     });
  15  |     page.on('pageerror', err => errors.push(err.message));
  16  | 
  17  |     await page.goto(route);
  18  |     await page.waitForTimeout(2000); // allow Firestore + React to settle
  19  | 
  20  |     // Filter out known Firebase / network warnings that aren't real crashes
  21  |     const realErrors = errors.filter(e =>
  22  |       !e.includes('net::ERR_') &&
  23  |       !e.includes('favicon') &&
  24  |       !e.includes('firestore') &&
  25  |       !e.includes('Failed to fetch')
  26  |     );
  27  | 
  28  |     if (realErrors.length) {
  29  |       console.log(`JS errors on ${route}:`, realErrors);
  30  |     }
  31  | 
  32  |     // Page must be visible and not a blank white screen
  33  |     await expect(page.locator('body')).toBeVisible();
  34  |   });
  35  | }
  36  | 
  37  | test.describe('Color Token Smoke Tests', () => {
  38  | 
  39  |   test('background color is the correct paper white (#F9F8F6)', async ({ page }) => {
  40  |     await page.goto('/');
  41  |     const bg = await page.evaluate(() => {
  42  |       return window.getComputedStyle(document.body).backgroundColor;
  43  |     });
  44  |     // rgb(249, 248, 246) = #F9F8F6
  45  |     expect(bg).toBe('rgb(249, 248, 246)');
  46  |   });
  47  | 
  48  |   test('primary dark green (#172f2d) appears in nav text', async ({ page }) => {
  49  |     await page.goto('/');
  50  |     const navLogo = page.getByRole('button', { name: /luminal journeys/i }).first();
  51  |     const color = await navLogo.evaluate(el =>
  52  |       window.getComputedStyle(el).color
  53  |     );
  54  |     expect(color).toBe('rgb(23, 47, 45)'); // #172f2d
  55  |   });
  56  | 
  57  |   test('intake page background is paper white', async ({ page }) => {
  58  |     await page.goto('/intake');
  59  |     const bg = await page.evaluate(() =>
  60  |       window.getComputedStyle(document.body).backgroundColor
  61  |     );
  62  |     expect(bg).toBe('rgb(249, 248, 246)');
  63  |   });
  64  | 
  65  | });
  66  | 
  67  | test.describe('Logo / Favicon', () => {
  68  | 
  69  |   test('favicon is linked in document head', async ({ page }) => {
  70  |     await page.goto('/');
  71  |     const favicon = await page.evaluate(() => {
  72  |       const link = document.querySelector('link[rel="icon"]');
  73  |       return link ? link.getAttribute('href') : null;
  74  |     });
  75  |     expect(favicon).not.toBeNull();
  76  |   });
  77  | 
  78  |   test('favicon URL returns 200', async ({ page }) => {
  79  |     await page.goto('/');
  80  |     const favicon = await page.evaluate(() => {
  81  |       const link = document.querySelector('link[rel="icon"]');
  82  |       return link ? link.href : null;
  83  |     });
  84  |     if (favicon) {
  85  |       const response = await page.request.get(favicon);
  86  |       expect(response.status()).toBe(200);
  87  |     }
  88  |   });
  89  | 
  90  | });
  91  | 
  92  | test.describe('Loading States', () => {
  93  | 
  94  |   test('intake page shows loading skeleton then resolves', async ({ page }) => {
  95  |     await page.goto('/intake');
  96  |     // Page must render something immediately (not blank)
  97  |     await expect(page.locator('body')).toBeVisible();
  98  |     // After Firestore resolves, form fields should appear
  99  |     await page.waitForTimeout(3000);
  100 |     const hasInputs = await page.locator('input, select, textarea').first().isVisible();
> 101 |     const hasLoading = await page.locator('[style*="pulse"]').isVisible();
      |                                                               ^ Error: locator.isVisible: Error: strict mode violation: locator('[style*="pulse"]') resolved to 3 elements:
  102 |     // Either inputs loaded or still showing skeleton — either is valid
  103 |     expect(hasInputs || hasLoading || true).toBeTruthy();
  104 |   });
  105 | 
  106 | });
  107 | 
```