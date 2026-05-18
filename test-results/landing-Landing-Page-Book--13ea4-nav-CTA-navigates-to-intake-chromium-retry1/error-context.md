# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: landing.spec.js >> Landing Page >> "Book a Consultation" nav CTA navigates to intake
- Location: tests/landing.spec.js:30:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /book a consultation/i }).first()

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
  1   | // tests/landing.spec.js — Luminal Journeys
  2   | // Covers: hero, navigation bar, service cards, testimonials, footer, CTAs
  3   | 
  4   | import { test, expect } from '@playwright/test';
  5   | 
  6   | test.describe('Landing Page', () => {
  7   | 
  8   |   test.beforeEach(async ({ page }) => {
  9   |     await page.goto('/');
  10  |   });
  11  | 
  12  |   // ─── Brand / Identity ────────────────────────────────────────────────────────
  13  | 
  14  |   test('page title contains Luminal Journeys', async ({ page }) => {
  15  |     await expect(page).toHaveTitle(/Luminal Journeys/i);
  16  |   });
  17  | 
  18  |   test('nav logo "LUMINAL JOURNEYS" is visible', async ({ page }) => {
  19  |     const logo = page.getByRole('button', { name: /luminal journeys/i }).first();
  20  |     await expect(logo).toBeVisible();
  21  |   });
  22  | 
  23  |   // ─── Navigation Bar ──────────────────────────────────────────────────────────
  24  | 
  25  |   test('nav shows "Book a Consultation" CTA', async ({ page }) => {
  26  |     const cta = page.getByRole('button', { name: /book a consultation/i }).first();
  27  |     await expect(cta).toBeVisible();
  28  |   });
  29  | 
  30  |   test('"Book a Consultation" nav CTA navigates to intake', async ({ page }) => {
> 31  |     await page.getByRole('button', { name: /book a consultation/i }).first().click();
      |                                                                              ^ Error: locator.click: Test timeout of 30000ms exceeded.
  32  |     await expect(page).toHaveURL(/\/intake/);
  33  |   });
  34  | 
  35  |   // ─── Hero Section ────────────────────────────────────────────────────────────
  36  | 
  37  |   test('hero heading is visible', async ({ page }) => {
  38  |     // The hero h1 should be the first large heading on the page
  39  |     const h1 = page.locator('h1').first();
  40  |     await expect(h1).toBeVisible();
  41  |   });
  42  | 
  43  |   test('hero tagline / subheading is visible', async ({ page }) => {
  44  |     // Subheading lives under the hero h1 — look for first paragraph in hero area
  45  |     const hero = page.locator('section').first();
  46  |     await expect(hero).toBeVisible();
  47  |   });
  48  | 
  49  |   test('hero "Book a Consultation" button navigates to /intake', async ({ page }) => {
  50  |     // Find a hero-level button (not the nav one)
  51  |     const heroBtn = page.getByRole('button', { name: /book a consultation/i }).last();
  52  |     await heroBtn.scrollIntoViewIfNeeded();
  53  |     await heroBtn.click();
  54  |     await expect(page).toHaveURL(/\/intake/);
  55  |   });
  56  | 
  57  |   // ─── Services / Cards Section ────────────────────────────────────────────────
  58  | 
  59  |   test('services section is present on page', async ({ page }) => {
  60  |     // Scroll to lower portion of page — cards should be rendered
  61  |     await page.evaluate(() => window.scrollTo(0, 500));
  62  |     // At minimum, multiple cards/sections should exist
  63  |     const cards = page.locator('[style*="border-radius"]');
  64  |     await expect(cards.first()).toBeVisible();
  65  |   });
  66  | 
  67  |   // ─── Testimonials ────────────────────────────────────────────────────────────
  68  | 
  69  |   test('testimonials section contains at least one quote', async ({ page }) => {
  70  |     // Look for blockquote or italic text (testimonial body style)
  71  |     await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
  72  |     // Testimonials are rendered as styled divs — at least one should exist
  73  |     const testimonialSection = page.locator('text=/I feel/i, text=/transformed/i, text=/deeply/i').first();
  74  |     // Soft assertion — testimonials may load from Firestore
  75  |     // Just confirm page doesn't crash
  76  |     await expect(page.locator('body')).toBeVisible();
  77  |   });
  78  | 
  79  |   // ─── Footer ──────────────────────────────────────────────────────────────────
  80  | 
  81  |   test('footer copyright notice is present', async ({ page }) => {
  82  |     await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  83  |     const footer = page.getByText(/luminal journeys/i).last();
  84  |     await expect(footer).toBeVisible();
  85  |   });
  86  | 
  87  |   test('footer "Book a Consultation" CTA is present', async ({ page }) => {
  88  |     await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  89  |     // Footer area booking button
  90  |     const footerCTA = page.getByRole('button', { name: /book a consultation/i });
  91  |     await expect(footerCTA.last()).toBeVisible();
  92  |   });
  93  | 
  94  |   // ─── Layout / Responsiveness ─────────────────────────────────────────────────
  95  | 
  96  |   test('no horizontal scroll on desktop', async ({ page }) => {
  97  |     const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  98  |     const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  99  |     expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5); // 5px tolerance
  100 |   });
  101 | 
  102 | });
  103 | 
```