/**
 * fixtures/pages.js
 * Mock Firestore pages collection — returned instantly by mock-firebase.js
 */

export const MOCK_PAGES = [
  { id: 'about',    title: 'About',    subheading: 'Our story', body: 'We are Luminal Journeys.',  showInNav: true,  order: 0 },
  { id: 'services', title: 'Services', subheading: 'What we offer', body: 'We offer holistic care.', showInNav: true,  order: 1 },
  { id: 'faq',      title: 'FAQ',      subheading: 'Common questions', body: 'Answers here.',        showInNav: false, order: 2 },
];
