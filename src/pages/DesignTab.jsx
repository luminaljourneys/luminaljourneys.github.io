/**
 * DesignTab.jsx — Luminal Journeys
 * Typography and color design controls for admin users.
 *
 * Per text category, Tie can set:
 *   - Font size (pt) via stepper + slider
 *   - Font color via native color picker
 *
 * Color picker shows:
 *   - Current (draft) color as a clickable swatch
 *   - Hex value
 *   - "Was" swatch — the last saved color — so she can revert with one click
 *
 * "Actual Reference" section renders a live HTML mockup of where each token
 * appears on the site — updates in real time as sliders change.
 * No static screenshots needed.
 */

import { useState, useEffect } from 'react';
import { useDesignTokens }    from '../hooks/useDesignTokens.js';
import { DESIGN_TOKENS, defaultPtValues, defaultColors, applyDesignTokens } from '../lib/designDefaults.js';

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

// ── Color picker row ──────────────────────────────────────────────────────────
function ColorRow({ tokenKey, def, colorValue, savedColor, onChange }) {
  const isChanged = colorValue !== savedColor;
  const isDefault = colorValue === def.defaultColor;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "0.75rem",
      padding: "0.75rem 0",
      borderTop: `1px solid ${B.border}`,
    }}>
      {/* Label */}
      <div style={{
        fontSize: "0.72rem", color: B.sage,
        fontFamily: "var(--font-mono, monospace)",
        minWidth: "5rem", flexShrink: 0,
      }}>
        Font color
      </div>

      {/* Clickable color swatch — opens native picker */}
      <label
        title="Click to change color"
        style={{ position: "relative", flexShrink: 0, cursor: "pointer" }}
      >
        <input
          type="color"
          value={colorValue}
          onChange={e => onChange(e.target.value)}
          aria-label={`${def.label} font color`}
          style={{
            opacity: 0,
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            cursor: "pointer",
            border: "none",
            padding: 0,
          }}
        />
        <div style={{
          width: 34, height: 34,
          borderRadius: "0.45rem",
          background: colorValue,
          border: `2px solid ${B.border}`,
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.15)",
          flexShrink: 0,
        }} />
      </label>

      {/* Hex value */}
      <span style={{
        fontFamily: "var(--font-mono, monospace)",
        fontSize: "0.82rem",
        color: B.deep,
        letterSpacing: "0.04em",
        flex: 1,
      }}>
        {colorValue}
      </span>

      {/* Reset to default — only shows if not at default */}
      {!isDefault && (
        <button
          onClick={() => onChange(def.defaultColor)}
          title={`Reset to default (${def.defaultColor})`}
          style={{
            fontSize: "0.68rem", color: B.sage,
            background: "none", border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-mono, monospace)",
            padding: "0.15rem 0.35rem",
            flexShrink: 0,
          }}
        >↺ default</button>
      )}

      {/* "Was" — previous saved color, shown when draft differs from saved */}
      {isChanged && (
        <div style={{
          display: "flex", alignItems: "center", gap: "0.4rem",
          flexShrink: 0,
        }}>
          <span style={{
            fontSize: "0.68rem", color: B.sage,
            fontFamily: "var(--font-mono, monospace)",
          }}>was</span>
          <button
            onClick={() => onChange(savedColor)}
            title={`Revert to previous saved color (${savedColor})`}
            style={{
              width: 26, height: 26,
              borderRadius: "0.35rem",
              background: savedColor,
              border: `1.5px solid ${B.border}`,
              cursor: "pointer",
              padding: 0,
              flexShrink: 0,
            }}
            aria-label={`Revert to previous color ${savedColor}`}
          />
          <span style={{
            fontSize: "0.65rem", color: B.sage,
            fontFamily: "var(--font-mono, monospace)",
          }}>
            {savedColor}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Live Reference Preview ─────────────────────────────────────────────────────
// Renders a live HTML mockup of where each token appears on the site.
// Uses CSS vars (var(--lj-size-*), var(--lj-color-*)) directly so it
// updates automatically as sliders move — no static screenshots needed.
function LivePreview({ tokenKey }) {
  const wrap = {
    borderRadius: "0.5rem",
    border: `1px solid ${B.border}`,
    overflow: "hidden",
  };

  switch (tokenKey) {

    case "body":
      return (
        <div style={{ ...wrap, background: "#fff", padding: "1.25rem 1.5rem" }}>
          <p style={{
            fontFamily: "var(--font-body, Georgia, serif)",
            fontSize: "var(--lj-size-body)",
            color: "var(--lj-color-body)",
            lineHeight: 1.75,
            margin: 0,
          }}>
            The psychedelic industry is not regulated in the way most people assume.
            Our practice holds itself to a clinical standard regardless.
          </p>
        </div>
      );

    case "heading":
      return (
        <div style={{ ...wrap, background: "#F9F8F6", padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1.25rem" }}>
            {/* Roman numeral — fixed style, not controlled by this token */}
            <div style={{
              fontFamily: "var(--font-heading, 'DM Serif Display', Georgia, serif)",
              fontSize: "1.5rem",
              color: "#89a99e",
              fontStyle: "italic",
              flexShrink: 0,
              paddingTop: "0.1rem",
            }}>
              I
            </div>
            <h3 style={{
              fontFamily: "var(--font-heading, 'DM Serif Display', Georgia, serif)",
              fontSize: "var(--lj-size-heading)",
              color: "var(--lj-color-heading)",
              fontWeight: 400,
              margin: 0,
              lineHeight: 1.25,
            }}>
              Competence without compromise
            </h3>
          </div>
          <div style={{
            fontSize: "0.7rem",
            color: B.sage,
            fontFamily: "var(--font-mono, monospace)",
            marginTop: "0.75rem",
          }}>
            ↑ Slider controls the bold title. The italic "I" uses a separate fixed style.
          </div>
        </div>
      );

    case "nav":
      return (
        <div style={{ ...wrap, background: "#fff", padding: "0.85rem 1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "2rem", flexWrap: "wrap" }}>
            {["Our Practice", "The Process", "About Us"].map(link => (
              <span key={link} style={{
                fontFamily: "var(--font-body, system-ui, sans-serif)",
                fontSize: "var(--lj-size-nav)",
                color: "var(--lj-color-nav)",
                fontWeight: 500,
                letterSpacing: "0.01em",
              }}>
                {link}
              </span>
            ))}
          </div>
        </div>
      );

    case "form":
      return (
        <div style={{ ...wrap, background: "#F9F8F6", padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div>
            <div style={{
              fontFamily: "var(--font-body, system-ui, sans-serif)",
              fontSize: "var(--lj-size-form)",
              color: "var(--lj-color-form)",
              fontWeight: 500,
              marginBottom: "0.35rem",
            }}>
              First Name
            </div>
            <div style={{
              fontFamily: "var(--font-body, system-ui, sans-serif)",
              fontSize: "var(--lj-size-form)",
              color: "var(--lj-color-form)",
              padding: "0.5rem 0.8rem",
              border: `1px solid ${B.border}`,
              borderRadius: "0.375rem",
              background: "#fff",
            }}>
              Wang Si
            </div>
          </div>
          <div>
            <div style={{
              fontFamily: "var(--font-body, system-ui, sans-serif)",
              fontSize: "var(--lj-size-form)",
              color: "var(--lj-color-form)",
              fontWeight: 500,
              marginBottom: "0.35rem",
            }}>
              How did you hear about us?
            </div>
            <div style={{
              fontFamily: "var(--font-body, system-ui, sans-serif)",
              fontSize: "var(--lj-size-form)",
              color: B.sage,
              padding: "0.5rem 0.8rem",
              border: `1px solid ${B.border}`,
              borderRadius: "0.375rem",
              background: "#fff",
            }}>
              Select an option…
            </div>
          </div>
        </div>
      );

    case "micro":
      return (
        <div style={{ ...wrap, background: "#F9F8F6", padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "2.5rem", flexWrap: "wrap" }}>
            <div>
              <div style={{
                fontFamily: "var(--font-heading, 'DM Serif Display', Georgia, serif)",
                fontSize: "2.8rem",
                color: "#172f2d",
                fontWeight: 400,
                lineHeight: 1,
              }}>69</div>
              <div style={{
                fontFamily: "var(--font-body, system-ui, sans-serif)",
                fontSize: "var(--lj-size-micro)",
                color: "var(--lj-color-micro)",
                letterSpacing: "0.1em",
                fontWeight: 600,
                textTransform: "uppercase",
                marginTop: "0.4rem",
                lineHeight: 1.4,
              }}>
                COMBINED EXPERIENCE<br />IN WELLNESS & HEALTHCARE
              </div>
            </div>
            <div>
              <div style={{
                fontFamily: "var(--font-heading, 'DM Serif Display', Georgia, serif)",
                fontSize: "2.8rem",
                color: "#172f2d",
                fontWeight: 400,
                lineHeight: 1,
              }}>3</div>
              <div style={{
                fontFamily: "var(--font-body, system-ui, sans-serif)",
                fontSize: "var(--lj-size-micro)",
                color: "var(--lj-color-micro)",
                letterSpacing: "0.1em",
                fontWeight: 600,
                textTransform: "uppercase",
                marginTop: "0.4rem",
              }}>
                PRACTITIONERS
              </div>
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}

// ── Single token card ─────────────────────────────────────────────────────────
function TokenCard({ tokenKey, def, ptValue, colorValue, savedColor, onPtChange, onColorChange }) {
  const pt          = ptValue ?? def.defaultPt;
  const color       = colorValue ?? def.defaultColor;
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
            onClick={() => onPtChange(def.defaultPt)}
            title="Reset size to default"
            style={{
              fontSize: "0.7rem", color: B.sage, background: "none", border: "none",
              cursor: "pointer", fontFamily: "var(--font-mono, monospace)",
              padding: "0.2rem 0.4rem", marginTop: "-0.1rem", flexShrink: 0,
            }}
          >↺ reset size</button>
        )}
      </div>

      {/* Size stepper row */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>

        <button
          onClick={() => onPtChange(Math.max(def.minPt, +(pt - STEP).toFixed(1)))}
          aria-label={`Decrease ${def.label} size`}
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
          onClick={() => onPtChange(Math.min(def.maxPt, +(pt + STEP).toFixed(1)))}
          aria-label={`Increase ${def.label} size`}
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
          onChange={e => onPtChange(+e.target.value)}
          aria-label={`${def.label} size in points`}
          style={{ flex: 1, accentColor: B.teal, height: 4, cursor: "pointer" }}
        />

        <div style={{
          fontSize: "0.65rem", color: B.sage,
          fontFamily: "var(--font-mono, monospace)", whiteSpace: "nowrap",
        }}>
          {def.minPt}–{def.maxPt} pt
        </div>
      </div>

      {/* WCAG size warning */}
      <WcagBadge pt={pt} wcagMinPt={def.wcagMinPt} />

      {/* Color picker row */}
      <ColorRow
        tokenKey={tokenKey}
        def={def}
        colorValue={color}
        savedColor={savedColor ?? def.defaultColor}
        onChange={onColorChange}
      />

      {/* Inline preview — uses direct draft values */}
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
        <div style={{ fontSize: previewSize, color, lineHeight: 1.6 }}>
          The quiet power of inner clarity.
        </div>
      </div>

      {/* Actual Reference — live HTML that updates as sliders move */}
      <div style={{
        borderTop: `1px solid ${B.border}`,
        paddingTop: "1rem",
      }}>
        <div style={{
          fontSize: "0.62rem", letterSpacing: "0.14em", textTransform: "uppercase",
          color: B.sage, fontFamily: "var(--font-mono, monospace)", marginBottom: "0.7rem",
        }}>
          Actual Reference — live
        </div>

        <LivePreview tokenKey={tokenKey} />

        {def.referenceCaption && (
          <div style={{
            fontSize: "0.83rem",
            fontWeight: 500,
            color: B.teal,
            marginTop: "0.55rem",
            lineHeight: 1.5,
          }}>
            {def.referenceCaption}
          </div>
        )}
      </div>

    </div>
  );
}

// ── Main Design tab ───────────────────────────────────────────────────────────
export default function DesignTab() {
  const {
    ptValues: savedPt,
    colors:   savedColors,
    saveTokens,
    loading,
    saving,
  } = useDesignTokens();

  // draft holds both pt values and colors together
  const [draft,  setDraft]  = useState(null);   // { pt: {...}, colors: {...} }
  const [saved,  setSaved]  = useState(false);

  // Seed draft once Firestore values load
  useEffect(() => {
    if (!loading && draft === null) {
      setDraft({ pt: { ...savedPt }, colors: { ...savedColors } });
    }
  }, [loading, savedPt, savedColors, draft]);

  // Live-preview: apply draft to CSS vars immediately as she changes anything
  useEffect(() => {
    if (draft) applyDesignTokens(draft.pt, draft.colors);
  }, [draft]);

  const handlePtChange = (key, pt) => {
    setDraft(d => ({ ...d, pt: { ...d.pt, [key]: pt } }));
    setSaved(false);
  };

  const handleColorChange = (key, color) => {
    setDraft(d => ({ ...d, colors: { ...d.colors, [key]: color } }));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!draft) return;
    await saveTokens(draft.pt, draft.colors);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setDraft({ pt: defaultPtValues(), colors: defaultColors() });
    setSaved(false);
  };

  const hasChanges = draft && (
    JSON.stringify(draft.pt)     !== JSON.stringify(savedPt) ||
    JSON.stringify(draft.colors) !== JSON.stringify(savedColors)
  );

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
          Typography & Color Controls
        </h2>
        <p style={{
          fontSize: "0.82rem", color: B.sage,
          fontFamily: "var(--font-mono, monospace)", margin: 0, lineHeight: 1.6,
        }}>
          Set font sizes and colors for each text category. Sizes are in{" "}
          <strong style={{ color: B.deep }}>points (pt)</strong> — same as Word and Google Docs.
          12pt = standard body text. Changes preview instantly and apply globally after saving.
        </p>
      </div>

      {/* Token cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {Object.entries(DESIGN_TOKENS).map(([key, def]) => (
          <TokenCard
            key={key}
            tokenKey={key}
            def={def}
            ptValue={draft.pt[key]}
            colorValue={draft.colors[key]}
            savedColor={savedColors[key] ?? def.defaultColor}
            onPtChange={(pt)    => handlePtChange(key, pt)}
            onColorChange={(c)  => handleColorChange(key, c)}
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
            ? "✓ Saved — live globally after Publish"
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
          Reset All to Defaults
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
