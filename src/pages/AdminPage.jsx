import React, { useState } from "react";
import MockupBanner from "../components/MockupBanner.jsx";
import { navigate } from "../App.jsx";

const ADMIN_USER = "admin";
const ADMIN_PASS = "luminal2026";

const MOCK_INTAKES = [
  {
    id: 1,
    firstName: "Amara", lastName: "Osei",
    preferredName: "Amara", dateOfBirth: "1990-04-12", pronouns: "She / Her",
    email: "amara@email.nl", phone: "+31 6 1234 5678",
    address: "Keizersgracht 412", city: "Amsterdam", state: "NH", zip: "1016 GC",
    preferredContact: "email",
    primaryGoal: "Stress & Anxiety Management", hearAboutUs: "Friend or Family",
    additionalNotes: "Looking forward to starting.",
    submittedAt: "2026-03-13", status: "New", notes: ""
  },
  {
    id: 2,
    firstName: "Lucia", lastName: "Vega",
    preferredName: "", dateOfBirth: "1985-09-22", pronouns: "She / Her",
    email: "lucia@email.nl", phone: "+31 6 2345 6789",
    address: "Witte de Withstraat 88", city: "Rotterdam", state: "ZH", zip: "3012 BN",
    preferredContact: "phone",
    primaryGoal: "Hormonal Balance", hearAboutUs: "Google Search",
    additionalNotes: "",
    submittedAt: "2026-03-12", status: "Contacted", notes: ""
  },
  {
    id: 3,
    firstName: "Priya", lastName: "Nair",
    preferredName: "Pri", dateOfBirth: "1993-01-05", pronouns: "She / Her",
    email: "priya@email.nl", phone: "+31 6 3456 7890",
    address: "Grote Marktstraat 201", city: "Den Haag", state: "ZH", zip: "2511 BK",
    preferredContact: "text",
    primaryGoal: "Sleep Improvement", hearAboutUs: "Social Media",
    additionalNotes: "Have tried melatonin, not working.",
    submittedAt: "2026-03-11", status: "Scheduled", notes: ""
  },
  {
    id: 4,
    firstName: "Camille", lastName: "Dubois",
    preferredName: "Cami", dateOfBirth: "1988-07-30", pronouns: "She / Her",
    email: "camille@email.nl", phone: "+31 6 4567 8901",
    address: "Nachtegaalstraat 54", city: "Utrecht", state: "UT", zip: "3581 AK",
    preferredContact: "email",
    primaryGoal: "Energy & Vitality", hearAboutUs: "Healthcare Provider Referral",
    additionalNotes: "",
    submittedAt: "2026-03-10", status: "New", notes: ""
  },
];

const STATUS_META = {
  New:       { bg: "rgba(224,122,95,0.12)", color: "#C4604A", dot: "#E07A5F" },
  Contacted: { bg: "rgba(95,158,160,0.12)", color: "#2E7D7F", dot: "#5F9EA0" },
  Scheduled: { bg: "rgba(17,76,92,0.12)",   color: "#114C5C", dot: "#114C5C" },
};
const STATUS_ORDER = ["New", "Contacted", "Scheduled"];

const fmt = (dateStr) =>
  new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

