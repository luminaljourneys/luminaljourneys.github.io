/**
 * DesignTab.jsx — Luminal Journeys
 * Typography design controls for admin users.
 *
 * Tie can set font sizes (in pt) for each text category.
 * Changes apply globally across the site immediately after saving.
 * WCAG minimum warnings display when below accessible thresholds.
 */

import { useState, useEffect } from 'react';
import { useDesignTokens }    from '../hooks/useDesignTokens.js';
import { DESIGN_TOKENS, defaultPtValues, applyDesignTokens } from '../lib/designDefaults.js';

const B = {
  deep:   "#172f2d",
  teal:   "#224e4a",
  sage:   "#89a99e",
  amber:  "#bf8a3e",
  paper:  "#F9F8F6",
  border: "rgba(23,47,45,0.1)",
  warn:   "#bf8a3e",
  err:    "#c0392b",
  green:  "#27ae60",
};

const STEP = 0.5; // pt increment per click

// ── WCAG warning badge ────────────────────────────────────────────────────────
function WcagBadge({ pt, wcagMinPt }) {
  if (pt >= wcagMinPt) return null;
  const isCritical = pt < wcagMinPt - 2;
  return (
    <div role="alert" style={{
      display: "flex", alignItems: "flex-start", gap: "0.4rem",
      marginTop: "0.25rem",
      padding: "0.4rem 0.75rem",
      borderRadius: "0.4rem",
      background: isCritical ? "rgba(192,57,43,0.07)" : "rgba(191,138,62,0.07)",
      border: `1px solid ${(isCritical ? B.err : B.warn)}50`,
      color: isCritical ? B.err : B.warn,
      fontSize: "0.75rem",
      fontFamily: "var(--font-mono, monospace)",
      lineHeight: 1.5,
    }}>
      <span aria-hidden="true">{isCritical ? "⛔" : "⚠"}</span>
      <span>
        {isCritical
          ? `${pt}pt may be illegible for users with low vision. WCAG recommends ≥ ${wcagMinPt}pt.`
          : `Below the recommended ${wcagMinPt}pt minimum for inclusive readability.`}
      </span>
    </div>
  );
}

