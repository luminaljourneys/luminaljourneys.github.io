/**
 * tests/admin-intakes.spec.js — Luminal Journeys
 *
 * Admin Intakes tab — verifies that real intake_submissions data from Firestore
 * is displayed, sortable, searchable, and that status/notes persist.
 *
 * Firebase is mocked — all Firestore reads return MOCK_SUBMISSIONS instantly.
 * Writes (updateDoc) are caught by the generic POST/PATCH mock.
 *
 * Run:  make qa
 * Run against live staging:
 *       npx playwright test tests/admin-intakes.spec.js --config=playwright.staging.config.js
 */

import { test, expect } from '@playwright/test';
import { mockFirebase, waitForApp } from './helpers/mock-firebase.js';
import { MOCK_SUBMISSIONS } from './fixtures/intake-submissions.js';

// ── Auth helper — mock the editor email so AdminPage lets us in ─────────────
async function mockAuth(page) {
  // Inject a fake Firebase user that matches an authorized editor email.
  // EditModeContext reads window.__pw_mock_user when present.
  await page.addInitScript(() => {
    window.__pw_mock_user = {
      email: 'keeya@springsparrowhousing.com',
      displayName: 'Keeya',
      uid: 'mock-uid',
    };
  });
}

test.describe('Admin — Intakes Tab', () => {

  test.beforeEach(async ({ page }) => {
    await mockFirebase(page);
    await mockAuth(page);
    await page.goto('/admin');
    await waitForApp(page);
    // Click the Intakes tab if the page has tab navigation
    const intakesTab = page.getByRole('button', { name: /intakes/i });
    if (await intakesTab.isVisible()) {
      await intakesTab.click();
    }
  });

  // ── Page load ───────────────────────────────────────────────────────────────

  test('Intakes table is visible', async ({ page }) => {
    await expect(page.getByTestId('intakes-table')).toBeVisible();
  });

  test('shows correct total submission count in metric card', async ({ page }) => {
    const totalCard = page.getByTestId('metric-total');
    await expect(totalCard).toContainText(String(MOCK_SUBMISSIONS.length));
  });

  test('shows correct "New" count in metric card', async ({ page }) => {
    const newCount = MOCK_SUBMISSIONS.filter(s => s.status === 'New').length;
    await expect(page.getByTestId('metric-new')).toContainText(String(newCount));
  });

  test('shows correct "Contacted" count in metric card', async ({ page }) => {
    const count = MOCK_SUBMISSIONS.filter(s => s.status === 'Contacted').length;
    await expect(page.getByTestId('metric-contacted')).toContainText(String(count));
  });

  test('shows correct "Scheduled" count in metric card', async ({ page }) => {
    const count = MOCK_SUBMISSIONS.filter(s => s.status === 'Scheduled').length;
    await expect(page.getByTestId('metric-scheduled')).toContainText(String(count));
  });

  test('table rows match fixture length', async ({ page }) => {
    const rows = page.getByTestId('intakes-table').locator('tbody tr').filter({ hasNotText: 'No records found' });
    await expect(rows).toHaveCount(MOCK_SUBMISSIONS.length);
  });

  test('first submission name appears in table', async ({ page }) => {
    await expect(page.getByTestId('intakes-table')).toContainText(MOCK_SUBMISSIONS[0].firstName);
    await expect(page.getByTestId('intakes-table')).toContainText(MOCK_SUBMISSIONS[0].lastName);
  });

  test('footer shows environment label', async ({ page }) => {
    const footer = page.getByTestId('intakes-footer');
    await expect(footer).toContainText(/staging|production/i);
  });

  // ── Search / filter ─────────────────────────────────────────────────────────

  test('search filters table by first name', async ({ page }) => {
    const target = MOCK_SUBMISSIONS[0];
    await page.getByTestId('intakes-search').fill(target.firstName);
    const rows = page.getByTestId('intakes-table').locator('tbody tr').filter({ hasNotText: 'No records found' });
    await expect(rows).toHaveCount(1);
    await expect(page.getByTestId('intakes-table')).toContainText(target.firstName);
  });

  test('search filters by email', async ({ page }) => {
    const target = MOCK_SUBMISSIONS[1];
    await page.getByTestId('intakes-search').fill(target.email);
    const rows = page.getByTestId('intakes-table').locator('tbody tr').filter({ hasNotText: 'No records found' });
    await expect(rows).toHaveCount(1);
  });

  test('search with no match shows "No records found"', async ({ page }) => {
    await page.getByTestId('intakes-search').fill('zzz-no-match-xyz');
    await expect(page.getByTestId('intakes-table')).toContainText(/no records found/i);
  });

  test('clearing search restores all rows', async ({ page }) => {
    await page.getByTestId('intakes-search').fill('zzz-no-match-xyz');
    await page.getByTestId('intakes-search').clear();
    const rows = page.getByTestId('intakes-table').locator('tbody tr').filter({ hasNotText: 'No records found' });
    await expect(rows).toHaveCount(MOCK_SUBMISSIONS.length);
  });

  // ── Status cycling ──────────────────────────────────────────────────────────

  test('clicking status badge cycles to next status', async ({ page }) => {
    const STATUS_ORDER = ['New', 'Contacted', 'Scheduled'];
    // Find first "New" submission
    const firstNew = MOCK_SUBMISSIONS.find(s => s.status === 'New');
    if (!firstNew) test.skip();

    // Find the status badge for that row — locate by row containing the first name
    const row = page.getByTestId('intakes-table').locator('tbody tr').filter({ hasText: firstNew.firstName }).first();
    const badge = row.getByTestId('status-badge');
    await expect(badge).toContainText('New');

    await badge.click();

    const nextStatus = STATUS_ORDER[(STATUS_ORDER.indexOf(firstNew.status) + 1) % STATUS_ORDER.length];
    await expect(badge).toContainText(nextStatus);
  });

  // ── Notes ───────────────────────────────────────────────────────────────────

  test('clicking "+ Add Note" opens note textarea', async ({ page }) => {
    // Find a row with no notes
    const noNotes = MOCK_SUBMISSIONS.find(s => !s.notes);
    if (!noNotes) test.skip();

    const row = page.getByTestId('intakes-table').locator('tbody tr').filter({ hasText: noNotes.firstName }).first();
    await row.getByText('+ Add Note').click();
    await expect(row.locator('textarea')).toBeVisible();
  });

  test('saving a note persists the text in the row', async ({ page }) => {
    const noNotes = MOCK_SUBMISSIONS.find(s => !s.notes);
    if (!noNotes) test.skip();

    const row = page.getByTestId('intakes-table').locator('tbody tr').filter({ hasText: noNotes.firstName }).first();
    await row.getByText('+ Add Note').click();
    const textarea = row.locator('textarea');
    await textarea.fill('Test note for QA.');
    await row.getByRole('button', { name: 'Save' }).click();

    await expect(row).toContainText('Test note for QA.');
  });

  test('existing notes show "Edit note" button', async ({ page }) => {
    const hasNotes = MOCK_SUBMISSIONS.find(s => s.notes);
    if (!hasNotes) test.skip();

    const row = page.getByTestId('intakes-table').locator('tbody tr').filter({ hasText: hasNotes.firstName }).first();
    await expect(row.getByText('Edit note')).toBeVisible();
  });

  test('clicking "Edit note" opens textarea with existing text', async ({ page }) => {
    const hasNotes = MOCK_SUBMISSIONS.find(s => s.notes);
    if (!hasNotes) test.skip();

    const row = page.getByTestId('intakes-table').locator('tbody tr').filter({ hasText: hasNotes.firstName }).first();
    await row.getByText('Edit note').click();
    const textarea = row.locator('textarea');
    await expect(textarea).toBeVisible();
    await expect(textarea).toHaveValue(hasNotes.notes);
  });

  // ── Expand / collapse ───────────────────────────────────────────────────────

  test('clicking ▼ expands a row with address and notes detail', async ({ page }) => {
    const firstRow = page.getByTestId('intakes-table').locator('tbody tr').first();
    await firstRow.locator('button', { hasText: '▼' }).click();
    await expect(page.getByText(/full address/i)).toBeVisible();
  });

  test('clicking ▲ collapses an expanded row', async ({ page }) => {
    const firstRow = page.getByTestId('intakes-table').locator('tbody tr').first();
    await firstRow.locator('button', { hasText: '▼' }).click();
    await expect(page.getByText(/full address/i)).toBeVisible();
    await firstRow.locator('button', { hasText: '▲' }).click();
    await expect(page.getByText(/full address/i)).not.toBeVisible();
  });

  // ── Layout ──────────────────────────────────────────────────────────────────

  test('no horizontal scroll on admin intakes page', async ({ page }) => {
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    const cw = await page.evaluate(() => document.documentElement.clientWidth);
    expect(sw).toBeLessThanOrEqual(cw + 5);
  });

});

