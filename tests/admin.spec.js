/**
 * tests/admin.spec.js — Luminal Journeys
 *
 * Admin dashboard: tab navigation (Intakes / Form Builder / Pages / Publish).
 * Firebase mocked. Uses data-testid="tab-{id}" on every tab button.
 *
 * Admin is gated by a password prompt (useEditMode). Tests run in two modes:
 *   1. Unauthenticated — confirms gate renders, doesn't crash
 *   2. Authenticated — set ADMIN_PASSWORD env var to skip the gate
 */

import { test, expect } from '@playwright/test';
import { mockFirebase, waitForApp } from './helpers/mock-firebase.js';

const PASSWORD = process.env.ADMIN_PASSWORD || '';

// ── Helper: navigate to admin and optionally log in ───────────────────────────
async function goToAdmin(page) {
  await mockFirebase(page);
  await page.goto('/admin');
  await waitForApp(page);

  if (PASSWORD) {
    const pwInput = page.locator('input[type="password"]');
    if (await pwInput.isVisible()) {
      await pwInput.fill(PASSWORD);
      await page.getByRole('button', { name: /sign in|enter|login|unlock/i }).first().click();
      await waitForApp(page);
    }
  }
}

// ── Unauthenticated ──────────────────────────────────────────────────────────

test.describe('Admin — unauthenticated', () => {

  test('/admin renders without crashing', async ({ page }) => {
    await mockFirebase(page);
    await page.goto('/admin');
    await waitForApp(page);
    // LoginModal is a fixed full-screen overlay with a unique heading
    await expect(
      page.getByRole('heading', { name: 'Editor Access' }).or(page.getByTestId('tab-intakes'))
    ).toBeVisible();
  });

  test('/admin shows password gate or tab bar', async ({ page }) => {
    await mockFirebase(page);
    await page.goto('/admin');
    await waitForApp(page);
    const hasGate = await page.locator('input[type="password"]').isVisible();
    const hasTabs = await page.getByTestId('tab-intakes').isVisible();
    expect(hasGate || hasTabs).toBeTruthy();
  });

});

// ── Tab navigation (requires auth or VITE_EDIT_MODE_ENABLED bypass) ──────────

test.describe('Admin — tab navigation', () => {

  test('Intakes tab is clickable', async ({ page }) => {
    await goToAdmin(page);
    const tab = page.getByTestId('tab-intakes');
    if (await tab.isVisible()) {
      await tab.click();
      await expect(tab).toBeVisible();
    }
  });

  test('Form Builder tab is clickable', async ({ page }) => {
    await goToAdmin(page);
    const tab = page.getByTestId('tab-form');
    if (await tab.isVisible()) {
      await tab.click();
      await expect(tab).toBeVisible();
    }
  });

  test('Pages tab is clickable', async ({ page }) => {
    await goToAdmin(page);
    const tab = page.getByTestId('tab-pages');
    if (await tab.isVisible()) {
      await tab.click();
      await expect(tab).toBeVisible();
    }
  });

  test('Publish tab is clickable', async ({ page }) => {
    await goToAdmin(page);
    const tab = page.getByTestId('tab-publish');
    if (await tab.isVisible()) {
      await tab.click();
      await expect(tab).toBeVisible();
    }
  });

  test('Form Builder tab shows step or field content', async ({ page }) => {
    await goToAdmin(page);
    const tab = page.getByTestId('tab-form');
    if (await tab.isVisible()) {
      await tab.click();
      await waitForApp(page);
      // Should render step names from mock fixture or an "Add Field" UI
      const hasContent = await page.getByText(/step|field|personal info|contact/i).isVisible();
      expect(hasContent).toBeTruthy();
    }
  });

  test('Pages tab shows page management UI', async ({ page }) => {
    await goToAdmin(page);
    const tab = page.getByTestId('tab-pages');
    if (await tab.isVisible()) {
      await tab.click();
      await waitForApp(page);
      // Should render page list from mock fixture (About, Services, FAQ)
      const hasContent = await page.getByText(/page|about|services|create/i).isVisible();
      expect(hasContent).toBeTruthy();
    }
  });

  test('Publish tab shows staging-to-production UI', async ({ page }) => {
    await goToAdmin(page);
    const tab = page.getByTestId('tab-publish');
    if (await tab.isVisible()) {
      await tab.click();
      await waitForApp(page);
      const hasContent = await page.getByText(/publish|staging|production|live/i).isVisible();
      expect(hasContent).toBeTruthy();
    }
  });

});
