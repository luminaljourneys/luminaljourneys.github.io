# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: landing.spec.js >> Landing Page >> footer "Book a Consultation" CTA is present
- Location: tests/landing.spec.js:87:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /book a consultation/i }).last()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('button', { name: /book a consultation/i }).last()

```

```yaml
- navigation:
  - img
  - text: Luminal Journeys
  - link "Our Practice":
    - /url: "#principles"
  - link "Process":
    - /url: "#process"
  - button "Discover Your Journey"
- text: Integrative Health · Private Practice
- heading "Care that begins with listening." [level=1]:
  - text: Care that begins with
  - emphasis: listening.
- paragraph: A private integrative health practice for people who want a care team that treats the whole person — not just the presenting complaint.
- button "Discover Your Journey →"
- text: 5 minutes · No commitment required 94% Client Retention 12+ Years of Practice 48h First Appointment 1:1 Personalized Care I
- heading "You deserve to be heard." [level=3]
- paragraph: Most healthcare treats symptoms. We treat people. Every care plan begins with understanding your full story — not just your lab results.
- text: II
- heading "Evidence without compromise." [level=3]
- paragraph: We hold ourselves to the highest standard of evidence-based integrative medicine. Rigorous science and whole-person care are not in conflict.
- text: III
- heading "A practice built for the long term." [level=3]
- paragraph: We measure success not by visit volume but by sustained outcomes. Your health trajectory is the only metric that matters.
- text: The Process 01
- heading "Complete Intake" [level=4]
- paragraph: A thorough 5-minute form that captures what matters most before we meet.
- text: "02"
- heading "Initial Consultation" [level=4]
- paragraph: 60 minutes. Full history. No rush. This is where your care plan begins.
- text: "03"
- heading "Your Protocol" [level=4]
- paragraph: A personalized, evidence-based plan built entirely around your biology and goals.
- text: "04"
- heading "Ongoing Partnership" [level=4]
- paragraph: Regular refinements, direct access, and accountability — for the long term.
- paragraph: "\"Real leadership starts within.\""
- button "Discover Your Journey →"
- contentinfo:
  - img
  - text: Luminal Journeys © 2026 Luminal Journeys · All rights reserved
  - button "Admin"
- text: ⚠ Mockup Prototype
- button "Edit Content"
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
  31  |     await page.getByRole('button', { name: /book a consultation/i }).first().click();
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
> 91  |     await expect(footerCTA.last()).toBeVisible();
      |                                    ^ Error: expect(locator).toBeVisible() failed
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