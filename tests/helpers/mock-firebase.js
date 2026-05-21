/**
 * helpers/mock-firebase.js
 *
 * Intercepts ALL Firestore REST + Firebase Auth identity toolkit calls.
 * Tests NEVER hit the real Firebase network — instant, deterministic.
 *
 * Mocked surfaces:
 *   - Firestore (site_config/*, pages_*, content_edits_*, writes)
 *   - Firebase Auth OOB codes (magic link sendSignInLinkToEmail)
 *
 * Usage:
 *   import { mockFirebase, waitForApp } from './helpers/mock-firebase.js';
 *   test.beforeEach(async ({ page }) => { await mockFirebase(page); });
 */

import { FORM_CONFIG_FIXTURE } from '../fixtures/form-config.js';
import { MOCK_PAGES }           from '../fixtures/pages.js';

// ── Firestore REST response helpers ──────────────────────────────────────────

function firestoreDoc(name, fields) {
  const wrap = (v) => {
    if (typeof v === 'string')  return { stringValue: v };
    if (typeof v === 'boolean') return { booleanValue: v };
    if (typeof v === 'number')  return { integerValue: String(v) };
    if (Array.isArray(v))       return { arrayValue: { values: v.map(wrap) } };
    if (v && typeof v === 'object') {
      return { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, fv]) => [k, wrap(fv)])) } };
    }
    return { nullValue: null };
  };
  return {
    name,
    fields: Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, wrap(v)])),
    createTime: '2026-01-01T00:00:00Z',
    updateTime: '2026-05-19T00:00:00Z',
  };
}

function firestoreQueryResponse(docs) {
  return docs.map(doc => ({ document: doc, readTime: '2026-05-19T00:00:00Z' }));
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_AUTHORIZED_EDITORS = {
  emails: [
    'hi@keeya.nl',
    'keeya@springsparrowhousing.com',
    'wouter@keijser.com',
    'dpendragon@pacbell.net',
  ],
};

// ── Main mock installer ───────────────────────────────────────────────────────

/**
 * @param {import('@playwright/test').Page} page
 * @param {{ writeResult?: 'success' | 'error' }} [opts]
 *   writeResult — controls window.__pw_intake_result injected into the page:
 *   'success' (default): intake submit resolves, thank-you screen appears.
 *   'error': intake submit throws, error message appears.
 */
export async function mockFirebase(page, { writeResult = 'success' } = {}) {
  // Inject the Playwright intake test hook before the page script runs.
  // IntakePage.jsx checks window.__pw_intake_result to bypass the Firebase
  // WebChannel write (which cannot be intercepted at the REST layer).
  await page.addInitScript((result) => {
    window.__pw_intake_result = result;
  }, writeResult);

  // ── Firebase Auth: magic link OOB send ───────────────────────────────────
  await page.route('**identitytoolkit.googleapis.com/**sendOobCode**', async (route) => {
    const body = (() => { try { return route.request().postDataJSON(); } catch { return {}; } })();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ email: body?.email ?? 'test@example.com' }),
    });
  });

  // ── Firebase Auth: other identity toolkit calls ───────────────────────────
  await page.route('**identitytoolkit.googleapis.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ idToken: 'mock-token', email: 'test@example.com', localId: 'mock-uid' }),
    });
  });

  // ── Firestore ─────────────────────────────────────────────────────────────
  await page.route('**firestore.googleapis.com/**', async (route) => {
    const url    = route.request().url();
    const method = route.request().method();

    // authorized_editors — must be checked BEFORE the generic site_config catch
    if (url.includes('authorized_editors')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(firestoreDoc(
          'projects/lj/databases/(default)/documents/site_config/authorized_editors',
          MOCK_AUTHORIZED_EDITORS,
        )),
      });
      return;
    }

    // site_config/meta
    if (url.includes('/meta')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(firestoreDoc(
          'projects/lj/databases/(default)/documents/site_config/meta',
          { lastSavedBy: { displayName: 'Admin', email: 'admin' } },
        )),
      });
      return;
    }

    // site_config (form_staging / form_production)
    if (url.includes('site_config') && (method === 'GET' || method === 'POST')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(firestoreDoc(
          'projects/lj/databases/(default)/documents/site_config/form_staging',
          FORM_CONFIG_FIXTURE,
        )),
      });
      return;
    }

    // pages collection
    if (url.includes('pages_staging') || url.includes('pages_production')) {
      const docs = MOCK_PAGES.map(p =>
        firestoreDoc(`projects/lj/databases/(default)/documents/pages_staging/${p.id}`, p)
      );
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(firestoreQueryResponse(docs)),
      });
      return;
    }

    // content edits
    if (url.includes('content_edits')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
      return;
    }

    // writes — return a valid Firestore document shape so addDoc/setDoc resolve
    if (['POST', 'PATCH', 'DELETE'].includes(method)) {
      // Extract a plausible collection name from the URL for the mock name field
      const seg = url.split('/documents/')[1]?.split('?')[0] ?? 'mock-collection/mock-doc';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          name: `projects/lj/databases/(default)/documents/${seg}`,
          fields: {},
          createTime: new Date().toISOString(),
          updateTime: new Date().toISOString(),
        }),
      });
      return;
    }

    // everything else (auth handshake, storage)
    await route.continue();
  });

  // WebChannel (Firestore real-time listener fallback)
  await page.route('**google.firestore.v1.Firestore**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
}

export async function waitForApp(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(() => document.readyState === 'complete');
}
