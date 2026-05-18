# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin.spec.js >> Admin Page >> admin URL renders a page (not blank)
- Location: tests/admin.spec.js:18:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator:  locator('body')
Expected: visible
Received: hidden
Timeout:  5000ms

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('body')
    14 × locator resolved to <body>…</body>
       - unexpected value "hidden"

```

```yaml
- button "×"
- text: Luminal Journeys Admin Sign In Username
- textbox "Admin username"
- text: Password
- textbox "Enter password"
- button "Sign In"
- button "← Back to site"
```

# Test source

```ts
  1   | // tests/admin.spec.js — Luminal Journeys
  2   | // Covers: admin login gate, tab navigation (Intakes / Form Builder / Pages / Publish),
  3   | //         form builder UI, pages management UI, staging banner (staging build only)
  4   | //
  5   | // NOTE: Admin tests require a running STAGING build (VITE_EDIT_MODE_ENABLED=true).
  6   | // Set ADMIN_PASSWORD env var to skip the login prompt in CI:
  7   | //   ADMIN_PASSWORD=your_password npx playwright test tests/admin.spec.js
  8   | 
  9   | import { test, expect } from '@playwright/test';
  10  | 
  11  | const ADMIN_URL = '/admin';
  12  | const PASSWORD = process.env.ADMIN_PASSWORD || '';
  13  | 
  14  | test.describe('Admin Page', () => {
  15  | 
  16  |   // ─── Login / Access Gate ──────────────────────────────────────────────────────
  17  | 
  18  |   test('admin URL renders a page (not blank)', async ({ page }) => {
  19  |     await page.goto(ADMIN_URL);
> 20  |     await expect(page.locator('body')).toBeVisible();
      |                                        ^ Error: expect(locator).toBeVisible() failed
  21  |     // Should show either login gate or admin tabs
  22  |     await page.waitForTimeout(1000);
  23  |   });
  24  | 
  25  |   test('admin shows login prompt when not authenticated', async ({ page }) => {
  26  |     await page.goto(ADMIN_URL);
  27  |     await page.waitForTimeout(1500);
  28  |     // Could be a password input, sign-in form, or redirect
  29  |     const hasInput = await page.locator('input[type="password"]').isVisible();
  30  |     const hasTabs = await page.getByText(/intakes/i).isVisible();
  31  |     // One or the other must be true — admin is either gated or open
  32  |     expect(hasInput || hasTabs).toBeTruthy();
  33  |   });
  34  | 
  35  |   // ─── Tab Navigation (after login) ────────────────────────────────────────────
  36  | 
  37  |   test.describe('Admin Tabs (authenticated)', () => {
  38  |     test.beforeEach(async ({ page }) => {
  39  |       await page.goto(ADMIN_URL);
  40  |       await page.waitForTimeout(1000);
  41  | 
  42  |       // Attempt login if password input is present
  43  |       const passwordInput = page.locator('input[type="password"]');
  44  |       if (await passwordInput.isVisible() && PASSWORD) {
  45  |         await passwordInput.fill(PASSWORD);
  46  |         await page.getByRole('button', { name: /sign in|login|enter/i }).click();
  47  |         await page.waitForTimeout(1500);
  48  |       }
  49  |     });
  50  | 
  51  |     test('Intakes tab is present and clickable', async ({ page }) => {
  52  |       const tab = page.getByRole('button', { name: /intakes/i }).first();
  53  |       if (await tab.isVisible()) {
  54  |         await tab.click();
  55  |         await expect(tab).toBeVisible();
  56  |       }
  57  |     });
  58  | 
  59  |     test('Form Builder tab is present and clickable', async ({ page }) => {
  60  |       const tab = page.getByRole('button', { name: /form builder/i });
  61  |       if (await tab.isVisible()) {
  62  |         await tab.click();
  63  |         await expect(tab).toBeVisible();
  64  |       }
  65  |     });
  66  | 
  67  |     test('Pages tab is present and clickable', async ({ page }) => {
  68  |       const tab = page.getByRole('button', { name: /^pages$/i });
  69  |       if (await tab.isVisible()) {
  70  |         await tab.click();
  71  |         await expect(tab).toBeVisible();
  72  |       }
  73  |     });
  74  | 
  75  |     test('Publish tab is present and clickable', async ({ page }) => {
  76  |       const tab = page.getByRole('button', { name: /publish/i }).first();
  77  |       if (await tab.isVisible()) {
  78  |         await tab.click();
  79  |         await expect(tab).toBeVisible();
  80  |       }
  81  |     });
  82  | 
  83  |     test('Form Builder shows step selector', async ({ page }) => {
  84  |       const formTab = page.getByRole('button', { name: /form builder/i });
  85  |       if (await formTab.isVisible()) {
  86  |         await formTab.click();
  87  |         await page.waitForTimeout(500);
  88  |         // Form Builder renders step tabs (step-0, step-1…) or "Add Field" UI
  89  |         const hasStepContent = await page.getByText(/step|field|add field/i).isVisible();
  90  |         expect(hasStepContent).toBeTruthy();
  91  |       }
  92  |     });
  93  | 
  94  |     test('Pages tab shows create page form', async ({ page }) => {
  95  |       const pagesTab = page.getByRole('button', { name: /^pages$/i });
  96  |       if (await pagesTab.isVisible()) {
  97  |         await pagesTab.click();
  98  |         await page.waitForTimeout(500);
  99  |         const hasPageInput = await page.locator('input[placeholder*="title" i], input[placeholder*="page" i]').isVisible();
  100 |         const hasAddBtn = await page.getByRole('button', { name: /add page|create/i }).isVisible();
  101 |         expect(hasPageInput || hasAddBtn).toBeTruthy();
  102 |       }
  103 |     });
  104 | 
  105 |     test('Publish tab shows Publish Live button', async ({ page }) => {
  106 |       const publishTab = page.getByRole('button', { name: /publish/i }).first();
  107 |       if (await publishTab.isVisible()) {
  108 |         await publishTab.click();
  109 |         await page.waitForTimeout(500);
  110 |         const publishLiveBtn = page.getByRole('button', { name: /publish live/i });
  111 |         if (await publishLiveBtn.isVisible()) {
  112 |           await expect(publishLiveBtn).toBeVisible();
  113 |         }
  114 |       }
  115 |     });
  116 | 
  117 |   });
  118 | 
  119 | });
  120 | 
```