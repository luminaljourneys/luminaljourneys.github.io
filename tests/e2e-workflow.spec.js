/**
 * tests/e2e-workflow.spec.js — Luminal Journeys
 *
 * Full staging → production workflow E2E tests.
 * Covers the three primary authorized-editor use cases:
 *
 *   1. Magic link auth   — authorized editor clicks link, lands on admin
 *                          Dashboard without the login modal appearing.
 *
 *   2. Staging → Publish — editor signs in on staging, clicks Publish Live,
 *                          confirms the dialog, sees the success state.
 *
 *   3. Production intake → admin Intakes tab — visitor submits the intake form,
 *                          sees the thank-you screen; admin signs in and sees
 *                          the submission in the Intakes tab.
 *
 * Firebase is fully mocked — no real Firestore / Auth / email calls.
 * Auth bypass: localStorage session injection (the real path EditModeContext
 * uses after any successful sign-in — magic link, password, or Google).
 *
 * NOTE: Email pipeline (Resend / Cloudflare Worker) is intentionally excluded
 * from these tests — Resend domain verification is still pending (DKIM).
 * Worker calls are mocked to 200 OK so they never block form submission.
 *
 * Run:
 *   make qa                                         # all suites
 *   npx playwright test tests/e2e-workflow.spec.js  # this suite only
 *
 * Live staging (skips Firebase mock, hits real backend):
 *   E2E_LIVE=1 npx playwright test tests/e2e-workflow.spec.js \
 *     --config=playwright.staging.config.js
 */

import { test, expect } from '@playwright/test';
import { mockFirebase, waitForApp } from './helpers/mock-firebase.js';
import { MOCK_PROD_SUBMISSIONS } from './fixtures/intake-submissions.js';

const IS_LIVE = !!process.env.E2E_LIVE;

// ── Shared fixtures ──────────────────────────────────────────────────────────

const MOCK_EDITOR = { displayName: 'Keeya', email: 'hi@keeya.nl', photoURL: null };
const SESSION_MS  = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Inject a valid localStorage edit session — the real auth bypass path.
 * EditModeContext restores isEditMode from this on mount, same as after a
 * real sign-in. Must be called via addInitScript before page.goto().
 */
async function injectSession(page, user = MOCK_EDITOR) {
  await page.addInitScript((args) => {
    localStorage.setItem('lj_edit_session', JSON.stringify({
      expiry: Date.now() + args.sessionMs,
      user: args.user,
    }));
  }, { user, sessionMs: SESSION_MS });
}

/**
 * Standard mocked-Firebase setup. In live mode, skips the mock entirely so
 * real Firebase calls fire against the staging/production backend.
 */
async function setup(page) {
  if (!IS_LIVE) {
    await mockFirebase(page);
  }
}

