/**
 * tests/landing.spec.js — Luminal Journeys
 *
 * Landing page smoke suite.
 * Firebase is mocked at the network layer — no real Firestore calls, instant.
 * All selectors use data-testid — zero fragility against copy changes.
 */

import { test, expect } from '@playwright/test';
import { mockFirebase, waitForApp } from './helpers/mock-firebase.js';

test.describe('Landing Page', () => {

  test.beforeEach(async ({ page }) => {
    await mockFirebase(page);
    await page.goto('/');
    await waitForApp(page);
  });

  // ── Nav ────────────────────────────────────────────────────────────────────

  test('nav bar is present', async ({ page }) => {
    await expect(page.getByTestId('nav')).toBeVisible();
  });

  test('nav logo is visible', async ({ page }) => {
    await expect(page.getByTestId('nav-logo')).toBeVisible();
  });

  test('nav CTA button is visible', async ({ page }) => {
    await expect(page.getByTestId('nav-cta')).toBeVisible();
  });

  test('nav CTA navigates to /intake', async ({ page }) => {
    await page.getByTestId('nav-cta').click();
    await expect(page).toHaveURL(/\/intake/);
  });

  // ── Hero ───────────────────────────────────────────────────────────────────

  test('hero section is visible', async ({ page }) => {
    await expect(page.getByTestId('hero-section')).toBeVisible();
  });

  test('hero section contains an h1', async ({ page }) => {
    await expect(page.getByTestId('hero-section').locator('h1')).toBeVisible();
  });

  test('hero CTA navigates to /intake', async ({ page }) => {
    await page.getByTestId('hero-cta').click();
    await expect(page).toHaveURL(/\/intake/);
  });

  // ── Manifesto / Dark section ───────────────────────────────────────────────

  test('manifesto CTA navigates to /intake', async ({ page }) => {
    await page.getByTestId('manifesto-cta').scrollIntoViewIfNeeded();
    await page.getByTestId('manifesto-cta').click();
    await expect(page).toHaveURL(/\/intake/);
  });

  // ── Footer ─────────────────────────────────────────────────────────────────

  test('footer is present', async ({ page }) => {
    await page.getByTestId('footer').scrollIntoViewIfNeeded();
    await expect(page.getByTestId('footer')).toBeVisible();
  });

  test('footer contains brand name', async ({ page }) => {
    await page.getByTestId('footer').scrollIntoViewIfNeeded();
    await expect(page.getByTestId('footer')).toContainText(/Luminal Journeys/i);
  });

  test('footer admin link is present', async ({ page }) => {
    await page.getByTestId('footer').scrollIntoViewIfNeeded();
    await expect(page.getByTestId('admin-link')).toBeVisible();
  });

  test('admin link navigates to /admin', async ({ page }) => {
    await page.getByTestId('footer').scrollIntoViewIfNeeded();
    await page.getByTestId('admin-link').click();
    await expect(page).toHaveURL(/\/admin/);
  });

  // ── Layout ─────────────────────────────────────────────────────────────────

  test('no horizontal scroll at desktop width', async ({ page }) => {
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });

  test('page title is non-empty', async ({ page }) => {
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

});
