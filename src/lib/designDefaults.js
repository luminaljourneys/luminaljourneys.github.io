/**
 * designDefaults.js — Luminal Journeys
 * Typography design token definitions for the admin Design Controls panel.
 *
 * Unit convention: all sizes stored as pt (points) in Firestore.
 * Rendered as rem via ptToRem(). 1rem = 16px = 12pt at default browser size.
 *
 * Colors stored as hex strings in Firestore, injected as CSS vars on <html>.
 *
 * CSS vars injected on <html> — referenced in components as:
 *   var(--lj-size-display, fallback)
 *   var(--lj-color-display, fallback)
 *   (and so on for each token key)
 */

// ── Conversion helpers ─────────────────────────────────────────────────────────
export const ptToRem = (pt) => +(pt / 12).toFixed(4);   // 12pt = 1rem = 16px
export const remToPt = (rem) => +(rem * 12).toFixed(1);

// ── Token definitions ──────────────────────────────────────────────────────────
// Order reflects visual hierarchy top → bottom on the page.
export const DESIGN_TOKENS = {

  // ── Hero section ─────────────────────────────────────────────────────────────

  display: {
    label:           "Hero Display Heading",
    description:     '"Illuminate your full human potential" — the large homepage headline',
    cssVar:          "--lj-size-display",
    colorCssVar:     "--lj-color-display",
    defaultPt:       84,    // ≈ 7rem / 112px — sits within the responsive clamp range
    defaultColor:    "#172f2d",
    minPt:           48,
    maxPt:           144,
    wcagMinPt:       14,    // display text, large size threshold
    referenceCaption: "The largest text on the site — the headline above the fold. Scales down automatically on smaller screens.",
  },

  tagline: {
    label:           "Hero Tagline",
    description:     'The amber decorative line in the hero section — "GUIDED PSYCHEDELIC SESSIONS…"',
    cssVar:          "--lj-size-tagline",
    colorCssVar:     "--lj-color-tagline",
    defaultPt:       8,     // ≈ 0.67rem / 10.7px
    defaultColor:    "#bf8a3e",  // amber — intentionally warm/gold
    minPt:           6,
    maxPt:           14,
    wcagMinPt:       8,
    referenceCaption: "The uppercase tagline and decorative line above the headline. The amber accent color also appears in the process step numbers.",
  },

  // ── Section content ───────────────────────────────────────────────────────────

  heading: {
    label:           "Headings & Section Titles",
    description:     "Principle headings, process step titles, sub-section headers",
    cssVar:          "--lj-size-heading",
    colorCssVar:     "--lj-color-heading",
    defaultPt:       26,    // ≈ 2.17rem / 34.7px
    defaultColor:    "#172f2d",
    minPt:           14,
    maxPt:           72,
    wcagMinPt:       14,    // WCAG large text threshold
    referenceCaption: "The bold section title — 'Competence without compromise'. The italic Roman numeral 'I' to the left is a separate decorative style and is not controlled by this slider.",
  },

  body: {
    label:           "Body & Paragraphs",
    description:     "Hero text, section body copy, principle descriptions",
    cssVar:          "--lj-size-body",
    colorCssVar:     "--lj-color-body",
    defaultPt:       13,    // ≈ 1.08rem / 17.3px
    defaultColor:    "#172f2d",
    minPt:           7,
    maxPt:           22,
    wcagMinPt:       12,    // WCAG AA — normal text legibility floor
    referenceCaption: "The paragraph text throughout the site — the main body copy in the hero section and the descriptions beneath each principle.",
  },

  // ── Navigation & UI ───────────────────────────────────────────────────────────

  nav: {
    label:           "Navigation Links",
    description:     '"Our Practice", "The Process" — top nav and footer page links',
    cssVar:          "--lj-size-nav",
    colorCssVar:     "--lj-color-nav",
    defaultPt:       10,    // ≈ 0.83rem / 13.3px
    defaultColor:    "#172f2d",
    minPt:           7,
    maxPt:           16,
    wcagMinPt:       9,     // 12px minimum for interactive touch targets
    referenceCaption: "The navigation links in the top menu bar and the footer.",
  },

  form: {
    label:           "Form Labels & Inputs",
    description:     "Intake form field labels, placeholders, and input text",
    cssVar:          "--lj-size-form",
    colorCssVar:     "--lj-color-form",
    defaultPt:       11,    // ≈ 0.92rem / 14.7px
    defaultColor:    "#172f2d",
    minPt:           7,
    maxPt:           18,
    wcagMinPt:       10,
    referenceCaption: "Labels and input fields on the intake form (/intake).",
  },

  micro: {
    label:           "Micro Labels",
    description:     "Uppercase section markers, stats labels, 'Forms for Participation' caption",
    cssVar:          "--lj-size-micro",
    colorCssVar:     "--lj-color-micro",
    defaultPt:       9,     // ≈ 0.75rem / 12px
    defaultColor:    "#89a99e",
    minPt:           6,
    maxPt:           14,
    wcagMinPt:       8,
    referenceCaption: "Small uppercase labels — the stats captions, section dividers ('OUR PRACTICE'), and the 'Forms for Participation' label beneath the navigation button.",
  },

};

// ── Default pt value map ───────────────────────────────────────────────────────
export function defaultPtValues() {
  return Object.fromEntries(
    Object.entries(DESIGN_TOKENS).map(([k, v]) => [k, v.defaultPt])
  );
}

// ── Default color map ──────────────────────────────────────────────────────────
export function defaultColors() {
  return Object.fromEntries(
    Object.entries(DESIGN_TOKENS).map(([k, v]) => [k, v.defaultColor])
  );
}

// ── CSS var injection ──────────────────────────────────────────────────────────
// Applies typography tokens as CSS custom properties on <html>.
// Called on page load and whenever tokens change.
//
// typography: { display: 84, body: 13, ... }   (pt values)
// colors:     { display: '#172f2d', ... }       (hex strings)
export function applyDesignTokens(typography = {}, colors = {}) {
  const root = document.documentElement;
  Object.entries(DESIGN_TOKENS).forEach(([key, def]) => {
    // Size
    const pt = typography?.[key] ?? def.defaultPt;
    root.style.setProperty(def.cssVar, `${ptToRem(pt)}rem`);
    // Color
    const color = colors?.[key] ?? def.defaultColor;
    root.style.setProperty(def.colorCssVar, color);
  });
}
