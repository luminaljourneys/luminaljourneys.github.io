/**
 * fixtures/form-config.js
 * Mock Firestore form config — returned instantly by mock-firebase.js
 * Mirrors the DEFAULT_FIELDS / DEFAULT_STEPS shape from useFormConfig.js
 */

export const MOCK_STEPS = [
  { id: 'step-0', title: 'Personal Info',  description: "Let's start with the basics." },
  { id: 'step-1', title: 'Contact Info',   description: 'How can we reach you?' },
  { id: 'step-2', title: 'About You',      description: 'A little more about you.' },
];

export const MOCK_FIELDS = [
  // Step 0
  { id: 'f-firstName',     step: 0, type: 'text',     name: 'firstName',        label: 'First Name',      placeholder: 'First name',          required: true,  halfWidth: true,  deletable: false, order: 1, options: [] },
  { id: 'f-lastName',      step: 0, type: 'text',     name: 'lastName',         label: 'Last Name',       placeholder: 'Last name',           required: true,  halfWidth: true,  deletable: false, order: 2, options: [] },
  { id: 'f-preferredName', step: 0, type: 'text',     name: 'preferredName',    label: 'Preferred Name',  placeholder: 'What should we call you?', required: false, halfWidth: false, deletable: true, order: 3, options: [] },
  { id: 'f-dob',           step: 0, type: 'date',     name: 'dateOfBirth',      label: 'Date of Birth',   placeholder: '',                    required: true,  halfWidth: false, deletable: false, order: 4, options: [] },
  { id: 'f-pronouns',      step: 0, type: 'select',   name: 'pronouns',         label: 'Pronouns',        placeholder: 'Select pronouns',     required: false, halfWidth: false, deletable: true,  order: 5, options: ['She / Her', 'He / Him', 'They / Them', 'Prefer not to say'] },
  // Step 1
  { id: 'f-email',         step: 1, type: 'email',    name: 'email',            label: 'Email Address',   placeholder: 'your@email.com',      required: true,  halfWidth: false, deletable: false, order: 1, options: [] },
  { id: 'f-phone',         step: 1, type: 'tel',      name: 'phone',            label: 'Phone Number',    placeholder: '+1 (555) 000-0000',   required: false, halfWidth: false, deletable: true,  order: 2, options: [] },
  // Step 2
  { id: 'f-goal',          step: 2, type: 'select',   name: 'primaryGoal',      label: 'Primary Goal',    placeholder: 'Select your goal',    required: true,  halfWidth: false, deletable: false, order: 1, options: ['Stress & Anxiety Management', 'Sleep Improvement', 'General Wellness'] },
  { id: 'f-notes',         step: 2, type: 'textarea', name: 'additionalNotes',  label: 'Additional Notes',placeholder: 'Anything to share…',  required: false, halfWidth: false, deletable: true,  order: 2, options: [] },
];

export const FORM_CONFIG_FIXTURE = { steps: MOCK_STEPS, fields: MOCK_FIELDS };
