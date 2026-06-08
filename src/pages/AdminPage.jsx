/**
 * AdminPage.jsx — Luminal Journeys
 * Admin dashboard with four tabs:
 *   1. Intakes   — client intake submissions
 *   2. Form      — add / edit / reorder / delete intake form fields and steps
 *   3. Pages     — add / delete / reorder dynamic site pages
 *   4. Publish   — one-click staging → production push
 *
 * Auth is handled entirely by EditModeContext / EditModeToggle.
 * If not authenticated, shows a gate that triggers the shared login modal.
 */

import React, { useState, useEffect } from "react";
import MockupBanner from "../components/MockupBanner.jsx";
import { navigate } from "../App.jsx";
import { useFormConfig }           from "../hooks/useFormConfig.js";
import { useSitePages }            from "../hooks/useSitePages.js";
import { usePublish }              from "../hooks/usePublish.js";
import { useEditMode }             from "../context/EditModeContext.jsx";
import { useIntakeSubmissions }    from "../hooks/useIntakeSubmissions.js";
import { ENV }                     from "../lib/collections.js";

// ─── Shared style tokens ──────────────────────────────────────────────────────
const S = {
  labelMono: {
    fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase",
    color: "#89a99e", fontFamily: "var(--font-mono)", fontWeight: 500,
  },
  card: {
    background: "#F4F3F1", border: "1px solid var(--color-border)",
    borderRadius: "0.8rem", overflow: "hidden",
  },
  input: {
    padding: "0.65rem 0.9rem", border: "1.5px solid var(--color-border)",
    borderRadius: "0.5rem", fontSize: "0.88rem", outline: "none",
    fontFamily: "'DM Sans', sans-serif", color: "var(--color-text)",
    background: "#F9F8F6", width: "100%", boxSizing: "border-box",
  },
  btn: (variant = "primary") => ({
    padding: "0.45rem 1.1rem", borderRadius: "2rem", border: "none",
    cursor: "pointer", fontSize: "0.78rem", fontWeight: 500,
    fontFamily: "'DM Sans', sans-serif",
    ...(variant === "primary"  ? { background: "#172f2d", color: "#fff" } : {}),
    ...(variant === "danger"   ? { background: "rgba(224,122,95,0.12)", color: "#C4604A", border: "1px solid rgba(224,122,95,0.3)" } : {}),
    ...(variant === "ghost"    ? { background: "none", color: "#89a99e", border: "1px solid var(--color-border)" } : {}),
    ...(variant === "gold"     ? { background: "#bf8a3e", color: "#fff" } : {}),
  }),
};

const STATUS_META  = { New: { bg: "rgba(224,122,95,0.12)", color: "#C4604A", dot: "#E07A5F" }, Contacted: { bg: "rgba(95,158,160,0.12)", color: "#2E7D7F", dot: "#5F9EA0" }, Scheduled: { bg: "rgba(17,76,92,0.12)", color: "#114C5C", dot: "#114C5C" } };
const STATUS_ORDER = ["New", "Contacted", "Scheduled"];