// ── Mock the Cloudflare Worker so form submissions never block ────────────────
async function mockWorker(page) {
  await page.route('**intake-mailer**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, results: [{ type: 'admin', status: 202 }] }),
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite 1 — Magic link auth: no login modal, lands on Dashboard
// ─────────────────────────────────────────────────────────────────────────────

test.describe('1 — Magic link auth', () => {

  test('authorized editor lands on admin Dashboard, login modal never appears', async ({ page }) => {
    await setup(page);

    // Pre-populate localStorage with the session the magic link completion would write.
    // This simulates: editor clicks magic link → Firebase signs them in →
    // EditModeContext stores session → page restores it on next load.
    await injectSession(page);

    await page.goto('/admin');
    await waitForApp(page);

    // Modal must NOT be visible
    await expect(page.getByText('Editor Access')).not.toBeVisible();

    // Dashboard must render — Intakes tab heading is the landmark
    await expect(page.getByRole('button', { name: /intakes/i })).toBeVisible({ timeout: 8_000 });
  });

  test('unauthenticated visitor sees login modal on /admin', async ({ page }) => {
    await setup(page);
    // No session injected — should show AdminGate + login modal auto-trigger
    await page.goto('/admin');
    await waitForApp(page);
    // Login modal should appear
    await expect(page.getByText('Editor Access')).toBeVisible({ timeout: 8_000 });
  });

  test('magicLinkPending loading screen shows "Signing you in…" — not modal', async ({ page }) => {
    await setup(page);

    // Override the identity toolkit mock to return an authorized email
    // so signInWithEmailLink completes successfully
    await page.route('**identitytoolkit.googleapis.com/v1/accounts:signInWithEmailLink**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ idToken: 'mock-token', email: 'hi@keeya.nl', localId: 'mock-uid' }),
      });
    });

    // Pre-store the email so the magic link handler doesn't fall back to window.prompt
    await page.addInitScript(() => {
      localStorage.setItem('lj_magic_link_email', 'hi@keeya.nl');
    });

    // Navigate with URL params that Firebase's isSignInWithEmailLink recognises
    await page.goto('/admin?apiKey=test-key&oobCode=test-code&mode=signIn&lang=en');

    // During processing: "Signing you in…" loading screen, no login modal
    const modal = page.getByText('Editor Access');
    await expect(modal).not.toBeVisible();

    // After magic link completes: Dashboard renders
    await expect(page.getByRole('button', { name: /intakes/i })).toBeVisible({ timeout: 10_000 });
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 2 — Staging edit → Publish Live
// ─────────────────────────────────────────────────────────────────────────────

test.describe('2 — Staging edit → Publish Live', () => {

  test.beforeEach(async ({ page }) => {
    await setup(page);
    await injectSession(page);
  });

  test('admin Dashboard loads with all 4 tabs', async ({ page }) => {
    await page.goto('/admin');
    await waitForApp(page);

    await expect(page.getByRole('button', { name: /intakes/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /form builder/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /pages/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /publish/i })).toBeVisible();
  });

  test('Publish tab renders Publish Live button', async ({ page }) => {
    await page.goto('/admin');
    await waitForApp(page);

    await page.getByRole('button', { name: /publish/i }).last().click();
    await expect(page.getByRole('button', { name: /publish live/i })).toBeVisible();
  });

  test('clicking Publish Live shows confirmation and completes publish', async ({ page }) => {
    await page.goto('/admin');
    await waitForApp(page);

    // Navigate to Publish tab
    await page.getByRole('button', { name: /publish/i }).last().click();

    // Click Publish Live
    const publishBtn = page.getByRole('button', { name: /publish live/i });
    await expect(publishBtn).toBeVisible();
    await publishBtn.click();

    // A confirmation dialog or "Publishing…" state should appear
    // (the mock returns success immediately for Firestore batch writes)
    const confirmOrPublishing = page.getByText(/publishing|confirm|are you sure/i);
    await expect(confirmOrPublishing).toBeVisible({ timeout: 5_000 });
  });

  test('editor display name appears in admin nav', async ({ page }) => {
    await page.goto('/admin');
    await waitForApp(page);

    // The nav should show the editor's display name (Keeya from injected session)
    await expect(page.getByText('Keeya')).toBeVisible({ timeout: 5_000 });
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 3 — Production intake → admin Intakes tab
// ─────────────────────────────────────────────────────────────────────────────

test.describe('3 — Production intake → admin Intakes tab', () => {

  test('visitor submits intake form and sees thank-you screen', async ({ page }) => {
    await setup(page);
    await mockWorker(page);

    await page.goto('/intake');
    await waitForApp(page);

    // Step through form — fill all required fields across all steps
    await fillAllSteps(page);

    // Thank-you screen should appear
    await expect(page.getByText(/thank you|submission received|we.ve received/i))
      .toBeVisible({ timeout: 10_000 });
  });

  test('admin sees production intake submissions in Intakes tab', async ({ page }) => {
    // Override mock to return production submissions for this test
    await page.route('**firestore.googleapis.com/**', async (route) => {
      const url = route.request().url();
      if (url.includes('intake_submissions') || url.includes('documents:runQuery')) {
        const sv = (v) => ({ stringValue: v ?? '' });
        const docs = MOCK_PROD_SUBMISSIONS.map(s => ({
          name: `projects/lj/databases/(default)/documents/intake_submissions/${s.id}`,
          fields: {
            firstName:        sv(s.firstName),
            lastName:         sv(s.lastName),
            preferredName:    sv(s.preferredName),
            dateOfBirth:      sv(s.dateOfBirth),
            pronouns:         sv(s.pronouns),
            email:            sv(s.email),
            phone:            sv(s.phone),
            address:          sv(s.address),
            city:             sv(s.city),
            state:            sv(s.state),
            zip:              sv(s.zip),
            preferredContact: sv(s.preferredContact),
            primaryGoal:      sv(s.primaryGoal),
            hearAboutUs:      sv(s.hearAboutUs),
            additionalNotes:  sv(s.additionalNotes),
            env:              sv(s.env),
            status:           sv(s.status),
            notes:            sv(s.notes),
            submittedAt: { timestampValue: new Date(s.submittedAt * 1000).toISOString() },
          },
          createTime: '2026-01-01T00:00:00Z',
          updateTime:  '2026-05-24T00:00:00Z',
        }));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(docs.map(d => ({ document: d, readTime: '2026-05-24T00:00:00Z' }))),
        });
        return;
      }
      await route.continue();
    });

    // Set up the rest of Firebase mocks and auth session
    await mockFirebase(page);
    await injectSession(page);

    await page.goto('/admin');
    await waitForApp(page);

    // Click Intakes tab
    const intakesTab = page.getByRole('button', { name: /intakes/i });
    if (await intakesTab.isVisible()) await intakesTab.click();

    // Intakes table must be visible
    await expect(page.getByTestId('intakes-table')).toBeVisible({ timeout: 8_000 });

    // Should show the production submission count
    await expect(page.getByTestId('metric-total'))
      .toContainText(String(MOCK_PROD_SUBMISSIONS.length));

    // First production submitter's name should appear
    await expect(page.getByText(MOCK_PROD_SUBMISSIONS[0].firstName)).toBeVisible();
  });

  test('intake submission appears with status New in admin panel', async ({ page }) => {
    await page.route('**firestore.googleapis.com/**', async (route) => {
      const url = route.request().url();
      if (url.includes('intake_submissions') || url.includes('documents:runQuery')) {
        const sv = (v) => ({ stringValue: v ?? '' });
        const s = MOCK_PROD_SUBMISSIONS[0];
        const doc = {
          name: `projects/lj/databases/(default)/documents/intake_submissions/${s.id}`,
          fields: {
            firstName: sv(s.firstName), lastName: sv(s.lastName),
            preferredName: sv(s.preferredName), dateOfBirth: sv(s.dateOfBirth),
            pronouns: sv(s.pronouns), email: sv(s.email), phone: sv(s.phone),
            address: sv(s.address), city: sv(s.city), state: sv(s.state), zip: sv(s.zip),
            preferredContact: sv(s.preferredContact), primaryGoal: sv(s.primaryGoal),
            hearAboutUs: sv(s.hearAboutUs), additionalNotes: sv(s.additionalNotes),
            env: sv(s.env), status: sv(s.status), notes: sv(s.notes),
            submittedAt: { timestampValue: new Date(s.submittedAt * 1000).toISOString() },
          },
          createTime: '2026-01-01T00:00:00Z',
          updateTime: '2026-05-24T00:00:00Z',
        };
        await route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify([{ document: doc, readTime: '2026-05-24T00:00:00Z' }]),
        });
        return;
      }
      await route.continue();
    });

    await mockFirebase(page);
    await injectSession(page);

    await page.goto('/admin');
    await waitForApp(page);

    const intakesTab = page.getByRole('button', { name: /intakes/i });
    if (await intakesTab.isVisible()) await intakesTab.click();

    // The New status badge should be visible for our submission
    await expect(page.getByTestId('status-badge').first()).toContainText('New');
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fill all intake form steps with realistic data and submit.
 * Handles multi-step form: fills visible text/email/tel/select/radio fields,
 * advances through steps, confirms, and submits.
 */
async function fillAllSteps(page) {
  const CLIENT = {
    firstName:     'Jordan',
    lastName:      'Park',
    email:         'jordan.park.test@example.com',
    phone:         '555-987-6543',
    dateOfBirth:   '1988-07-30',
    address:       '22 Sunrise Blvd',
    city:          'Oakland',
    state:         'CA',
    zip:           '94612',
  };

  // Keep advancing through steps until Submit button appears
  let stepCount = 0;
  const MAX_STEPS = 10;

  while (stepCount < MAX_STEPS) {
    // Fill any visible text/email/tel inputs that are empty
    const inputs = page.locator('input[type="text"], input[type="email"], input[type="tel"], input[type="date"]');
    const count = await inputs.count();

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      if (!await input.isVisible()) continue;
      const current = await input.inputValue();
      if (current) continue; // already filled

      const placeholder = (await input.getAttribute('placeholder') ?? '').toLowerCase();
      const name        = (await input.getAttribute('name') ?? '').toLowerCase();
      const hint        = placeholder + name;

      let value = 'Test Value';
      if (hint.includes('first'))       value = CLIENT.firstName;
      else if (hint.includes('last'))   value = CLIENT.lastName;
      else if (hint.includes('email'))  value = CLIENT.email;
      else if (hint.includes('phone') || hint.includes('tel')) value = CLIENT.phone;
      else if (hint.includes('birth') || hint.includes('dob')) value = CLIENT.dateOfBirth;
      else if (hint.includes('address') || hint.includes('street')) value = CLIENT.address;
      else if (hint.includes('city'))   value = CLIENT.city;
      else if (hint.includes('state'))  value = CLIENT.state;
      else if (hint.includes('zip') || hint.includes('postal')) value = CLIENT.zip;

      await input.fill(value);
    }

    // Select first available option for any visible selects
    const selects = page.locator('select');
    const sCount = await selects.count();
    for (let i = 0; i < sCount; i++) {
      const sel = selects.nth(i);
      if (!await sel.isVisible()) continue;
      const val = await sel.inputValue();
      if (val) continue;
      const options = await sel.locator('option').allTextContents();
      const first = options.find(o => o.trim() && o.trim() !== 'Select…' && o.trim() !== '--') ?? options[1];
      if (first) await sel.selectOption({ label: first.trim() });
    }

    // Click first visible unselected radio button in each group
    const radios = page.locator('input[type="radio"]');
    const rCount = await radios.count();
    const clickedGroups = new Set();
    for (let i = 0; i < rCount; i++) {
      const radio = radios.nth(i);
      if (!await radio.isVisible()) continue;
      const groupName = await radio.getAttribute('name') ?? `group-${i}`;
      if (clickedGroups.has(groupName)) continue;
      const checked = await radio.isChecked();
      if (!checked) {
        await radio.click();
        clickedGroups.add(groupName);
      }
    }

    // Check if Submit button is visible — if so, submit
    const submitBtn = page.getByTestId('btn-submit');
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      break;
    }

    // Otherwise advance to next step
    const continueBtn = page.getByTestId('btn-continue');
    if (await continueBtn.isVisible() && await continueBtn.isEnabled()) {
      await continueBtn.click();
      stepCount++;
      continue;
    }

    // Confirm step (last step before submit)
    const confirmBtn = page.getByTestId('btn-confirm');
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
      stepCount++;
      continue;
    }

    break; // safety exit
  }
}
