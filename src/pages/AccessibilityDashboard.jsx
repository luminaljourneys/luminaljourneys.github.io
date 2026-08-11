/**
 * AccessibilityDashboard.jsx — Luminal Journeys
 *
 * SonarCloud-style Accessibility & D&I Audit dashboard.
 * Scans any page URL using axe-core (WCAG 2.2 AA) + automated D&I DOM checks.
 *
 * Routes:
 *   admin.luminaljourneys.com/admin/accessibility  (admin domain)
 *   luminaljourneys.com/admin/accessibility         (redirects to admin domain)
 *
 * axe-core is dynamically imported — zero impact on main bundle.
 * D&I checks run against the hidden iframe document — no API calls needed.
 */

import { useState, useCallback, useRef } from "react";
import { navigate } from "../App.jsx";

// ── Pages available to audit ──────────────────────────────────────────────────
const AUDIT_PAGES = [
  { id: "landing", label: "Landing Page", path: "/" },
  { id: "intake",  label: "Intake Form",  path: "/intake" },
];

// ── Brand ──────────────────────────────────────────────────────────────────────
const B = {
  deep:   "#172f2d",
  teal:   "#224e4a",
  sage:   "#89a99e",
  sand:   "#e6ddd0",
  amber:  "#bf8a3e",
  paper:  "#F9F8F6",
  card:   "#F4F3F1",
  border: "#e5e7eb",
  muted:  "rgba(23,47,45,0.45)",
  rule:   "rgba(23,47,45,0.08)",
};

// Impact → colour mapping
const IMPACT_COLOR = {
  critical: "#dc2626",
  serious:  "#ea580c",
  moderate: "#d97706",
  minor:    "#65a30d",
};

// WCAG tag → readable label
const WCAG_TAG_LABEL = {
  "wcag2a":   "2.0 A",
  "wcag2aa":  "2.0 AA",
  "wcag21a":  "2.1 A",
  "wcag21aa": "2.1 AA",
  "wcag22aa": "2.2 AA",
};

// ── D&I checklist definition ──────────────────────────────────────────────────
const DI_CHECKLIST = [
  {
    category: "Inclusive Language",
    items: [
      { id: "pronouns",        label: "Intake form includes pronoun field (they/them, he/him, she/her, custom)" },
      { id: "gendered",        label: 'No gendered salutations ("ladies", "guys", "he or she")' },
      { id: "ableist",         label: 'No ableist language ("crazy", "lame", "blind to", "stands alone")' },
      { id: "identity-first",  label: "Uses identity-first language option where appropriate" },
    ],
  },
  {
    category: "Representation",
    items: [
      { id: "imagery-diversity", label: "Imagery reflects diverse individuals and family structures" },
      { id: "alt-text",          label: "All images have descriptive, meaningful alt text" },
      { id: "lgbtq-affirming",   label: "Copy explicitly affirms LGBTQ+ clients if applicable to scope" },
    ],
  },
  {
    category: "Cognitive Accessibility",
    items: [
      { id: "reading-level",  label: "Body copy at ≤ 8th grade reading level (Flesch-Kincaid)" },
      { id: "short-para",     label: "Paragraphs ≤ 3 sentences; no walls of text" },
      { id: "plain-language", label: "Clinical/insurance terms are explained in plain language" },
      { id: "error-guidance", label: "Form error messages describe what went wrong and how to fix it" },
    ],
  },
  {
    category: "Sensory & Motor",
    items: [
      { id: "keyboard",     label: "All interactive elements reachable and operable via keyboard alone" },
      { id: "touch-target", label: "Touch targets ≥ 44×44 CSS pixels (WCAG 2.5.5)" },
      { id: "motion",       label: "Animations respect prefers-reduced-motion" },
      { id: "color-alone",  label: "Color is never the sole means of conveying information" },
    ],
  },
  {
    category: "Technical & Structural",
    items: [
      { id: "lang-attr",     label: '<html lang="en"> (or appropriate locale) is present' },
      { id: "skip-link",     label: "Skip-to-content link present for screen readers" },
      { id: "page-title",    label: "Every page has a unique, descriptive <title>" },
      { id: "heading-order", label: "Headings follow logical order (h1 → h2 → h3)" },
    ],
  },
];

// ── Syllable counter (Flesch-Kincaid approximation) ──────────────────────────
function countSyllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (word.length <= 3) return 1;
  return (
    word
      .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "")
      .replace(/^y/, "")
      .match(/[aeiouy]{1,2}/g)?.length ?? 1
  );
}

