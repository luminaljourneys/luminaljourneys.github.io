/**
 * designDefaults.js — Luminal Journeys
 * Typography design token definitions for the admin Design Controls panel.
 *
 * Unit convention: all sizes stored as pt (points) in Firestore.
 * Rendered as rem via ptToRem(). 1rem = 16px = 12pt at default browser size.
 *
 * CSS vars injected on <html> — referenced in components as var(--lj-size-body, fallback).
 */

// ── Conversion helpers ─────────────────────────────────────────────────────────
export const ptToRem = (pt) => +(pt / 12).toFixed(4);   // 12pt = 1rem = 16px
export const remToPt = (rem) => +(rem * 12).toFixed(1);

// ── Token definitions ──────────────────────────────────────────────────────────
export const DESIGN_TOKENS = {
  body: {
    label:       "Body & Paragraphs",
    description: "Hero text, section body copy, principle descriptions",
    cssVar:      "--lj-size-body",
    defaultPt:   13,    // ≈ 1.08rem / 17.3px
    minPt:       7,
    maxPt:       22,
    wcagMinPt:   12,    // WCAG AA — normal text legibility floor
  },
  heading: {
    label:       "Headings & Section Titles",
    description: "Principle headings, process step titles, sub-section headers",
    cssVar:      "--lj-size-heading",
    defaultPt:   26,    // ≈ 2.17rem / 34.7px
    minPt:       14,
    maxPt:       72,
    wcagMinPt:   14,    // WCAG large text threshold
  },
  nav: {
    label:       "Navigation Links",
    description: "\"Our Practice\", \"The Process\" — top nav page links",
    cssVar:      "--lj-size-nav",
    defaultPt:   10,    // ≈ 0.83rem / 13.3px
    minPt:       7,
    maxPt:       16,
    wcagMinPt:   9,     // 12px minimum for interactive touch targets
  },
  form: {
    label:       "Form Labels & Inputs",
    description: "Intake form field labels, placeholders, and input text",
    cssVar:      "--lj-size-form",
    defaultPt:   11,    // ≈ 0.92rem / 14.7px
    minPt:       7,
    maxPt:       18,
    wcagMinPt:   10,
  },
  micro: {
    label:       "Micro Labels",
    description: "Uppercase section markers, stats labels, footer text",
    cssVar:      "--lj-size-micro",
    defaultPt:   9,     // ≈ 0.75rem / 12px
    minPt:       6,
    maxPt:       14,
    wcagMinPt:   8,
  },
};

// ── Default pt value map ───────────────────────────────────────────────────────
export function defaultPtValues() {
  return Object.fromEntries(
    Object.entries(DESIGN_TOKENS).map(([k, v]) => [k, v.defaultPt])
  );
}

// ── CSS var injection ──────────────────────────────────────────────────────────
// Applies typography tokens as CSS custom properties on <html>.
// Called on page load and whenever tokens change.
export function applyDesignTokens(typography) {
  const root = document.documentElement;
  Object.entries(DESIGN_TOKENS).forEach(([key, def]) => {
    const pt = typography?.[key] ?? def.defaultPt;
    root.style.setProperty(def.cssVar, `${ptToRem(pt)}rem`);
  });
}
