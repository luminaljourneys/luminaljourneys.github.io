/**
 * tests/login.spec.js — Luminal Journeys
 *
 * Login test cases for the Editor Access modal.
 * Three auth paths:
 *   1. Password login  — username "admin" + ADMIN_PASSWORD env var
 *   2. Email magic link — passwordless, for non-Gmail authorized editors
 *   3. Google Sign-In  — popup flow (mocked for CI, live for manual runs)
 */

import { test, expect } from '@playwright/test';
import { mockFirebase, waitForApp } from './helpers/mock-firebase.js';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'luminal2026';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function openLoginModal(page) {
  await mockFirebase(page);
  await page.goto('/');
  await waitForApp(page);
  await page.getByRole('button', { name: /edit site/i }).click();
  await expect(page.getByText('Editor Access')).toBeVisible();
}

async function loginWithPassword(page, username = 'admin', password = ADMIN_PASSWORD) {
  await page.getByPlaceholder('Username').fill(username);
  await page.getByPlaceholder('Password').fill(password);
  await page.getByRole('button', { name: /^sign in$/i }).click();
}

async function expectEditMode(page) {
  await expect(page.getByText('Publish Live')).toBeVisible({ timeout: 5000 });
}

async function expectViewMode(page) {
  await expect(page.getByRole('button', { name: /edit site/i })).toBeVisible({ timeout: 5000 });
}

// ── Modal UI ──────────────────────────────────────────────────────────────────

test.describe('Login modal — UI', () => {

  test('modal opens when Edit Site is clicked', async ({ page }) => {
    await openLoginModal(page);
    await expect(page.getByRole('heading', { name: 'Editor Access' })).toBeVisible();
    // Google Sign-In is intentionally removed — magic link + password only
    await expect(page.getByRole('button', { name: /continue with google/i })).not.toBeVisible();
    await expect(page.getByText(/sign in with email link/i)).toBeVisible();
    await expect(page.getByPlaceholder('Username')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /^sign in$/i })).toBeVisible();
  });

  test('modal closes when backdrop is clicked', async ({ page }) => {
    await openLoginModal(page);
    await page.mouse.click(10, 10);
    await expect(page.getByText('Editor Access')).not.toBeVisible({ timeout: 3000 });
  });

  test('modal does not open when already in edit mode', async ({ page }) => {
    await openLoginModal(page);
    await loginWithPassword(page);
    await expectEditMode(page);
    await expect(page.getByRole('button', { name: /edit site/i })).not.toBeVisible();
  });

});

// ── Password login ────────────────────────────────────────────────────────────

test.describe('Password login', () => {

  test('correct credentials enter edit mode', async ({ page }) => {
    await openLoginModal(page);
    await loginWithPassword(page);
    await expectEditMode(page);
    // User chip in StagingBanner shows the logged-in user's displayName
    await expect(page.getByTestId('user-chip-name')).toHaveText('Admin');
  });

  test('wrong password shows error', async ({ page }) => {
    await openLoginModal(page);
    await loginWithPassword(page, 'admin', 'wrongpassword');
    await expect(page.getByText('Incorrect credentials.')).toBeVisible();
    await expect(page.getByText('Editor Access')).toBeVisible();
  });

  test('wrong username shows error', async ({ page }) => {
    await openLoginModal(page);
    await loginWithPassword(page, 'notadmin', ADMIN_PASSWORD);
    await expect(page.getByText('Incorrect credentials.')).toBeVisible();
  });

  test('empty credentials show error, do not crash', async ({ page }) => {
    await openLoginModal(page);
    await loginWithPassword(page, '', '');
    await expect(page.getByText('Incorrect credentials.')).toBeVisible();
    await expect(page.getByText('Editor Access')).toBeVisible();
  });

  test('session persists after page reload', async ({ page }) => {
    await openLoginModal(page);
    await loginWithPassword(page);
    await expectEditMode(page);
    await page.reload();
    await waitForApp(page);
    await expectEditMode(page);
  });

  test('sign-out exits edit mode', async ({ page }) => {
    await openLoginModal(page);
    await loginWithPassword(page);
    await expectEditMode(page);
    // "Exit Edit Mode" button is in the floating toolbar when logged in
    await page.getByRole('button', { name: /exit edit mode/i }).click();
    await expectViewMode(page);
  });

  test('session does not persist after sign-out + reload', async ({ page }) => {
    await openLoginModal(page);
    await loginWithPassword(page);
    await expectEditMode(page);
    await page.getByRole('button', { name: /exit edit mode/i }).click();
    await expectViewMode(page);
    await page.reload();
    await waitForApp(page);
    await expectViewMode(page);
  });

});

// ── Email magic link (passwordless) ──────────────────────────────────────────