// ─── Login Modal ──────────────────────────────────────────────────────────────
function LoginModal({ onAuth }) {
  const [username, setUsername] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);

  const submit = () => {
    if (username === ADMIN_USER && pw === ADMIN_PASS) {
      sessionStorage.setItem("lj_admin", "true");
      onAuth();
    } else {
      setError(true);
      setPw("");
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 999,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(17,76,92,0.55)", fontFamily: "'DM Sans', sans-serif"
    }}>
      <div style={{
        background: "var(--color-bg)", borderRadius: "1.2rem",
        padding: "2.8rem 2.5rem", width: "100%", maxWidth: 400,
        boxShadow: "0 24px 80px rgba(17,76,92,0.2)",
        border: "1px solid var(--color-border)", position: "relative", margin: "1rem"
      }}>
        <button onClick={() => navigate("/")} style={{
          position: "absolute", top: "1.2rem", right: "1.4rem",
          background: "none", border: "none", cursor: "pointer",
          color: "var(--color-text-muted)", fontSize: "1.4rem", lineHeight: 1
        }}>×</button>

        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "1.6rem", color: "var(--color-primary)", marginBottom: "0.3rem" }}>
            Luminal Journey
          </div>
          <div style={{ fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
            Admin Sign In
          </div>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-soft)", marginBottom: "0.4rem" }}>Username</label>
          <input
            type="text" value={username} autoFocus
            onChange={e => { setUsername(e.target.value); setError(false); }}
            onKeyDown={e => e.key === "Enter" && submit()}
            placeholder="Admin username"
            style={{
              width: "100%", padding: "0.75rem 1rem", boxSizing: "border-box",
              border: "1.5px solid " + (error ? "#E07A5F" : "var(--color-border)"),
              borderRadius: "0.6rem", fontSize: "0.92rem", outline: "none",
              background: "var(--color-bg-soft)", color: "var(--color-text)"
            }}
          />
        </div>

        <div style={{ marginBottom: "1.2rem" }}>
          <label style={{ display: "block", fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-soft)", marginBottom: "0.4rem" }}>Password</label>
          <input
            type="password" value={pw}
            onChange={e => { setPw(e.target.value); setError(false); }}
            onKeyDown={e => e.key === "Enter" && submit()}
            placeholder="Enter password"
            style={{
              width: "100%", padding: "0.75rem 1rem", boxSizing: "border-box",
              border: "1.5px solid " + (error ? "#E07A5F" : "var(--color-border)"),
              borderRadius: "0.6rem", fontSize: "0.92rem", outline: "none",
              background: "var(--color-bg-soft)", color: "var(--color-text)"
            }}
          />
        </div>

        {error && <div style={{ fontSize: "0.82rem", color: "#E07A5F", marginBottom: "1rem", textAlign: "center" }}>Incorrect username or password</div>}

        <button onClick={submit} style={{
          width: "100%", background: "var(--color-primary)", color: "#fff",
          border: "none", borderRadius: "0.6rem", padding: "0.85rem",
          fontSize: "0.9rem", cursor: "pointer", letterSpacing: "0.04em"
        }}>Sign In</button>

        <div style={{ textAlign: "center", marginTop: "1.4rem" }}>
          <button onClick={() => navigate("/")} style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: "0.8rem", color: "var(--color-text-muted)"
          }}>← Back to site</button>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard() {
  const [intakes, setIntakes] = useState(MOCK_INTAKES);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [sortCol, setSortCol] = useState("submittedAt");
  const [sortDir, setSortDir] = useState("desc");
  const [noteEditing, setNoteEditing] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");

  const filtered = intakes
    .filter(r => {
      const q = search.toLowerCase();
      return [r.firstName, r.lastName, r.email, r.primaryGoal, r.status, r.city]
        .some(v => v.toLowerCase().includes(q));
    })
    .sort((a, b) => {
      const av = a[sortCol] || "", bv = b[sortCol] || "";
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });

  const cycleStatus = (id) =>
    setIntakes(prev => prev.map(r =>
      r.id === id ? { ...r, status: STATUS_ORDER[(STATUS_ORDER.indexOf(r.status) + 1) % STATUS_ORDER.length] } : r
    ));

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };

  const counts = {
    total: intakes.length,
    new: intakes.filter(r => r.status === "New").length,
    contacted: intakes.filter(r => r.status === "Contacted").length,
    scheduled: intakes.filter(r => r.status === "Scheduled").length,
  };

  const th = (col) => ({
    padding: "0.75rem 1rem", textAlign: "left",
    fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase",
    color: "var(--color-text-muted)", fontWeight: 500,
    cursor: col ? "pointer" : "default", userSelect: "none", whiteSpace: "nowrap",
    borderBottom: "1.5px solid var(--color-border)", background: "var(--color-bg-soft)",
  });

  const td = {
    padding: "0.85rem 1rem", fontSize: "0.87rem",
    color: "var(--color-text)", borderBottom: "1px solid var(--color-border)",
    verticalAlign: "middle",
  };

  const COLS = [
    ["#", null], ["First Name", "firstName"], ["Last Name", "lastName"],
    ["Preferred Name", "preferredName"], ["Date of Birth", "dateOfBirth"],
    ["Pronouns", "pronouns"], ["Email", "email"], ["Phone", null],
    ["City", "city"], ["Pref. Contact", "preferredContact"],
    ["Primary Goal", "primaryGoal"], ["Heard Via", "hearAboutUs"],
    ["Submitted", "submittedAt"], ["Status", "status"],
    ["Notes", null], ["", null],
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)", fontFamily: "'DM Sans', sans-serif" }}>

      {/* NAV */}
      <div style={{
        padding: "1rem 2.5rem", display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "var(--color-primary)", borderBottom: "1px solid rgba(255,255,255,0.1)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <button onClick={() => navigate("/")} style={{
            background: "none", border: "none", cursor: "pointer",
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: "1.3rem", color: "rgba(255,255,255,0.9)"
          }}>Luminal Journey</button>
          <span style={{ color: "rgba(255,255,255,0.3)" }}>|</span>
          <span style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>Admin</span>
        </div>
        <button onClick={() => { sessionStorage.removeItem("lj_admin"); navigate("/"); }} style={{
          background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
          color: "rgba(255,255,255,0.75)", padding: "0.4rem 1.1rem", borderRadius: "2rem",
          cursor: "pointer", fontSize: "0.78rem", letterSpacing: "0.04em"
        }}>Sign Out</button>
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "2.5rem 2rem" }}>

        <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "2.2rem", fontWeight: 400, color: "var(--color-primary)", marginBottom: "0.3rem" }}>
          Welcome back ✦
        </h1>
        <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", marginTop: 0 }}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </p>

        <div style={{ height: 1, background: "var(--color-border)", margin: "1.8rem 0" }} />

        {/* METRICS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          {[
            { label: "Total Intakes", value: counts.total,     accent: "var(--color-primary)" },
            { label: "New",           value: counts.new,       accent: "#E07A5F" },
            { label: "Contacted",     value: counts.contacted, accent: "#5F9EA0" },
            { label: "Scheduled",     value: counts.scheduled, accent: "#114C5C" },
          ].map(m => (
            <div key={m.label} style={{
              background: "#fff", border: "1px solid var(--color-border)",
              borderRadius: "0.8rem", padding: "1.3rem 1.5rem", borderTop: "3px solid " + m.accent
            }}>
              <div style={{ fontSize: "2rem", fontWeight: 600, color: m.accent, lineHeight: 1, marginBottom: "0.35rem" }}>{m.value}</div>
              <div style={{ fontSize: "0.72rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-muted)" }}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* TABLE */}
        <div style={{ background: "#fff", border: "1px solid var(--color-border)", borderRadius: "0.8rem", overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.2rem", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--color-border)" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--color-text)" }}>
              Client Intakes
              <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", fontWeight: 400, marginLeft: "0.6rem" }}>
                {filtered.length} record{filtered.length !== 1 ? "s" : ""}
              </span>
            </span>
            <div style={{ display: "flex", gap: "0.8rem", alignItems: "center" }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                style={{
                  padding: "0.45rem 0.9rem", border: "1.5px solid var(--color-border)",
                  borderRadius: "2rem", fontSize: "0.83rem", outline: "none",
                  width: 200, background: "var(--color-bg)", color: "var(--color-text)"
                }}
              />
              <button onClick={() => navigate("/intake")} style={{
                background: "var(--color-accent)", color: "#fff", border: "none",
                padding: "0.45rem 1.1rem", borderRadius: "2rem",
                cursor: "pointer", fontSize: "0.8rem", letterSpacing: "0.04em"
              }}>+ New Intake</button>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {COLS.map(([label, col]) => (
                    <th key={label} style={th(col)} onClick={() => col && handleSort(col)}>
                      {label}{col && sortCol === col ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={16} style={{ ...td, textAlign: "center", color: "var(--color-text-muted)", padding: "3rem" }}>
                      No records found
                    </td>
                  </tr>
                )}
                {filtered.map((row, i) => {
                  const sc = STATUS_META[row.status];
                  const isExp = expanded === row.id;
                  return (
                    <React.Fragment key={row.id}>
                      <tr
                        style={{ background: isExp ? "rgba(17,76,92,0.03)" : "transparent" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(17,76,92,0.03)"}
                        onMouseLeave={e => e.currentTarget.style.background = isExp ? "rgba(17,76,92,0.03)" : "transparent"}
                      >
                        <td style={{ ...td, color: "var(--color-text-muted)", width: 36 }}>{i + 1}</td>
                        <td style={{ ...td, fontWeight: 500 }}>{row.firstName}</td>
                        <td style={{ ...td, fontWeight: 500 }}>{row.lastName}</td>
                        <td style={{ ...td, color: "var(--color-text-soft)" }}>{row.preferredName || "—"}</td>
                        <td style={{ ...td, whiteSpace: "nowrap", fontSize: "0.82rem" }}>{fmt(row.dateOfBirth)}</td>
                        <td style={{ ...td, fontSize: "0.82rem" }}>{row.pronouns || "—"}</td>
                        <td style={td}>
                          <a href={"mailto:" + row.email} style={{ color: "var(--color-secondary)", textDecoration: "none", fontSize: "0.82rem" }}>{row.email}</a>
                        </td>
                        <td style={{ ...td, whiteSpace: "nowrap", fontSize: "0.82rem" }}>{row.phone}</td>
                        <td style={{ ...td, fontSize: "0.82rem" }}>{row.city}, {row.state}</td>
                        <td style={{ ...td, fontSize: "0.82rem", textTransform: "capitalize" }}>{row.preferredContact}</td>
                        <td style={{ ...td, fontSize: "0.82rem", maxWidth: 180 }}>{row.primaryGoal}</td>
                        <td style={{ ...td, fontSize: "0.82rem" }}>{row.hearAboutUs || "—"}</td>
                        <td style={{ ...td, whiteSpace: "nowrap", fontSize: "0.82rem", color: "var(--color-text-muted)" }}>{fmt(row.submittedAt)}</td>
                        <td style={td}>
                          <button onClick={() => cycleStatus(row.id)} style={{
                            background: sc.bg, color: sc.color, border: "none", borderRadius: "2rem",
                            padding: "0.28rem 0.8rem", fontSize: "0.73rem", fontWeight: 500,
                            cursor: "pointer", display: "flex", alignItems: "center", gap: "0.35rem", whiteSpace: "nowrap"
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: sc.dot, display: "inline-block" }} />
                            {row.status}
                          </button>
                        </td>
                        <td style={{ ...td, minWidth: 160, maxWidth: 220 }}>
                          {noteEditing === row.id ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                              <textarea autoFocus value={noteDraft} onChange={e => setNoteDraft(e.target.value)} rows={3}
                                style={{
                                  width: "100%", padding: "0.5rem 0.6rem",
                                  border: "1.5px solid var(--color-primary)", borderRadius: "0.4rem",
                                  fontSize: "0.82rem", fontFamily: "'DM Sans', sans-serif",
                                  resize: "none", outline: "none",
                                  background: "var(--color-bg-soft)", color: "var(--color-text)", boxSizing: "border-box"
                                }}
                              />
                              <div style={{ display: "flex", gap: "0.4rem" }}>
                                <button onClick={() => { setIntakes(prev => prev.map(r => r.id === row.id ? { ...r, notes: noteDraft } : r)); setNoteEditing(null); }}
                                  style={{ background: "var(--color-primary)", color: "#fff", border: "none", borderRadius: "0.4rem", padding: "0.3rem 0.7rem", fontSize: "0.75rem", cursor: "pointer" }}>Save</button>
                                <button onClick={() => setNoteEditing(null)}
                                  style={{ background: "none", border: "1px solid var(--color-border)", borderRadius: "0.4rem", padding: "0.3rem 0.7rem", fontSize: "0.75rem", cursor: "pointer", color: "var(--color-text-muted)" }}>Cancel</button>
                              </div>
                            </div>
                          ) : row.notes ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                              <span style={{ fontSize: "0.82rem", color: "var(--color-text)", lineHeight: 1.4 }}>{row.notes}</span>
                              <button onClick={() => { setNoteEditing(row.id); setNoteDraft(row.notes); }}
                                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-secondary)", fontSize: "0.75rem", textAlign: "left", padding: 0 }}>Edit note</button>
                            </div>
                          ) : (
                            <button onClick={() => { setNoteEditing(row.id); setNoteDraft(""); }}
                              style={{ background: "none", border: "1.5px dashed var(--color-border)", borderRadius: "0.4rem", padding: "0.3rem 0.7rem", fontSize: "0.75rem", cursor: "pointer", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>+ Add Note</button>
                          )}
                        </td>
                        <td style={{ ...td, width: 36 }}>
                          <button onClick={() => setExpanded(isExp ? null : row.id)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", fontSize: "1.1rem", padding: "0.1rem 0.3rem" }}>
                            {isExp ? "▲" : "▼"}
                          </button>
                        </td>
                      </tr>
                      {isExp && (
                        <tr>
                          <td colSpan={16} style={{ padding: "1.2rem 1.5rem", background: "var(--color-bg-soft)", borderBottom: "1px solid var(--color-border)" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                              <div>
                                <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-text-muted)", marginBottom: "0.2rem" }}>Full Address</div>
                                <div style={{ fontSize: "0.88rem", color: "var(--color-text)" }}>{row.address}, {row.city}, {row.state} {row.zip}</div>
                              </div>
                              <div>
                                <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-text-muted)", marginBottom: "0.2rem" }}>Additional Notes</div>
                                <div style={{ fontSize: "0.88rem", color: "var(--color-text)" }}>{row.additionalNotes || "None provided"}</div>
                              </div>
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

          <div style={{ padding: "0.75rem 1.2rem", borderTop: "1px solid var(--color-border)", background: "var(--color-bg-soft)", fontSize: "0.73rem", color: "var(--color-text-muted)" }}>
            Click status badge to advance · Click ▼ to expand row · Data is local until Firestore is connected
          </div>
        </div>
      </div>
      <MockupBanner />
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("lj_admin") === "true");
  if (!authed) return <LoginModal onAuth={() => setAuthed(true)} />;
  return <Dashboard />;
}