/**
 * IntakePage.jsx — Luminal Journeys
 * Dynamic multi-step intake form driven by Firestore via useFormConfig().
 *
 * Edit Mode (Squarespace-style):
 *  – (–) delete circle on each field   — always visible, no hover required
 *  – (+) add circle to the right of each field row — inserts after that field
 *  – Click field body to open the inline editor
 *  – Changes write to Firestore and instantly sync with the Admin Form Builder
 */

import React, { useState, useMemo } from "react";
import MockupBanner from "../components/MockupBanner.jsx";
import { navigate } from "../App.jsx";
import { useFormConfig } from "../hooks/useFormConfig.js";
import { useEditMode } from "../context/EditModeContext.jsx";
import NoteMarker from "../components/NoteMarker.jsx";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { ENV } from "../lib/collections";

// ─── Field type metadata ───────────────────────────────────────────────────────
const FIELD_TYPE_META = {
  text:      { label: "Short Text",      icon: "Aa", hasOptions: false },
  textarea:  { label: "Long Answer",     icon: "¶",  hasOptions: false },
  email:     { label: "Email",           icon: "@",  hasOptions: false },
  tel:       { label: "Phone Number",    icon: "☎",  hasOptions: false },
  number:    { label: "Number",          icon: "#",  hasOptions: false },
  date:      { label: "Date",            icon: "📅", hasOptions: false },
  yesno:     { label: "Yes / No",        icon: "◐",  hasOptions: false },
  rating:    { label: "Rating Scale",    icon: "★",  hasOptions: false },
  select:    { label: "Dropdown",        icon: "▾",  hasOptions: true  },
  radio:     { label: "Multiple Choice", icon: "◉",  hasOptions: true  },
  checkbox:  { label: "Checkboxes",      icon: "☑",  hasOptions: true  },
  statement: { label: "Statement",       icon: "T",  hasOptions: false },
};
const FIELD_TYPES = Object.keys(FIELD_TYPE_META);

// ─── Inline editor style tokens ───────────────────────────────────────────────
const ES = {
  labelMono: {
    fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase",
    color: "#89a99e", fontFamily: "var(--font-mono)", fontWeight: 500,
  },
  input: {
    padding: "0.6rem 0.85rem", border: "1.5px solid var(--color-border)",
    borderRadius: "0.5rem", fontSize: "0.85rem", outline: "none",
    fontFamily: "'DM Sans', sans-serif", color: "var(--color-text)",
    background: "#F9F8F6", width: "100%", boxSizing: "border-box",
  },
  btn: (variant = "primary") => ({
    padding: "0.38rem 1rem", borderRadius: "2rem", border: "none",
    cursor: "pointer", fontSize: "0.75rem", fontWeight: 500,
    fontFamily: "'DM Sans', sans-serif",
    ...(variant === "primary" ? { background: "#172f2d", color: "#fff" } : {}),
    ...(variant === "gold"    ? { background: "#bf8a3e", color: "#fff" } : {}),
    ...(variant === "ghost"   ? { background: "none", color: "#89a99e", border: "1px solid var(--color-border)" } : {}),
    ...(variant === "danger"  ? { background: "rgba(224,122,95,0.1)", color: "#C4604A", border: "1px solid rgba(224,122,95,0.25)" } : {}),
  }),
};

// ─── OptionsBuilder ────────────────────────────────────────────────────────────
function OptionsBuilder({ options = [], onChange }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (!v || options.includes(v)) return;
    onChange([...options, v]);
    setDraft("");
  };
  const remove = (i) => onChange(options.filter((_, idx) => idx !== i));
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginBottom: "0.45rem" }}>
        {options.map((opt, i) => (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: "0.22rem", background: "#e6ddd0", borderRadius: "2rem", padding: "0.18rem 0.6rem", fontSize: "0.78rem", fontFamily: "'DM Sans', sans-serif" }}>
            {opt}
            <button onClick={() => remove(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#89a99e", fontSize: "1rem", lineHeight: 1, padding: "0 0.1rem" }}>×</button>
          </span>
        ))}
        {options.length === 0 && (
          <span style={{ color: "#89a99e", fontSize: "0.73rem", fontFamily: "var(--font-mono)" }}>No options yet</span>
        )}
      </div>
      <div style={{ display: "flex", gap: "0.4rem" }}>
        <input
          value={draft} onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); }}}
          placeholder="Type an option, press Enter…"
          style={{ ...ES.input, padding: "0.35rem 0.7rem", flex: 1 }}
        />
        <button onClick={add} disabled={!draft.trim()} style={{ ...ES.btn("primary"), opacity: draft.trim() ? 1 : 0.5 }}>Add</button>
      </div>
    </div>
  );
}

