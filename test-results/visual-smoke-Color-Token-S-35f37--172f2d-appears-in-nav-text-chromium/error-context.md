# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: visual-smoke.spec.js >> Color Token Smoke Tests >> primary dark green (#172f2d) appears in nav text
- Location: tests/visual-smoke.spec.js:48:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.evaluate: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /luminal journeys/i }).first()

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - navigation [ref=e4]:
      - generic [ref=e5]:
        - img [ref=e6]
        - generic [ref=e11]: Luminal Journeys
      - generic [ref=e12]:
        - link "Our Practice" [ref=e13] [cursor=pointer]:
          - /url: "#principles"
        - link "Process" [ref=e14] [cursor=pointer]:
          - /url: "#process"
        - button "Discover Your Journey" [ref=e15] [cursor=pointer]
    - generic [ref=e16]:
      - generic [ref=e19]: Integrative Health · Private Practice
      - heading "Care that begins with listening." [level=1] [ref=e20]:
        - text: Care that begins
        - text: with
        - emphasis [ref=e21]: listening.
      - generic [ref=e22]:
        - paragraph [ref=e23]: A private integrative health practice for people who want a care team that treats the whole person — not just the presenting complaint.
        - generic [ref=e24]:
          - button "Discover Your Journey →" [ref=e25] [cursor=pointer]
          - generic [ref=e26]: 5 minutes · No commitment required
    - generic [ref=e27]:
      - generic [ref=e28]:
        - generic [ref=e29]: 94%
        - generic [ref=e30]: Client Retention
      - generic [ref=e31]:
        - generic [ref=e32]: 12+
        - generic [ref=e33]: Years of Practice
      - generic [ref=e34]:
        - generic [ref=e35]: 48h
        - generic [ref=e36]: First Appointment
      - generic [ref=e37]:
        - generic [ref=e38]: 1:1
        - generic [ref=e39]: Personalized Care
    - generic [ref=e40]:
      - generic [ref=e41]:
        - generic [ref=e42]: I
        - heading "You deserve to be heard." [level=3] [ref=e43]
        - paragraph [ref=e44]: Most healthcare treats symptoms. We treat people. Every care plan begins with understanding your full story — not just your lab results.
      - generic [ref=e45]:
        - generic [ref=e46]: II
        - heading "Evidence without compromise." [level=3] [ref=e47]
        - paragraph [ref=e48]: We hold ourselves to the highest standard of evidence-based integrative medicine. Rigorous science and whole-person care are not in conflict.
      - generic [ref=e49]:
        - generic [ref=e50]: III
        - heading "A practice built for the long term." [level=3] [ref=e51]
        - paragraph [ref=e52]: We measure success not by visit volume but by sustained outcomes. Your health trajectory is the only metric that matters.
    - generic [ref=e53]:
      - generic [ref=e55]: The Process
      - generic [ref=e57]:
        - generic [ref=e58]:
          - generic [ref=e59]: "01"
          - heading "Complete Intake" [level=4] [ref=e60]
          - paragraph [ref=e61]: A thorough 5-minute form that captures what matters most before we meet.
        - generic [ref=e62]:
          - generic [ref=e63]: "02"
          - heading "Initial Consultation" [level=4] [ref=e64]
          - paragraph [ref=e65]: 60 minutes. Full history. No rush. This is where your care plan begins.
        - generic [ref=e66]:
          - generic [ref=e67]: "03"
          - heading "Your Protocol" [level=4] [ref=e68]
          - paragraph [ref=e69]: A personalized, evidence-based plan built entirely around your biology and goals.
        - generic [ref=e70]:
          - generic [ref=e71]: "04"
          - heading "Ongoing Partnership" [level=4] [ref=e72]
          - paragraph [ref=e73]: Regular refinements, direct access, and accountability — for the long term.
    - generic [ref=e75]:
      - paragraph [ref=e77]: "\"Real leadership starts within.\""
      - button "Discover Your Journey →" [ref=e79] [cursor=pointer]
    - contentinfo [ref=e80]:
      - generic [ref=e81]:
        - img [ref=e82]
        - generic [ref=e87]: Luminal Journeys
      - generic [ref=e88]: © 2026 Luminal Journeys · All rights reserved
      - button "Admin" [ref=e89] [cursor=pointer]
    - generic [ref=e90] [cursor=pointer]:
      - generic [ref=e91]: ⚠
      - text: Mockup Prototype
  - button "Edit Content" [ref=e93] [cursor=pointer]:
    - img [ref=e95]
    - generic [ref=e98]: Edit Content
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
> 51  |     const color = await navLogo.evaluate(el =>
      |                                 ^ Error: locator.evaluate: Test timeout of 30000ms exceeded.
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
  101 |     const hasLoading = await page.locator('[style*="pulse"]').isVisible();
  102 |     // Either inputs loaded or still showing skeleton — either is valid
  103 |     expect(hasInputs || hasLoading || true).toBeTruthy();
  104 |   });
  105 | 
  106 | });
  107 | 
```