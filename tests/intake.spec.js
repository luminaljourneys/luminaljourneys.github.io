/**
 * tests/intake.spec.js — Luminal Journeys
 *
 * Multi-step intake form: load, validation, step navigation, confirm, submit.
 * Firebase mocked — form config returns instantly from fixture data.
 * Selectors: data-testid (stable) + MOCK_FIELDS names (known schema).
 */

import { test, expect } from '@playwright/test';
import { mockFirebase, waitForApp } from './helpers/mock-firebase.js';
import { MOCK_STEPS } from './fixtures/form-config.js';

test.describe('Intake Form', () => {

  test.beforeEach(async ({ page }) => {
    await mockFirebase(page);
    await page.goto('/intake');
    await waitForApp(page);
  });

  // ── Page Load ──────────────────────────────────────────────────────────────

  test('intake page shows "New Client Intake" header', async ({ page }) => {
    await expect(page.getByText('New Client Intake')).toBeVisible();
  });

  test('progress bar is visible', async ({ page }) => {
    await expect(page.getByTestId('progress-bar')).toBeVisible();
  });

  test('progress bar has correct step count', async ({ page }) => {
    // MOCK_STEPS (3) + Confirm = 4 segments
    const segments = page.getByTestId('progress-bar').locator('> div');
    await expect(segments).toHaveCount(MOCK_STEPS.length + 1);
  });

  test('step counter starts at Step 1', async ({ page }) => {
    await expect(page.getByTestId('step-counter')).toContainText('Step 1');
  });

  test('first step title matches fixture', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 2 })).toContainText(MOCK_STEPS[0].title);
  });

  // ── Continue button / validation ───────────────────────────────────────────

  test('Continue button is disabled when required fields are empty', async ({ page }) => {
    const btn = page.getByTestId('btn-continue');
    await expect(btn).toBeVisible();
    await expect(btn).toBeDisabled();
  });

  test('Continue button enables after filling required fields', async ({ page }) => {
    await fillStep0(page);
    await expect(page.getByTestId('btn-continue')).toBeEnabled();
  });

  // ── Step navigation ────────────────────────────────────────────────────────

  test('Back button is hidden on step 1', async ({ page }) => {
    await expect(page.getByTestId('btn-back')).not.toBeVisible();
  });

  test('advancing to step 2 shows Back button', async ({ page }) => {
    await fillStep0(page);
    await page.getByTestId('btn-continue').click();
    await expect(page.getByTestId('btn-back')).toBeVisible();
  });

  test('Back button returns to previous step', async ({ page }) => {
    await fillStep0(page);
    await page.getByTestId('btn-continue').click();
    await expect(page.getByTestId('step-counter')).toContainText('Step 2');
    await page.getByTestId('btn-back').click();
    await expect(page.getByTestId('step-counter')).toContainText('Step 1');
  });

  test('progress bar advances on step change', async ({ page }) => {
    await fillStep0(page);
    await page.getByTestId('btn-continue').click();
    await expect(page.getByTestId('step-counter')).toContainText('Step 2');
  });

  // ── Confirm step ───────────────────────────────────────────────────────────

  test('Confirm step shows Submit button', async ({ page }) => {
    await advanceToConfirm(page);
    await expect(page.getByTestId('btn-submit')).toBeVisible();
  });

  test('Confirm step shows data summary', async ({ page }) => {
    await advanceToConfirm(page);
    await expect(page.getByTestId('confirm-step')).toBeVisible();
  });

  test('Confirm step shows "everything look right" text', async ({ page }) => {
    await advanceToConfirm(page);
    await expect(page.getByText(/everything look right/i)).toBeVisible();
  });

  // ── Submission ─────────────────────────────────────────────────────────────

  test('Submit shows thank-you screen', async ({ page }) => {
    await advanceToConfirm(page);
    await page.getByTestId('btn-submit').click();
    await expect(page.getByTestId('thank-you')).toBeVisible();
  });

  test('thank-you screen contains "Thank you"', async ({ page }) => {
    await advanceToConfirm(page);
    await page.getByTestId('btn-submit').click();
    await expect(page.getByTestId('thank-you')).toContainText(/thank you/i);
  });

  test('thank-you "Back to home" button navigates to /', async ({ page }) => {
    await advanceToConfirm(page);
    await page.getByTestId('btn-submit').click();
    await page.getByRole('button', { name: /back to home/i }).click();
    await expect(page).toHaveURL('/');
  });

  // ── Footer ─────────────────────────────────────────────────────────────────

  test('intake footer has copyright text', async ({ page }) => {
    await page.getByTestId('intake-footer').scrollIntoViewIfNeeded();
    await expect(page.getByTestId('intake-footer')).toContainText(/Luminal Journeys/i);
  });

  // ── Layout ─────────────────────────────────────────────────────────────────

  test('no horizontal scroll on intake page', async ({ page }) => {
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    const cw = await page.evaluate(() => document.documentElement.clientWidth);
    expect(sw).toBeLessThanOrEqual(cw + 5);
  });

});

