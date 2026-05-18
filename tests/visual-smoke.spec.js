/**
 * tests/visual-smoke.spec.js — Luminal Journeys
 *
 * Fast smoke pass: all routes load without JS errors, color tokens render,
 * favicon resolves. Run first to catch regressions before heavier suites.
 *
 * Firebase mocked → no network wait, instant fixture data.
 */

import { test, expect } from '@playwright/test';
import { mockFirebase, waitForApp } from './helpers/mock-firebase.js';

// ── No-crash sweep ─────────────────────────────────────────────────────────────

const CORE_ROUTES = ['/', '/intake', '/admin'];

for (const route of CORE_ROUTES) {
  test(`${route} — loads without JS errors`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await mockFirebase(page);
    await page.goto(route);
    await waitForApp(page);

    // Filter out expected non-fatal noise (network errors from mocked Firebase)
    const fatal = errors.filter(e =>
      !e.includes('net::ERR_') &&
      !e.includes('favicon') &&
      !e.includes('Failed to fetch') &&
      !e.includes('firestore')
    );

    expect(fatal, `JS errors on ${route}: ${fatal.join('; ')}`).toHaveLength(0);
    // /admin has a fixed full-screen login overlay — body reports as hidden to Playwright
    if (route === '/admin') {
      await expect(
        page.getByRole('button', { name: 'Sign In' }).or(page.getByTestId('tab-intakes'))
      ).toBeVisible();
    } else {
      await expect(page.locator('body')).toBeVisible();
    }
  });
}

// Dynamic pages from fixture
const DYNAMIC_ROUTES = ['/about', '/services', '/faq'];

for (const route of DYNAMIC_ROUTES) {
  test(`${route} — renders without crash`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await mockFirebase(page);
    await page.goto(route);
    await waitForApp(page);

    const fatal = errors.filter(e => !e.includes('net::ERR_') && !e.includes('firestore'));
    expect(fatal, `JS errors on ${route}: ${fatal.join('; ')}`).toHaveLength(0);
    await expect(page.locator('body')).toBeVisible();
  });
}

// ── Color tokens ───────────────────────────────────────────────────────────────

test.describe('Color Token Smoke', () => {

  test('landing page background is paper white rgb(249,248,246)', async ({ page }) => {
    await mockFirebase(page);
    await page.goto('/');
    await waitForApp(page);
    const bg = await page.evaluate(() =>
      window.getComputedStyle(document.body).backgroundColor
    );
    expect(bg).toBe('rgb(249, 248, 246)');
  });

  test('intake page background is paper white', async ({ page }) => {
    await mockFirebase(page);
    await page.goto('/intake');
    await waitForApp(page);
    const bg = await page.evaluate(() =>
      window.getComputedStyle(document.body).backgroundColor
    );
    expect(bg).toBe('rgb(249, 248, 246)');
  });

});

// ── Favicon ────────────────────────────────────────────────────────────────────

test.describe('Favicon', () => {

  test('favicon link tag is present in <head>', async ({ page }) => {
    await mockFirebase(page);
    await page.goto('/');
    await waitForApp(page);
    const favicon = await page.evaluate(() => {
      const el = document.querySelector('link[rel="icon"]');
      return el ? el.getAttribute('href') : null;
    });
    expect(favicon).not.toBeNull();
  });

  test('favicon URL returns 200', async ({ page }) => {
    await mockFirebase(page);
    await page.goto('/');
    await waitForApp(page);
    const faviconHref = await page.evaluate(() => {
      const el = document.querySelector('link[rel="icon"]');
      return el ? el.href : null;
    });
    if (faviconHref) {
      const res = await page.request.get(faviconHref);
      expect(res.status()).toBe(200);
    }
  });

});

// ── Core UI elements present ───────────────────────────────────────────────────

test.describe('Core UI Presence', () => {

  test('landing page has nav, hero, and footer', async ({ page }) => {
    await mockFirebase(page);
    await page.goto('/');
    await waitForApp(page);
    await expect(page.getByTestId('nav')).toBeVisible();
    await expect(page.getByTestId('hero-section')).toBeVisible();
    await page.getByTestId('footer').scrollIntoViewIfNeeded();
    await expect(page.getByTestId('footer')).toBeVisible();
  });

  test('intake page has progress bar and continue button', async ({ page }) => {
    await mockFirebase(page);
    await page.goto('/intake');
    await waitForApp(page);
    await expect(page.getByTestId('progress-bar')).toBeVisible();
    await expect(page.getByTestId('btn-continue')).toBeVisible();
  });

});
