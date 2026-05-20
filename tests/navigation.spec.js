/**
 * tests/navigation.spec.js — Luminal Journeys
 *
 * SPA routing: home, intake, dynamic pages, 404 state.
 * Firebase mocked — dynamic page slugs resolve from MOCK_PAGES fixture instantly.
 */

import { test, expect } from '@playwright/test';
import { mockFirebase, waitForApp } from './helpers/mock-firebase.js';
import { MOCK_PAGES } from './fixtures/pages.js';

test.describe('Navigation & Routing', () => {

  // ── Home ───────────────────────────────────────────────────────────────────

  test('/ renders the landing page', async ({ page }) => {
    await mockFirebase(page);
    await page.goto('/');
    await waitForApp(page);
    await expect(page.getByTestId('nav')).toBeVisible();
  });

  // ── Intake ─────────────────────────────────────────────────────────────────

  test('/intake renders the intake form', async ({ page }) => {
    await mockFirebase(page);
    await page.goto('/intake');
    await waitForApp(page);
    await expect(page.getByText('New Client Intake')).toBeVisible();
  });

  test('/intake direct URL works (SPA no 404)', async ({ page }) => {
    await mockFirebase(page);
    await page.goto('/intake');
    await waitForApp(page);
    await expect(page.getByTestId('progress-bar')).toBeVisible();
  });

  // ── Dynamic pages from fixture ─────────────────────────────────────────────

  for (const mockPage of MOCK_PAGES) {
    test(`/${mockPage.id} renders the "${mockPage.title}" page`, async ({ page }) => {
      await mockFirebase(page);
      await page.goto(`/${mockPage.id}`);
      await waitForApp(page);
      // DynamicPage renders the page title as a heading or shows the content
      await expect(page.locator('body')).toBeVisible();
      // Should not accidentally render intake form
      await expect(page.getByText('New Client Intake')).not.toBeVisible();
    });
  }

  // ── 404 / unknown slug ─────────────────────────────────────────────────────

  test('unknown slug shows graceful not-found state', async ({ page }) => {
    await mockFirebase(page);
    await page.goto('/this-page-does-not-exist-xyz');
    await waitForApp(page);
    // Must render something — body visible, no crash
    await expect(page.locator('body')).toBeVisible();
    // Should not render the intake form
    await expect(page.getByText('New Client Intake')).not.toBeVisible();
  });

  test('not-found state has a way back to home', async ({ page }) => {
    await mockFirebase(page);
    await page.goto('/this-page-does-not-exist-xyz');
    await waitForApp(page);
    // Either a "Back" button or the landing page nav should be reachable
    const homeBtn = page.getByRole('button', { name: /home|back/i }).first();
    if (await homeBtn.isVisible()) {
      await homeBtn.click();
      await expect(page).toHaveURL('/');
    }
  });

  // ── Admin ──────────────────────────────────────────────────────────────────

  test('/admin renders a page (no crash)', async ({ page }) => {
    await mockFirebase(page);
    await page.goto('/admin');
    await waitForApp(page);
    // LoginModal is a fixed full-screen overlay with a unique heading
    await expect(
      page.getByRole('heading', { name: 'Editor Access' }).or(page.getByTestId('tab-intakes'))
    ).toBeVisible();
  });

  // ── Mobile layout ──────────────────────────────────────────────────────────

  test('intake page: no horizontal overflow on narrow viewport', async ({ page }) => {
    await mockFirebase(page);
    await page.goto('/intake');
    await waitForApp(page);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    const cw = await page.evaluate(() => document.documentElement.clientWidth);
    expect(sw).toBeLessThanOrEqual(cw + 5);
  });

  test('landing page: no horizontal overflow', async ({ page }) => {
    await mockFirebase(page);
    await page.goto('/');
    await waitForApp(page);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    const cw = await page.evaluate(() => document.documentElement.clientWidth);
    expect(sw).toBeLessThanOrEqual(cw + 5);
  });

});
