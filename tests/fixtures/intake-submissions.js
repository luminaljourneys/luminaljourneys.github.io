/**
 * fixtures/intake-submissions.js — Luminal Journeys
 *
 * Mock intake_submissions documents used by admin-intakes.spec.js and
 * e2e-workflow.spec.js. Mirrors the shape written by IntakePage.jsx handleSubmit.
 *
 * submittedAt is stored as a Firestore Timestamp in production;
 * the mock helper in mock-firebase.js wraps it as integerValue seconds
 * so the client SDK converts it back to a Date correctly.
 *
 * MOCK_SUBMISSIONS      — env:'staging'  (used by admin tests running in staging env)
 * MOCK_PROD_SUBMISSIONS — env:'production' (used by E2E workflow tests)
 */

export const MOCK_SUBMISSIONS = [
  {
    id: 'sub-001',
    firstName: 'Amara',   lastName: 'Osei',   preferredName: 'Amara',
    dateOfBirth: '1990-04-12', pronouns: 'She / Her',
    email: 'amara.osei@example.com', phone: '555-234-5678',
    address: '123 Wellness Way', city: 'San Francisco', state: 'CA', zip: '94102',
    preferredContact: 'Email',
    primaryGoal: 'Stress & Anxiety Management',
    hearAboutUs: 'Friend or Family',
    additionalNotes: 'Looking forward to starting my wellness journey.',
    env: 'staging',
    status: 'New',
    notes: '',
    // epoch seconds for a Firestore Timestamp mock (2026-03-13)
    submittedAt: 1773446400,
  },
  {
    id: 'sub-002',
    firstName: 'Lucia',   lastName: 'Vega',   preferredName: '',
    dateOfBirth: '1985-09-22', pronouns: 'She / Her',
    email: 'lucia.vega@example.com', phone: '555-111-2222',
    address: '456 Oak Ave', city: 'Berkeley', state: 'CA', zip: '94710',
    preferredContact: 'Phone',
    primaryGoal: 'Hormonal Balance',
    hearAboutUs: 'Google Search',
    additionalNotes: '',
    env: 'staging',
    status: 'Contacted',
    notes: 'Called on Tuesday.',
    submittedAt: 1773360000,
  },
  {
    id: 'sub-003',
    firstName: 'Priya',   lastName: 'Nair',   preferredName: 'Pri',
    dateOfBirth: '1993-01-05', pronouns: 'She / Her',
    email: 'priya.nair@example.com', phone: '555-333-4444',
    address: '789 Elm Blvd', city: 'Oakland', state: 'CA', zip: '94601',
    preferredContact: 'Text',
    primaryGoal: 'Sleep Improvement',
    hearAboutUs: 'Social Media',
    additionalNotes: 'Have tried melatonin.',
    env: 'staging',
    status: 'Scheduled',
    notes: '',
    submittedAt: 1773273600,
  },
];

// ── Production submissions — env:'production' ─────────────────────────────────
// Used by e2e-workflow.spec.js to verify the admin Intakes tab shows
// production data when the production bundle is served.

export const MOCK_PROD_SUBMISSIONS = [
  {
    id: 'prod-001',
    firstName: 'Jordan',  lastName: 'Park',    preferredName: 'Jordan',
    dateOfBirth: '1988-07-30', pronouns: 'They / Them',
    email: 'jordan.park@example.com', phone: '555-987-6543',
    address: '22 Sunrise Blvd', city: 'Oakland', state: 'CA', zip: '94612',
    preferredContact: 'Email',
    primaryGoal: 'Stress & Anxiety Management',
    hearAboutUs: 'Instagram',
    additionalNotes: 'Interested in integrative care.',
    env: 'production',
    status: 'New',
    notes: '',
    submittedAt: 1773532800, // 2026-03-14
  },
  {
    id: 'prod-002',
    firstName: 'Maya',    lastName: 'Chen',    preferredName: 'Maya',
    dateOfBirth: '1995-02-18', pronouns: 'She / Her',
    email: 'maya.chen@example.com', phone: '555-456-7890',
    address: '88 Harbor St', city: 'San Francisco', state: 'CA', zip: '94107',
    preferredContact: 'Phone',
    primaryGoal: 'Hormonal Balance',
    hearAboutUs: 'Friend or Family',
    additionalNotes: '',
    env: 'production',
    status: 'New',
    notes: '',
    submittedAt: 1773446400, // 2026-03-13
  },
];