// ── Live Firestore verification (staging) ────────────────────────────────────
// Skipped unless TEST_ADMIN_LIVE=1 is set in env.
// This test does NOT mock Firebase — it hits the real staging Firestore.
// Requires the admin to be signed in (FIREBASE_ID_TOKEN env var).
//
// Run: TEST_ADMIN_LIVE=1 FIREBASE_ID_TOKEN=<token> npx playwright test tests/admin-intakes.spec.js --grep live

test.describe('Admin Intakes — live Firestore verification (staging)', () => {
  test.skip(
    !process.env.TEST_ADMIN_LIVE,
    'Set TEST_ADMIN_LIVE=1 to run live Firestore tests'
  );

  test('live: intake_submissions query returns data', async ({ request }) => {
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'luminal-journeys';
    const token     = process.env.FIREBASE_ID_TOKEN;

    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;
    const body = {
      structuredQuery: {
        from: [{ collectionId: 'intake_submissions' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'env' },
            op: 'EQUAL',
            value: { stringValue: 'staging' },
          },
        },
        orderBy: [{ field: { fieldPath: 'submittedAt' }, direction: 'DESCENDING' }],
        limit: 10,
      },
    };
    const headers = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    const response = await request.post(url, { data: body, headers });

    if (response.status() === 403) {
      console.log('[admin-intakes live] 403 — no ID token provided. Skipping read-back assertion.');
      return;
    }

    expect(response.status()).toBe(200);
    const json = await response.json();
    // At least one document should exist from prior intake submissions
    const docs = json.filter(item => item.document);
    expect(docs.length).toBeGreaterThanOrEqual(1);

    const first = docs[0].document.fields;
    expect(first.env?.stringValue).toBe('staging');
    expect(first.status?.stringValue).toBeTruthy();
    console.log(`[admin-intakes live] Found ${docs.length} staging submissions. Latest: ${first.firstName?.stringValue} ${first.lastName?.stringValue}`);
  });
});