// ── Automated D&I DOM checkers ────────────────────────────────────────────────
// Each checker receives the iframe document and returns { status, notes, repairs[] }
// status: "pass" | "fail" | "warning"
const DI_CHECKERS = {
  pronouns: (doc) => {
    const all = [...doc.querySelectorAll("input, select, label, textarea, [placeholder]")];
    const has = all.some(el =>
      /pronoun/i.test(
        [el.textContent, el.placeholder, el.name, el.id, el.getAttribute("aria-label")].join(" ")
      )
    );
    return has
      ? { status: "pass", notes: "Pronoun field detected in the form." }
      : {
          status: "fail",
          notes: "No pronoun field found on this page.",
          repairs: [
            "Add a 'Pronouns' field to the intake form.",
            "Options: She/her · He/him · They/them · Prefer not to say · Custom (text input)",
            "Place it near the name field — it signals inclusion before clients share their story.",
          ],
        };
  },

  gendered: (doc) => {
    const text = doc.body?.innerText ?? "";
    const terms = ["ladies", "guys", "he or she", "his or her", "gentlemen", "you guys", "man-made", "manpower"];
    const hits = terms.filter(w => new RegExp(`\\b${w}\\b`, "i").test(text));
    return hits.length === 0
      ? { status: "pass", notes: "No gendered salutations detected." }
      : {
          status: "fail",
          notes: `Gendered terms found: "${hits.join('", "')}"`,
          repairs: hits.map(h => {
            const alts = { ladies: "everyone / folks", guys: "everyone / folks", "he or she": "they", "his or her": "their", gentlemen: "everyone", "you guys": "you all / everyone", "man-made": "synthetic / artificial", manpower: "workforce / staff" };
            return `Replace "${h}" → "${alts[h.toLowerCase()] || "a gender-neutral alternative"}"`;
          }),
        };
  },

  ableist: (doc) => {
    const text = doc.body?.innerText ?? "";
    const terms = ["crazy", "lame", "blind to", "deaf to", "dumb", "insane", "stupid", "cripple", "idiot", "stands alone", "falls on deaf"];
    const hits = terms.filter(w => new RegExp(`\\b${w.replace(/ /g, "\\s+")}\\b`, "i").test(text));
    return hits.length === 0
      ? { status: "pass", notes: "No ableist language detected." }
      : {
          status: "fail",
          notes: `Potentially ableist terms found: "${hits.join('", "')}"`,
          repairs: [
            "Replace ableist terms with neutral alternatives.",
            "crazy → intense / unexpected   |   lame → disappointing   |   dumb → unclear",
            "See consciousstyleguide.com for a full reference.",
          ],
        };
  },

  "identity-first": (doc) => {
    const text = doc.body?.innerText ?? "";
    const pf = /person (with|who has|living with)/i.test(text);
    const id = /(autistic|disabled|deaf|blind|neurodivergent) (person|individual|client)/i.test(text);
    if (!pf && !id) {
      return {
        status: "warning",
        notes: "No disability language detected on this page — nothing to flag.",
        repairs: [
          "When writing about disability, preferences vary by community.",
          "Autistic community often prefers identity-first: 'autistic person'.",
          "Many others prefer person-first: 'person with a disability'.",
          "Best practice: offer both, or follow the individual's preference.",
        ],
      };
    }
    return { status: "pass", notes: "Disability language detected — review manually to confirm it follows client preferences." };
  },

  "imagery-diversity": (doc) => {
    const imgs = [...doc.querySelectorAll("img")];
    return {
      status: "warning",
      notes: `${imgs.length} image(s) found. Visual diversity cannot be determined automatically.`,
      repairs: [
        "Review all images for diversity of race, ethnicity, age, body type, disability, and family structure.",
        "Ensure no single demographic is overrepresented across the image set.",
        "Avoid stock photos that appear staged or tokenistic.",
      ],
    };
  },

  "alt-text": (doc) => {
    const imgs = [...doc.querySelectorAll("img")];
    if (imgs.length === 0) return { status: "pass", notes: "No img elements found on this page." };
    const missing = imgs.filter(img => img.getAttribute("alt") === null);
    const empty   = imgs.filter(img => img.getAttribute("alt") === "" && img.getAttribute("role") !== "presentation" && !img.getAttribute("aria-hidden"));
    if (missing.length === 0 && empty.length === 0) {
      return { status: "pass", notes: `All ${imgs.length} image(s) have alt text.` };
    }
    return {
      status: "fail",
      notes: `${missing.length + empty.length} of ${imgs.length} image(s) need attention.`,
      repairs: [
        ...missing.map(img => `Missing alt attribute: <img src="${img.src?.split("/").pop()?.slice(0, 50) || "?"}">`),
        ...empty.map(img => `Empty alt on non-decorative image — add a description: <img src="${img.src?.split("/").pop()?.slice(0, 50) || "?"}">`),
      ],
    };
  },

  "lgbtq-affirming": (doc) => {
    const text = (doc.body?.innerText ?? "").toLowerCase();
    const affirming = ["lgbtq", "queer", "all families", "all identities", "gender-affirming", "same-sex", "non-binary", "trans ", "rainbow", "pride"];
    const found = affirming.filter(w => text.includes(w));
    return found.length > 0
      ? { status: "pass", notes: `LGBTQ+ affirming language detected: "${found.join('", "')}"` }
      : {
          status: "warning",
          notes: "No explicit LGBTQ+ affirming language found.",
          repairs: [
            "Consider a statement like: 'We welcome clients of all gender identities, sexual orientations, and family structures.'",
            "Even one sentence signals belonging before a client shares their story.",
          ],
        };
  },

  "reading-level": (doc) => {
    const text = (doc.body?.innerText ?? "").replace(/\n+/g, " ").trim();
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().split(/\s+/).length > 2);
    const words = text.split(/\s+/).filter(w => /[a-z]/i.test(w));
    if (sentences.length < 3 || words.length < 20) {
      return { status: "warning", notes: "Not enough text to calculate reading level reliably." };
    }
    const syllables = words.reduce((acc, w) => acc + countSyllables(w), 0);
    const fk = 0.39 * (words.length / sentences.length) + 11.8 * (syllables / words.length) - 15.59;
    const grade = Math.max(1, Math.round(fk));
    return grade <= 8
      ? { status: "pass", notes: `Estimated reading level: Grade ${grade} (Flesch-Kincaid). Target ≤ Grade 8. ✓` }
      : {
          status: "fail",
          notes: `Estimated reading level: Grade ${grade}. Target is Grade 8 or lower.`,
          repairs: [
            "Shorten sentences — aim for ≤ 15 words per sentence.",
            "Replace multi-syllable words: 'utilize' → 'use', 'facilitate' → 'help'.",
            "Prefer active voice: 'We help families' not 'Families are helped by us'.",
            "Paste copy into hemingwayapp.com to identify hard-to-read sentences.",
          ],
        };
  },

  "short-para": (doc) => {
    const paras = [...doc.querySelectorAll("p")].filter(p => (p.innerText ?? "").trim().length > 0);
    if (paras.length === 0) return { status: "pass", notes: "No paragraph elements found." };
    const long = paras.filter(p => {
      const sents = (p.innerText ?? "").split(/[.!?]+/).filter(s => s.trim().length > 3);
      return sents.length > 3;
    });
    return long.length === 0
      ? { status: "pass", notes: `All ${paras.length} paragraph(s) are ≤ 3 sentences.` }
      : {
          status: "fail",
          notes: `${long.length} of ${paras.length} paragraph(s) exceed 3 sentences.`,
          repairs: [
            "Break long paragraphs into shorter ones — one idea per paragraph.",
            "Target ≤ 3 sentences per paragraph.",
            "Use bullet points for lists of 3+ items.",
          ],
        };
  },

  "plain-language": (doc) => {
    const text = doc.body?.innerText ?? "";
    const jargon = [
      ["pursuant",       "in accordance with / following"],
      ["utilize",        "use"],
      ["facilitate",     "help / make easier"],
      ["endeavor",       "try"],
      ["aforementioned", "the above"],
      ["commencing",     "starting"],
      ["terminate",      "end"],
      ["notwithstanding","despite / even though"],
      ["in lieu of",     "instead of"],
      ["subsequent",     "next / after"],
    ];
    const hits = jargon.filter(([w]) => new RegExp(`\\b${w}\\b`, "i").test(text));
    return hits.length === 0
      ? { status: "pass", notes: "No common jargon terms detected." }
      : {
          status: "warning",
          notes: `${hits.length} jargon term(s) found.`,
          repairs: hits.map(([w, alt]) => `Replace "${w}" → "${alt}"`),
        };
  },

  "error-guidance": (doc) => {
    const inputs = [...doc.querySelectorAll("input, textarea, select")];
    if (inputs.length === 0) {
      return {
        status: "warning",
        notes: "No form inputs found on this page. Select 'Intake Form' from the dropdown to test error messages.",
      };
    }
    const alerts = [...doc.querySelectorAll('[role="alert"], [aria-live="polite"], [aria-live="assertive"]')];
    return {
      status: "warning",
      notes: `${inputs.length} input(s) found. Submit the form with invalid data to inspect live error messages.`,
      repairs: [
        "Error messages must say what went wrong AND how to fix it.",
        "✗ Bad: 'Invalid email'   ✓ Good: 'Please enter a valid email (e.g. name@example.com)'",
        "Use aria-describedby to associate each error message with its input.",
        alerts.length === 0 ? "No aria-live regions detected — add role=\"alert\" to error containers." : `${alerts.length} aria-live region(s) found ✓`,
      ],
    };
  },

  keyboard: (doc) => {
    const interactive = [...doc.querySelectorAll("a[href], button, input, select, textarea, [tabindex]")];
    const trapped = interactive.filter(el => parseInt(el.getAttribute("tabindex") ?? "0") < 0);
    return trapped.length === 0
      ? { status: "pass", notes: `${interactive.length} interactive element(s) — none have tabindex < 0.` }
      : {
          status: "warning",
          notes: `${trapped.length} element(s) have tabindex < 0 (keyboard-unreachable). Also Tab through the page visually to check focus order and visibility.`,
          repairs: trapped.slice(0, 6).map(el =>
            `Remove tabindex="-1" from: <${el.tagName.toLowerCase()}${el.id ? ' id="' + el.id + '"' : el.className ? ' class="' + el.className.trim().split(" ")[0] + '"' : ""}>`
          ),
        };
  },

  "touch-target": (doc) => {
    const interactive = [...doc.querySelectorAll("a[href], button, input[type='checkbox'], input[type='radio'], select")];
    if (interactive.length === 0) return { status: "pass", notes: "No interactive elements found." };
    const small = interactive.filter(el => {
      try {
        const r = el.getBoundingClientRect();
        return r.width > 0 && (r.width < 44 || r.height < 44);
      } catch { return false; }
    });
    return small.length === 0
      ? { status: "pass", notes: `All ${interactive.length} interactive element(s) meet the 44×44px minimum (WCAG 2.5.5).` }
      : {
          status: "fail",
          notes: `${small.length} of ${interactive.length} element(s) are below 44×44px.`,
          repairs: small.slice(0, 6).map(el => {
            const r = el.getBoundingClientRect();
            const name = el.id ? "#" + el.id : el.className?.trim().split(" ")[0] ? "." + el.className.trim().split(" ")[0] : el.tagName.toLowerCase();
            return `${name}: ${Math.round(r.width)}×${Math.round(r.height)}px → needs min 44×44px (add padding or min-width/height)`;
          }),
        };
  },

  motion: (doc) => {
    let hasQuery = false;
    try {
      for (const ss of doc.styleSheets) {
        try {
          for (const rule of ss.cssRules) {
            if (rule.conditionText?.includes("prefers-reduced-motion") || rule.media?.mediaText?.includes("prefers-reduced-motion")) {
              hasQuery = true;
              break;
            }
          }
        } catch { /* cross-origin stylesheet, skip */ }
        if (hasQuery) break;
      }
    } catch {}
    return hasQuery
      ? { status: "pass", notes: "prefers-reduced-motion media query found in stylesheets." }
      : {
          status: "fail",
          notes: "No prefers-reduced-motion query detected. Users who prefer reduced motion will still see all animations.",
          repairs: [
            "@media (prefers-reduced-motion: reduce) {",
            "  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }",
            "}",
            "Add this to your global CSS. For scroll-triggered animations, check the preference before running them.",
          ],
        };
  },

  "color-alone": (doc) => {
    return {
      status: "warning",
      notes: "Cannot be fully determined automatically — requires visual review.",
      repairs: [
        "Check: are form errors indicated by color AND an icon or text label?",
        "Check: are required fields marked with color AND a symbol (e.g., *) with legend?",
        "Check: are links distinguishable from body text without relying on color alone?",
        "Check: are charts or status indicators usable without color perception?",
      ],
    };
  },

  "lang-attr": (doc) => {
    const lang = doc.documentElement?.getAttribute("lang");
    return lang
      ? { status: "pass", notes: `lang="${lang}" is set on the <html> element.` }
      : {
          status: "fail",
          notes: "<html> is missing the lang attribute. Screen readers will guess the language, causing mispronunciation.",
          repairs: ['Add lang="en" to <html> in index.html', "Use the correct BCP 47 code for your language (e.g., lang=\"nl\" for Dutch, lang=\"es\" for Spanish)."],
        };
  },

  "skip-link": (doc) => {
    const links = [...doc.querySelectorAll("a")];
    const skip = links.find(
      a => /skip|jump.*main|main.*content/i.test(a.textContent ?? "") ||
           /^#(main|content|skip)/i.test(a.getAttribute("href") ?? "")
    );
    return skip
      ? { status: "pass", notes: `Skip link found: "${skip.textContent?.trim()}"` }
      : {
          status: "fail",
          notes: "No skip-to-content link detected. Keyboard users must Tab through the full navigation bar on every page load.",
          repairs: [
            "Add as the very first element inside <body>:",
            '<a href="#main" class="skip-link">Skip to main content</a>',
            "Add id=\"main\" to your main content wrapper.",
            "Style: .skip-link { position: absolute; left: -9999px; } .skip-link:focus { position: static; }",
          ],
        };
  },

  "page-title": (doc) => {
    const title = doc.title?.trim();
    return title
      ? { status: "pass", notes: `Page title: "${title}"` }
      : {
          status: "fail",
          notes: "Page has no <title>. Screen readers announce the title when loading a page — without it, users have no orientation cue.",
          repairs: [
            "Add a unique, descriptive <title> to every page.",
            "Format: <title>Intake Form — Luminal Journeys</title>",
            "Each page title should describe its purpose, not just the site name.",
          ],
        };
  },

  "heading-order": (doc) => {
    const headings = [...doc.querySelectorAll("h1,h2,h3,h4,h5,h6")];
    if (headings.length === 0) return { status: "warning", notes: "No heading elements found on this page." };
    const levels = headings.map(h => parseInt(h.tagName[1]));
    const issues = [];
    for (let i = 1; i < levels.length; i++) {
      if (levels[i] - levels[i - 1] > 1) {
        issues.push(`Skipped from h${levels[i - 1]} to h${levels[i]} — heading levels must not skip`);
      }
    }
    const h1s = levels.filter(l => l === 1);
    if (h1s.length > 1) issues.push(`${h1s.length} h1 elements found — page should have exactly one h1`);
    if (h1s.length === 0) issues.push("No h1 found — every page needs exactly one h1");
    return issues.length === 0
      ? { status: "pass", notes: `${headings.length} headings in correct order: ${levels.map(l => "h" + l).join(" → ")}` }
      : {
          status: "fail",
          notes: `${issues.length} heading structure issue(s).`,
          repairs: issues,
        };
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function wcagTags(violation) {
  const tags = violation.tags ?? [];
  const wcag = tags
    .filter(t => t.startsWith("wcag") && WCAG_TAG_LABEL[t])
    .map(t => WCAG_TAG_LABEL[t]);
  return wcag.length ? wcag.join(", ") : "—";
}

function timeSince(date) {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60)   return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}

