/**
 * IntakePage.jsx — Luminal Journeys
 * Dynamic multi-step intake form driven by Firestore via useFormConfig().
 * Falls back to DEFAULT_FIELDS if no Firestore doc exists yet.
 */

import React, { useState, useMemo } from "react";
import MockupBanner from "../components/MockupBanner.jsx";
import { navigate } from "../App.jsx";
import { useFormConfig } from "../hooks/useFormConfig.js";
import { useEditMode } from "../context/EditModeContext.jsx";

// ─── Styles ───────────────────────────────────────────────────────────────────
const inputStyle = (focused, name, value) => {
  const hasValue = value && value.toString().trim().length > 0;
  const isValid  = hasValue && focused !== name;
  const isFocused = focused === name;
  let borderColor = "var(--color-border)";
  let shadow      = "none";
  let bg          = "var(--color-bg-soft)";
  if (isFocused) {
    borderColor = "var(--color-primary)";
    shadow      = "0 0 0 3px rgba(44,95,74,0.1)";
  } else if (isValid) {
    borderColor = "var(--color-accent)";
    shadow      = "0 0 0 3px rgba(74,140,106,0.08)";
    bg          = "rgba(74,140,106,0.04)";
  }
  return {
    width: "100%", padding: "0.8rem 1rem", boxSizing: "border-box",
    border: "1.5px solid " + borderColor, borderRadius: "0.6rem",
    fontSize: "0.92rem", outline: "none", background: bg,
    color: "#172f2d", fontFamily: "'DM Sans', sans-serif",
    transition: "border 0.2s, box-shadow 0.2s, background 0.2s",
    boxShadow: shadow,
  };
};

const labelStyle = {
  display: "block", fontSize: "0.72rem", letterSpacing: "0.06em",
  textTransform: "uppercase", color: "#3a5450", marginBottom: "0.4rem",
  fontFamily: "var(--font-mono)",
};

function FieldWrapper({ label, required, children }) {
  return (
    <div style={{ marginBottom: "1.4rem" }}>
      <label style={labelStyle}>
        {label}
        {required && <span style={{ color: "#bf8a3e" }}> *</span>}
      </label>
      {children}
    </div>
  );
}

