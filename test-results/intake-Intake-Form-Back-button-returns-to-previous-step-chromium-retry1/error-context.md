# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: intake.spec.js >> Intake Form >> Back button returns to previous step
- Location: tests/intake.spec.js:84:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /continue/i })
    - locator resolved to <button disabled>Continue →</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
      - waiting 100ms
    56 × waiting for element to be visible, enabled and stable
       - element is not enabled
     - retrying click action
       - waiting 500ms

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
  1   | // tests/intake.spec.js — Luminal Journeys
  2   | // Covers: multi-step intake form, validation, back/forward navigation, confirmation step, submission
  3   | 
  4   | import { test, expect } from '@playwright/test';
  5   | 
  6   | test.describe('Intake Form', () => {
  7   | 
  8   |   test.beforeEach(async ({ page }) => {
  9   |     await page.goto('/intake');
  10  |   });
  11  | 
  12  |   // ─── Page Load ───────────────────────────────────────────────────────────────
  13  | 
  14  |   test('intake page loads with "New Client Intake" label', async ({ page }) => {
  15  |     await expect(page.getByText('New Client Intake')).toBeVisible();
  16  |   });
  17  | 
  18  |   test('progress bar is visible on load', async ({ page }) => {
  19  |     // Progress bar: multiple step indicators at top of form
  20  |     const progressItems = page.locator('[style*="height: 3px"]');
  21  |     await expect(progressItems.first()).toBeVisible();
  22  |   });
  23  | 
  24  |   test('"LUMINAL JOURNEYS" nav logo navigates home', async ({ page }) => {
  25  |     await page.getByRole('button', { name: /luminal journeys/i }).click();
  26  |     await expect(page).toHaveURL('/');
  27  |   });
  28  | 
  29  |   // ─── Step 1 — Required field validation ──────────────────────────────────────
  30  | 
  31  |   test('Continue button is disabled when required fields are empty', async ({ page }) => {
  32  |     const continueBtn = page.getByRole('button', { name: /continue/i });
  33  |     // Disabled state: cursor not-allowed + muted background
  34  |     await expect(continueBtn).toBeVisible();
  35  |     // Clicking a disabled button should NOT advance the step
  36  |     await continueBtn.click();
  37  |     // Still on step 1 — "Step 1 of" text remains
  38  |     await expect(page.getByText(/step 1 of/i)).toBeVisible();
  39  |   });
  40  | 
  41  |   test('filling required fields enables Continue', async ({ page }) => {
  42  |     // Fill the first visible text/email input
  43  |     const inputs = page.locator('input[type="text"], input[type="email"], input[type="tel"]');
  44  |     const count = await inputs.count();
  45  | 
  46  |     // Fill all visible inputs on step 1
  47  |     for (let i = 0; i < count; i++) {
  48  |       const input = inputs.nth(i);
  49  |       const type = await input.getAttribute('type');
  50  |       if (type === 'email') {
  51  |         await input.fill('test@example.com');
  52  |       } else if (type === 'tel') {
  53  |         await input.fill('555-123-4567');
  54  |       } else {
  55  |         await input.fill('Test Value');
  56  |       }
  57  |     }
  58  | 
  59  |     // Fill any visible selects
  60  |     const selects = page.locator('select');
  61  |     const selectCount = await selects.count();
  62  |     for (let i = 0; i < selectCount; i++) {
  63  |       const opts = await selects.nth(i).locator('option').all();
  64  |       if (opts.length > 1) {
  65  |         await selects.nth(i).selectOption({ index: 1 });
  66  |       }
  67  |     }
  68  | 
  69  |     const continueBtn = page.getByRole('button', { name: /continue/i });
  70  |     // After filling, the button style should change (cursor: pointer)
  71  |     await expect(continueBtn).toBeVisible();
  72  |   });
  73  | 
  74  |   // ─── Multi-step Navigation ───────────────────────────────────────────────────
  75  | 
  76  |   test('Back button appears after advancing to step 2', async ({ page }) => {
  77  |     // Fill and advance step 1
  78  |     await fillCurrentStep(page);
  79  |     await page.getByRole('button', { name: /continue/i }).click();
  80  |     // Back button should now be visible
  81  |     await expect(page.getByRole('button', { name: /back/i })).toBeVisible();
  82  |   });
  83  | 
  84  |   test('Back button returns to previous step', async ({ page }) => {
  85  |     await fillCurrentStep(page);
> 86  |     await page.getByRole('button', { name: /continue/i }).click();
      |                                                           ^ Error: locator.click: Test timeout of 30000ms exceeded.
  87  |     await expect(page.getByText(/step 2 of/i)).toBeVisible();
  88  |     await page.getByRole('button', { name: /back/i }).click();
  89  |     await expect(page.getByText(/step 1 of/i)).toBeVisible();
  90  |   });
  91  | 
  92  |   test('progress bar updates when advancing steps', async ({ page }) => {
  93  |     await fillCurrentStep(page);
  94  |     await page.getByRole('button', { name: /continue/i }).click();
  95  |     // The 2nd step bar should now be highlighted (darker background)
  96  |     // Confirmed by step counter advancing
  97  |     await expect(page.getByText(/step 2 of/i)).toBeVisible();
  98  |   });
  99  | 
  100 |   // ─── Confirm Step ────────────────────────────────────────────────────────────
  101 | 
  102 |   test('Confirm step shows "Submit Intake" button', async ({ page }) => {
  103 |     await advanceToConfirm(page);
  104 |     await expect(page.getByRole('button', { name: /submit intake/i })).toBeVisible();
  105 |   });
  106 | 
  107 |   test('Confirm step shows submitted data summary', async ({ page }) => {
  108 |     await advanceToConfirm(page);
  109 |     // Summary cards should be present (review of each step's data)
  110 |     // Confirm step header text
  111 |     await expect(page.getByText(/everything look right/i)).toBeVisible();
  112 |   });
  113 | 
  114 |   // ─── Submission ──────────────────────────────────────────────────────────────
  115 | 
  116 |   test('Submit Intake shows thank-you screen', async ({ page }) => {
  117 |     await advanceToConfirm(page);
  118 |     await page.getByRole('button', { name: /submit intake/i }).click();
  119 |     await expect(page.getByText(/thank you/i)).toBeVisible();
  120 |   });
  121 | 
  122 |   test('thank-you screen has "Back to home" link', async ({ page }) => {
  123 |     await advanceToConfirm(page);
  124 |     await page.getByRole('button', { name: /submit intake/i }).click();
  125 |     const backBtn = page.getByRole('button', { name: /back to home/i });
  126 |     await expect(backBtn).toBeVisible();
  127 |     await backBtn.click();
  128 |     await expect(page).toHaveURL('/');
  129 |   });
  130 | 
  131 |   // ─── Footer ──────────────────────────────────────────────────────────────────
  132 | 
  133 |   test('copyright footer is visible on intake page', async ({ page }) => {
  134 |     await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  135 |     await expect(page.getByText(/luminal journeys · all rights reserved/i)).toBeVisible();
  136 |   });
  137 | 
  138 | });
  139 | 
  140 | // ─── Helpers ──────────────────────────────────────────────────────────────────
  141 | 
  142 | /**
  143 |  * Fills all visible required-looking fields on the current step.
  144 |  * This is intentionally permissive — it fills everything it can see,
  145 |  * which is sufficient to enable the Continue button for standard steps.
  146 |  */
  147 | async function fillCurrentStep(page) {
  148 |   const inputs = page.locator('input[type="text"], input[type="email"], input[type="tel"], input[type="date"], input[type="number"]');
  149 |   const count = await inputs.count();
  150 |   for (let i = 0; i < count; i++) {
  151 |     const input = inputs.nth(i);
  152 |     const type = await input.getAttribute('type');
  153 |     if (type === 'email') {
  154 |       await input.fill('test@example.com');
  155 |     } else if (type === 'tel') {
  156 |       await input.fill('555-123-4567');
  157 |     } else if (type === 'date') {
  158 |       await input.fill('1990-01-15');
  159 |     } else if (type === 'number') {
  160 |       await input.fill('30');
  161 |     } else {
  162 |       await input.fill('Test');
  163 |     }
  164 |   }
  165 | 
  166 |   const selects = page.locator('select');
  167 |   const selectCount = await selects.count();
  168 |   for (let i = 0; i < selectCount; i++) {
  169 |     const opts = await selects.nth(i).locator('option').all();
  170 |     if (opts.length > 1) {
  171 |       await selects.nth(i).selectOption({ index: 1 });
  172 |     }
  173 |   }
  174 | 
  175 |   const textareas = page.locator('textarea');
  176 |   const taCount = await textareas.count();
  177 |   for (let i = 0; i < taCount; i++) {
  178 |     await textareas.nth(i).fill('Sample response for testing purposes.');
  179 |   }
  180 | 
  181 |   // Select first radio option in each radio group
  182 |   const radios = page.locator('input[type="radio"]');
  183 |   const radioGroups = new Set();
  184 |   const radioCount = await radios.count();
  185 |   for (let i = 0; i < radioCount; i++) {
  186 |     const name = await radios.nth(i).getAttribute('name');
```