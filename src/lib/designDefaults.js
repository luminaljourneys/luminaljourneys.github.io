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
 *   var(--lj-size-body, fallback)
 *   var(--lj-color-body, fallback)
 */

// ── Conversion helpers ─────────────────────────────────────────────────────────
export const ptToRem = (pt) => +(pt / 12).toFixed(4);   // 12pt = 1rem = 16px
export const remToPt = (rem) => +(rem * 12).toFixed(1);

// ── Token definitions ──────────────────────────────────────────────────────────
export const DESIGN_TOKENS = {
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
    referenceImage:  "/design-reference/ref-body.png",
    referenceCaption: "The paragraph text on the right — \"The psychedelic industry is not regulated…\"",
  },
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
    referenceImage:  "/design-reference/ref-heading.png",
    referenceCaption: "The bold heading — \"Competence without compromise\"",
  },
  nav: {
    label:           "Navigation Links",
    description:     '"Our Practice", "The Process" — top nav page links',
    cssVar:          "--lj-size-nav",
    colorCssVar:     "--lj-color-nav",
    defaultPt:       10,    // ≈ 0.83rem / 13.3px
    defaultColor:    "#172f2d",
    minPt:           7,
    maxPt:           16,
    wcagMinPt:       9,     // 12px minimum for interactive touch targets
    referenceImage:  "/design-reference/ref-nav.png",
    referenceCaption: "The navigation links at the top of every page",
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
    referenceImage:  null,  // add /design-reference/ref-form.png when screenshot is ready
    referenceCaption: "Labels and text fields on the intake form page (/intake)",
  },
  micro: {
    label:           "Micro Labels",
    description:     "Uppercase section markers, stats labels, footer text",
    cssVar:          "--lj-size-micro",
    colorCssVar:     "--lj-color-micro",
    defaultPt:       9,     // ≈ 0.75rem / 12px
    defaultColor:    "#89a99e",
    minPt:           6,
    maxPt:           14,
    wcagMinPt:       8,
    referenceImage:  "/design-reference/ref-micro.png",
    referenceCaption: "\"COMBINED EXPERIENCE IN WELLNESS & HEALTHCARE\" — the small caps labels",
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
// typography: { body: 13, heading: 26, ... }   (pt values)
// colors:     { body: '#172f2d', ... }          (hex strings)
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