function impactCounts(violations) {
  return {
    critical: violations.filter(v => v.impact === "critical").length,
    serious:  violations.filter(v => v.impact === "serious").length,
    moderate: violations.filter(v => v.impact === "moderate").length,
    minor:    violations.filter(v => v.impact === "minor").length,
  };
}

function statusColor(status) {
  return { pass: "#16a34a", fail: "#dc2626", warning: "#d97706" }[status] ?? B.muted;
}

function statusIcon(status) {
  return { pass: "✓", fail: "✗", warning: "⚠" }[status] ?? "·";
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MetricCard({ label, count, color }) {
  return (
    <div style={{
      background: count > 0 ? `${color}12` : B.card,
      border: `1.5px solid ${count > 0 ? color : B.border}`,
      borderRadius: "0.75rem",
      padding: "1.25rem 1.5rem",
      textAlign: "center",
      flex: "1 1 120px",
      minWidth: "100px",
    }}>
      <div style={{ fontSize: "2rem", fontWeight: 700, color: count > 0 ? color : B.muted, lineHeight: 1 }}>
        {count}
      </div>
      <div style={{ fontSize: "0.72rem", letterSpacing: "0.08em", textTransform: "uppercase", color: B.muted, marginTop: "0.4rem", fontFamily: "var(--font-mono, monospace)" }}>
        {label}
      </div>
    </div>
  );
}

function QualityGate({ violations }) {
  const counts = impactCounts(violations);
  const blocking = counts.critical + counts.serious;
  const passed = blocking === 0;

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "1.25rem",
      padding: "1.5rem",
      background: passed ? "#dcfce712" : "#fef2f2",
      border: `2px solid ${passed ? "#16a34a" : "#dc2626"}`,
      borderRadius: "0.75rem",
      marginBottom: "1.5rem",
    }}>
      <div style={{
        width: "64px", height: "64px", borderRadius: "50%", flexShrink: 0,
        background: passed ? "#16a34a" : "#dc2626",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "1.75rem", color: "#fff",
      }}>
        {passed ? "✓" : "✗"}
      </div>
      <div>
        <div style={{ fontSize: "1.1rem", fontWeight: 600, color: passed ? "#15803d" : "#dc2626", letterSpacing: "0.05em", textTransform: "uppercase", fontFamily: "var(--font-mono, monospace)" }}>
          {passed ? "Quality Gate Passed" : "Quality Gate Failed"}
        </div>
        <div style={{ fontSize: "0.85rem", color: B.muted, marginTop: "0.25rem", lineHeight: 1.6 }}>
          {passed
            ? `No critical or serious WCAG 2.2 AA violations. ${counts.moderate + counts.minor} lower-severity items to review.`
            : `${blocking} blocking violation${blocking !== 1 ? "s" : ""} (critical or serious) must be resolved.`}
        </div>
      </div>
    </div>
  );
}

