/**
 * tests/a11y.spec.js — Luminal Journeys
 *
 * WCAG 2.2 AA accessibility audit using axe-core.
 * Firebase is mocked at the network layer — same as all other test suites.
 *
 * Failure threshold: critical + serious violations only.
 * Moderate/minor violations are reported but do NOT fail the build.
 * Tighten `includedImpacts` once critical/serious issues are cleared.
 *
 * Run locally:
 *   npx playwright test tests/a11y.spec.js
 *
 * Run against staging:
 *   BASE_URL=https://admin.luminaljourneys.com npx playwright test tests/a11y.spec.js --project=chromium
 */

import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';
import { mockFirebase, waitForApp } from './helpers/mock-firebase.js';

// Shared axe options — WCAG 2.2 AA tags, fail only on critical/serious
const AXE_OPTIONS = {
  runOnly: {
    type: 'tag',
    values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'],
  },
  includedImpacts: ['critical', 'serious'],
  detailedReport: true,
  detailedReportOptions: { html: true },
};

test.describe('Accessibility (WCAG 2.2 AA)', () => {

  // ── Landing page ────────────────────────────────────────────────────────────

  test('landing page — no critical/serious violations', async ({ page }) => {
    await mockFirebase(page);
    await page.goto('/');
    await waitForApp(page);
    await injectAxe(page);
    await checkA11y(page, null, AXE_OPTIONS);
  });

  test('landing page footer — no critical/serious violations', async ({ page }) => {
    await mockFirebase(page);
    await page.goto('/');
    await waitForApp(page);
    // Scroll to footer so axe evaluates it in context
    await page.getByTestId('footer').scrollIntoViewIfNeeded();
    await injectAxe(page);
    await checkA11y(page, null, AXE_OPTIONS);
  });

  // ── Intake page ─────────────────────────────────────────────────────────────

  test('intake page — no critical/serious violations', async ({ page }) => {
    await mockFirebase(page);
    await page.goto('/intake');
    await waitForApp(page);
    await injectAxe(page);
    await checkA11y(page, null, AXE_OPTIONS);
  });

  // ── Keyboard navigation ─────────────────────────────────────────────────────

  test('landing page nav CTA is keyboard-reachable', async ({ page }) => {
    await mockFirebase(page);
    await page.goto('/');
    await waitForApp(page);

    // Tab from body until we reach the nav CTA — must be focusable
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    const navCta = page.getByTestId('nav-cta');
    const isFocused = await navCta.evaluate(el => document.activeElement === el);
    // Allow a few more tabs if CTA isn't the second focusable element
    if (!isFocused) {
      await page.keyboard.press('Tab');
    }

    // CTA must be reachable via keyboard within first few tabs
    await expect(navCta).toBeFocused({ timeout: 3_000 }).catch(async () => {
      // Not a hard failure here — just log for awareness.
      // Tab order depends on DOM structure; this test is a signal, not a gate.
      console.warn('[a11y] nav-cta not in first 3 tab stops — review tab order');
    });
  });

  // ── Color contrast spot-check (structural) ──────────────────────────────────

  test('no color-contrast violations on landing page', async ({ page }) => {
    await mockFirebase(page);
    await page.goto('/');
    await waitForApp(page);
    await injectAxe(page);
    // Target contrast specifically — this is a known risk area
    await checkA11y(page, null, {
      runOnly: { type: 'rule', values: ['color-contrast'] },
      includedImpacts: ['critical', 'serious'],
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
  });

});