// ─── InlineFieldEditor ─────────────────────────────────────────────────────────
function InlineFieldEditor({ field, onSave, onCancel, onDelete, isNew = false }) {
  const [draft, setDraft] = useState({
    label:       field.label       || "",
    placeholder: field.placeholder || "",
    type:        field.type        || "text",
    required:    field.required    || false,
    halfWidth:   field.halfWidth   || false,
    options:     [...(field.options || [])],
  });
  const [saving, setSaving] = useState(false);
  const meta = FIELD_TYPE_META[draft.type] || {};

  const handleSave = async () => {
    if (!draft.label.trim()) return;
    setSaving(true);
    const name = draft.label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    await onSave({ ...draft, name });
    setSaving(false);
  };

  return (
    <div style={{
      margin: "0.5rem 0 1.4rem",
      padding: "1.2rem 1.3rem",
      background: "rgba(23,47,45,0.03)",
      border: "1px solid rgba(23,47,45,0.12)",
      borderLeft: "3px solid #172f2d",
      borderRadius: "0 0.6rem 0.6rem 0",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ ...ES.labelMono, color: "#172f2d", marginBottom: "0.9rem" }}>
        {isNew ? "New field — saves to Firebase & syncs with Form Builder" : "Editing field — syncs with Form Builder"}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: draft.type === "statement" ? "1fr 1fr" : "1fr 1fr 1fr", gap: "0.65rem", marginBottom: "0.75rem" }}>
        <div>
          <label style={{ ...ES.labelMono, display: "block", marginBottom: "0.25rem" }}>{draft.type === "statement" ? "Heading" : "Label *"}</label>
          <input autoFocus={isNew} value={draft.label}
            onChange={e => setDraft(d => ({ ...d, label: e.target.value }))}
            placeholder={draft.type === "statement" ? "e.g. About Your Health" : "e.g. Emergency Contact Name"}
            style={ES.input} />
        </div>
        {draft.type !== "statement" && (
          <div>
            <label style={{ ...ES.labelMono, display: "block", marginBottom: "0.25rem" }}>Placeholder / hint</label>
            <input value={draft.placeholder}
              onChange={e => setDraft(d => ({ ...d, placeholder: e.target.value }))}
              placeholder="Shown inside the empty field…" style={ES.input} />
          </div>
        )}
        <div>
          <label style={{ ...ES.labelMono, display: "block", marginBottom: "0.25rem" }}>Field type</label>
          <select value={draft.type}
            onChange={e => setDraft(d => ({ ...d, type: e.target.value, options: FIELD_TYPE_META[e.target.value]?.hasOptions ? d.options : (e.target.value === "rating" ? ["5"] : []) }))}
            style={{ ...ES.input, appearance: "none" }}>
            {FIELD_TYPES.map(t => <option key={t} value={t}>{FIELD_TYPE_META[t]?.icon} {FIELD_TYPE_META[t]?.label}</option>)}
          </select>
        </div>
      </div>

      {draft.type === "statement" && (
        <div style={{ marginBottom: "0.75rem" }}>
          <label style={{ ...ES.labelMono, display: "block", marginBottom: "0.25rem" }}>Body text</label>
          <textarea value={draft.placeholder} onChange={e => setDraft(d => ({ ...d, placeholder: e.target.value }))}
            placeholder="Paragraph, instructions, consent language…" rows={3} style={{ ...ES.input, resize: "vertical" }} />
        </div>
      )}

      {meta.hasOptions && (
        <div style={{ background: "#F4F3F1", border: "1px solid var(--color-border)", borderRadius: "0.5rem", padding: "0.85rem", marginBottom: "0.75rem" }}>
          <div style={{ ...ES.labelMono, marginBottom: "0.5rem" }}>Options</div>
          <OptionsBuilder options={draft.options} onChange={opts => setDraft(d => ({ ...d, options: opts }))} />
        </div>
      )}

      {draft.type === "rating" && (
        <div style={{ marginBottom: "0.75rem" }}>
          <div style={{ ...ES.labelMono, marginBottom: "0.4rem" }}>Scale</div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {["5", "10"].map(s => (
              <button key={s} type="button" onClick={() => setDraft(d => ({ ...d, options: [s] }))} style={{
                padding: "0.35rem 1.1rem", borderRadius: "2rem", border: "1.5px solid",
                borderColor: (draft.options?.[0] || "5") === s ? "#172f2d" : "var(--color-border)",
                background:  (draft.options?.[0] || "5") === s ? "#172f2d" : "transparent",
                color:       (draft.options?.[0] || "5") === s ? "#fff"    : "#3a5450",
                fontFamily: "'DM Sans', sans-serif", fontSize: "0.78rem", cursor: "pointer",
              }}>1 – {s}</button>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "1.2rem", flexWrap: "wrap", marginTop: "0.2rem" }}>
        {draft.type !== "statement" && (
          <>
            <label style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem", fontFamily: "'DM Sans', sans-serif", color: "#3a5450", cursor: "pointer" }}>
              <input type="checkbox" checked={draft.required} onChange={e => setDraft(d => ({ ...d, required: e.target.checked }))} />
              Required
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem", fontFamily: "'DM Sans', sans-serif", color: "#3a5450", cursor: "pointer" }}>
              <input type="checkbox" checked={draft.halfWidth} onChange={e => setDraft(d => ({ ...d, halfWidth: e.target.checked }))} />
              Half-width
            </label>
          </>
        )}
        {!isNew && field.deletable && (
          <button onClick={() => onDelete(field.id)} style={{ ...ES.btn("danger"), fontSize: "0.73rem" }}>Delete field</button>
        )}
        <div style={{ marginLeft: "auto", display: "flex", gap: "0.45rem" }}>
          <button onClick={onCancel} style={ES.btn("ghost")}>Cancel</button>
          <button onClick={handleSave} disabled={!draft.label.trim() || saving}
            style={{ ...ES.btn("gold"), opacity: draft.label.trim() ? 1 : 0.5 }}>
            {saving ? "Saving…" : (isNew ? "+ Add Field ✦" : "Save ✦")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── EditableFieldShell ────────────────────────────────────────────────────────
// Wraps a single field with:
//   • a persistent (–) delete circle (top-right, always visible when deletable)
//   • click-to-edit: clicking the field body opens the inline editor
//   • the inline editor expands below
// The (+) add button lives in renderStepFields, not here.
function EditableFieldShell({ field, editingFieldId, onEdit, onDelete, onSave, onCancel, children }) {
  const isEditing = editingFieldId === field.id;

  return (
    <div style={{ position: "relative" }}>
      {/* Persistent delete circle — only for deletable fields */}
      {field.deletable && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm(`Delete the field "${field.label}"? This cannot be undone.`)) {
              onDelete(field.id);
            }
          }}
          title="Delete this field"
          style={{
            position: "absolute", top: "0.1rem", right: "-0.6rem",
            width: 22, height: 22, borderRadius: "50%",
            background: "#fff", border: "1.5px solid rgba(224,122,95,0.55)",
            color: "#C4604A", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1rem", lineHeight: 1, zIndex: 6,
            boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
            fontFamily: "'DM Sans', sans-serif",
            padding: 0,
          }}
        >–</button>
      )}

      {/* Field body — click to open/close editor */}
      <div
        onClick={() => onEdit(field.id)}
        style={{
          cursor: "pointer",
          borderRadius: "0.5rem",
          outline: isEditing
            ? "2px solid #172f2d"
            : "1.5px dashed rgba(23,47,45,0.14)",
          outlineOffset: "2px",
          transition: "outline 0.1s",
        }}
      >
        {children}
      </div>

      {/* Inline editor — expands below the field */}
      {isEditing && (
        <InlineFieldEditor
          field={field}
          onSave={async (changes) => { await onSave(field.id, changes); }}
          onCancel={onCancel}
          onDelete={async (id) => {
            if (window.confirm(`Delete the field "${field.label}"? This cannot be undone.`)) {
              await onDelete(id);
              onCancel();
            }
          }}
        />
      )}
    </div>
  );
}