test.describe('Email magic link — passwordless', () => {

  test('email input and Send link button are visible', async ({ page }) => {
    await openLoginModal(page);
    await expect(page.getByText(/sign in with email link/i)).toBeVisible();
    await expect(page.getByPlaceholder('your@email.com')).toBeVisible();
    await expect(page.getByRole('button', { name: /send link/i })).toBeVisible();
  });

  test('Send link button is disabled when email is empty', async ({ page }) => {
    await openLoginModal(page);
    const sendBtn = page.getByRole('button', { name: /send link/i });
    await expect(sendBtn).toBeDisabled();
  });

  test('Gmail address is accepted (Google Sign-In removed, magic link works for all)', async ({ page }) => {
    await openLoginModal(page);
    await page.getByPlaceholder('your@email.com').fill('someone@gmail.com');
    await page.getByRole('button', { name: /send link/i }).click();
    // Gmail block removed — should show success state, not an error
    await expect(page.getByText(/access list/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Editor Access')).toBeVisible();
  });

  test('googlemail.com is also accepted via magic link', async ({ page }) => {
    await openLoginModal(page);
    await page.getByPlaceholder('your@email.com').fill('someone@googlemail.com');
    await page.getByRole('button', { name: /send link/i }).click();
    await expect(page.getByText(/access list/i)).toBeVisible({ timeout: 5000 });
  });

  test('valid non-Gmail email shows check-inbox success state', async ({ page }) => {
    await openLoginModal(page);
    await page.getByPlaceholder('your@email.com').fill('wouter@keijser.com');
    await page.getByRole('button', { name: /send link/i }).click();
    await expect(page.getByText(/access list/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('wouter@keijser.com')).toBeVisible();
  });

  test('"Use a different email" resets back to input form', async ({ page }) => {
    await openLoginModal(page);
    await page.getByPlaceholder('your@email.com').fill('wouter@keijser.com');
    await page.getByRole('button', { name: /send link/i }).click();
    await expect(page.getByText(/access list/i)).toBeVisible({ timeout: 5000 });
    await page.getByText(/use a different email/i).click();
    await expect(page.getByPlaceholder('your@email.com')).toBeVisible();
    await expect(page.getByRole('button', { name: /send link/i })).toBeVisible();
  });

  test('rate limiting blocks after 3 attempts', async ({ page }) => {
    await openLoginModal(page);
    await page.evaluate(() => {
      const rl = { 'blocked@example.com': { count: 3, first: Date.now() } };
      localStorage.setItem('lj_rl_magic', JSON.stringify(rl));
    });
    await page.getByPlaceholder('your@email.com').fill('blocked@example.com');
    await page.getByRole('button', { name: /send link/i }).click();
    await expect(page.getByText(/too many attempts/i)).toBeVisible();
  });

  test('rate limit resets after window expires', async ({ page }) => {
    await openLoginModal(page);
    await page.evaluate(() => {
      const expired = Date.now() - (11 * 60 * 1000);
      const rl = { 'wouter@keijser.com': { count: 3, first: expired } };
      localStorage.setItem('lj_rl_magic', JSON.stringify(rl));
    });
    await page.getByPlaceholder('your@email.com').fill('wouter@keijser.com');
    await page.getByRole('button', { name: /send link/i }).click();
    await expect(page.getByText(/access list/i)).toBeVisible({ timeout: 5000 });
  });

});

// ── Google Sign-In — removed ──────────────────────────────────────────────────
// Google Sign-In was removed from the UI. Magic link works for all email
// addresses including Gmail. These tests are kept as skipped documentation.

test.describe('Google Sign-In — removed', () => {

  test.skip('Google button is not present in the modal', async ({ page }) => {
    await openLoginModal(page);
    await expect(page.getByRole('button', { name: /continue with google/i })).not.toBeVisible();
  });

});

// ── Live Google Sign-In (manual / staging only) ───────────────────────────────

test.describe('Google Sign-In — live (manual)', () => {

  test.skip(!process.env.GOOGLE_TEST_EMAIL, 'Set GOOGLE_TEST_EMAIL to run live Google auth tests');

  test('authorized Google email enters edit mode', async ({ page }) => {
    await mockFirebase(page);
    await page.goto('/');
    await waitForApp(page);
    await page.getByRole('button', { name: /edit site/i }).click();
    const popupPromise = page.waitForEvent('popup');
    await page.getByRole('button', { name: /continue with google/i }).click();
    const popup = await popupPromise;
    await popup.waitForEvent('close', { timeout: 30000 });
    await expectEditMode(page);
    await expect(page.getByText(process.env.GOOGLE_TEST_EMAIL)).toBeVisible();
  });

});
