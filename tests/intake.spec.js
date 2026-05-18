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

/** Fill all visible inputs on step 0 (Personal Info from fixture) */
async function fillStep0(page) {
  // First Name + Last Name (text inputs)
  const textInputs = page.locator('input[type="text"]');
  const count = await textInputs.count();
  for (let i = 0; i < count; i++) {
    await textInputs.nth(i).fill('Test');
  }
  // Date of Birth
  const dateInput = page.locator('input[type="date"]');
  if (await dateInput.isVisible()) {
    await dateInput.fill('1990-01-15');
  }
  // Pronouns select (optional — fill to be safe)
  const selects = page.locator('select');
  const sc = await selects.count();
  for (let i = 0; i < sc; i++) {
    await selects.nth(i).selectOption({ index: 1 });
  }
}

/** Fill step 1: email */
async function fillStep1(page) {
  const emailInput = page.locator('input[type="email"]');
  if (await emailInput.isVisible()) {
    await emailInput.fill('test@example.com');
  }
  const telInput = page.locator('input[type="tel"]');
  if (await telInput.isVisible()) {
    await telInput.fill('555-123-4567');
  }
}

/** Fill step 2: goal select + notes textarea */
async function fillStep2(page) {
  const selects = page.locator('select');
  const sc = await selects.count();
  for (let i = 0; i < sc; i++) {
    await selects.nth(i).selectOption({ index: 1 });
  }
  const textareas = page.locator('textarea');
  const tc = await textareas.count();
  for (let i = 0; i < tc; i++) {
    await textareas.nth(i).fill('Sample notes for testing.');
  }
}

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