// ─── Form field styles ─────────────────────────────────────────────────────────
const inputStyle = (focused, name, value) => {
  const hasValue  = value && value.toString().trim().length > 0;
  const isValid   = hasValue && focused !== name;
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
        {label}{required && <span style={{ color: "#bf8a3e" }}> *</span>}
      </label>
      {children}
    </div>
  );
}

// ─── Dynamic field renderer ───────────────────────────────────────────────────
function DynamicField({ field, form, focused, setFocused, onChange }) {
  const { name, type, label, placeholder, required, options } = field;
  const rawValue = form[name];
  const value    = type === "checkbox" ? (Array.isArray(rawValue) ? rawValue : []) : (rawValue ?? "");

  const sharedProps = {
    value,
    onChange:  (e) => onChange(name, e.target.value),
    onFocus:   () => setFocused(name),
    onBlur:    () => setFocused(null),
    style: inputStyle(focused, name, value),
  };

  let input;

  if (type === "select") {
    input = (
      <select {...sharedProps} style={{ ...sharedProps.style, appearance: "none" }}>
        <option value="">{placeholder || "Select an option"}</option>
        {(options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    );
  } else if (type === "radio") {
    input = (
      <div style={{ display: "flex", gap: "1rem", fontFamily: "'DM Sans', sans-serif", flexWrap: "wrap" }}>
        {(options || []).map(opt => (
          <label key={opt} style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            cursor: "pointer", fontSize: "0.92rem", color: "#172f2d",
            padding: "0.55rem 1rem",
            background: value === opt ? "rgba(44,95,74,0.07)" : "transparent",
            border: "1.5px solid " + (value === opt ? "var(--color-primary)" : "var(--color-border)"),
            borderRadius: "0.5rem", transition: "all 0.15s",
          }}>
            <input type="radio" name={name} value={opt} checked={value === opt}
              onChange={e => onChange(name, e.target.value)}
              style={{ accentColor: "var(--color-primary)" }} />
            {opt}
          </label>
        ))}
      </div>
    );
  } else if (type === "checkbox") {
    input = (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontFamily: "'DM Sans', sans-serif" }}>
        {(options || []).map(opt => {
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
              <input type="checkbox" checked={checked}
                onChange={e => {
                  const next = e.target.checked ? [...value, opt] : value.filter(v => v !== opt);
                  onChange(name, next);
                }}
                style={{ accentColor: "var(--color-primary)", width: 16, height: 16 }} />
              {opt}
            </label>
          );
        })}
      </div>
    );
  } else if (type === "yesno") {
    input = (
      <div style={{ display: "flex", gap: "0.75rem" }}>
        {["Yes", "No"].map(opt => (
          <button key={opt} type="button" onClick={() => onChange(name, opt)} style={{
            flex: 1, padding: "0.85rem 1rem", cursor: "pointer",
            border: "1.5px solid " + (value === opt ? "var(--color-primary)" : "var(--color-border)"),
            borderRadius: "0.6rem",
            background: value === opt ? "rgba(44,95,74,0.08)" : "transparent",
            color: value === opt ? "var(--color-primary)" : "#3a5450",
            fontFamily: "'DM Sans', sans-serif", fontSize: "0.95rem",
            fontWeight: value === opt ? 600 : 400, transition: "all 0.15s",
          }}>{opt}</button>
        ))}
      </div>
    );
  } else if (type === "rating") {
    const max  = parseInt(options?.[0]) || 5;
    const nums = Array.from({ length: max }, (_, i) => i + 1);
    input = (
      <div>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {nums.map(n => {
            const sel = parseInt(value) === n;
            return (
              <button key={n} type="button" onClick={() => onChange(name, String(n))} style={{
                width: 44, height: 44, borderRadius: "0.5rem", cursor: "pointer",
                border: "1.5px solid " + (sel ? "var(--color-primary)" : "var(--color-border)"),
                background: sel ? "var(--color-primary)" : "transparent",
                color: sel ? "#fff" : "#3a5450",
                fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem",
                fontWeight: 600, transition: "all 0.15s",
              }}>{n}</button>
            );
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.45rem", fontSize: "0.7rem", color: "#89a99e", fontFamily: "var(--font-mono)" }}>
          <span>1 — Not at all</span><span>{max} — Extremely</span>
        </div>
      </div>
    );
  } else if (type === "statement") {
    return (
      <div style={{
        padding: "1.1rem 1.4rem",
        background: "rgba(191,138,62,0.05)",
        borderLeft: "3px solid #bf8a3e",
        borderRadius: "0 0.5rem 0.5rem 0",
        marginBottom: "1.4rem",
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {label && <div style={{ fontWeight: 600, color: "#172f2d", marginBottom: placeholder ? "0.4rem" : 0, fontSize: "0.95rem" }}>{label}</div>}
        {placeholder && <div style={{ color: "#3a5450", fontSize: "0.88rem", lineHeight: 1.7 }}>{placeholder}</div>}
      </div>
    );
  } else if (type === "textarea") {
    input = (
      <textarea placeholder={placeholder} value={value}
        onChange={e => onChange(name, e.target.value)}
        onFocus={() => setFocused(name)} onBlur={() => setFocused(null)}
        rows={5} style={{ ...inputStyle(focused, name, value), resize: "vertical" }} />
    );
  } else {
    input = <input type={type} placeholder={placeholder} {...sharedProps} />;
  }

  return <FieldWrapper label={label} required={required}>{input}</FieldWrapper>;
}

// ─── renderStepFields ─────────────────────────────────────────────────────────
// In edit mode each logical row is laid out as:
//   [field(s)]  [+ add button]
// The + button sits in a fixed-width right column, vertically centred on the input.
function renderStepFields(stepFields, form, focused, setFocused, onChange, editConfig) {
  const rows  = [];
  const sorted = [...stepFields].sort((a, b) => a.order - b.order);
  let i = 0;

  // Wrap a single DynamicField with edit chrome (delete circle + click-to-edit)
  const wrapField = (field) => {
    const el = (
      <DynamicField
        key={field.id} field={field} form={form}
        focused={focused} setFocused={setFocused} onChange={onChange}
      />
    );
    if (!editConfig) return el;
    return (
      <EditableFieldShell key={field.id} field={field} {...editConfig}>
        {el}
      </EditableFieldShell>
    );
  };

  // Wrap a full row (single or half-width pair) with:
  //   [💬 note marker]  [field(s)]  [+ add button]
  // noteField = the field whose name becomes the sectionKey for notes
  const wrapRow = (content, rowKey, lastFieldInRow, noteField) => {
    if (!editConfig) return <React.Fragment key={rowKey}>{content}</React.Fragment>;
    const sectionKey = `field-${(noteField ?? lastFieldInRow)?.name ?? rowKey}`;
    return (
      <div key={rowKey} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>

        {/* 💬 Note marker — left side, aligned with the input line */}
        <div style={{ flexShrink: 0, marginTop: "1.55rem", display: "flex", alignItems: "center" }}>
          <NoteMarker sectionKey={sectionKey} />
        </div>

        {/* Field content */}
        <div style={{ flex: 1, minWidth: 0 }}>{content}</div>

        {/* (+) add-after button — right side */}
        <button
          onClick={() => editConfig.onAddAfter(lastFieldInRow)}
          title="Add a new field after this one"
          style={{
            flexShrink: 0,
            marginTop: "1.55rem",
            width: 34, height: 34, borderRadius: "50%",
            background: "#fff",
            border: "2px solid rgba(23,47,45,0.22)",
            color: "#172f2d", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.25rem", fontWeight: 300, lineHeight: 1,
            boxShadow: "0 1px 5px rgba(0,0,0,0.08)",
            fontFamily: "'DM Sans', sans-serif", padding: 0,
            transition: "border-color 0.12s",
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = "#172f2d"}
          onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(23,47,45,0.22)"}
        >+</button>
      </div>
    );
  };

  while (i < sorted.length) {
    const curr = sorted[i];
    const next = sorted[i + 1];
    if (curr.halfWidth && next?.halfWidth) {
      const pair = (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          {wrapField(curr)}
          {wrapField(next)}
        </div>
      );
      rows.push(wrapRow(pair, curr.id + "-pair", next, curr)); // note key = first field; + inserts after pair
      i += 2;
    } else {
      rows.push(wrapRow(wrapField(curr), curr.id, curr, curr));
      i += 1;
    }
  }
  return rows;
}

// ─── Confirm step ─────────────────────────────────────────────────────────────
function ConfirmStep({ steps, fields, form }) {
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {steps.map((step, stepIdx) => {
        const stepFields = fields
          .filter(f => f.step === stepIdx && f.type !== "statement")
          .sort((a, b) => a.order - b.order);
        if (!stepFields.length) return null;
        return (
          <div key={step.id} style={{ marginBottom: "1.8rem", background: "#e6ddd0", borderRadius: "0.8rem", padding: "1.5rem", border: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#89a99e", fontFamily: "var(--font-mono)", marginBottom: "1rem" }}>{step.title}</div>
            {stepFields.map(({ name, label }) => {
              const v = form[name];
              const display = Array.isArray(v) ? (v.length ? v.join(", ") : "—") : (v || "—");
              return (
                <div key={name} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.6rem", fontSize: "0.88rem" }}>
                  <span style={{ color: "#89a99e", fontFamily: "var(--font-mono)" }}>{label}</span>
                  <span style={{ color: "#172f2d", fontWeight: 500, textAlign: "right", maxWidth: "60%" }}>{display}</span>
                </div>
              );
            })}
          </div>
        );
      })}
      <p style={{ fontSize: "0.78rem", color: "#89a99e", fontFamily: "var(--font-mono)", lineHeight: 1.6, marginBottom: "1.5rem" }}>
        By submitting this form, you consent to being contacted by Luminal Journeys to schedule
        your appointment. Your information is kept private and never shared.
      </p>
    </div>
  );
}

// ─── Edit Mode Bar ─────────────────────────────────────────────────────────────
function FormEditBar() {
  const { isEditMode } = useEditMode();
  if (!isEditMode) return null;
  return (
    <div style={{
      background: "#172f2d",
      padding: "0.55rem clamp(1rem, 4vw, 2.5rem)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      fontFamily: "'DM Sans', sans-serif", gap: "1rem",
    }}>
      <span style={{ fontSize: "0.73rem", color: "rgba(255,255,255,0.65)", fontFamily: "var(--font-mono)", letterSpacing: "0.05em" }}>
        ✎ Edit mode — click any field to edit · (–) deletes · (+) adds after
      </span>
      <button onClick={() => navigate("/admin?tab=form")} style={{
        background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.85)",
        border: "1px solid rgba(255,255,255,0.2)",
        padding: "0.32rem 0.95rem", borderRadius: "2rem", cursor: "pointer",
        fontSize: "0.72rem", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap",
      }}>
        Form Builder ↗
      </button>
    </div>
  );
}

// ─── "Add Field" inline panel — shown when (+) is clicked ─────────────────────
const EMPTY_NEW_FIELD = { id: null, label: "", placeholder: "", type: "text", required: false, halfWidth: false, options: [], deletable: false };

function AddFieldPanel({ onAdd, onClose }) {
  return (
    <div style={{ border: "1.5px dashed rgba(23,47,45,0.2)", borderRadius: "0.7rem", overflow: "hidden", margin: "0.25rem 0 1rem" }}>
      <div style={{ background: "rgba(23,47,45,0.03)", padding: "0.5rem 1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ ...ES.labelMono, color: "#172f2d" }}>New field</span>
        <button onClick={onClose} style={{ ...ES.btn("ghost"), padding: "0.12rem 0.6rem", fontSize: "0.7rem" }}>✕ Cancel</button>
      </div>
      <div style={{ padding: "0 1rem" }}>
        <InlineFieldEditor
          field={EMPTY_NEW_FIELD}
          isNew={true}
          onSave={onAdd}
          onCancel={onClose}
          onDelete={() => {}}
        />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function IntakePage() {
  const { fields, steps, loading, updateField, deleteField, addField, reorderField } = useFormConfig();
  const { isEditMode } = useEditMode();

  const [step, setStep]           = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [focused, setFocused]     = useState(null);
  const [form, setForm]           = useState({});

  // Edit mode state
  const [editingFieldId, setEditingFieldId] = useState(null);
  const [addAfterField,  setAddAfterField]  = useState(null); // field object — the row after which to insert
  const [showAddPanel,   setShowAddPanel]   = useState(false);
  const [addPanelAnchor, setAddPanelAnchor] = useState(null); // field.id — where the panel is shown
  const [toast,          setToast]          = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await addDoc(collection(db, `intake_submissions`), {
        ...form,
        env:         ENV,          // "staging" or "production" — for filtering
        submittedAt: serverTimestamp(),
        status:      "New",
      });
      setSubmitted(true);
    } catch (err) {
      console.error("[IntakePage] Submission failed:", err);
      setSubmitError("Something went wrong saving your form. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const closeAddPanel = () => { setShowAddPanel(false); setAddAfterField(null); setAddPanelAnchor(null); };

  const editConfig = isEditMode ? {
    editingFieldId,
    onEdit: (id) => {
      closeAddPanel();
      setEditingFieldId(prev => prev === id ? null : id);
    },
    onCancel: () => setEditingFieldId(null),
    onSave: async (id, changes) => {
      await updateField(id, changes);
      setEditingFieldId(null);
      showToast("Field saved ✦");
    },
    onDelete: async (id) => {
      await deleteField(id);
      setEditingFieldId(null);
      showToast("Field deleted");
    },
    // Called by the (+) button — stores which field to insert after, shows the panel
    onAddAfter: (field) => {
      setEditingFieldId(null);
      setAddAfterField(field);
      setAddPanelAnchor(field.id);
      setShowAddPanel(true);
    },
  } : null;

  // Sync form keys when fields change
  React.useEffect(() => {
    setForm(prev => {
      const next = {};
      fields.forEach(f => {
        if (f.type === "statement") return;
        if (f.type === "checkbox") {
          next[f.name] = Array.isArray(prev[f.name]) ? prev[f.name] : [];
        } else {
          next[f.name] = prev[f.name] ?? "";
        }
      });
      return next;
    });
  }, [fields]);

  const onChange = (name, value) => setForm(prev => ({ ...prev, [name]: value }));

  const STEP_LABELS = [...steps.map(s => s.title), "Confirm"];
  const totalSteps  = STEP_LABELS.length;
  const isConfirm   = step === steps.length;

  const canAdvance = useMemo(() => {
    if (isConfirm) return true;
    if (isEditMode) return true; // admin can always advance to edit each step
    const required = fields.filter(f => f.step === step && f.required && f.type !== "statement");
    return required.every(f => {
      const v = form[f.name];
      if (Array.isArray(v)) return v.length > 0;
      return (v ?? "").toString().trim() !== "";
    });
  }, [step, fields, form, isConfirm, isEditMode]);

  // Fields for the currently-visible step
  const currentFields = useMemo(
    () => fields.filter(f => f.step === step).sort((a, b) => a.order - b.order),
    [step, fields]
  );

  // Thank-you screen
  const submitterName  = form["preferredName"] || form["firstName"] || "there";
  const submitterEmail = form["email"] || "";

  if (submitted) {
    return (
      <div data-testid="thank-you" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-bg)", fontFamily: "'DM Serif Display', Georgia, serif", padding: "2rem", textAlign: "center" }}>
        <div>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✦</div>
          <h1 style={{ fontSize: "2.8rem", fontWeight: 400, color: "#172f2d", marginBottom: "1rem" }}>Thank you, {submitterName}.</h1>
          <p style={{ fontSize: "1.1rem", color: "#3a5450", fontFamily: "'DM Sans', sans-serif", fontWeight: 300, maxWidth: 440, margin: "0 auto 2rem", lineHeight: 1.7 }}>
            {submitterEmail
              ? <>We've received your intake form and will reach out to <strong>{submitterEmail}</strong> within 1–2 business days.</>
              : "We've received your intake form and will be in touch shortly."}
          </p>
          <button onClick={() => navigate("/")} style={{ color: "var(--color-primary)", fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", letterSpacing: "0.06em", background: "none", border: "none", cursor: "pointer", borderBottom: "1px solid rgba(155,94,82,0.4)", padding: 0 }}>← Back to home</button>
        </div>
        <MockupBanner />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)", fontFamily: "'DM Serif Display', Georgia, serif" }}>

      <FormEditBar />

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: "5rem", left: "50%", transform: "translateX(-50%)", background: "#172f2d", color: "#fff", padding: "0.55rem 1.4rem", borderRadius: "2rem", fontSize: "0.82rem", fontFamily: "var(--font-mono)", zIndex: 9999, boxShadow: "0 4px 20px rgba(0,0,0,0.2)", pointerEvents: "none" }}>
          ✓ {toast}
        </div>
      )}

      {/* Top bar */}
      <div style={{ padding: "1.2rem clamp(1rem, 4vw, 2.5rem)", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e5e7eb", background: "#F9F8F6" }}>
        <button onClick={() => navigate("/")} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", fontWeight: 600, color: "#172f2d", background: "none", border: "none", cursor: "pointer", letterSpacing: "0.18em", textTransform: "uppercase" }}>
          Luminal Journeys
        </button>
        <span style={{ fontSize: "0.8rem", fontFamily: "var(--font-mono)", color: "#89a99e", letterSpacing: "0.08em" }}>New Client Intake</span>
      </div>

      {/* In edit mode give extra right margin so the (+) buttons don't clip */}
      <div style={{ maxWidth: isEditMode ? 700 : 640, margin: "0 auto", padding: "2.5rem clamp(1rem, 4vw, 2rem) 0" }}>

        {/* Progress bar */}
        <div data-testid="progress-bar" style={{ display: "flex", gap: "0.5rem", marginBottom: "2.5rem" }}>
          {STEP_LABELS.map((label, i) => (
            <div key={i} style={{ flex: 1 }}>
              <div style={{ height: 3, borderRadius: 2, background: i <= step ? "#224e4a" : "rgba(137,169,158,0.25)", transition: "background 0.3s" }} />
              <div style={{ fontSize: "0.65rem", marginTop: "0.4rem", fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.06em", textTransform: "uppercase", color: i <= step ? "#172f2d" : "#89a99e", transition: "color 0.3s" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Step header */}
        <div data-testid="step-counter" style={{ marginBottom: "0.3rem", fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "#89a99e", letterSpacing: "0.08em" }}>
          Step {step + 1} of {totalSteps}
        </div>
        <h2 style={{ fontSize: "2rem", fontWeight: 400, color: "var(--color-primary)", marginBottom: "0.5rem", marginTop: 0 }}>{STEP_LABELS[step]}</h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.95rem", color: "#3a5450", marginBottom: "2rem", marginTop: 0 }}>
          {isConfirm ? "Everything look right? Review and submit when ready." : (steps[step]?.description ?? "")}
        </p>

        {/* Loading skeleton */}
        {loading && !isConfirm && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem", opacity: 0.4 }}>
            {[1, 2, 3].map(k => <div key={k} style={{ height: 52, borderRadius: "0.6rem", background: "rgba(23,47,45,0.08)", animation: "pulse 1.4s infinite" }} />)}
          </div>
        )}

        {/* Form fields */}
        {!loading && !isConfirm && (
          <div style={{ paddingRight: isEditMode ? "0.5rem" : 0 }}>
            {(() => {
              // Render fields interleaved with AddFieldPanel anchors
              const sorted = [...currentFields].sort((a, b) => a.order - b.order);
              const items  = [];
              const rows   = renderStepFields(currentFields, form, focused, setFocused, onChange, editConfig);

              if (!editConfig) return rows;

              // Weave in the AddFieldPanel below its anchor field row
              let rowIdx = 0;
              let i = 0;
              while (i < sorted.length) {
                const curr = sorted[i];
                const next = sorted[i + 1];
                const isPair = curr.halfWidth && next?.halfWidth;
                const anchorField = isPair ? next : curr;

                items.push(rows[rowIdx]);

                // If the add panel is anchored to this row's last field, show it here
                if (editConfig && showAddPanel && addPanelAnchor === anchorField.id) {
                  items.push(
                    <AddFieldPanel
                      key="add-panel"
                      onAdd={async (changes) => {
                        const name = changes.label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
                        await addField({ ...changes, name, step }, addAfterField?.order ?? null);
                        closeAddPanel();
                        showToast("Field added ✦");
                      }}
                      onClose={closeAddPanel}
                    />
                  );
                }

                rowIdx++;
                i += isPair ? 2 : 1;
              }

              // If panel is anchored to nothing (shouldn't happen) or step is empty, show at end
              if (editConfig && showAddPanel && !items.some((_, idx) => idx > 0)) {
                items.push(
                  <AddFieldPanel
                    key="add-panel-end"
                    onAdd={async (changes) => {
                      const name = changes.label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
                      await addField({ ...changes, name, step });
                      closeAddPanel();
                      showToast("Field added ✦");
                    }}
                    onClose={closeAddPanel}
                  />
                );
              }

              return items;
            })()}

            {/* "Add first field" — only shown when step has no fields at all */}
            {isEditMode && !isConfirm && currentFields.length === 0 && !showAddPanel && (
              <button
                onClick={() => { setAddAfterField(null); setAddPanelAnchor("__empty__"); setShowAddPanel(true); }}
                style={{ width: "100%", padding: "0.65rem", border: "1.5px dashed rgba(23,47,45,0.2)", borderRadius: "0.6rem", background: "transparent", color: "#89a99e", fontFamily: "var(--font-mono)", fontSize: "0.78rem", cursor: "pointer", letterSpacing: "0.04em" }}
              >+ Add the first field to this step</button>
            )}
            {isEditMode && !isConfirm && currentFields.length === 0 && showAddPanel && addPanelAnchor === "__empty__" && (
              <AddFieldPanel
                onAdd={async (changes) => {
                  const name = changes.label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
                  await addField({ ...changes, name, step });
                  closeAddPanel();
                  showToast("Field added ✦");
                }}
                onClose={closeAddPanel}
              />
            )}
          </div>
        )}

        {/* Confirm step */}
        {isConfirm && (
          <div data-testid="confirm-step">
            <ConfirmStep steps={steps} fields={fields} form={form} />
          </div>
        )}

        {/* Nav buttons */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", paddingBottom: "3rem" }}>
          {step > 0
            ? <button data-testid="btn-back" onClick={() => setStep(s => s - 1)} style={{ background: "none", border: "1.5px solid rgba(23,47,45,0.15)", color: "#89a99e", padding: "0.75rem 1.8rem", borderRadius: "2rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem" }}>← Back</button>
            : <div />}
          {!isConfirm
            ? <button data-testid="btn-continue" onClick={() => canAdvance && setStep(s => s + 1)} disabled={!canAdvance} style={{ background: canAdvance ? "var(--color-primary)" : "rgba(23,47,45,0.2)", color: canAdvance ? "#fff" : "#89a99e", padding: "0.85rem 2.4rem", borderRadius: "2rem", border: "none", cursor: canAdvance ? "pointer" : "not-allowed", fontFamily: "'DM Sans', sans-serif", fontSize: "0.95rem", fontWeight: 600, transition: "all 0.2s" }}>Continue →</button>
            : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.5rem" }}>
                {submitError && (
                  <div style={{ fontSize: "0.82rem", color: "#C4604A", fontFamily: "'DM Sans', sans-serif" }}>{submitError}</div>
                )}
                <button
                  data-testid="btn-submit"
                  onClick={handleSubmit}
                  disabled={submitting}
                  style={{ background: "#bf8a3e", color: "#F9F8F6", padding: "0.85rem 2.4rem", borderRadius: "2rem", border: "none", cursor: submitting ? "wait" : "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: "0.95rem", fontWeight: 600, opacity: submitting ? 0.7 : 1 }}
                >
                  {submitting ? "Submitting…" : "Submit Intake ✦"}
                </button>
              </div>
            )}
        </div>
      </div>

      <div data-testid="intake-footer" style={{ textAlign: "center", padding: "1.5rem", fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "#89a99e", borderTop: "1px solid var(--color-border)" }}>
        © {new Date().getFullYear()} Luminal Journeys · All rights reserved
      </div>
      <MockupBanner />
    </div>
  );
}