/** Render a date from either a JS Date (Firestore Timestamp.toDate()) or a plain string. */
const fmt = (d) => {
  if (!d) return "—";
  const date = d instanceof Date ? d : new Date(d + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

// ─── Auth gate (shown when not in edit mode) ──────────────────────────────────
function AdminGate() {
  const { requestAuth } = useEditMode();
  // Auto-trigger the login modal when landing on /admin while not authenticated
  useEffect(() => { requestAuth(); }, []);
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F9F8F6", fontFamily: "'DM Sans', sans-serif", flexDirection: "column", gap: "1.2rem" }}>
      <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "1.6rem", color: "#172f2d" }}>Luminal Journeys</div>
      <div style={{ fontSize: "0.82rem", color: "#89a99e", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>Admin</div>
      <button onClick={() => requestAuth()} style={{ marginTop: "0.5rem", background: "#172f2d", color: "#fff", border: "none", borderRadius: "0.6rem", padding: "0.75rem 2rem", fontSize: "0.9rem", cursor: "pointer" }}>Sign In</button>
      <button onClick={() => navigate("/")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.8rem", color: "#89a99e", fontFamily: "var(--font-mono)" }}>← Back to site</button>
    </div>
  );
}

// ─── Tab: Intakes ─────────────────────────────────────────────────────────────
// Shell component: waits for Firebase Auth to be established before mounting
// IntakesData. This prevents useIntakeSubmissions from running before auth is
// ready, which would cause a permission-denied Firestore error. Both Magic Link
// sessions (hasFirebaseAuth=true immediately) and password sessions
// (hasFirebaseAuth becomes true after signInAnonymously completes) are handled.
function IntakesTab() {
  const { hasFirebaseAuth } = useEditMode();

  if (!hasFirebaseAuth) return (
    <div style={{ minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#89a99e", fontFamily: "var(--font-mono)", fontSize: "0.82rem" }}>
      Loading submissions…
    </div>
  );

  return <IntakesData />;
}

function IntakesData() {
  const { intakes, loading, error, updateStatus, updateNotes } = useIntakeSubmissions();
  const [search, setSearch]   = useState("");
  const [expanded, setExpanded] = useState(null);
  const [sortCol, setSortCol]   = useState("submittedAt");
  const [sortDir, setSortDir]   = useState("desc");
  const [noteEditing, setNoteEditing] = useState(null);
  const [noteDraft, setNoteDraft]     = useState("");

  const filtered = intakes.filter(r => {
    const q = search.toLowerCase();
    return [r.firstName, r.lastName, r.email, r.primaryGoal, r.status, r.city].some(v => (v || "").toLowerCase().includes(q));
  }).sort((a, b) => {
    const av = a[sortCol] instanceof Date ? a[sortCol].toISOString() : (a[sortCol] || "");
    const bv = b[sortCol] instanceof Date ? b[sortCol].toISOString() : (b[sortCol] || "");
    return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const cycleStatus = (id, currentStatus) => {
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(currentStatus) + 1) % STATUS_ORDER.length];
    updateStatus(id, next);
  };
  const handleSort  = (col) => { if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc"); else { setSortCol(col); setSortDir("asc"); } };
  const counts = { total: intakes.length, new: intakes.filter(r => r.status === "New").length, contacted: intakes.filter(r => r.status === "Contacted").length, scheduled: intakes.filter(r => r.status === "Scheduled").length };

  const th = { padding: "0.75rem 1rem", textAlign: "left", ...S.labelMono, cursor: "pointer", userSelect: "none", whiteSpace: "nowrap", borderBottom: "1.5px solid #e5e7eb", background: "#e6ddd0" };
  const td = { padding: "0.85rem 1rem", fontSize: "0.87rem", color: "var(--color-text)", borderBottom: "1px solid rgba(23,47,45,0.1)", verticalAlign: "middle" };

  const COLS = [["#", null], ["First", "firstName"], ["Last", "lastName"], ["Preferred", "preferredName"], ["DOB", "dateOfBirth"], ["Pronouns", "pronouns"], ["Email", "email"], ["Phone", null], ["City", "city"], ["Contact", "preferredContact"], ["Goal", "primaryGoal"], ["Source", "hearAboutUs"], ["Submitted", "submittedAt"], ["Status", "status"], ["Notes", null], ["", null]];

  if (loading) return (
    <div style={{ minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#89a99e", fontFamily: "var(--font-mono)", fontSize: "0.82rem" }}>
      Loading submissions…
    </div>
  );

  if (error) return (
    <div style={{ minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#C4604A", fontFamily: "var(--font-mono)", fontSize: "0.82rem" }}>
      Error: {error}
    </div>
  );

  return (
    <div>
      {/* Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {[["Total", counts.total, "var(--color-primary)"], ["New", counts.new, "#E07A5F"], ["Contacted", counts.contacted, "#5F9EA0"], ["Scheduled", counts.scheduled, "#114C5C"]].map(([label, val, accent]) => (
          <div key={label} style={{ background: "#fff", border: "1px solid var(--color-border)", borderRadius: "0.8rem", padding: "1.2rem 1.5rem", borderTop: "3px solid " + accent }}>
            <div style={{ fontSize: "2rem", fontWeight: 600, color: accent, lineHeight: 1, marginBottom: "0.3rem" }} data-testid={`metric-${label.toLowerCase()}`}>{val}</div>
            <div style={S.labelMono}>{label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={S.card}>
        <div style={{ padding: "1rem 1.2rem", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(23,47,45,0.1)" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--color-text)" }}>
            Client Intakes <span style={{ ...S.labelMono, fontWeight: 400, marginLeft: "0.5rem" }}>{filtered.length} records</span>
          </span>
          <div style={{ display: "flex", gap: "0.8rem", alignItems: "center" }}>
            <input data-testid="intakes-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" style={{ ...S.input, width: 200, padding: "0.45rem 0.9rem", borderRadius: "2rem" }} />
            <button onClick={() => navigate("/intake")} style={S.btn("gold")}>+ New Intake</button>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table data-testid="intakes-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>{COLS.map(([label, col]) => <th key={label} style={{ ...th, cursor: col ? "pointer" : "default" }} onClick={() => col && handleSort(col)}>{label}{col && sortCol === col ? (sortDir === "asc" ? " ↑" : " ↓") : ""}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={16} style={{ ...td, textAlign: "center", color: "#89a99e", padding: "3rem" }}>No records found</td></tr>}
              {filtered.map((row, i) => {
                const sc = STATUS_META[row.status];
                const isExp = expanded === row.id;
                return (
                  <React.Fragment key={row.id}>
                    <tr style={{ background: isExp ? "rgba(17,76,92,0.03)" : "transparent" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(17,76,92,0.03)"} onMouseLeave={e => e.currentTarget.style.background = isExp ? "rgba(17,76,92,0.03)" : "transparent"}>
                      <td style={{ ...td, color: "#89a99e", fontFamily: "var(--font-mono)", width: 36 }}>{i + 1}</td>
                      <td style={{ ...td, fontWeight: 500 }}>{row.firstName}</td>
                      <td style={{ ...td, fontWeight: 500 }}>{row.lastName}</td>
                      <td style={{ ...td, color: "var(--color-text-soft)" }}>{row.preferredName || "—"}</td>
                      <td style={{ ...td, whiteSpace: "nowrap", fontSize: "0.82rem" }}>{fmt(row.dateOfBirth)}</td>
                      <td style={{ ...td, fontSize: "0.82rem" }}>{row.pronouns || "—"}</td>
                      <td style={td}><a href={"mailto:" + row.email} style={{ color: "var(--color-secondary)", textDecoration: "none", fontSize: "0.82rem" }}>{row.email}</a></td>
                      <td style={{ ...td, whiteSpace: "nowrap", fontSize: "0.82rem" }}>{row.phone}</td>
                      <td style={{ ...td, fontSize: "0.82rem" }}>{row.city}, {row.state}</td>
                      <td style={{ ...td, fontSize: "0.82rem", textTransform: "capitalize" }}>{row.preferredContact}</td>
                      <td style={{ ...td, fontSize: "0.82rem", maxWidth: 180 }}>{row.primaryGoal}</td>
                      <td style={{ ...td, fontSize: "0.82rem" }}>{row.hearAboutUs || "—"}</td>
                      <td style={{ ...td, whiteSpace: "nowrap", fontSize: "0.82rem", color: "#89a99e", fontFamily: "var(--font-mono)" }}>{fmt(row.submittedAt)}</td>
                      <td style={td}>
                        <button onClick={() => cycleStatus(row.id, row.status)} data-testid="status-badge" style={{ background: sc.bg, color: sc.color, border: "none", borderRadius: "2rem", padding: "0.28rem 0.8rem", fontSize: "0.73rem", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.35rem", whiteSpace: "nowrap" }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: sc.dot, display: "inline-block" }} />{row.status}
                        </button>
                      </td>
                      <td style={{ ...td, minWidth: 160, maxWidth: 220 }}>
                        {noteEditing === row.id ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                            <textarea autoFocus value={noteDraft} onChange={e => setNoteDraft(e.target.value)} rows={3} style={{ width: "100%", padding: "0.5rem 0.6rem", border: "1.5px solid var(--color-primary)", borderRadius: "0.4rem", fontSize: "0.82rem", fontFamily: "'DM Sans', sans-serif", resize: "none", outline: "none", background: "#e6ddd0", color: "var(--color-text)", boxSizing: "border-box" }} />
                            <div style={{ display: "flex", gap: "0.4rem" }}>
                              <button onClick={() => { updateNotes(row.id, noteDraft); setNoteEditing(null); }} style={{ background: "#172f2d", color: "#fff", border: "none", borderRadius: "0.4rem", padding: "0.3rem 0.7rem", fontSize: "0.75rem", cursor: "pointer" }}>Save</button>
                              <button onClick={() => setNoteEditing(null)} style={{ background: "none", border: "1px solid var(--color-border)", borderRadius: "0.4rem", padding: "0.3rem 0.7rem", fontSize: "0.75rem", cursor: "pointer", color: "#89a99e", fontFamily: "var(--font-mono)" }}>Cancel</button>
                            </div>
                          </div>
                        ) : row.notes ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                            <span style={{ fontSize: "0.82rem", color: "var(--color-text)", lineHeight: 1.4 }}>{row.notes}</span>
                            <button onClick={() => { setNoteEditing(row.id); setNoteDraft(row.notes); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-secondary)", fontSize: "0.75rem", textAlign: "left", padding: 0 }}>Edit note</button>
                          </div>
                        ) : (
                          <button onClick={() => { setNoteEditing(row.id); setNoteDraft(""); }} style={{ background: "none", border: "1.5px dashed var(--color-border)", borderRadius: "0.4rem", padding: "0.3rem 0.7rem", fontSize: "0.75rem", cursor: "pointer", color: "#89a99e", fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>+ Add Note</button>
                        )}
                      </td>
                      <td style={{ ...td, width: 36 }}>
                        <button onClick={() => setExpanded(isExp ? null : row.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#89a99e", fontSize: "1.1rem" }}>{isExp ? "▲" : "▼"}</button>
                      </td>
                    </tr>
                    {isExp && (
                      <tr>
                        <td colSpan={16} style={{ padding: "1.2rem 1.5rem", background: "#e6ddd0", borderBottom: "1px solid rgba(23,47,45,0.1)" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                            <div><div style={{ ...S.labelMono, marginBottom: "0.2rem" }}>Full Address</div><div style={{ fontSize: "0.88rem" }}>{row.address}, {row.city}, {row.state} {row.zip}</div></div>
                            <div><div style={{ ...S.labelMono, marginBottom: "0.2rem" }}>Additional Notes</div><div style={{ fontSize: "0.88rem" }}>{row.additionalNotes || "None provided"}</div></div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ padding: "0.75rem 1.2rem", borderTop: "1px solid var(--color-border)", background: "#e6ddd0", ...S.labelMono }} data-testid="intakes-footer">
          Showing {ENV} submissions · Click status badge to advance · Click ▼ to expand
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Form Builder ────────────────────────────────────────────────────────
// Human-readable type labels for the Form Builder UI
const FIELD_TYPE_META = {
  text:      { label: "Short Text",          icon: "Aa",  hasOptions: false, isInput: true  },
  textarea:  { label: "Long Answer",         icon: "¶",   hasOptions: false, isInput: true  },
  email:     { label: "Email",               icon: "@",   hasOptions: false, isInput: true  },
  tel:       { label: "Phone Number",        icon: "☎",   hasOptions: false, isInput: true  },
  number:    { label: "Number",              icon: "#",   hasOptions: false, isInput: true  },
  date:      { label: "Date (Calendar)",     icon: "📅",  hasOptions: false, isInput: true  },
  yesno:     { label: "Yes / No",            icon: "◐",   hasOptions: false, isInput: true  },
  rating:    { label: "Rating Scale",        icon: "★",   hasOptions: false, isInput: true, special: "rating"    },
  select:    { label: "Dropdown",            icon: "▾",   hasOptions: true,  isInput: true  },
  radio:     { label: "Multiple Choice",     icon: "◉",   hasOptions: true,  isInput: true  },
  checkbox:  { label: "Checkboxes",          icon: "☑",   hasOptions: true,  isInput: true  },
  statement: { label: "Statement / Heading", icon: "T",   hasOptions: false, isInput: false, special: "statement" },
};
const FIELD_TYPES = Object.keys(FIELD_TYPE_META);

// ─── Inline options builder (reused in Add Field + Edit Field) ────────────────
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
      <div style={{ ...S.labelMono, fontSize: "0.65rem", marginBottom: "0.5rem" }}>Options</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "0.5rem" }}>
        {options.map((opt, i) => (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: "0.25rem", background: "#e6ddd0", borderRadius: "2rem", padding: "0.22rem 0.65rem", fontSize: "0.8rem", fontFamily: "'DM Sans', sans-serif" }}>
            {opt}
            <button onClick={() => remove(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#89a99e", fontSize: "1rem", lineHeight: 1, padding: "0 0.1rem" }}>×</button>
          </span>
        ))}
        {options.length === 0 && <span style={{ color: "#89a99e", fontSize: "0.75rem", fontFamily: "var(--font-mono)" }}>No options yet — add one below</span>}
      </div>
      <div style={{ display: "flex", gap: "0.4rem" }}>
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="Type an option, press Enter…"
          style={{ ...S.input, padding: "0.38rem 0.75rem", flex: 1 }}
        />
        <button onClick={add} disabled={!draft.trim()} style={{ ...S.btn("primary"), opacity: draft.trim() ? 1 : 0.5 }}>Add</button>
      </div>
    </div>
  );
}

// ─── Rating scale picker (reused in FieldRow edit + Add Field) ───────────────
function RatingScalePicker({ value, onChange }) {
  const scales = ["5", "10"];
  return (
    <div>
      <div style={{ ...S.labelMono, fontSize: "0.65rem", marginBottom: "0.5rem" }}>Scale</div>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        {scales.map(s => (
          <button key={s} type="button" onClick={() => onChange(s)} style={{
            padding: "0.45rem 1.2rem", borderRadius: "2rem", border: "1.5px solid",
            borderColor: value === s ? "#172f2d" : "var(--color-border)",
            background: value === s ? "#172f2d" : "transparent",
            color: value === s ? "#fff" : "#3a5450",
            fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", cursor: "pointer",
          }}>1 – {s}</button>
        ))}
      </div>
      <div style={{ ...S.labelMono, fontSize: "0.65rem", color: "#89a99e", marginTop: "0.4rem" }}>
        Renders as a row of numbered buttons in the form
      </div>
    </div>
  );
}

// ─── Editable field row ───────────────────────────────────────────────────────
function FieldRow({ field, idx, isLast, onReorder, onDelete, onUpdate, showToast }) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(null);
  const [saving,  setSaving]  = useState(false);

  const startEdit = () => {
    setDraft({
      label:       field.label,
      placeholder: field.placeholder || "",
      type:        field.type,
      required:    field.required,
      halfWidth:   field.halfWidth,
      options:     [...(field.options || [])],
    });
    setEditing(true);
  };
  const cancelEdit = () => { setEditing(false); setDraft(null); };

  const saveEdit = async () => {
    if (!draft.label.trim()) return;
    setSaving(true);
    const name = draft.label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    await onUpdate(field.id, { ...draft, name });
    setSaving(false);
    setEditing(false);
    setDraft(null);
    showToast("Field saved to Firebase");
  };

  const typeMeta = FIELD_TYPE_META[field.type] || { label: field.type, icon: "Aa", hasOptions: false, isInput: true };
  const editMeta = draft ? (FIELD_TYPE_META[draft.type] || {}) : typeMeta;
  const isStatement = field.type === "statement";

  const chip = (text, bg, color) => (
    <span style={{ background: bg, color, fontSize: "0.68rem", padding: "0.15rem 0.5rem", borderRadius: "0.25rem", fontFamily: "var(--font-mono)" }}>{text}</span>
  );

  return (
    <div style={{ borderBottom: !isLast ? "1px solid rgba(23,47,45,0.08)" : "none" }}>

      {/* ── View row ─────────────────────────────────────────────────────────── */}
      {!editing && (
        <div style={{ padding: "1.1rem 1.3rem", display: "flex", alignItems: "flex-start", gap: "1rem", background: isStatement ? "rgba(191,138,62,0.04)" : "transparent" }}>
          {/* Reorder */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem", paddingTop: "0.25rem" }}>
            <button onClick={() => onReorder(field.id, "up")}   disabled={idx === 0} style={{ background: "none", border: "none", color: idx === 0 ? "rgba(137,169,158,0.3)" : "#89a99e", cursor: idx === 0 ? "default" : "pointer", fontSize: "0.75rem", padding: "0.1rem" }}>▲</button>
            <button onClick={() => onReorder(field.id, "down")} disabled={isLast}    style={{ background: "none", border: "none", color: isLast    ? "rgba(137,169,158,0.3)" : "#89a99e", cursor: isLast    ? "default" : "pointer", fontSize: "0.75rem", padding: "0.1rem" }}>▼</button>
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.35rem", flexWrap: "wrap" }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: "0.9rem", color: isStatement ? "#bf8a3e" : "#172f2d" }}>
                {isStatement ? "T " : ""}{field.label}
              </span>
              {chip(typeMeta.icon + " " + typeMeta.label, isStatement ? "rgba(191,138,62,0.12)" : "rgba(23,47,45,0.06)", isStatement ? "#bf8a3e" : "#3a5450")}
              {field.required   && chip("required",   "rgba(191,138,62,0.12)",  "#bf8a3e")}
              {field.halfWidth  && chip("half-width", "rgba(95,158,160,0.12)",  "#2E7D7F")}
              {!field.deletable && chip("locked",     "rgba(137,169,158,0.12)", "#89a99e")}
              {field.type === "rating" && field.options?.[0] && chip("1–" + field.options[0], "rgba(95,158,160,0.12)", "#2E7D7F")}
            </div>
            {/* Statement content preview */}
            {isStatement && field.placeholder && (
              <div style={{ fontSize: "0.82rem", color: "#3a5450", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5, marginTop: "0.2rem" }}>
                {field.placeholder}
              </div>
            )}
            {/* Placeholder hint for non-statement */}
            {!isStatement && field.placeholder && (
              <div style={{ ...S.labelMono, fontSize: "0.68rem", color: "#89a99e" }}>hint: "{field.placeholder}"</div>
            )}
            {/* Options chips */}
            {typeMeta.hasOptions && (field.options || []).length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginTop: "0.35rem" }}>
                {field.options.map((o, i) => <span key={i} style={{ background: "#e6ddd0", borderRadius: "2rem", padding: "0.15rem 0.6rem", fontSize: "0.75rem", fontFamily: "'DM Sans', sans-serif" }}>{o}</span>)}
              </div>
            )}
            {typeMeta.hasOptions && !(field.options || []).length && (
              <div style={{ color: "#E07A5F", fontSize: "0.72rem", fontFamily: "var(--font-mono)", marginTop: "0.3rem" }}>⚠ No options yet — click Edit to add</div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
            <button onClick={startEdit} style={S.btn("ghost")}>Edit</button>
            <button onClick={() => onDelete(field.id, field.deletable)} disabled={!field.deletable}
              style={{ ...S.btn("danger"), opacity: field.deletable ? 1 : 0.3, cursor: field.deletable ? "pointer" : "not-allowed" }}>Delete</button>
          </div>
        </div>
      )}

      {/* ── Edit mode ────────────────────────────────────────────────────────── */}
      {editing && draft && (
        <div style={{ padding: "1.3rem", background: "rgba(23,47,45,0.025)", borderLeft: "3px solid #172f2d" }}>

          {/* Row 1: label + type (statement skips placeholder) */}
          <div style={{ display: "grid", gridTemplateColumns: draft.type === "statement" ? "1fr 1fr" : "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "0.85rem" }}>
            <div>
              <label style={{ ...S.labelMono, fontSize: "0.65rem", display: "block", marginBottom: "0.3rem" }}>
                {draft.type === "statement" ? "Heading / Title" : "Label *"}
              </label>
              <input value={draft.label} onChange={e => setDraft(d => ({ ...d, label: e.target.value }))} style={S.input} />
            </div>
            {draft.type !== "statement" && (
              <div>
                <label style={{ ...S.labelMono, fontSize: "0.65rem", display: "block", marginBottom: "0.3rem" }}>Placeholder / hint text</label>
                <input value={draft.placeholder} onChange={e => setDraft(d => ({ ...d, placeholder: e.target.value }))} placeholder="Shown inside the field…" style={S.input} />
              </div>
            )}
            <div>
              <label style={{ ...S.labelMono, fontSize: "0.65rem", display: "block", marginBottom: "0.3rem" }}>Field type</label>
              <select value={draft.type}
                onChange={e => setDraft(d => ({ ...d, type: e.target.value, options: FIELD_TYPE_META[e.target.value]?.hasOptions ? d.options : (e.target.value === "rating" ? ["5"] : []) }))}
                style={{ ...S.input, appearance: "none" }}>
                {FIELD_TYPES.map(t => <option key={t} value={t}>{FIELD_TYPE_META[t]?.icon} {FIELD_TYPE_META[t]?.label}</option>)}
              </select>
            </div>
          </div>

          {/* Statement body */}
          {draft.type === "statement" && (
            <div style={{ marginBottom: "0.85rem" }}>
              <label style={{ ...S.labelMono, fontSize: "0.65rem", display: "block", marginBottom: "0.3rem" }}>Body text (shown below the heading)</label>
              <textarea value={draft.placeholder} onChange={e => setDraft(d => ({ ...d, placeholder: e.target.value }))}
                placeholder="Paragraph of text, instructions, consent language…"
                rows={3} style={{ ...S.input, resize: "vertical" }} />
            </div>
          )}

          {/* Type-specific extras */}
          {draft.type === "date" && (
            <div style={{ background: "rgba(95,158,160,0.08)", border: "1px solid rgba(95,158,160,0.2)", borderRadius: "0.5rem", padding: "0.5rem 0.9rem", marginBottom: "0.85rem", fontSize: "0.78rem", color: "#2E7D7F", fontFamily: "var(--font-mono)" }}>
              📅 Renders as a native calendar date picker in the form.
            </div>
          )}
          {draft.type === "yesno" && (
            <div style={{ background: "rgba(95,158,160,0.08)", border: "1px solid rgba(95,158,160,0.2)", borderRadius: "0.5rem", padding: "0.5rem 0.9rem", marginBottom: "0.85rem", fontSize: "0.78rem", color: "#2E7D7F", fontFamily: "var(--font-mono)" }}>
              ◐ Renders as two pill buttons — Yes and No.
            </div>
          )}
          {draft.type === "rating" && (
            <div style={{ marginBottom: "0.85rem" }}>
              <RatingScalePicker value={draft.options?.[0] || "5"} onChange={v => setDraft(d => ({ ...d, options: [v] }))} />
            </div>
          )}
          {editMeta.hasOptions && (
            <div style={{ marginBottom: "0.85rem" }}>
              <OptionsBuilder options={draft.options} onChange={opts => setDraft(d => ({ ...d, options: opts }))} />
            </div>
          )}

          {/* Toggles + save — statements skip required/halfWidth */}
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
            {draft.type !== "statement" && (
              <>
                <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.82rem", fontFamily: "'DM Sans', sans-serif", color: "#3a5450", cursor: "pointer" }}>
                  <input type="checkbox" checked={draft.required} onChange={e => setDraft(d => ({ ...d, required: e.target.checked }))} />
                  Required
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.82rem", fontFamily: "'DM Sans', sans-serif", color: "#3a5450", cursor: "pointer" }}>
                  <input type="checkbox" checked={draft.halfWidth} onChange={e => setDraft(d => ({ ...d, halfWidth: e.target.checked }))} />
                  Half-width
                </label>
              </>
            )}
            <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem" }}>
              <button onClick={cancelEdit} style={S.btn("ghost")}>Cancel</button>
              <button onClick={saveEdit} disabled={!draft.label.trim() || saving}
                style={{ ...S.btn("primary"), opacity: draft.label.trim() ? 1 : 0.5 }}>
                {saving ? "Saving…" : "Save to Firebase ✦"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FormBuilderTab() {
  const { fields, steps, loading, addField, deleteField, updateField, reorderField, addStep, updateStep, deleteStep } = useFormConfig();
  const [activeStep,   setActiveStep]   = useState(0);
  const [saving,       setSaving]       = useState(false);
  const [toast,        setToast]        = useState(null);
  const [newStepTitle, setNewStepTitle] = useState("");
  // Step editing
  const [editingStep,  setEditingStep]  = useState(null); // { idx, title, description }
  const [savingStep,   setSavingStep]   = useState(false);

  const EMPTY_FIELD = { type: "text", label: "", placeholder: "", required: false, halfWidth: false, options: [] };
  const [newField, setNewField] = useState(EMPTY_FIELD);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const stepFields = fields.filter(f => f.step === activeStep).sort((a, b) => a.order - b.order);
  const newMeta    = FIELD_TYPE_META[newField.type] || {};

  const handleAddField = async () => {
    if (!newField.label.trim()) return;
    setSaving(true);
    const name = newField.label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    // Statement fields are never required and never half-width
    const isStatement = newField.type === "statement";
    await addField({ ...newField, step: activeStep, name, required: isStatement ? false : newField.required, halfWidth: isStatement ? false : newField.halfWidth });
    setNewField(EMPTY_FIELD);
    setSaving(false);
    showToast("Field added ✦ saved to Firebase");
  };

  const handleDeleteField = async (fieldId, deletable) => {
    if (!deletable) return;
    if (!window.confirm("Delete this field? This cannot be undone.")) return;
    await deleteField(fieldId);
    showToast("Field deleted");
  };

  const handleAddStep = async () => {
    if (!newStepTitle.trim()) return;
    await addStep(newStepTitle.trim(), "");
    setNewStepTitle("");
    showToast("Step added");
  };

  const handleSaveStep = async () => {
    if (!editingStep || !editingStep.title.trim()) return;
    setSavingStep(true);
    await updateStep(steps[editingStep.idx].id, { title: editingStep.title, description: editingStep.description });
    setSavingStep(false);
    setEditingStep(null);
    showToast("Step saved to Firebase");
  };

  const handleDeleteStep = async (idx) => {
    const count = fields.filter(f => f.step === idx).length;
    const msg   = count
      ? `Delete "${steps[idx].title}"? ${count} field(s) inside will also be removed.`
      : `Delete step "${steps[idx].title}"?`;
    if (!window.confirm(msg)) return;
    await deleteStep(idx);
    setActiveStep(Math.max(0, activeStep - 1));
    setEditingStep(null);
    showToast("Step deleted");
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: "5rem", left: "50%", transform: "translateX(-50%)", background: "#172f2d", color: "#fff", padding: "0.6rem 1.4rem", borderRadius: "2rem", fontSize: "0.82rem", fontFamily: "var(--font-mono)", zIndex: 9999, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
          ✓ {toast}
        </div>
      )}

      {loading && <div style={{ color: "#89a99e", fontFamily: "var(--font-mono)", padding: "2rem 0" }}>Loading form config…</div>}

      {!loading && (
        <>
          {/* ── Step tabs ──────────────────────────────────────────────────────── */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "1rem", flexWrap: "wrap" }}>
            {steps.map((s, i) => {
              const isActive  = activeStep === i;
              const isEditing = editingStep?.idx === i;
              return (
                <button
                  key={s.id}
                  onClick={() => { setActiveStep(i); setEditingStep(null); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 0,
                    padding: 0, borderRadius: "2rem",
                    border: "1.5px solid",
                    borderColor: isActive ? "#172f2d" : "var(--color-border)",
                    background: isActive ? "#172f2d" : "transparent",
                    color: isActive ? "#fff" : "#3a5450",
                    fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem",
                    cursor: "pointer", overflow: "hidden",
                  }}
                >
                  {/* Step title */}
                  <span style={{ padding: "0.45rem 0.85rem 0.45rem 1rem" }}>{s.title}</span>
                  {/* Divider */}
                  <span style={{ width: 1, alignSelf: "stretch", flexShrink: 0, background: isActive ? "rgba(255,255,255,0.22)" : "rgba(23,47,45,0.15)" }} />
                  {/* Pencil — stopPropagation so outer button doesn't clear editingStep */}
                  <span
                    title="Edit step name & description"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveStep(i);
                      setEditingStep(isEditing ? null : { idx: i, title: s.title, description: s.description || "" });
                    }}
                    style={{
                      padding: "0.45rem 0.75rem",
                      fontSize: "0.78rem", lineHeight: 1,
                      color: isEditing ? "#bf8a3e" : (isActive ? "rgba(255,255,255,0.72)" : "#89a99e"),
                      background: isEditing ? "rgba(191,138,62,0.18)" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "background 0.12s, color 0.12s",
                    }}
                  >✎</span>
                </button>
              );
            })}
            {/* Add step */}
            <div style={{ display: "flex", gap: "0.4rem", marginLeft: "auto" }}>
              <input value={newStepTitle} onChange={e => setNewStepTitle(e.target.value)} placeholder="New page/step name…"
                style={{ ...S.input, width: 190, padding: "0.4rem 0.85rem" }}
                onKeyDown={e => e.key === "Enter" && handleAddStep()} />
              <button onClick={handleAddStep} style={S.btn("primary")}>+ Add Page</button>
            </div>
          </div>

          {/* ── Step editor panel ─────────────────────────────────────────────── */}
          {editingStep && (
            <div style={{ ...S.card, padding: "1.2rem 1.4rem", marginBottom: "1.2rem", borderLeft: "3px solid #bf8a3e" }}>
              <div style={{ ...S.labelMono, marginBottom: "0.8rem", color: "#bf8a3e" }}>Editing page: "{steps[editingStep.idx]?.title}"</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <div>
                  <label style={{ ...S.labelMono, fontSize: "0.65rem", display: "block", marginBottom: "0.3rem" }}>Page / Step title *</label>
                  <input
                    value={editingStep.title}
                    onChange={e => setEditingStep(s => ({ ...s, title: e.target.value }))}
                    placeholder="e.g. Health History"
                    style={S.input}
                    onKeyDown={e => e.key === "Enter" && handleSaveStep()}
                  />
                </div>
                <div>
                  <label style={{ ...S.labelMono, fontSize: "0.65rem", display: "block", marginBottom: "0.3rem" }}>Description shown to the client on this page</label>
                  <input
                    value={editingStep.description}
                    onChange={e => setEditingStep(s => ({ ...s, description: e.target.value }))}
                    placeholder="e.g. Tell us about your health background so we can prepare for your visit."
                    style={S.input}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", alignItems: "center" }}>
                {steps.length > 1 && (
                  <button onClick={() => handleDeleteStep(editingStep.idx)} style={{ ...S.btn("danger"), marginRight: "auto" }}>
                    Delete This Page
                  </button>
                )}
                <button onClick={() => setEditingStep(null)} style={S.btn("ghost")}>Cancel</button>
                <button onClick={handleSaveStep} disabled={!editingStep.title.trim() || savingStep}
                  style={{ ...S.btn("gold"), opacity: editingStep.title.trim() ? 1 : 0.5 }}>
                  {savingStep ? "Saving…" : "Save Page ✦"}
                </button>
              </div>
            </div>
          )}

          {/* ── Active step summary ───────────────────────────────────────────── */}
          {!editingStep && (
            <div style={{ marginBottom: "1.2rem" }}>
              <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "1.15rem", color: "#172f2d" }}>
                {steps[activeStep]?.title}
              </div>
              {steps[activeStep]?.description && (
                <div style={{ fontSize: "0.82rem", color: "#89a99e", fontFamily: "'DM Sans', sans-serif", marginTop: "0.2rem" }}>
                  {steps[activeStep].description}
                </div>
              )}
              <div style={{ ...S.labelMono, marginTop: "0.3rem" }}>
                {stepFields.length} field{stepFields.length !== 1 ? "s" : ""} · click ✎ on a tab to edit its title &amp; description
              </div>
            </div>
          )}

          {/* ── Field list ────────────────────────────────────────────────────── */}
          <div style={{ ...S.card, marginBottom: "1.5rem" }}>
            {stepFields.length === 0 && (
              <div style={{ padding: "2.5rem", textAlign: "center", color: "#89a99e", fontFamily: "var(--font-mono)", fontSize: "0.82rem" }}>
                No fields yet — add one below.
              </div>
            )}
            {stepFields.map((field, idx) => (
              <FieldRow
                key={field.id} field={field} idx={idx}
                isLast={idx === stepFields.length - 1}
                onReorder={reorderField} onDelete={handleDeleteField}
                onUpdate={updateField} showToast={showToast}
              />
            ))}
          </div>

          {/* ── Add new field ─────────────────────────────────────────────────── */}
          <div style={{ ...S.card, padding: "1.4rem" }}>
            <div style={{ ...S.labelMono, marginBottom: "1rem" }}>
              Add field to "{steps[activeStep]?.title}"
            </div>

            {/* Type picker — full-width pill row for visibility */}
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ ...S.labelMono, fontSize: "0.65rem", display: "block", marginBottom: "0.5rem" }}>Field type</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {FIELD_TYPES.map(t => {
                  const m = FIELD_TYPE_META[t];
                  const active = newField.type === t;
                  return (
                    <button key={t} type="button"
                      onClick={() => setNewField(f => ({ ...f, type: t, options: m.hasOptions ? f.options : (t === "rating" ? ["5"] : []) }))}
                      style={{
                        padding: "0.35rem 0.9rem", borderRadius: "2rem",
                        border: "1.5px solid " + (active ? "#172f2d" : "var(--color-border)"),
                        background: active ? "#172f2d" : "transparent",
                        color: active ? "#fff" : "#3a5450",
                        fontFamily: "'DM Sans', sans-serif", fontSize: "0.78rem", cursor: "pointer",
                        display: "flex", alignItems: "center", gap: "0.3rem",
                      }}
                    >{m.icon} {m.label}</button>
                  );
                })}
              </div>
            </div>

            {/* Label + placeholder (statement gets different labels) */}
            <div style={{ display: "grid", gridTemplateColumns: newField.type === "statement" ? "1fr" : "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
              <div>
                <label style={{ ...S.labelMono, fontSize: "0.65rem", display: "block", marginBottom: "0.3rem" }}>
                  {newField.type === "statement" ? "Heading / Title" : "Label *"}
                </label>
                <input value={newField.label} onChange={e => setNewField(f => ({ ...f, label: e.target.value }))}
                  placeholder={newField.type === "statement" ? "e.g. About Your Health History" : "e.g. Emergency Contact Name"}
                  style={S.input} onKeyDown={e => e.key === "Enter" && !newMeta.hasOptions && newField.type !== "statement" && handleAddField()} />
              </div>
              {newField.type !== "statement" && (
                <div>
                  <label style={{ ...S.labelMono, fontSize: "0.65rem", display: "block", marginBottom: "0.3rem" }}>Placeholder / hint text</label>
                  <input value={newField.placeholder} onChange={e => setNewField(f => ({ ...f, placeholder: e.target.value }))}
                    placeholder="Shown inside the empty field…" style={S.input} />
                </div>
              )}
            </div>

            {/* Statement body */}
            {newField.type === "statement" && (
              <div style={{ marginBottom: "0.75rem" }}>
                <label style={{ ...S.labelMono, fontSize: "0.65rem", display: "block", marginBottom: "0.3rem" }}>Body text (paragraph, instructions, consent language…)</label>
                <textarea value={newField.placeholder} onChange={e => setNewField(f => ({ ...f, placeholder: e.target.value }))}
                  placeholder="e.g. The following information helps us personalise your first session. Everything you share is confidential."
                  rows={3} style={{ ...S.input, resize: "vertical" }} />
              </div>
            )}

            {/* Type-specific extras */}
            {newField.type === "date" && (
              <div style={{ background: "rgba(95,158,160,0.08)", border: "1px solid rgba(95,158,160,0.2)", borderRadius: "0.5rem", padding: "0.5rem 0.9rem", marginBottom: "0.75rem", fontSize: "0.78rem", color: "#2E7D7F", fontFamily: "var(--font-mono)" }}>
                📅 Renders as a native calendar date picker in the client form.
              </div>
            )}
            {newField.type === "yesno" && (
              <div style={{ background: "rgba(95,158,160,0.08)", border: "1px solid rgba(95,158,160,0.2)", borderRadius: "0.5rem", padding: "0.5rem 0.9rem", marginBottom: "0.75rem", fontSize: "0.78rem", color: "#2E7D7F", fontFamily: "var(--font-mono)" }}>
                ◐ Renders as two large pill buttons — Yes and No.
              </div>
            )}
            {newField.type === "rating" && (
              <div style={{ marginBottom: "0.75rem" }}>
                <RatingScalePicker
                  value={newField.options?.[0] || "5"}
                  onChange={v => setNewField(f => ({ ...f, options: [v] }))}
                />
              </div>
            )}
            {newMeta.hasOptions && (
              <div style={{ background: "rgba(23,47,45,0.02)", border: "1px solid var(--color-border)", borderRadius: "0.6rem", padding: "1rem", marginBottom: "0.75rem" }}>
                <OptionsBuilder options={newField.options} onChange={opts => setNewField(f => ({ ...f, options: opts }))} />
              </div>
            )}

            {/* Toggles + add button — statements skip required/halfWidth */}
            <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", flexWrap: "wrap" }}>
              {newField.type !== "statement" && (
                <>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.82rem", fontFamily: "'DM Sans', sans-serif", color: "#3a5450", cursor: "pointer" }}>
                    <input type="checkbox" checked={newField.required} onChange={e => setNewField(f => ({ ...f, required: e.target.checked }))} />
                    Required
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.82rem", fontFamily: "'DM Sans', sans-serif", color: "#3a5450", cursor: "pointer" }}>
                    <input type="checkbox" checked={newField.halfWidth} onChange={e => setNewField(f => ({ ...f, halfWidth: e.target.checked }))} />
                    Half-width (pairs with next field)
                  </label>
                </>
              )}
              <button onClick={handleAddField} disabled={!newField.label.trim() || saving}
                style={{ ...S.btn("primary"), marginLeft: "auto", opacity: newField.label.trim() ? 1 : 0.5 }}>
                {saving ? "Saving…" : "+ Add Field"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Tab: Pages ───────────────────────────────────────────────────────────────
const EMPTY_PAGE = { title: "", subheading: "", body: "", showInNav: true };

function PageRow({ page, idx, isLast, onReorder, onDelete, onUpdate, showToast }) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(null);
  const [saving,  setSaving]  = useState(false);

  const startEdit = () => {
    setDraft({ title: page.title, subheading: page.subheading || "", body: page.body || "", showInNav: page.showInNav ?? true });
    setEditing(true);
  };
  const cancelEdit = () => { setEditing(false); setDraft(null); };

  const saveEdit = async () => {
    if (!draft.title.trim()) return;
    setSaving(true);
    await onUpdate(page.id, draft);
    setSaving(false);
    setEditing(false);
    setDraft(null);
    showToast(`"${draft.title}" saved to Firebase`);
  };

  const wordCount = (page.body || "").trim().split(/\s+/).filter(Boolean).length;
  const bodyPreview = (page.body || "").trim().slice(0, 120) + ((page.body || "").length > 120 ? "…" : "");

  return (
    <div style={{ borderBottom: !isLast ? "1px solid rgba(23,47,45,0.08)" : "none" }}>

      {/* ── View row ─────────────────────────────────────────────────────────── */}
      {!editing && (
        <div style={{ padding: "1.1rem 1.3rem", display: "flex", gap: "1rem", alignItems: "flex-start" }}>
          {/* Reorder */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem", paddingTop: "0.2rem", flexShrink: 0 }}>
            <button onClick={() => onReorder(page.id, "up")} disabled={idx === 0} style={{ background: "none", border: "none", color: idx === 0 ? "rgba(137,169,158,0.3)" : "#89a99e", cursor: idx === 0 ? "default" : "pointer", fontSize: "0.75rem", padding: "0.1rem" }}>▲</button>
            <button onClick={() => onReorder(page.id, "down")} disabled={isLast} style={{ background: "none", border: "none", color: isLast ? "rgba(137,169,158,0.3)" : "#89a99e", cursor: isLast ? "default" : "pointer", fontSize: "0.75rem", padding: "0.1rem" }}>▼</button>
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Title row */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.3rem", flexWrap: "wrap" }}>
              <span style={{ fontWeight: 600, fontSize: "0.95rem", color: "#172f2d", fontFamily: "'DM Sans', sans-serif" }}>{page.title}</span>
              <span style={{ ...S.labelMono, fontSize: "0.68rem", color: "#89a99e" }}>
                luminaljourneys.com/<strong>{page.id}</strong>
              </span>
              {page.showInNav
                ? <span style={{ background: "rgba(95,158,160,0.12)", color: "#2E7D7F", fontSize: "0.65rem", padding: "0.12rem 0.45rem", borderRadius: "0.25rem", fontFamily: "var(--font-mono)" }}>in nav</span>
                : <span style={{ background: "rgba(137,169,158,0.1)", color: "#89a99e", fontSize: "0.65rem", padding: "0.12rem 0.45rem", borderRadius: "0.25rem", fontFamily: "var(--font-mono)" }}>hidden from nav</span>
              }
              {wordCount > 0 && (
                <span style={{ ...S.labelMono, fontSize: "0.65rem", color: "#89a99e" }}>{wordCount} words</span>
              )}
            </div>

            {/* Subheading */}
            {page.subheading && (
              <div style={{ fontSize: "0.82rem", color: "#3a5450", fontFamily: "'DM Sans', sans-serif", fontStyle: "italic", marginBottom: "0.3rem" }}>
                {page.subheading}
              </div>
            )}

            {/* Body preview */}
            {bodyPreview ? (
              <div style={{ fontSize: "0.78rem", color: "#89a99e", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>
                {bodyPreview}
              </div>
            ) : (
              <div style={{ ...S.labelMono, fontSize: "0.68rem", color: "rgba(137,169,158,0.6)" }}>
                No body content yet — click Edit to add
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
            <button onClick={startEdit} style={S.btn("ghost")}>Edit</button>
            <button onClick={() => navigate("/" + page.id)} style={S.btn("ghost")}>View ↗</button>
            <button onClick={() => onDelete(page)} style={S.btn("danger")}>Delete</button>
          </div>
        </div>
      )}

      {/* ── Edit form ────────────────────────────────────────────────────────── */}
      {editing && draft && (
        <div style={{ padding: "1.3rem", background: "rgba(23,47,45,0.025)", borderLeft: "3px solid #172f2d" }}>
          <div style={{ ...S.labelMono, marginBottom: "1rem", color: "#172f2d" }}>
            Editing: <strong>{page.title}</strong>
            <span style={{ color: "#89a99e", fontWeight: 400, marginLeft: "0.5rem" }}>luminaljourneys.com/{page.id}</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <div>
              <label style={{ ...S.labelMono, fontSize: "0.65rem", display: "block", marginBottom: "0.3rem" }}>Page Title *</label>
              <input value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} style={S.input} />
              <div style={{ ...S.labelMono, fontSize: "0.62rem", color: "#89a99e", marginTop: "0.25rem" }}>
                Note: title changes don't change the URL slug
              </div>
            </div>
            <div>
              <label style={{ ...S.labelMono, fontSize: "0.65rem", display: "block", marginBottom: "0.3rem" }}>Subheading</label>
              <input value={draft.subheading} onChange={e => setDraft(d => ({ ...d, subheading: e.target.value }))} placeholder="Short tagline shown under the heading" style={S.input} />
            </div>
          </div>

          <div style={{ marginBottom: "0.85rem" }}>
            <label style={{ ...S.labelMono, fontSize: "0.65rem", display: "block", marginBottom: "0.3rem" }}>Body Content</label>
            <textarea
              value={draft.body}
              onChange={e => setDraft(d => ({ ...d, body: e.target.value }))}
              placeholder="Main page content — supports plain text paragraphs…"
              rows={6}
              style={{ ...S.input, resize: "vertical", lineHeight: 1.7 }}
            />
            <div style={{ ...S.labelMono, fontSize: "0.62rem", color: "#89a99e", marginTop: "0.25rem" }}>
              {draft.body.trim().split(/\s+/).filter(Boolean).length} words
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.82rem", fontFamily: "'DM Sans', sans-serif", color: "#3a5450", cursor: "pointer" }}>
              <input type="checkbox" checked={draft.showInNav} onChange={e => setDraft(d => ({ ...d, showInNav: e.target.checked }))} />
              Show in navigation
            </label>
            <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem" }}>
              <button onClick={cancelEdit} style={S.btn("ghost")}>Cancel</button>
              <button onClick={saveEdit} disabled={!draft.title.trim() || saving}
                style={{ ...S.btn("primary"), opacity: draft.title.trim() ? 1 : 0.5 }}>
                {saving ? "Saving…" : "Save to Firebase ✦"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PagesTab() {
  const { pages, loading, addPage, updatePage, deletePage, reorderPage } = useSitePages();
  const [newPage, setNewPage]   = useState(EMPTY_PAGE);
  const [adding, setAdding]     = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast]       = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const handleAdd = async () => {
    if (!newPage.title.trim()) return;
    setAdding(true);
    const p = await addPage(newPage);
    setNewPage(EMPTY_PAGE);
    setShowForm(false);
    setAdding(false);
    showToast(`Page "${p.title}" created`);
  };

  const handleDelete = async (page) => {
    if (!window.confirm(`Delete page "${page.title}"? This cannot be undone.`)) return;
    await deletePage(page.id);
    showToast("Page deleted");
  };

  const sorted = [...pages].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div style={{ position: "relative" }}>
      {toast && (
        <div style={{ position: "fixed", bottom: "5rem", left: "50%", transform: "translateX(-50%)", background: "#172f2d", color: "#fff", padding: "0.6rem 1.4rem", borderRadius: "2rem", fontSize: "0.82rem", fontFamily: "var(--font-mono)", zIndex: 999, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
          ✓ {toast}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
        <div>
          <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "1.2rem", color: "#172f2d" }}>Dynamic Pages</div>
          <div style={{ ...S.labelMono, marginTop: "0.2rem" }}>
            {sorted.length} page{sorted.length !== 1 ? "s" : ""} · accessible at luminaljourneys.com/{"{slug}"}
          </div>
        </div>
        <button onClick={() => setShowForm(v => !v)} style={S.btn("primary")}>
          {showForm ? "Cancel" : "+ New Page"}
        </button>
      </div>

      {/* ── New page form ──────────────────────────────────────────────────────── */}
      {showForm && (
        <div style={{ ...S.card, padding: "1.4rem", marginBottom: "1.5rem", borderLeft: "3px solid #bf8a3e" }}>
          <div style={{ ...S.labelMono, marginBottom: "1rem", color: "#bf8a3e" }}>New Page</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <div>
              <label style={{ ...S.labelMono, fontSize: "0.65rem", display: "block", marginBottom: "0.3rem" }}>Page Title * (becomes URL slug)</label>
              <input value={newPage.title} onChange={e => setNewPage(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Services" style={S.input} />
              {newPage.title && (
                <div style={{ ...S.labelMono, fontSize: "0.68rem", color: "#bf8a3e", marginTop: "0.3rem" }}>
                  URL: /{newPage.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}
                </div>
              )}
            </div>
            <div>
              <label style={{ ...S.labelMono, fontSize: "0.65rem", display: "block", marginBottom: "0.3rem" }}>Subheading</label>
              <input value={newPage.subheading} onChange={e => setNewPage(p => ({ ...p, subheading: e.target.value }))} placeholder="Short tagline under the heading" style={S.input} />
            </div>
          </div>
          <div style={{ marginBottom: "0.75rem" }}>
            <label style={{ ...S.labelMono, fontSize: "0.65rem", display: "block", marginBottom: "0.3rem" }}>Body Content</label>
            <textarea value={newPage.body} onChange={e => setNewPage(p => ({ ...p, body: e.target.value }))} placeholder="Main page content…" rows={5} style={{ ...S.input, resize: "vertical" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.82rem", fontFamily: "'DM Sans', sans-serif", color: "#3a5450", cursor: "pointer" }}>
              <input type="checkbox" checked={newPage.showInNav} onChange={e => setNewPage(p => ({ ...p, showInNav: e.target.checked }))} />
              Show in navigation
            </label>
            <button onClick={handleAdd} disabled={!newPage.title.trim() || adding}
              style={{ ...S.btn("primary"), marginLeft: "auto", opacity: newPage.title.trim() ? 1 : 0.5 }}>
              {adding ? "Creating…" : "Create Page"}
            </button>
          </div>
        </div>
      )}

      {/* ── Pages list ────────────────────────────────────────────────────────── */}
      {loading && <div style={{ color: "#89a99e", fontFamily: "var(--font-mono)", padding: "1rem 0" }}>Loading pages…</div>}

      {!loading && sorted.length === 0 && !showForm && (
        <div style={{ ...S.card, padding: "3rem", textAlign: "center", color: "#89a99e", fontFamily: "var(--font-mono)", fontSize: "0.82rem" }}>
          No dynamic pages yet. Click "+ New Page" to create one.
        </div>
      )}

      {!loading && sorted.length > 0 && (
        <div style={S.card}>
          {sorted.map((page, idx) => (
            <PageRow
              key={page.id}
              page={page}
              idx={idx}
              isLast={idx === sorted.length - 1}
              onReorder={reorderPage}
              onDelete={handleDelete}
              onUpdate={updatePage}
              showToast={showToast}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Publish ─────────────────────────────────────────────────────────────
function PublishTab() {
  const { publish, publishing, lastPublished, error } = usePublish();
  const [done, setDone] = useState(false);

  const handlePublish = async () => {
    if (!window.confirm("Publish all staging content to luminaljourneys.com now?")) return;
    await publish();
    setDone(true);
  };

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "1.4rem", color: "#172f2d", marginBottom: "0.5rem" }}>Publish to Production</div>
      <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#3a5450", lineHeight: 1.7, marginBottom: "2rem" }}>
        When you're happy with everything on staging, click Publish to push your content changes — text edits, form configuration, and dynamic pages — live to <strong>luminaljourneys.com</strong> instantly. No redeploy needed.
      </p>

      <div style={{ background: "#e6ddd0", borderRadius: "0.8rem", padding: "1.4rem 1.6rem", marginBottom: "2rem", border: "1px solid rgba(23,47,45,0.1)" }}>
        <div style={{ ...S.labelMono, marginBottom: "0.8rem" }}>What gets published</div>
        {[["Text content edits", "All copy changes made via the inline editor"], ["Form configuration", "Steps, fields, options, and order"], ["Dynamic pages", "All pages created in the Pages tab"]].map(([title, desc]) => (
          <div key={title} style={{ display: "flex", gap: "0.75rem", marginBottom: "0.7rem", alignItems: "flex-start" }}>
            <span style={{ color: "#bf8a3e", fontSize: "0.9rem", marginTop: "0.05rem" }}>✦</span>
            <div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.88rem", fontWeight: 500, color: "#172f2d" }}>{title}</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.78rem", color: "#89a99e" }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>

      {error && <div style={{ color: "#E07A5F", fontFamily: "var(--font-mono)", fontSize: "0.82rem", marginBottom: "1rem" }}>{error}</div>}
      {done && lastPublished && <div style={{ color: "#74c9a0", fontFamily: "var(--font-mono)", fontSize: "0.82rem", marginBottom: "1rem" }}>✓ Published successfully · {new Date(lastPublished).toLocaleString()}</div>}

      <button onClick={handlePublish} disabled={publishing} style={{
        ...S.btn("gold"), fontSize: "0.95rem", padding: "0.75rem 2.2rem",
        opacity: publishing ? 0.6 : 1, cursor: publishing ? "wait" : "pointer",
      }}>
        {publishing ? "Publishing…" : "Publish Live ✦"}
      </button>

      <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "#89a99e", marginTop: "1.2rem", lineHeight: 1.6 }}>
        Note: code changes (new components, routes, etc.) still require a GitHub push and CI/CD deploy. Only Firestore content is updated here.
      </p>
    </div>
  );
}

// ─── Dashboard (tabbed shell) ─────────────────────────────────────────────────
const TABS = [
  { id: "intakes",  label: "Intakes" },
  { id: "form",     label: "Form Builder" },
  { id: "pages",    label: "Pages" },
  { id: "publish",  label: "Publish" },
];

function SignOutBtn() {
  const { signOutFully } = useEditMode();
  return (
    <button
      onClick={async () => { await signOutFully(); navigate("/"); }}
      style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.75)", padding: "0.4rem 1.1rem", borderRadius: "2rem", cursor: "pointer", fontSize: "0.78rem" }}
    >Sign Out</button>
  );
}

function Dashboard() {
  const { currentUser } = useEditMode();
  // Support ?tab=form deep-link from Edit Form shortcut on IntakePage
  const initialTab = new URLSearchParams(window.location.search).get("tab") || "intakes";
  const [tab, setTab] = useState(initialTab);

  return (
    <div style={{ minHeight: "100vh", background: "#F9F8F6", fontFamily: "'DM Sans', sans-serif" }}>

      {/* NAV */}
      <div style={{ padding: "1rem clamp(1rem, 3vw, 2.5rem)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#172f2d", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <button onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <img src="/luminaljourneys-primary-logo-mark-gold.transparent.png" alt="Luminal Journeys" style={{ height: 60, width: "auto" }} />
            <div style={{ width: 1, height: 32, background: "rgba(255,255,255,0.25)" }} />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", fontWeight: 600, color: "rgba(249,247,244,0.95)", letterSpacing: "0.18em", textTransform: "uppercase" }}>Luminal Journeys</span>
          </button>
          <span style={{ color: "rgba(255,255,255,0.3)" }}>|</span>
          <span style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>Admin</span>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={() => navigate("/brand")} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)", padding: "0.4rem 1.1rem", borderRadius: "2rem", cursor: "pointer", fontSize: "0.78rem" }}>Brand Kit</button>
          <SignOutBtn />
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "2.5rem clamp(1rem, 3vw, 2rem)" }}>

        <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "2.2rem", fontWeight: 400, color: "#172f2d", marginBottom: "0.3rem" }}>Welcome back{currentUser?.displayName ? `, ${currentUser.displayName}` : ''} ✦</h1>
        <p style={{ fontSize: "0.9rem", color: "#89a99e", fontFamily: "var(--font-mono)", marginTop: 0, marginBottom: "2rem" }}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </p>

        {/* Tab bar */}
        <div style={{ display: "flex", gap: "0.25rem", borderBottom: "2px solid var(--color-border)", marginBottom: "2rem" }}>
          {TABS.map(t => (
            <button key={t.id} data-testid={`tab-${t.id}`} onClick={() => setTab(t.id)} style={{
              padding: "0.6rem 1.4rem", background: "none", border: "none", cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif", fontSize: "0.88rem",
              color: tab === t.id ? "#172f2d" : "#89a99e",
              fontWeight: tab === t.id ? 600 : 400,
              borderBottom: tab === t.id ? "2px solid #172f2d" : "2px solid transparent",
              marginBottom: "-2px", transition: "color 0.15s",
            }}>{t.label}</button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "intakes" && <IntakesTab />}
        {tab === "form"    && <FormBuilderTab />}
        {tab === "pages"   && <PagesTab />}
        {tab === "publish" && <PublishTab />}

      </div>

      <div style={{ textAlign: "center", padding: "1.5rem", fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "#89a99e" }}>
        © {new Date().getFullYear()} Luminal Journeys · All rights reserved
      </div>
      <MockupBanner />
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { isEditMode, magicLinkPending } = useEditMode();
  // Magic link is mid-completion — show a neutral loading screen so AdminGate
  // doesn't flash and requestAuth() doesn't fire the login modal prematurely.
  if (magicLinkPending) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F9F8F6", fontFamily: "'DM Sans', sans-serif", flexDirection: "column", gap: "1rem" }}>
      <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "1.4rem", color: "#172f2d" }}>Luminal Journeys</div>
      <div style={{ fontSize: "0.8rem", color: "#89a99e", letterSpacing: "0.1em", textTransform: "uppercase" }}>Signing you in…</div>
    </div>
  );
  if (!isEditMode) return <AdminGate />;
  return <Dashboard />;
}