function ViolationRow({ v, idx }) {
  const [open, setOpen] = useState(false);
  const color = IMPACT_COLOR[v.impact] ?? B.muted;

  return (
    <>
      <tr
        onClick={() => setOpen(!open)}
        style={{ cursor: "pointer", background: idx % 2 === 0 ? "transparent" : B.card }}
      >
        <td style={{ padding: "0.75rem 1rem", fontFamily: "var(--font-mono, monospace)", fontSize: "0.78rem", color: B.deep }}>
          {v.id}
        </td>
        <td style={{ padding: "0.75rem 1rem" }}>
          <span style={{
            display: "inline-block", padding: "0.2rem 0.6rem", borderRadius: "0.3rem",
            background: `${color}18`, color, fontSize: "0.72rem",
            fontFamily: "var(--font-mono, monospace)", letterSpacing: "0.05em", fontWeight: 600,
          }}>
            {v.impact}
          </span>
        </td>
        <td style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", color: B.deep }}>
          {v.description}
        </td>
        <td style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", color: B.muted, textAlign: "center" }}>
          {v.nodes?.length ?? 0}
        </td>
        <td style={{ padding: "0.75rem 1rem", fontSize: "0.72rem", fontFamily: "var(--font-mono, monospace)", color: B.muted }}>
          {wcagTags(v)}
        </td>
        <td style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", color: B.muted, textAlign: "center" }}>
          {open ? "▲" : "▼"}
        </td>
      </tr>
      {open && (
        <tr style={{ background: "#f8fafc" }}>
          <td colSpan={6} style={{ padding: "1rem 1.5rem" }}>
            <div style={{ fontSize: "0.82rem", color: B.deep, marginBottom: "0.75rem", fontStyle: "italic" }}>
              {v.help} — <a href={v.helpUrl} target="_blank" rel="noopener noreferrer" style={{ color: B.amber }}>WCAG guidance →</a>
            </div>
            {v.nodes?.slice(0, 5).map((node, i) => (
              <div key={i} style={{
                fontFamily: "var(--font-mono, monospace)", fontSize: "0.75rem",
                background: "#1e293b", color: "#e2e8f0", padding: "0.6rem 1rem",
                borderRadius: "0.4rem", marginBottom: "0.4rem", overflowX: "auto",
                whiteSpace: "pre-wrap", wordBreak: "break-all",
              }}>
                {node.html ?? node.target?.join(", ")}
              </div>
            ))}
            {v.nodes?.length > 5 && (
              <div style={{ fontSize: "0.75rem", color: B.muted }}>+ {v.nodes.length - 5} more nodes</div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

// ── D&I Checklist with automated per-item scanning ────────────────────────────
function DiChecklist({ results, onScan, scanning }) {
  return (
    <div>
      {DI_CHECKLIST.map(section => (
        <div key={section.category} style={{ marginBottom: "2rem" }}>
          <div style={{
            fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase",
            color: B.sage, fontFamily: "var(--font-mono, monospace)", marginBottom: "0.5rem",
            fontWeight: 600,
          }}>
            {section.category}
          </div>
          <div style={{ background: "#fff", border: `1.5px solid ${B.border}`, borderRadius: "0.65rem", overflow: "hidden" }}>
            {section.items.map((item, i) => {
              const result   = results[item.id];
              const isScanning = scanning[item.id];
              const canAuto  = !!DI_CHECKERS[item.id];
              const sc       = result ? statusColor(result.status) : B.border;
              const hasResult = result && !isScanning;

              return (
                <div
                  key={item.id}
                  style={{
                    borderTop: i === 0 ? "none" : `1px solid ${B.rule}`,
                    padding: hasResult ? "0.875rem 1.125rem" : "0",
                  }}
                >
                  {/* ── Main row ── */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.875rem",
                    padding: hasResult ? "0" : "0.875rem 1.125rem",
                    background: hasResult ? "transparent" : "transparent",
                  }}>
                    {/* Status dot */}
                    <div style={{
                      width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0,
                      background: isScanning ? B.amber : (result ? sc : B.border),
                      transition: "background 0.3s",
                    }} />

                    {/* Label */}
                    <div style={{ flex: 1, fontSize: "0.875rem", color: result ? (result.status === "pass" ? B.muted : B.deep) : B.deep, lineHeight: 1.5 }}>
                      {item.label}
                    </div>

                    {/* Scan button / status badge */}
                    {canAuto && (
                      <button
                        onClick={() => !isScanning && onScan(item.id)}
                        disabled={isScanning}
                        style={{
                          flexShrink: 0,
                          padding: "0.3rem 0.9rem",
                          borderRadius: "0.375rem",
                          border: `1.5px solid ${hasResult ? sc : B.border}`,
                          background: hasResult ? `${sc}14` : "transparent",
                          color: hasResult ? sc : B.muted,
                          fontSize: "0.75rem",
                          fontFamily: "var(--font-mono, monospace)",
                          fontWeight: hasResult ? 600 : 400,
                          cursor: isScanning ? "default" : "pointer",
                          whiteSpace: "nowrap",
                          minWidth: "80px",
                          textAlign: "center",
                          transition: "all 0.2s",
                        }}
                      >
                        {isScanning
                          ? "Scanning…"
                          : hasResult
                            ? `${statusIcon(result.status)} ${result.status === "pass" ? "Pass" : result.status === "fail" ? "Fail" : "Review"}`
                            : "▶ Scan"}
                      </button>
                    )}
                  </div>

                  {/* ── Result details ── */}
                  {hasResult && (
                    <div style={{ marginTop: "0.6rem", paddingLeft: "1.4rem" }}>
                      <div style={{ fontSize: "0.8rem", color: sc, marginBottom: result.repairs?.length ? "0.5rem" : 0, lineHeight: 1.5 }}>
                        {result.notes}
                      </div>
                      {result.repairs?.map((r, ri) => (
                        <div key={ri} style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "0.5rem",
                          fontSize: "0.78rem",
                          color: B.deep,
                          padding: "0.3rem 0.75rem",
                          marginBottom: "0.2rem",
                          background: "#f8fafc",
                          borderLeft: `3px solid ${sc}`,
                          borderRadius: "0 0.25rem 0.25rem 0",
                          lineHeight: 1.5,
                          fontFamily: r.startsWith("@") || r.startsWith("<") ? "var(--font-mono, monospace)" : "inherit",
                        }}>
                          <span style={{ color: sc, flexShrink: 0, marginTop: "0.05rem" }}>→</span>
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────

export default function AccessibilityDashboard() {
  const [status, setStatus]             = useState("idle"); // idle | scanning | done | error
  const [results, setResults]           = useState(null);
  const [scannedPage, setScannedPage]   = useState(null);
  const [selectedPage, setSelectedPage] = useState(AUDIT_PAGES[0]);
  const [scannedAt, setScannedAt]       = useState(null);
  const [errMsg, setErrMsg]             = useState(null);
  const [filterImpact, setFilterImpact] = useState("all");
  const [diResults, setDiResults]       = useState({});  // { [id]: { status, notes, repairs } }
  const [diScanning, setDiScanning]     = useState({});  // { [id]: boolean }
  const iframeRef         = useRef(null);
  const iframeLoadedPath  = useRef(null); // tracks which path is currently in the iframe

  // ── Ensure the iframe has the selected page loaded ──────────────────────────
  const ensureIframeLoaded = useCallback(async (path) => {
    if (iframeLoadedPath.current === path) return; // already loaded
    await new Promise((resolve, reject) => {
      const iframe = iframeRef.current;
      const timeout = setTimeout(() => reject(new Error("Page load timed out after 15s")), 15000);
      iframe.onload = () => { clearTimeout(timeout); resolve(); };
      iframe.onerror = (e) => { clearTimeout(timeout); reject(e); };
      iframe.src = path;
    });
    iframeLoadedPath.current = path;
    await new Promise(r => setTimeout(r, 1500)); // hydration wait
  }, []);

  // ── axe-core WCAG scan ──────────────────────────────────────────────────────
  // axe must run INSIDE the iframe's window context — calling axe.run(iframeDoc)
  // from the parent fails because axe's instanceof checks break across frame
  // boundaries even on same-origin iframes. Fix: inject axe.source as a script
  // into the iframe, then call iframeWin.axe.run() from within that context.
  const runAudit = useCallback(async (page) => {
    setStatus("scanning");
    setScannedPage(page);
    setErrMsg(null);
    setResults(null);
    try {
      const { default: axe } = await import("axe-core");
      await ensureIframeLoaded(page.path);

      const iframeWin = iframeRef.current.contentWindow;
      const iframeDoc = iframeRef.current.contentDocument;

      // Inject axe-core into the iframe's JS context if not already present
      if (!iframeWin.axe) {
        const script = iframeDoc.createElement("script");
        script.textContent = axe.source; // axe.source = full minified axe bundle string
        iframeDoc.documentElement.appendChild(script);
        // inline scripts execute synchronously — no need to await
      }

      const axeResults = await iframeWin.axe.run({
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] },
        resultTypes: ["violations", "passes", "incomplete"],
        reporter: "v2",
      });

      setResults(axeResults);
      setScannedAt(new Date());
      setStatus("done");
    } catch (err) {
      console.error("[a11y dashboard]", err);
      setErrMsg(err.message ?? "Unknown error");
      setStatus("error");
    }
  }, [ensureIframeLoaded]);

  // ── Per-item D&I check ──────────────────────────────────────────────────────
  const runItemCheck = useCallback(async (itemId) => {
    const checker = DI_CHECKERS[itemId];
    if (!checker) return;
    setDiScanning(prev => ({ ...prev, [itemId]: true }));
    try {
      await ensureIframeLoaded(selectedPage.path);
      const iframeDoc = iframeRef.current.contentDocument;
      const result = checker(iframeDoc);
      setDiResults(prev => ({ ...prev, [itemId]: result }));
    } catch (err) {
      setDiResults(prev => ({ ...prev, [itemId]: { status: "fail", notes: `Check failed: ${err.message}`, repairs: [] } }));
    } finally {
      setDiScanning(prev => ({ ...prev, [itemId]: false }));
    }
  }, [selectedPage, ensureIframeLoaded]);

  // ── Scan all D&I items at once ──────────────────────────────────────────────
  const runAllChecks = useCallback(async () => {
    const allIds = DI_CHECKLIST.flatMap(s => s.items.map(i => i.id)).filter(id => DI_CHECKERS[id]);
    // Mark all as scanning
    const scanState = {};
    allIds.forEach(id => { scanState[id] = true; });
    setDiScanning(scanState);
    try {
      await ensureIframeLoaded(selectedPage.path);
      const iframeDoc = iframeRef.current.contentDocument;
      const allResults = {};
      for (const id of allIds) {
        try { allResults[id] = DI_CHECKERS[id](iframeDoc); }
        catch (err) { allResults[id] = { status: "fail", notes: `Check failed: ${err.message}`, repairs: [] }; }
      }
      setDiResults(prev => ({ ...prev, ...allResults }));
    } catch (err) {
      console.error("[D&I scan-all]", err);
    } finally {
      setDiScanning({});
    }
  }, [selectedPage, ensureIframeLoaded]);

  const violations         = results?.violations ?? [];
  const passes             = results?.passes ?? [];
  const incomplete         = results?.incomplete ?? [];
  const counts             = impactCounts(violations);
  const filteredViolations = filterImpact === "all" ? violations : violations.filter(v => v.impact === filterImpact);

  const allDiIds    = DI_CHECKLIST.flatMap(s => s.items.map(i => i.id)).filter(id => DI_CHECKERS[id]);
  const diPassed    = allDiIds.filter(id => diResults[id]?.status === "pass").length;
  const diFailed    = allDiIds.filter(id => diResults[id]?.status === "fail").length;
  const diScanned   = allDiIds.filter(id => diResults[id]).length;
  const anyScanning = Object.values(diScanning).some(Boolean);

  return (
    <div style={{
      background: B.paper,
      minHeight: "100vh",
      fontFamily: "var(--font-body, Georgia, serif)",
      color: B.deep,
      zoom: 1.25,
    }}>
      {/* ── Header ── */}
      <div style={{ background: B.deep, color: B.paper, padding: "1.5rem 2.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <button
            onClick={() => navigate("/")}
            style={{ background: "transparent", border: "none", color: B.sage, cursor: "pointer", fontSize: "0.78rem", fontFamily: "var(--font-mono, monospace)", padding: 0, marginBottom: "0.5rem", letterSpacing: "0.05em" }}
          >
            ← Back to site
          </button>
          <h1 style={{ fontFamily: "var(--font-heading, serif)", fontSize: "1.5rem", fontWeight: 400, margin: 0, letterSpacing: "-0.02em" }}>
            Accessibility & D&I Audit
          </h1>
          <div style={{ fontSize: "0.75rem", color: B.sage, marginTop: "0.25rem", fontFamily: "var(--font-mono, monospace)" }}>
            {window.location.hostname} · WCAG 2.2 AA · axe-core
          </div>
        </div>

        {scannedAt && (
          <div style={{ fontSize: "0.75rem", color: B.sage, fontFamily: "var(--font-mono, monospace)", textAlign: "right" }}>
            Last scanned: {timeSince(scannedAt)}
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem 2rem 4rem" }}>

        {/* ── Audit control bar ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: "0.875rem",
          background: B.card, border: `1.5px solid ${B.border}`,
          borderRadius: "0.75rem", padding: "1.25rem 1.5rem",
          marginBottom: "2rem", flexWrap: "wrap",
        }}>
          <label htmlFor="audit-page-select" style={{ fontSize: "0.82rem", color: B.muted, fontFamily: "var(--font-mono, monospace)", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
            Page to audit
          </label>
          <select
            id="audit-page-select"
            value={selectedPage.id}
            onChange={e => setSelectedPage(AUDIT_PAGES.find(p => p.id === e.target.value))}
            disabled={status === "scanning"}
            style={{ flex: "1 1 200px", padding: "0.6rem 1rem", borderRadius: "0.5rem", border: `1.5px solid ${B.border}`, background: "#fff", color: B.deep, fontSize: "0.9rem", fontFamily: "var(--font-body, Georgia, serif)", cursor: "pointer" }}
          >
            {AUDIT_PAGES.map(p => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
          <button
            onClick={() => runAudit(selectedPage)}
            disabled={status === "scanning"}
            style={{ background: status === "scanning" ? B.muted : B.teal, color: "#fff", border: "none", borderRadius: "0.5rem", padding: "0.65rem 1.75rem", fontSize: "0.9rem", fontWeight: 600, cursor: status === "scanning" ? "default" : "pointer", fontFamily: "var(--font-body, Georgia, serif)", whiteSpace: "nowrap", transition: "background 0.2s" }}
          >
            {status === "scanning" ? "Scanning…" : "▶ Run Audit"}
          </button>
          {scannedPage && status === "done" && (
            <div style={{ fontSize: "0.78rem", color: B.muted, fontFamily: "var(--font-mono, monospace)", whiteSpace: "nowrap" }}>
              {window.location.origin}{scannedPage.path}
              {scannedAt && <span style={{ marginLeft: "0.75rem" }}>{timeSince(scannedAt)}</span>}
            </div>
          )}
        </div>

        {/* ── Scanning ── */}
        {status === "scanning" && (
          <div style={{ textAlign: "center", padding: "3rem 2rem", color: B.muted }}>
            <div style={{ fontSize: "0.95rem" }}>Loading <strong style={{ color: B.deep }}>{scannedPage?.label}</strong> and running axe-core…</div>
          </div>
        )}

        {/* ── Error ── */}
        {status === "error" && (
          <div style={{ background: "#fef2f2", border: "1.5px solid #dc2626", borderRadius: "0.75rem", padding: "1.5rem", color: "#dc2626", marginBottom: "1.5rem" }}>
            <strong>Audit failed.</strong> {errMsg}
          </div>
        )}

        {/* ── WCAG Results ── */}
        {status === "done" && results && (
          <>
            <QualityGate violations={violations} />
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "2rem" }}>
              <MetricCard label="Critical"  count={counts.critical}  color={IMPACT_COLOR.critical} />
              <MetricCard label="Serious"   count={counts.serious}   color={IMPACT_COLOR.serious}  />
              <MetricCard label="Moderate"  count={counts.moderate}  color={IMPACT_COLOR.moderate} />
              <MetricCard label="Minor"     count={counts.minor}     color={IMPACT_COLOR.minor}    />
              <MetricCard label="Passes"    count={passes.length}    color={B.deep}                />
              <MetricCard label="Review"    count={incomplete.length} color={B.sage}               />
            </div>

            {violations.length > 0 ? (
              <div style={{ marginBottom: "2.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
                  <h2 style={{ fontFamily: "var(--font-heading, serif)", fontSize: "1.2rem", fontWeight: 400, margin: 0 }}>
                    Violations <span style={{ color: B.muted, fontFamily: "var(--font-mono, monospace)", fontSize: "0.85rem" }}>({filteredViolations.length})</span>
                  </h2>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {["all", "critical", "serious", "moderate", "minor"].map(f => (
                      <button
                        key={f}
                        onClick={() => setFilterImpact(f)}
                        style={{
                          padding: "0.3rem 0.75rem", borderRadius: "1rem",
                          border: `1.5px solid ${filterImpact === f ? (IMPACT_COLOR[f] ?? B.deep) : B.border}`,
                          background: filterImpact === f ? (f === "all" ? B.deep : `${IMPACT_COLOR[f]}18`) : "transparent",
                          color: filterImpact === f ? (f === "all" ? B.paper : (IMPACT_COLOR[f] ?? B.deep)) : B.muted,
                          fontSize: "0.75rem", cursor: "pointer",
                          fontFamily: "var(--font-mono, monospace)", letterSpacing: "0.03em",
                        }}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ overflowX: "auto", borderRadius: "0.75rem", border: `1.5px solid ${B.border}` }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                    <thead>
                      <tr style={{ background: B.card, borderBottom: `1.5px solid ${B.border}` }}>
                        {["Rule", "Impact", "Description", "Nodes", "WCAG", ""].map(h => (
                          <th key={h} style={{ padding: "0.75rem 1rem", textAlign: h === "Nodes" ? "center" : "left", fontSize: "0.72rem", letterSpacing: "0.06em", textTransform: "uppercase", color: B.muted, fontWeight: 600, fontFamily: "var(--font-mono, monospace)", whiteSpace: "nowrap" }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredViolations.length === 0
                        ? <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: B.muted }}>No violations at this impact level.</td></tr>
                        : filteredViolations.map((v, i) => <ViolationRow key={v.id} v={v} idx={i} />)
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div style={{ padding: "1.5rem", background: "#f0fdf4", border: "1.5px solid #16a34a", borderRadius: "0.75rem", marginBottom: "2.5rem", color: "#15803d", fontSize: "0.9rem" }}>
                ✓ No WCAG 2.2 AA violations found on this page.
              </div>
            )}
          </>
        )}

        {/* ── D&I Automated Checklist ── */}
        <div style={{ borderTop: `1.5px solid ${B.border}`, paddingTop: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
            <div>
              <h2 style={{ fontFamily: "var(--font-heading, serif)", fontSize: "1.2rem", fontWeight: 400, margin: "0 0 0.2rem" }}>
                Diversity & Inclusion Checklist
              </h2>
              <p style={{ fontSize: "0.82rem", color: B.muted, margin: 0, lineHeight: 1.5 }}>
                Each item scans the selected page automatically. Click <strong>▶ Scan</strong> per item, or run all at once.
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexShrink: 0 }}>
              {diScanned > 0 && (
                <div style={{ fontSize: "0.78rem", fontFamily: "var(--font-mono, monospace)", color: B.muted, textAlign: "right" }}>
                  <span style={{ color: "#16a34a", fontWeight: 600 }}>{diPassed} pass</span>
                  {diFailed > 0 && <span style={{ color: "#dc2626", fontWeight: 600, marginLeft: "0.5rem" }}>{diFailed} fail</span>}
                  <span style={{ marginLeft: "0.5rem" }}>/ {allDiIds.length} items</span>
                </div>
              )}
              <button
                onClick={runAllChecks}
                disabled={anyScanning}
                style={{
                  background: anyScanning ? B.muted : B.amber,
                  color: "#fff", border: "none",
                  borderRadius: "0.5rem", padding: "0.55rem 1.25rem",
                  fontSize: "0.82rem", fontWeight: 600,
                  cursor: anyScanning ? "default" : "pointer",
                  fontFamily: "var(--font-body, Georgia, serif)",
                  whiteSpace: "nowrap", transition: "background 0.2s",
                }}
              >
                {anyScanning ? "Scanning…" : "⚡ Scan All Items"}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: "1.5rem", padding: "0.75rem 1rem", background: `${B.amber}10`, border: `1px solid ${B.amber}40`, borderRadius: "0.5rem", fontSize: "0.8rem", color: B.deep, lineHeight: 1.5 }}>
            Scanning <strong>{selectedPage.label}</strong>. To test a different page, change the dropdown above and click Scan again.
          </div>

          <DiChecklist results={diResults} onScan={runItemCheck} scanning={diScanning} />
        </div>

      </div>

      {/* ── Hidden iframe — loads target pages off-screen for scanning ──
          position:fixed + left:-9999px keeps it off-screen but NOT display:none.
          display:none hides all elements from axe, causing false positives. */}
      <iframe
        ref={iframeRef}
        title="Accessibility audit frame"
        style={{
          position: "fixed", left: "-9999px", top: 0,
          width: "1280px", height: "900px",
          border: "none", visibility: "hidden", pointerEvents: "none",
        }}
      />
    </div>
  );
}