// ─── Dynamic field renderer ───────────────────────────────────────────────────
function DynamicField({ field, form, focused, setFocused, onChange }) {
  const { name, type, label, placeholder, required, options } = field;
  const rawValue = form[name];
  // Checkboxes store arrays; everything else stores strings
  const value     = type === "checkbox" ? (Array.isArray(rawValue) ? rawValue : []) : (rawValue ?? "");

  const sharedProps = {
    value,
    onChange: (e) => onChange(name, e.target.value),
    onFocus: () => setFocused(name),
    onBlur:  () => setFocused(null),
    style: inputStyle(focused, name, value),
  };

  let input;

  if (type === "select") {
    input = (
      <select {...sharedProps} style={{ ...sharedProps.style, appearance: "none" }}>
        <option value="">{placeholder || "Select an option"}</option>
        {(options || []).map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    );

  } else if (type === "radio") {
    input = (
      <div style={{ display: "flex", gap: "1rem", fontFamily: "'DM Sans', sans-serif", flexWrap: "wrap" }}>
        {(options || []).map((opt) => (
          <label key={opt} style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            cursor: "pointer", fontSize: "0.92rem", color: "#172f2d",
            padding: "0.55rem 1rem",
            background: value === opt ? "rgba(44,95,74,0.07)" : "transparent",
            border: "1.5px solid " + (value === opt ? "var(--color-primary)" : "var(--color-border)"),
            borderRadius: "0.5rem", transition: "all 0.15s",
          }}>
            <input
              type="radio" name={name} value={opt}
              checked={value === opt}
              onChange={(e) => onChange(name, e.target.value)}
              style={{ accentColor: "var(--color-primary)" }}
            />
            {opt}
          </label>
        ))}
      </div>
    );

  } else if (type === "checkbox") {
    input = (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontFamily: "'DM Sans', sans-serif" }}>
        {(options || []).map((opt) => {
          const checked = value.includes(opt);
          return (
            <label key={opt} style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              cursor: "pointer", fontSize: "0.92rem", color: "#172f2d",
              padding: "0.55rem 1rem",
              background: checked ? "rgba(44,95,74,0.07)" : "transparent",
              border: "1.5px solid " + (checked ? "var(--color-primary)" : "var(--color-border)"),
              borderRadius: "0.5rem", transition: "all 0.15s",
            }}>
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...value, opt]
                    : value.filter((v) => v !== opt);
                  onChange(name, next);
                }}
                style={{ accentColor: "var(--color-primary)", width: 16, height: 16 }}
              />
              {opt}
            </label>
          );
        })}
      </div>
    );

  } else if (type === "yesno") {
    input = (
      <div style={{ display: "flex", gap: "0.75rem" }}>
        {["Yes", "No"].map((opt) => (
          <button key={opt} type="button" onClick={() => onChange(name, opt)}
            style={{
              flex: 1, padding: "0.85rem 1rem", cursor: "pointer",
              border: "1.5px solid " + (value === opt ? "var(--color-primary)" : "var(--color-border)"),
              borderRadius: "0.6rem",
              background: value === opt ? "rgba(44,95,74,0.08)" : "transparent",
              color: value === opt ? "var(--color-primary)" : "#3a5450",
              fontFamily: "'DM Sans', sans-serif", fontSize: "0.95rem",
              fontWeight: value === opt ? 600 : 400, transition: "all 0.15s",
            }}>
            {opt}
          </button>
        ))}
      </div>
    );

  } else if (type === "rating") {
    const max  = parseInt(options?.[0]) || 5;
    const nums = Array.from({ length: max }, (_, i) => i + 1);
    input = (
      <div>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {nums.map((n) => {
            const sel = parseInt(value) === n;
            return (
              <button key={n} type="button" onClick={() => onChange(name, String(n))}
                style={{
                  width: 44, height: 44, borderRadius: "0.5rem", cursor: "pointer",
                  border: "1.5px solid " + (sel ? "var(--color-primary)" : "var(--color-border)"),
                  background: sel ? "var(--color-primary)" : "transparent",
                  color: sel ? "#fff" : "#3a5450",
                  fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem",
                  fontWeight: 600, transition: "all 0.15s",
                }}>
                {n}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.45rem", fontSize: "0.7rem", color: "#89a99e", fontFamily: "var(--font-mono)" }}>
          <span>1 — Not at all</span>
          <span>{max} — Extremely</span>
        </div>
      </div>
    );

  } else if (type === "statement") {
    // Read-only display block — not an input, renders early
    return (
      <div style={{
        padding: "1.1rem 1.4rem",
        background: "rgba(191,138,62,0.05)",
        borderLeft: "3px solid #bf8a3e",
        borderRadius: "0 0.5rem 0.5rem 0",
        marginBottom: "1.4rem",
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {label && (
          <div style={{ fontWeight: 600, color: "#172f2d", marginBottom: placeholder ? "0.4rem" : 0, fontSize: "0.95rem" }}>
            {label}
          </div>
        )}
        {placeholder && (
          <div style={{ color: "#3a5450", fontSize: "0.88rem", lineHeight: 1.7 }}>{placeholder}</div>
        )}
      </div>
    );

  } else if (type === "textarea") {
    input = (
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        onFocus={() => setFocused(name)}
        onBlur={() => setFocused(null)}
        rows={5}
        style={{ ...inputStyle(focused, name, value), resize: "vertical" }}
      />
    );

  } else {
    // text, email, tel, date (calendar), number, etc.
    input = (
      <input type={type} placeholder={placeholder} {...sharedProps} />
    );
  }

  return (
    <FieldWrapper label={label} required={required}>
      {input}
    </FieldWrapper>
  );
}

// ─── Pair half-width fields into rows ─────────────────────────────────────────
function renderStepFields(stepFields, form, focused, setFocused, onChange) {
  const rows = [];
  const sorted = [...stepFields].sort((a, b) => a.order - b.order);
  let i = 0;
  while (i < sorted.length) {
    const curr = sorted[i];
    const next = sorted[i + 1];
    if (curr.halfWidth && next?.halfWidth) {
      rows.push(
        <div key={curr.id + "-row"} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <DynamicField key={curr.id} field={curr} form={form} focused={focused} setFocused={setFocused} onChange={onChange} />
          <DynamicField key={next.id} field={next} form={form} focused={focused} setFocused={setFocused} onChange={onChange} />
        </div>
      );
      i += 2;
    } else {
      rows.push(
        <DynamicField key={curr.id} field={curr} form={form} focused={focused} setFocused={setFocused} onChange={onChange} />
      );
      i += 1;
    }
  }
  return rows;
}

// ─── Confirm step — auto-generated from steps + form values ──────────────────
function ConfirmStep({ steps, fields, form }) {
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {steps.map((step, stepIdx) => {
        const stepFields = fields
          .filter((f) => f.step === stepIdx && f.type !== "statement")
          .sort((a, b) => a.order - b.order);
        if (!stepFields.length) return null;
        return (
          <div key={step.id} style={{
            marginBottom: "1.8rem", background: "#e6ddd0",
            borderRadius: "0.8rem", padding: "1.5rem",
            border: "1px solid #e5e7eb",
          }}>
            <div style={{
              fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase",
              color: "#89a99e", fontFamily: "var(--font-mono)", marginBottom: "1rem",
            }}>{step.title}</div>
            {stepFields.map(({ name, label }) => {
              const v = form[name];
              const display = Array.isArray(v)
                ? (v.length ? v.join(", ") : "—")
                : (v || "—");
              return (
                <div key={name} style={{
                  display: "flex", justifyContent: "space-between",
                  marginBottom: "0.6rem", fontSize: "0.88rem",
                }}>
                  <span style={{ color: "#89a99e", fontFamily: "var(--font-mono)" }}>{label}</span>
                  <span style={{ color: "#172f2d", fontWeight: 500, textAlign: "right", maxWidth: "60%" }}>
                    {display}
                  </span>
                </div>
              );
            })}
          </div>
        );
      })}
      <p style={{
        fontSize: "0.78rem", color: "#89a99e", fontFamily: "var(--font-mono)",
        lineHeight: 1.6, marginBottom: "1.5rem",
      }}>
        By submitting this form, you consent to being contacted by Luminal Journeys to schedule
        your appointment. Your information is kept private and never shared.
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
// ─── Edit Mode Shortcut Bar ───────────────────────────────────────────────────
function FormEditBar() {
  const { isEditMode } = useEditMode();
  if (!isEditMode) return null;
  return (
    <div style={{
      background: "rgba(23,47,45,0.06)", borderBottom: "1.5px solid rgba(23,47,45,0.12)",
      padding: "0.5rem clamp(1rem, 4vw, 2.5rem)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <span style={{
        fontSize: "0.75rem", color: "#3a5450", fontFamily: "var(--font-mono)",
        letterSpacing: "0.06em",
      }}>
        ✎ Edit mode — you can add, reorder, or remove form fields in the Form Builder
      </span>
      <button
        onClick={() => navigate("/admin?tab=form")}
        style={{
          background: "#172f2d", color: "#F9F8F6", border: "none",
          padding: "0.4rem 1.1rem", borderRadius: "2rem", cursor: "pointer",
          fontSize: "0.78rem", fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
          letterSpacing: "0.02em", whiteSpace: "nowrap",
        }}
      >
        Edit Form Fields →
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function IntakePage() {
  const { fields, steps, loading } = useFormConfig();
  const [step, setStep]           = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [focused, setFocused]     = useState(null);

  // Build initial form state — checkboxes get [] arrays, everything else gets ""
  const [form, setForm] = useState({});

  // Sync form keys when fields change (first load from Firestore)
  React.useEffect(() => {
    setForm((prev) => {
      const next = {};
      fields.forEach((f) => {
        if (f.type === "statement") return;      // no value — display only
        if (f.type === "checkbox") {
          next[f.name] = Array.isArray(prev[f.name]) ? prev[f.name] : [];
        } else {
          next[f.name] = prev[f.name] ?? "";
        }
      });
      return next;
    });
  }, [fields]);

  const onChange = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  // All step labels + final Confirm step
  const STEP_LABELS = [...steps.map((s) => s.title), "Confirm"];
  const totalSteps  = STEP_LABELS.length;
  const isConfirm   = step === steps.length;

  // Validate required fields — statements skipped, checkboxes need ≥1 selection
  const canAdvance = useMemo(() => {
    if (isConfirm) return true;
    const required = fields.filter((f) => f.step === step && f.required && f.type !== "statement");
    return required.every((f) => {
      const v = form[f.name];
      if (Array.isArray(v)) return v.length > 0;
      return (v ?? "").toString().trim() !== "";
    });
  }, [step, fields, form, isConfirm]);

  // Current step's fields
  const currentFields = useMemo(
    () => fields.filter((f) => f.step === step).sort((a, b) => a.order - b.order),
    [step, fields]
  );

  // Submitted state
  const submitterName = form["preferredName"] || form["firstName"] || "there";
  const submitterEmail = form["email"] || "";

  if (submitted) {
    return (
      <div data-testid="thank-you" style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--color-bg)", fontFamily: "'DM Serif Display', Georgia, serif",
        padding: "2rem", textAlign: "center",
      }}>
        <div>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✦</div>
          <h1 style={{ fontSize: "2.8rem", fontWeight: 400, color: "#172f2d", marginBottom: "1rem" }}>
            Thank you, {submitterName}.
          </h1>
          <p style={{
            fontSize: "1.1rem", color: "#3a5450", fontFamily: "'DM Sans', sans-serif",
            fontWeight: 300, maxWidth: 440, margin: "0 auto 2rem", lineHeight: 1.7,
          }}>
            {submitterEmail
              ? <>We've received your intake form and will reach out to <strong>{submitterEmail}</strong> within 1–2 business days to schedule your first visit.</>
              : "We've received your intake form and will be in touch shortly to schedule your first visit."
            }
          </p>
          <button onClick={() => navigate("/")} style={{
            color: "var(--color-primary)", fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.9rem", letterSpacing: "0.06em", background: "none", border: "none",
            cursor: "pointer", borderBottom: "1px solid rgba(155,94,82,0.4)", padding: 0,
          }}>← Back to home</button>
        </div>
        <MockupBanner />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)", fontFamily: "'DM Serif Display', Georgia, serif" }}>

      {/* EDIT MODE SHORTCUT BAR */}
      <FormEditBar />

      {/* TOP BAR */}
      <div style={{
        padding: "1.2rem clamp(1rem, 4vw, 2.5rem)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        borderBottom: "1px solid #e5e7eb", background: "#F9F8F6",
      }}>
        <button onClick={() => navigate("/")} style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", fontWeight: 600,
          color: "#172f2d", background: "none", border: "none", cursor: "pointer",
          letterSpacing: "0.18em", textTransform: "uppercase",
        }}>
          Luminal Journeys
        </button>
        <span style={{
          fontSize: "0.8rem", fontFamily: "var(--font-mono)",
          color: "#89a99e", letterSpacing: "0.08em",
        }}>
          New Client Intake
        </span>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "2.5rem clamp(1rem, 4vw, 2rem) 0" }}>

        {/* PROGRESS BAR */}
        <div data-testid="progress-bar" style={{ display: "flex", gap: "0.5rem", marginBottom: "2.5rem" }}>
          {STEP_LABELS.map((label, i) => (
            <div key={i} style={{ flex: 1 }}>
              <div style={{
                height: 3, borderRadius: 2,
                background: i <= step ? "#224e4a" : "rgba(137,169,158,0.25)",
                transition: "background 0.3s",
              }} />
              <div style={{
                fontSize: "0.65rem", marginTop: "0.4rem",
                fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: i <= step ? "#172f2d" : "#89a99e",
                transition: "color 0.3s",
              }}>{label}</div>
            </div>
          ))}
        </div>

        {/* STEP HEADER */}
        <div data-testid="step-counter" style={{
          marginBottom: "0.3rem", fontFamily: "var(--font-mono)",
          fontSize: "0.78rem", color: "#89a99e", letterSpacing: "0.08em",
        }}>
          Step {step + 1} of {totalSteps}
        </div>
        <h2 style={{
          fontSize: "2rem", fontWeight: 400, color: "var(--color-primary)",
          marginBottom: "0.5rem", marginTop: 0,
        }}>
          {STEP_LABELS[step]}
        </h2>
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: "0.95rem",
          color: "#3a5450", marginBottom: "2rem", marginTop: 0,
        }}>
          {isConfirm
            ? "Everything look right? Review and submit when ready."
            : (steps[step]?.description ?? "")}
        </p>

        {/* LOADING SKELETON */}
        {loading && !isConfirm && (
          <div style={{
            display: "flex", flexDirection: "column", gap: "1.2rem", opacity: 0.4,
          }}>
            {[1, 2, 3].map((k) => (
              <div key={k} style={{
                height: 52, borderRadius: "0.6rem",
                background: "rgba(23,47,45,0.08)", animation: "pulse 1.4s infinite",
              }} />
            ))}
          </div>
        )}

        {/* FORM FIELDS — current data step */}
        {!loading && !isConfirm && (
          <div>
            {renderStepFields(currentFields, form, focused, setFocused, onChange)}
          </div>
        )}

        {/* CONFIRM STEP */}
        {isConfirm && (
          <div data-testid="confirm-step">
            <ConfirmStep steps={steps} fields={fields} form={form} />
          </div>
        )}

        {/* NAV BUTTONS */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginTop: "1rem", paddingBottom: "3rem",
        }}>
          {step > 0 ? (
            <button data-testid="btn-back" onClick={() => setStep((s) => s - 1)} style={{
              background: "none", border: "1.5px solid rgba(23,47,45,0.15)",
              color: "#89a99e", padding: "0.75rem 1.8rem", borderRadius: "2rem",
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem",
            }}>← Back</button>
          ) : <div />}

          {!isConfirm ? (
            <button
              data-testid="btn-continue"
              onClick={() => canAdvance && setStep((s) => s + 1)}
              disabled={!canAdvance}
              style={{
                background: canAdvance ? "var(--color-primary)" : "rgba(23,47,45,0.2)",
                color: canAdvance ? "#fff" : "#89a99e",
                padding: "0.85rem 2.4rem", borderRadius: "2rem", border: "none",
                cursor: canAdvance ? "pointer" : "not-allowed",
                fontFamily: "'DM Sans', sans-serif", fontSize: "0.95rem",
                fontWeight: 600, transition: "all 0.2s",
              }}
            >Continue →</button>
          ) : (
            <button data-testid="btn-submit" onClick={() => setSubmitted(true)} style={{
              background: "#bf8a3e", color: "#F9F8F6",
              padding: "0.85rem 2.4rem", borderRadius: "2rem", border: "none",
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.95rem", fontWeight: 600, transition: "all 0.2s",
            }}>Submit Intake ✦</button>
          )}
        </div>
      </div>

      <div data-testid="intake-footer" style={{
        textAlign: "center", padding: "1.5rem",
        fontFamily: "var(--font-mono)", fontSize: "0.75rem",
        color: "#89a99e", borderTop: "1px solid var(--color-border)",
      }}>
        © {new Date().getFullYear()} Luminal Journeys · All rights reserved
      </div>
      <MockupBanner />
    </div>
  );
}
