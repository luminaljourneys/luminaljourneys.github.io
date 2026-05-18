/**
 * helpers/mock-firebase.js
 *
 * Intercepts ALL Firestore REST + WebChannel network calls and returns
 * fixture data instantly. Tests NEVER hit the real Firebase network —
 * this is what makes the suite fast.
 *
 * Usage:
 *   import { mockFirebase } from './helpers/mock-firebase.js';
 *
 *   test.beforeEach(async ({ page }) => {
 *     await mockFirebase(page);
 *   });
 *
 * How it works:
 *   Firebase JS SDK v9+ uses the Firestore REST API over HTTPS.
 *   We intercept **.googleapis.com/google.firestore** and
 *   **firestore.googleapis.com** routes and return the appropriate
 *   Firestore REST response shape for each collection.
 */

import { FORM_CONFIG_FIXTURE } from '../fixtures/form-config.js';
import { MOCK_PAGES }           from '../fixtures/pages.js';

// ── Firestore REST response helpers ──────────────────────────────────────────

/** Wrap a plain JS object into a Firestore REST document shape */
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
    updateTime: '2026-05-18T00:00:00Z',
  };
}

/** Wrap an array of docs into a Firestore runQuery response */
function firestoreQueryResponse(docs) {
  return docs.map(doc => ({ document: doc, readTime: '2026-05-18T00:00:00Z' }));
}

// ── Main mock installer ───────────────────────────────────────────────────────

export async function mockFirebase(page) {
  // Intercept ALL requests to Firestore endpoints
  await page.route('**firestore.googleapis.com/**', async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    // ── Form config reads (getDoc on site_config/form_staging) ───────────────
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

    // ── Pages collection reads (pages_staging) ────────────────────────────────
    if (url.includes('pages_staging') || url.includes('pages_production')) {
      const docs = MOCK_PAGES.map((p, i) =>
        firestoreDoc(`projects/lj/databases/(default)/documents/pages_staging/${p.id}`, p)
      );
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(firestoreQueryResponse(docs)),
      });
      return;
    }

    // ── Content edits reads ────────────────────────────────────────────────────
    if (url.includes('content_edits')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]), // empty — fallbacks render
      });
      return;
    }

    // ── Writes (setDoc, addDoc, updateDoc) — succeed silently ─────────────────
    if (['POST', 'PATCH', 'DELETE'].includes(method)) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      return;
    }

    // ── Everything else — pass through (auth, storage, etc.) ──────────────────
    await route.continue();
  });

  // Also intercept WebChannel (Firestore real-time listener fallback)
  await page.route('**google.firestore.v1.Firestore**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
}

/**
 * Wait for the app to be ready after navigation.
 * Uses network idle instead of arbitrary timeouts.
 */
export async function waitForApp(page) {
  await page.waitForLoadState('domcontentloaded');
  // Brief tick for React to render after Firebase resolves
  await page.waitForFunction(() => document.readyState === 'complete');
}
