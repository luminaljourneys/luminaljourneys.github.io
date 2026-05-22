/**
 * fixtures/intake-submissions.js — Luminal Journeys
 *
 * Mock intake_submissions documents used by admin-intakes.spec.js.
 * Mirrors the shape written by IntakePage.jsx handleSubmit.
 *
 * submittedAt is stored as a Firestore Timestamp in production;
 * the mock helper in mock-firebase.js wraps it as integerValue seconds
 * so the client SDK converts it back to a Date correctly.
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