// ── Step-fill helpers ──────────────────────────────────────────────────────────

/**
 * Fill every visible field on the current step.
 * Form-config agnostic — works regardless of which fields exist or are added.
 * Uses name + placeholder hints to pick realistic values; falls back to 'Test'
 * so no required field is ever left blank.
 */
async function fillCurrentStep(page) {
  const inputs = page.locator('input');
  const inputCount = await inputs.count();
  for (let i = 0; i < inputCount; i++) {
    const input = inputs.nth(i);
    if (!await input.isVisible()) continue;
    const type        = (await input.getAttribute('type')        ?? 'text').toLowerCase();
    const name        = (await input.getAttribute('name')        ?? '').toLowerCase();
    const placeholder = (await input.getAttribute('placeholder') ?? '').toLowerCase();
    const hint = `${name} ${placeholder}`;

    if (type === 'date') {
      await input.fill('1990-01-15');
    } else if (type === 'email') {
      await input.fill('test@example.com');
    } else if (type === 'tel') {
      await input.fill('555-123-4567');
    } else if (/first.?name|firstname/i.test(hint)) {
      await input.fill('Amara');
    } else if (/last.?name|lastname/i.test(hint)) {
      await input.fill('Osei');
    } else if (/prefer|nickname|call you/i.test(hint)) {
      await input.fill('Amara');
    } else if (/street|address/i.test(hint)) {
      await input.fill('123 Wellness Way');
    } else if (/city/i.test(hint)) {
      await input.fill('San Francisco');
    } else if (/state/i.test(hint)) {
      await input.fill('CA');
    } else if (/zip|postal/i.test(hint)) {
      await input.fill('94102');
    } else {
      await input.fill('Test');
    }
  }

  const selects = page.locator('select');
  const selectCount = await selects.count();
  for (let i = 0; i < selectCount; i++) {
    const sel = selects.nth(i);
    if (!await sel.isVisible()) continue;
    await sel.selectOption({ index: 1 });
  }

  const textareas = page.locator('textarea');
  const textareaCount = await textareas.count();
  for (let i = 0; i < textareaCount; i++) {
    const ta = textareas.nth(i);
    if (!await ta.isVisible()) continue;
    await ta.fill('Sample notes for testing.');
  }
}

// Step aliases — all delegate to fillCurrentStep so adding/removing form
// fields never requires updating these helpers
const fillStep0 = fillCurrentStep;
const fillStep1 = fillCurrentStep;
const fillStep2 = fillCurrentStep;

/**
 * Advance through all data steps to reach Confirm.
 * Uses data-testid buttons — no text matching, no timeouts.
 */
async function advanceToConfirm(page) {
  const fillers = [fillStep0, fillStep1, fillStep2];
  for (const filler of fillers) {
    const submitVisible = await page.getByTestId('btn-submit').isVisible();
    if (submitVisible) break;
    await filler(page);
    const continueBtn = page.getByTestId('btn-continue');
    if (await continueBtn.isEnabled()) {
      await continueBtn.click();
    }
  }
}
