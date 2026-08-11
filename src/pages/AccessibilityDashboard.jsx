/**
 * AccessibilityDashboard.jsx — Luminal Journeys
 *
 * SonarCloud-style Accessibility & D&I Audit dashboard.
 * Scans any page URL using axe-core (WCAG 2.2 AA).
 *
 * Routes:
 *   admin.luminaljourneys.com/admin/accessibility  (admin domain)
 *   luminaljourneys.com/admin/accessibility         (redirects to admin domain)
 *
 * axe-core is dynamically imported — zero impact on main bundle.
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

// ── D&I static checklist (manual review items) ────────────────────────────────
const DI_CHECKLIST = [
  {
    category: "Inclusive Language",
    items: [
      { id: "pronouns",        label: 'Intake form includes pronoun field (they/them, he/him, she/her, custom)' },
      { id: "gendered",        label: 'No gendered salutations ("ladies", "guys", "he or she")' },
      { id: "ableist",         label: 'No ableist language ("crazy", "lame", "blind to", "stands alone")' },
      { id: "identity-first",  label: 'Uses identity-first language option where appropriate' },
    ],
  },
  {
    category: "Representation",
    items: [
      { id: "imagery-diversity", label: 'Imagery reflects diverse individuals and family structures' },
      { id: "alt-text",          label: 'All images have descriptive, meaningful alt text (checked by audit)' },
      { id: "lgbtq-affirming",   label: 'Copy explicitly affirms LGBTQ+ clients if applicable to scope' },
    ],
  },
  {
    category: "Cognitive Accessibility",
    items: [
      { id: "reading-level",  label: 'Body copy at ≤ 8th grade reading level (Flesch-Kincaid)' },
      { id: "short-para",     label: 'Paragraphs ≤ 3 sentences; no walls of text' },
      { id: "plain-language", label: 'Clinical/insurance terms are explained in plain language' },
      { id: "error-guidance", label: 'Form error messages describe what went wrong and how to fix it' },
    ],
  },
  {
    category: "Sensory & Motor",
    items: [
      { id: "keyboard",    label: 'All interactive elements reachable and operable via keyboard alone' },
      { id: "touch-target",label: 'Touch targets ≥ 44×44 CSS pixels (WCAG 2.5.5)' },
      { id: "motion",      label: 'Animations respect prefers-reduced-motion' },
      { id: "color-alone", label: 'Color is never the sole means of conveying information' },
    ],
  },
  {
    category: "Technical & Structural",
    items: [
      { id: "lang-attr",   label: '<html lang="en"> (or appropriate locale) is present' },
      { id: "skip-link",   label: 'Skip-to-content link present for screen readers' },
      { id: "page-title",  label: 'Every page has a unique, descriptive <title>' },
      { id: "heading-order", label: 'Headings follow logical order (h1 → h2 → h3)' },
    ],
  },
];

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
        fontSize: "1.75rem",
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

function DiChecklist({ checked, onToggle }) {
  return (
    <div>
      {DI_CHECKLIST.map(section => (
        <div key={section.category} style={{ marginBottom: "1.5rem" }}>
          <div style={{
            fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase",
            color: B.sage, fontFamily: "var(--font-mono, monospace)", marginBottom: "0.75rem",
            fontWeight: 600,
          }}>
            {section.category}
          </div>
          {section.items.map(item => (
            <label key={item.id} style={{
              display: "flex", alignItems: "flex-start", gap: "0.75rem",
              padding: "0.6rem 0", borderBottom: `1px solid ${B.rule}`,
              cursor: "pointer", userSelect: "none",
            }}>
              <input
                type="checkbox"
                checked={!!checked[item.id]}
                onChange={() => onToggle(item.id)}
                style={{ marginTop: "0.15rem", accentColor: B.deep, cursor: "pointer", flexShrink: 0 }}
              />
              <span style={{ fontSize: "0.875rem", color: checked[item.id] ? B.muted : B.deep, lineHeight: 1.5 }}>
                {item.label}
              </span>
            </label>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────

export default function AccessibilityDashboard() {
  const [status, setStatus]         = useState("idle"); // idle | scanning | done | error
  const [results, setResults]       = useState(null);
  const [scannedPage, setScannedPage] = useState(null);
  const [scannedAt, setScannedAt]   = useState(null);
  const [errMsg, setErrMsg]         = useState(null);
  const [filterImpact, setFilterImpact] = useState("all");
  const [diChecked, setDiChecked]   = useState({});
  const iframeRef = useRef(null);

  // Load a page in the hidden off-screen iframe, then run axe on its document.
  // The user never leaves /admin/accessibility — single-tab experience.
  const runAudit = useCallback(async (page) => {
    setStatus("scanning");
    setScannedPage(page);
    setErrMsg(null);
    setResults(null);
    try {
      const { default: axe } = await import("axe-core");

      // Point the iframe at the target page and wait for it to load
      await new Promise((resolve, reject) => {
        const iframe = iframeRef.current;
        const timeout = setTimeout(() => reject(new Error("Page load timed out after 15s")), 15000);
        iframe.onload = () => { clearTimeout(timeout); resolve(); };
        iframe.onerror = (e) => { clearTimeout(timeout); reject(e); };
        iframe.src = page.path;
      });

      // Give React a moment to hydrate inside the iframe
      await new Promise(r => setTimeout(r, 1500));

      const iframeDoc = iframeRef.current.contentDocument;
      const axeResults = await axe.run(iframeDoc, {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
        },
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
  }, []);

  const toggleDi = useCallback((id) => {
    setDiChecked(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const violations    = results?.violations ?? [];
  const passes        = results?.passes ?? [];
  const incomplete    = results?.incomplete ?? [];
  const counts        = impactCounts(violations);

  const filteredViolations = filterImpact === "all"
    ? violations
    : violations.filter(v => v.impact === filterImpact);

  const diTotal    = DI_CHECKLIST.flatMap(s => s.items).length;
  const diComplete = Object.values(diChecked).filter(Boolean).length;

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
            {scannedPage ? `${window.location.origin}${scannedPage.path}` : window.location.origin}
            {scannedAt && <span style={{ marginLeft: "1rem", color: B.sand }}>Last scanned: {timeSince(scannedAt)}</span>}
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          {AUDIT_PAGES.map(page => {
            const isActive = scannedPage?.id === page.id;
            const scanning = status === "scanning" && isActive;
            return (
              <button
                key={page.id}
                onClick={() => runAudit(page)}
                disabled={status === "scanning"}
                style={{
                  background: isActive ? B.amber : "rgba(255,255,255,0.1)",
                  color: "#fff",
                  border: `1.5px solid ${isActive ? B.amber : "rgba(255,255,255,0.25)"}`,
                  borderRadius: "2rem",
                  padding: "0.55rem 1.4rem",
                  fontSize: "0.82rem",
                  fontWeight: isActive ? 600 : 400,
                  cursor: status === "scanning" ? "default" : "pointer",
                  fontFamily: "var(--font-body, Georgia, serif)",
                  opacity: status === "scanning" && !isActive ? 0.5 : 1,
                  transition: "all 0.2s",
                }}
              >
                {scanning ? "Scanning…" : page.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem 2rem 4rem" }}>

        {/* ── Idle state ── */}
        {status === "idle" && (
          <div style={{ textAlign: "center", padding: "4rem 2rem", color: B.muted }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🛡</div>
            <div style={{ fontSize: "1.1rem", marginBottom: "0.5rem", color: B.deep }}>Select a page to audit</div>
            <div style={{ fontSize: "0.875rem" }}>
              Click <strong style={{ color: B.deep }}>Landing Page</strong> or <strong style={{ color: B.deep }}>Intake Form</strong> in the header.
              axe loads the page in the background and scans it — no second tab needed.
            </div>
          </div>
        )}

        {/* ── Scanning ── */}
        {status === "scanning" && (
          <div style={{ textAlign: "center", padding: "4rem 2rem", color: B.muted }}>
            <div style={{ fontSize: "0.95rem" }}>Scanning page with axe-core…</div>
          </div>
        )}

        {/* ── Error ── */}
        {status === "error" && (
          <div style={{ background: "#fef2f2", border: "1.5px solid #dc2626", borderRadius: "0.75rem", padding: "1.5rem", color: "#dc2626", marginBottom: "1.5rem" }}>
            <strong>Audit failed.</strong> {errMsg}
          </div>
        )}

        {/* ── Results ── */}
        {status === "done" && results && (
          <>
            {/* Quality gate */}
            <QualityGate violations={violations} />

            {/* Metric row */}
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "2rem" }}>
              <MetricCard label="Critical"  count={counts.critical}  color={IMPACT_COLOR.critical}  />
              <MetricCard label="Serious"   count={counts.serious}   color={IMPACT_COLOR.serious}   />
              <MetricCard label="Moderate"  count={counts.moderate}  color={IMPACT_COLOR.moderate}  />
              <MetricCard label="Minor"     count={counts.minor}     color={IMPACT_COLOR.minor}     />
              <MetricCard label="Passes"    count={passes.length}    color={B.deep}                  />
              <MetricCard label="Review"    count={incomplete.length} color={B.sage}                 />
            </div>

            {/* Violations table */}
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
                          padding: "0.3rem 0.75rem",
                          borderRadius: "1rem",
                          border: `1.5px solid ${filterImpact === f ? (IMPACT_COLOR[f] ?? B.deep) : B.border}`,
                          background: filterImpact === f ? (f === "all" ? B.deep : `${IMPACT_COLOR[f]}18`) : "transparent",
                          color: filterImpact === f ? (f === "all" ? B.paper : (IMPACT_COLOR[f] ?? B.deep)) : B.muted,
                          fontSize: "0.75rem",
                          cursor: "pointer",
                          fontFamily: "var(--font-mono, monospace)",
                          letterSpacing: "0.03em",
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
                          <th key={h} style={{
                            padding: "0.75rem 1rem", textAlign: h === "Nodes" ? "center" : "left",
                            fontSize: "0.72rem", letterSpacing: "0.06em", textTransform: "uppercase",
                            color: B.muted, fontWeight: 600, fontFamily: "var(--font-mono, monospace)",
                            whiteSpace: "nowrap",
                          }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredViolations.length === 0
                        ? (
                          <tr>
                            <td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: B.muted }}>
                              No violations at this impact level.
                            </td>
                          </tr>
                        )
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

        {/* ── D&I Checklist — always visible ── */}
        <div style={{ borderTop: `1.5px solid ${B.border}`, paddingTop: "2rem" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <h2 style={{ fontFamily: "var(--font-heading, serif)", fontSize: "1.2rem", fontWeight: 400, margin: 0 }}>
              Diversity & Inclusion Checklist
            </h2>
            <span style={{ fontSize: "0.78rem", fontFamily: "var(--font-mono, monospace)", color: B.muted }}>
              {diComplete} / {diTotal} complete
            </span>
          </div>
          <p style={{ fontSize: "0.85rem", color: B.muted, marginBottom: "1.5rem", lineHeight: 1.6 }}>
            Manual review items — not automatically detectable by axe. Check each item as you verify it.
            Progress is saved in this browser session.
          </p>

          <div style={{ background: B.card, borderRadius: "0.75rem", border: `1.5px solid ${B.border}`, padding: "1.5rem 2rem" }}>
            <DiChecklist checked={diChecked} onToggle={toggleDi} />
          </div>
        </div>

      </div>

      {/* ── Hidden iframe — loads target pages off-screen for axe scanning ──
          position:fixed + left:-9999px keeps it off-screen but NOT display:none.
          display:none would hide all elements from axe, causing false positives. */}
      <iframe
        ref={iframeRef}
        title="Accessibility audit frame"
        style={{
          position: "fixed",
          left: "-9999px",
          top: 0,
          width: "1280px",
          height: "900px",
          border: "none",
          visibility: "hidden",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