// ── Single token card ─────────────────────────────────────────────────────────
function TokenCard({ tokenKey, def, ptValue, onChange }) {
  const pt          = ptValue ?? def.defaultPt;
  const previewSize = `${(pt / 12).toFixed(4)}rem`;
  const isDefault   = pt === def.defaultPt;

  return (
    <div style={{
      background: "#fff",
      border: `1px solid ${B.border}`,
      borderRadius: "0.75rem",
      padding: "1.5rem",
      display: "flex", flexDirection: "column", gap: "1rem",
    }}>

      {/* Label + description */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontWeight: 600, color: B.deep, fontSize: "0.92rem", marginBottom: "0.2rem" }}>
            {def.label}
          </div>
          <div style={{ fontSize: "0.75rem", color: B.sage, fontFamily: "var(--font-mono, monospace)" }}>
            {def.description}
          </div>
        </div>
        {!isDefault && (
          <button
            onClick={() => onChange(def.defaultPt)}
            title="Reset to default"
            style={{
              fontSize: "0.7rem", color: B.sage, background: "none", border: "none",
              cursor: "pointer", fontFamily: "var(--font-mono, monospace)",
              padding: "0.2rem 0.4rem", marginTop: "-0.1rem", flexShrink: 0,
            }}
          >↺ reset</button>
        )}
      </div>

      {/* Stepper row */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>

        <button
          onClick={() => onChange(Math.max(def.minPt, +(pt - STEP).toFixed(1)))}
          aria-label={`Decrease ${def.label}`}
          style={{
            width: 34, height: 34, flexShrink: 0,
            border: `1px solid ${B.border}`, borderRadius: "0.4rem",
            background: B.paper, cursor: "pointer",
            fontSize: "1.1rem", color: B.deep, lineHeight: 1,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >−</button>

        <div style={{ textAlign: "center", minWidth: "5rem" }}>
          <span style={{
            fontFamily: "var(--font-mono, monospace)",
            fontWeight: 700, fontSize: "1.35rem", color: B.deep,
          }}>{pt % 1 === 0 ? pt : pt.toFixed(1)}</span>
          <span style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "0.75rem", color: B.sage, marginLeft: "0.2rem",
          }}>pt</span>
        </div>

        <button
          onClick={() => onChange(Math.min(def.maxPt, +(pt + STEP).toFixed(1)))}
          aria-label={`Increase ${def.label}`}
          style={{
            width: 34, height: 34, flexShrink: 0,
            border: `1px solid ${B.border}`, borderRadius: "0.4rem",
            background: B.paper, cursor: "pointer",
            fontSize: "1.1rem", color: B.deep, lineHeight: 1,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >+</button>

        <input
          type="range"
          min={def.minPt}
          max={def.maxPt}
          step={STEP}
          value={pt}
          onChange={e => onChange(+e.target.value)}
          aria-label={`${def.label} size in points`}
          style={{ flex: 1, accentColor: B.teal, height: 4, cursor: "pointer" }}
        />

        {/* Range endpoints */}
        <div style={{
          fontSize: "0.65rem", color: B.sage,
          fontFamily: "var(--font-mono, monospace)", whiteSpace: "nowrap",
        }}>
          {def.minPt}–{def.maxPt} pt
        </div>
      </div>

      {/* WCAG warning */}
      <WcagBadge pt={pt} wcagMinPt={def.wcagMinPt} />

      {/* Live preview */}
      <div style={{
        padding: "0.85rem 1rem",
        background: B.paper,
        borderRadius: "0.5rem",
        border: `1px solid ${B.border}`,
      }}>
        <div style={{
          fontSize: "0.62rem", letterSpacing: "0.14em", textTransform: "uppercase",
          color: B.sage, fontFamily: "var(--font-mono, monospace)", marginBottom: "0.5rem",
        }}>
          Preview · {(pt / 12 * 16).toFixed(1)}px
        </div>
        <div style={{ fontSize: previewSize, color: B.deep, lineHeight: 1.6 }}>
          The quiet power of inner clarity.
        </div>
      </div>
    </div>
  );
}

// ── Main Design tab ───────────────────────────────────────────────────────────
export default function DesignTab() {
  const { ptValues: savedValues, saveTokens, loading, saving } = useDesignTokens();
  const [draft, setDraft] = useState(null);
  const [saved, setSaved] = useState(false);

  // Seed draft once saved values load
  useEffect(() => {
    if (!loading && draft === null) setDraft({ ...savedValues });
  }, [loading, savedValues, draft]);

  // Live-preview: apply draft to CSS vars immediately (admin sees changes as they drag)
  useEffect(() => {
    if (draft) applyDesignTokens(draft);
  }, [draft]);

  const handleChange = (key, pt) => {
    setDraft(d => ({ ...d, [key]: pt }));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!draft) return;
    await saveTokens(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setDraft(defaultPtValues());
    setSaved(false);
  };

  const hasChanges = draft && JSON.stringify(draft) !== JSON.stringify(savedValues);

  if (loading || !draft) {
    return (
      <div style={{
        padding: "4rem", textAlign: "center",
        color: B.sage, fontFamily: "var(--font-mono, monospace)", fontSize: "0.82rem",
      }}>
        Loading design tokens…
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 760, paddingBottom: "6rem" }}>

      {/* Section header */}
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{
          fontFamily: "'DM Serif Display', Georgia, serif",
          fontSize: "1.6rem", fontWeight: 400, color: B.deep,
          margin: 0, marginBottom: "0.5rem",
        }}>
          Typography Controls
        </h2>
        <p style={{
          fontSize: "0.82rem", color: B.sage,
          fontFamily: "var(--font-mono, monospace)", margin: 0, lineHeight: 1.6,
        }}>
          Set font sizes for each text category. Sizes are in <strong style={{ color: B.deep }}>points (pt)</strong> — the same unit used in Word and Google Docs.
          12pt = standard body text. Changes apply globally across the site after saving.
        </p>
      </div>

      {/* Token cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {Object.entries(DESIGN_TOKENS).map(([key, def]) => (
          <TokenCard
            key={key}
            tokenKey={key}
            def={def}
            ptValue={draft[key]}
            onChange={(pt) => handleChange(key, pt)}
          />
        ))}
      </div>

      {/* Sticky save bar */}
      <div style={{
        position: "sticky", bottom: "1rem",
        marginTop: "2rem",
        display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap",
        padding: "0.85rem 1.25rem",
        background: B.deep,
        borderRadius: "1rem",
        boxShadow: "0 8px 32px rgba(23,47,45,0.3)",
      }}>

        <div style={{
          fontSize: "0.78rem",
          fontFamily: "var(--font-mono, monospace)",
          color: saved
            ? B.green
            : hasChanges
              ? "rgba(255,255,255,0.65)"
              : "rgba(255,255,255,0.3)",
        }}>
          {saved
            ? "✓ Saved — live globally"
            : hasChanges
              ? "Unsaved changes"
              : "No changes"}
        </div>

        <div style={{ flex: 1 }} />

        <button
          onClick={handleReset}
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "rgba(255,255,255,0.7)",
            padding: "0.45rem 1.1rem", borderRadius: "2rem",
            cursor: "pointer", fontSize: "0.8rem",
          }}
        >
          Reset to Defaults
        </button>

        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          style={{
            background: hasChanges ? B.amber : "rgba(255,255,255,0.12)",
            color: hasChanges ? "#fff" : "rgba(255,255,255,0.35)",
            border: "none",
            padding: "0.5rem 1.5rem", borderRadius: "2rem",
            cursor: hasChanges ? "pointer" : "not-allowed",
            fontSize: "0.88rem", fontWeight: 600,
            transition: "background 0.2s, color 0.2s",
          }}
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
