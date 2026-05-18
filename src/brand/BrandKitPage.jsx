import { useState } from "react";
import { navigate } from "../App.jsx";

// ── Exact brand tokens from Lovable CSS ──────────────────────────────────────
const T = {
  paper:      "#F9F8F6",   // page background
  card:       "#F4F3F1",   // card / surface background
  deep:       "#172f2d",
  teal:       "#224e4a",
  sage:       "#89a99e",
  sand:       "#e6ddd0",
  amber:      "#bf8a3e",
  // on-dark: use paper, NOT filter:invert (Lovable's pink was an invert/brightness artifact)
  onDark:     "#F9F8F6",
  muted:      "#89a99e",
  border:     "#e5e7eb",
  borderLight:"#f0f1f2",
  avoid:      "#e05c5c",
  radius:     "12px",
};

const PASS = "lj-brand-2026";

// ── Primitives ────────────────────────────────────────────────────────────────
const mono = { fontFamily: "'DM Mono', monospace" };
const serif = { fontFamily: "'DM Serif Display', serif" };
const sans = { fontFamily: "'DM Sans', sans-serif" };

function SectionLabel({ num, label }) {
  return (
    <p style={{ ...mono, fontSize: "0.72rem", letterSpacing: "0.14em", color: T.sage, marginBottom: "0.75rem" }}>
      {num} — {label}
    </p>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 style={{ ...serif, fontSize: "1.9rem", fontWeight: 400, color: T.deep, marginBottom: "2rem", lineHeight: 1.2 }}>
      {children}
    </h2>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius: T.radius, padding: "1.5rem",
      ...style
    }}>
      {children}
    </div>
  );
}

function CardLabel({ children, color = T.sage, strikethrough = false }) {
  return (
    <p style={{
      ...mono, fontSize: "0.68rem", letterSpacing: "0.14em",
      textTransform: "uppercase", color, marginBottom: "0.75rem"
    }}>
      {children}
    </p>
  );
}

function Tag({ children, style = {} }) {
  return (
    <span style={{
      ...sans, fontSize: "0.82rem", color: T.deep,
      border: `1px solid ${T.border}`, borderRadius: "6px",
      padding: "0.3rem 0.75rem", display: "inline-block",
      margin: "0.2rem",
      ...style
    }}>
      {children}
    </span>
  );
}

function MonoTag({ children }) {
  return (
    <span style={{
      ...mono, fontSize: "0.72rem", letterSpacing: "0.1em",
      textTransform: "uppercase", color: T.deep,
      border: `1px solid ${T.border}`, borderRadius: "6px",
      padding: "0.3rem 0.75rem", display: "inline-block",
      margin: "0.2rem",
    }}>
      {children}
    </span>
  );
}

function Rule() {
  return <div style={{ borderTop: `1px solid ${T.borderLight}`, margin: "4rem 0" }} />;
}

// ── Logo Mark SVG ─────────────────────────────────────────────────────────────
function LogoMark({ color = T.deep, size = 40 }) {
  return (
    <svg width={size} height={size * 1.28} viewBox="0 0 40 51" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1"   y="1"   width="38" height="49" rx="1" stroke={color} strokeWidth="2"   fill="none"/>
      <rect x="5"   y="5"   width="30" height="41" rx="1" stroke={color} strokeWidth="1.5" fill="none"/>
      <rect x="10"  y="10"  width="20" height="31" rx="1" stroke={color} strokeWidth="1.2" fill="none"/>
      <rect x="15.5" y="15.5" width="9" height="20" rx="1" stroke={color} strokeWidth="1"   fill="none"/>
    </svg>
  );
}

// ── Password Gate ─────────────────────────────────────────────────────────────
function PasswordGate({ onAuth }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);

  const submit = () => {
    if (pw === PASS) { onAuth(); }
    else { setError(true); setPw(""); }
  };

  return (
    <div style={{ minHeight: "100vh", background: T.paper, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", ...sans }}>
      <div style={{ maxWidth: 440, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <LogoMark color={T.deep} size={36} />
          <p style={{ ...mono, fontSize: "0.72rem", letterSpacing: "0.14em", color: T.sage, marginTop: "1.5rem" }}>
            LUMINAL JOURNEYS — BRAND KIT V2.0
          </p>
        </div>
        <Card>
          <p style={{ ...mono, fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase", color: T.sage, marginBottom: "0.5rem" }}>
            Access Code
          </p>
          <input
            type="password" value={pw} autoFocus
            onChange={e => { setPw(e.target.value); setError(false); }}
            onKeyDown={e => e.key === "Enter" && submit()}
            placeholder="Enter brand kit password"
            style={{
              width: "100%", padding: "0.75rem 1rem", boxSizing: "border-box",
              border: `1.5px solid ${error ? T.amber : T.border}`,
              borderRadius: "8px", fontSize: "0.95rem", outline: "none",
              background: T.paper, color: T.deep, marginBottom: "0.75rem",
              ...sans
            }}
          />
          {error && <p style={{ color: T.amber, fontSize: "0.85rem", marginBottom: "0.75rem" }}>Incorrect access code.</p>}
          <button onClick={submit} style={{
            width: "100%", background: T.deep, color: T.paper, border: "none",
            padding: "0.85rem", borderRadius: "8px", cursor: "pointer",
            fontSize: "0.9rem", fontWeight: 500, ...sans
          }}>Access Brand Kit →</button>
        </Card>
        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <button onClick={() => navigate("/")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.82rem", color: T.sage, ...sans }}>
            ← Back to site
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Brand Kit Content ─────────────────────────────────────────────────────────
function BrandKitContent() {
  const w = { maxWidth: 1100, margin: "0 auto", padding: "0 3rem" };

  return (
    <div style={{ background: T.paper, minHeight: "100vh", ...sans, color: T.deep }}>

      {/* TOP BAR */}
      <div style={{ borderBottom: `1px solid ${T.border}`, padding: "1rem 3rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <LogoMark color={T.deep} size={18} />
          <p style={{ ...mono, fontSize: "0.7rem", letterSpacing: "0.14em", color: T.sage }}>
            LUMINAL JOURNEYS — BRAND KIT V2.0
          </p>
        </div>
        <div style={{ display: "flex", gap: "1rem" }}>
          <button onClick={() => navigate("/admin")} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: "6px", padding: "0.35rem 0.9rem", cursor: "pointer", fontSize: "0.78rem", color: T.sage, ...sans }}>← Admin</button>
          <button onClick={() => { sessionStorage.removeItem("lj_brand"); window.location.reload(); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.78rem", color: T.sage, ...sans }}>Lock</button>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ paddingTop: "4rem", paddingBottom: "6rem" }}>

        {/* 01 — LOGO */}
        <section style={{ ...w, marginBottom: "0" }}>
          <SectionLabel num="01" label="LOGO" />
          <SectionTitle>Luminal Journeys</SectionTitle>
          <p style={{ fontSize: "0.95rem", color: T.sage, marginBottom: "2rem" }}>Real leadership starts within.</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {/* Logo Mark — light */}
            <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 200, gap: "1.5rem" }}>
              <LogoMark color={T.deep} size={44} />
              <p style={{ ...mono, fontSize: "0.65rem", letterSpacing: "0.18em", color: T.sage }}>LOGO MARK</p>
            </Card>
            {/* Wordmark — light */}
            <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 200, gap: "1.5rem" }}>
              <p style={{ ...mono, fontSize: "1.1rem", letterSpacing: "0.2em", color: T.teal, fontWeight: 500 }}>LUMINAL JOURNEYS</p>
              <p style={{ ...mono, fontSize: "0.65rem", letterSpacing: "0.18em", color: T.sage }}>WORDMARK</p>
            </Card>
            {/* Logo Mark — dark */}
            <Card style={{ background: T.teal, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 200, gap: "1.5rem" }}>
              <LogoMark color={T.onDark} size={44} />
              <p style={{ ...mono, fontSize: "0.65rem", letterSpacing: "0.18em", color: "rgba(249,247,244,0.45)" }}>ON DARK</p>
            </Card>
            {/* Wordmark — dark */}
            <Card style={{ background: T.teal, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 200, gap: "1.5rem" }}>
              <p style={{ ...mono, fontSize: "1.1rem", letterSpacing: "0.2em", color: T.onDark, fontWeight: 500 }}>LUMINAL JOURNEYS</p>
              <p style={{ ...mono, fontSize: "0.65rem", letterSpacing: "0.18em", color: "rgba(249,247,244,0.45)" }}>ON DARK</p>
            </Card>
          </div>
        </section>

        <Rule />

        {/* 02 — NAME ORIGIN */}
        <section style={w}>
          <SectionLabel num="02" label="NAME ORIGIN" />
          <SectionTitle>The Meaning Behind the Name</SectionTitle>
          <Card>
            <p style={{ fontSize: "0.95rem", color: T.deep, lineHeight: 1.75, marginBottom: "1.2rem" }}>
              <strong style={{ fontStyle: "italic" }}>Luminal</strong> refers to the inner space where transformation occurs — the internal channel (<code style={{ ...mono, fontSize: "0.85rem" }}>lumen</code>) through which insight, awareness, and change move.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginBottom: "1.2rem" }}>
              {["INNER EXPLORATION", "ILLUMINATION", "PSYCHOLOGICAL DEPTH"].map(t => <MonoTag key={t}>{t}</MonoTag>)}
            </div>
            <p style={{ fontSize: "0.95rem", color: T.deep, lineHeight: 1.75 }}>
              <strong>Journeys</strong> acknowledges that this work is a process over time, not a single event. Together, the name signals guided inner exploration that leads to meaningful transformation.
            </p>
          </Card>
        </section>

        <Rule />

        {/* 03 — MISSION & VISION */}
        <section style={w}>
          <SectionLabel num="03" label="MISSION & VISION" />
          <SectionTitle>Purpose & Direction</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <Card>
              <CardLabel color={T.amber}>MISSION</CardLabel>
              <p style={{ fontSize: "0.95rem", color: T.deep, lineHeight: 1.75 }}>
                To support leaders in doing the inner work required to lead with clarity, responsibility, and connection — through a structured process that integrates science, psychology, and psychedelic-assisted insight.
              </p>
            </Card>
            <Card>
              <CardLabel color={T.amber}>VISION</CardLabel>
              <p style={{ fontSize: "0.95rem", color: T.deep, lineHeight: 1.75 }}>
                To shape a new generation of leaders who are self-aware, emotionally integrated, and systemically responsible — and to establish a new standard for leadership development that includes inner transformation as essential, not optional.
              </p>
            </Card>
          </div>
          <Card>
            <CardLabel>LONG-TERM VISION</CardLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem" }}>
              {["Global community of leaders", "Multiple retreat environments", "Research-backed methodology", "Train-the-trainer ecosystem"].map(v => (
                <span key={v} style={{ fontSize: "0.9rem", color: T.deep }}>• {v}</span>
              ))}
            </div>
          </Card>
        </section>

        <Rule />

        {/* 04 — COLOR PALETTE */}
        <section style={w}>
          <SectionLabel num="04" label="COLOR PALETTE" />
          <SectionTitle>Grounded. Warm. Intentional.</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
            {[
              { name: "Deep Teal",  hex: "#172f2d", usage: "Headlines, primary text" },
              { name: "Brand Teal", hex: "#224e4a", usage: "Primary actions, links" },
              { name: "Sage",       hex: "#89a99e", usage: "Supporting elements" },
              { name: "Sand",       hex: "#e6ddd0", usage: "Backgrounds, cards" },
              { name: "Warm Amber", hex: "#bf8a3e", usage: "Accent, highlights" },
              { name: "Paper",      hex: "#F9F8F6", usage: "Page background" },
            ].map(c => (
              <div key={c.hex} style={{ border: `1px solid ${T.border}`, borderRadius: T.radius, overflow: "hidden" }}>
                <div style={{ background: c.hex, height: 90 }} />
                <div style={{ background: T.paper, padding: "1rem" }}>
                  <p style={{ fontSize: "0.92rem", fontWeight: 600, color: T.deep, marginBottom: "0.25rem" }}>{c.name}</p>
                  <p style={{ ...mono, fontSize: "0.72rem", color: T.sage, marginBottom: "0.25rem" }}>{c.hex}</p>
                  <p style={{ fontSize: "0.82rem", color: T.sage }}>{c.usage}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <Rule />

        {/* 05 — TYPOGRAPHY */}
        <section style={w}>
          <SectionLabel num="05" label="TYPOGRAPHY" />
          <SectionTitle>Typography System</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <Card>
              <CardLabel>DISPLAY — DM SERIF DISPLAY</CardLabel>
              <p style={{ ...serif, fontSize: "2.4rem", color: T.deep, lineHeight: 1.2 }}>
                The infrastructure for inner transformation.
              </p>
            </Card>
            <Card>
              <CardLabel>BODY — DM SANS</CardLabel>
              <p style={{ fontSize: "1rem", color: T.deep, lineHeight: 1.75, marginBottom: "0.75rem" }}>
                A safe, structured, and deeply transformative leadership experience that integrates psychedelic insight into real-world leadership. Built for executives, founders, and senior leaders.
              </p>
              <p style={{ fontSize: "0.9rem", color: T.sage, lineHeight: 1.7 }}>
                Integration-first model — equal emphasis on preparation, experience, and integration. Science, psychology, and psychedelic-assisted insight combined with a curated cohort of high-functioning leaders.
              </p>
            </Card>
            <Card>
              <CardLabel>MONO — DM MONO</CardLabel>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                {["LABELS", "NAVIGATION", "METADATA", "CATEGORIES", "TAGS"].map(t => <MonoTag key={t}>{t}</MonoTag>)}
              </div>
            </Card>
          </div>
        </section>

        <Rule />

        {/* 06 — PRINCIPLES */}
        <section style={w}>
          <SectionLabel num="06" label="PRINCIPLES" />
          <SectionTitle>What We Stand For</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[
              { n: "01", t: "Safety First",                b: "Psychological and physical safety are non-negotiable." },
              { n: "02", t: "Integration Over Experience", b: "Transformation is measured by how insight is lived, not just felt." },
              { n: "03", t: "Connection as Foundation",    b: "Growth happens through connection — to self, others, and systems." },
              { n: "04", t: "Responsibility in Leadership",b: "Personal development must translate into conscious impact." },
              { n: "05", t: "Depth Over Performance",      b: "This is not surface-level optimisation — it's real inner work." },
            ].map(p => (
              <Card key={p.n} style={{ display: "flex", gap: "2rem", alignItems: "flex-start" }}>
                <span style={{ ...mono, fontSize: "0.75rem", color: T.sage, flexShrink: 0, paddingTop: "0.15rem" }}>{p.n}</span>
                <div>
                  <p style={{ fontWeight: 600, color: T.deep, marginBottom: "0.3rem", fontSize: "0.95rem" }}>{p.t}</p>
                  <p style={{ fontSize: "0.88rem", color: T.sage, lineHeight: 1.65 }}>{p.b}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <Rule />

        {/* 07 — USPs */}
        <section style={w}>
          <SectionLabel num="07" label="UNIQUE SELLING PROPOSITIONS" />
          <SectionTitle>What Sets Us Apart</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {[
              { n: "01", t: "Integration-First Model",          b: "Equal emphasis on preparation, experience, and integration." },
              { n: "02", t: "Science + Psychedelics + Leadership",b: "A rare and credible intersection that bridges three worlds responsibly." },
              { n: "03", t: "Curated Cohorts",                   b: "High-functioning leaders form the peer group — a key driver of growth." },
              { n: "04", t: "Structured Developmental Arc",      b: "Screening → Intake → Preparation → Experience → Integration → Community." },
            ].map(p => (
              <Card key={p.n}>
                <p style={{ ...mono, fontSize: "0.68rem", color: T.amber, marginBottom: "0.5rem" }}>{p.n}</p>
                <p style={{ fontWeight: 600, color: T.deep, marginBottom: "0.4rem", fontSize: "0.95rem" }}>{p.t}</p>
                <p style={{ fontSize: "0.88rem", color: T.sage, lineHeight: 1.65 }}>{p.b}</p>
              </Card>
            ))}
          </div>
          <div style={{ marginTop: "1rem" }}>
            <Card>
              <p style={{ ...mono, fontSize: "0.68rem", color: T.amber, marginBottom: "0.5rem" }}>05</p>
              <p style={{ fontWeight: 600, color: T.deep, marginBottom: "0.4rem", fontSize: "0.95rem" }}>Deeply Personalised</p>
              <p style={{ fontSize: "0.88rem", color: T.sage, lineHeight: 1.65 }}>Combining 1:1, group work, and ongoing support.</p>
            </Card>
          </div>
        </section>

        <Rule />

        {/* 08 — AUDIENCE */}
        <section style={w}>
          <SectionLabel num="08" label="AUDIENCE" />
          <SectionTitle>Who We Serve</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <Card>
              <CardLabel>IDEAL AUDIENCE</CardLabel>
              {["Executives, founders, and senior leaders", "High-functioning professionals in personal development", "Individuals seeking safe, structured psychedelic environments"].map(a => (
                <p key={a} style={{ fontSize: "0.9rem", color: T.deep, lineHeight: 1.65, marginBottom: "0.4rem" }}>• {a}</p>
              ))}
              <div style={{ borderLeft: `3px solid ${T.amber}`, paddingLeft: "1rem", marginTop: "1rem" }}>
                <p style={{ fontSize: "0.88rem", color: T.sage, lineHeight: 1.65, fontStyle: "italic" }}>
                  "There is more depth available to me, but I don't know how to access it."
                </p>
              </div>
            </Card>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <Card>
                <CardLabel>MOTIVATIONS</CardLabel>
                {["Deeper clarity and meaning", "Curiosity about inner exploration", "Alignment between personal and professional life"].map(m => (
                  <p key={m} style={{ fontSize: "0.9rem", color: T.deep, lineHeight: 1.65, marginBottom: "0.3rem" }}>• {m}</p>
                ))}
              </Card>
              <Card>
                <CardLabel>PAIN POINTS</CardLabel>
                {["Internal disconnection despite external success", "Burnout or quiet dissatisfaction", "Lack of spaces for real, honest reflection"].map((p, i) => (
                  <p key={p} style={{ fontSize: "0.9rem", color: T.deep, lineHeight: 1.65, marginBottom: "0.3rem", display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                    <span style={{ color: T.amber, flexShrink: 0 }}>•</span>{p}
                  </p>
                ))}
              </Card>
            </div>
          </div>
        </section>

        <Rule />

        {/* 09 — BRAND PERSONALITY */}
        <section style={w}>
          <SectionLabel num="09" label="BRAND PERSONALITY" />
          <SectionTitle>Who We Are</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <Card>
              <CardLabel>PERSONALITY TRAITS</CardLabel>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {["Calm", "Intelligent", "Grounded", "Quietly bold", "Emotionally aware"].map(t => <Tag key={t}>{t}</Tag>)}
              </div>
            </Card>
            <Card>
              <CardLabel>IF THE BRAND WERE A PERSON</CardLabel>
              <p style={{ fontSize: "0.92rem", color: T.deep, lineHeight: 1.75 }}>
                A combination of a clinical psychologist, a systems thinker, and a grounded, modern philosopher. Someone who is perceptive, calm, deeply present, and not performative.
              </p>
            </Card>
          </div>
          <Card>
            <CardLabel>EMOTIONAL BENEFITS</CardLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {["More connected", "Clearer thinking", "Less alone", "More aligned", "Grounded & expanded"].map(t => <Tag key={t}>{t}</Tag>)}
            </div>
          </Card>
        </section>

        <Rule />

        {/* 10 — POSITIONING */}
        <section style={w}>
          <SectionLabel num="10" label="POSITIONING" />
          <SectionTitle>Where We Stand</SectionTitle>
          <Card style={{ marginBottom: "1rem" }}>
            <CardLabel color={T.amber}>PRIMARY VALUE PROPOSITION</CardLabel>
            <p style={{ ...serif, fontSize: "1.4rem", color: T.deep, lineHeight: 1.5 }}>
              A safe, structured, and deeply transformative leadership experience that integrates psychedelic insight into real-world leadership.
            </p>
          </Card>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1rem" }}>
            {[
              { t: "Premium, but not elitist",              s: "Accessible gravitas without exclusivity." },
              { t: "Serious, but not rigid",                s: "Rigorous without being cold or clinical." },
              { t: "Transformational, but not performative",s: "Real depth without spectacle." },
            ].map(p => (
              <Card key={p.t}>
                <p style={{ fontWeight: 600, color: T.deep, marginBottom: "0.4rem", fontSize: "0.9rem" }}>{p.t}</p>
                <p style={{ fontSize: "0.85rem", color: T.sage }}>{p.s}</p>
              </Card>
            ))}
          </div>
          <Card>
            <CardLabel>WHITE SPACE</CardLabel>
            <p style={{ fontSize: "0.95rem", color: T.deep, lineHeight: 1.7 }}>Psychedelic-informed leadership development with integration at its core.</p>
          </Card>
        </section>

        <Rule />

        {/* 11 — CUSTOMER JOURNEY */}
        <section style={w}>
          <SectionLabel num="11" label="CUSTOMER JOURNEY" />
          <SectionTitle>The Experience Arc</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "1rem", marginBottom: "1rem" }}>
            {[
              { n: "01", t: "Discovery",   s: "Intrigue, resonance" },
              { n: "02", t: "Decision",    s: "Safety, trust" },
              { n: "03", t: "Experience",  s: "Depth, expansion" },
              { n: "04", t: "Integration", s: "Clarity, grounding" },
              { n: "05", t: "Community",   s: "Belonging, continuity" },
            ].map(s => (
              <Card key={s.n} style={{ padding: "1.2rem" }}>
                <p style={{ ...mono, fontSize: "0.65rem", color: T.sage, marginBottom: "0.5rem" }}>{s.n}</p>
                <p style={{ fontWeight: 600, color: T.deep, fontSize: "0.9rem", marginBottom: "0.3rem" }}>{s.t}</p>
                <p style={{ fontSize: "0.8rem", color: T.sage }}>{s.s}</p>
              </Card>
            ))}
          </div>
          <Card>
            <CardLabel>KEY TOUCHPOINTS</CardLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {["Website", "Intake process", "Retreat environment", "Integration sessions", "Community"].map(t => <Tag key={t}>{t}</Tag>)}
            </div>
          </Card>
        </section>

        <Rule />

        {/* 12 — VOICE & TONE */}
        <section style={w}>
          <SectionLabel num="12" label="VOICE & TONE" />
          <SectionTitle>How We Speak</SectionTitle>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
            {["Calm", "Precise", "Grounded", "Spacious", "Non-hyped"].map(t => <Tag key={t}>{t}</Tag>)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <Card>
              <CardLabel>USE</CardLabel>
              {["Integration", "Connection", "Leadership", "Depth", "Responsibility"].map(t => (
                <p key={t} style={{ fontSize: "0.9rem", color: T.deep, lineHeight: 1.7 }}>• {t}</p>
              ))}
            </Card>
            <Card>
              <CardLabel color={T.avoid}>AVOID</CardLabel>
              {['"Magic"', '"Healing retreat"', "Overly spiritual language", "Vague or hyped phrasing", '"Next-generation"'].map(t => (
                <p key={t} style={{ fontSize: "0.9rem", color: T.sage, lineHeight: 1.7, textDecoration: "line-through" }}>• {t}</p>
              ))}
            </Card>
          </div>
          <Card>
            <CardLabel>ALWAYS COMMUNICATE</CardLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {["Safety", "Integrity", "Depth", "Responsibility", "Human connection"].map(t => <Tag key={t}>{t}</Tag>)}
            </div>
          </Card>
        </section>

        <Rule />

        {/* 13 — COMPETITIVE CONTEXT */}
        <section style={w}>
          <SectionLabel num="13" label="COMPETITIVE CONTEXT" />
          <SectionTitle>How We Differ</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1rem" }}>
            {[
              { vs: "VS. PSYCHEDELIC RETREATS",  d: "More structured, with a full developmental arc and integration focus." },
              { vs: "VS. LEADERSHIP PROGRAMS",   d: "Goes deeper — includes inner transformation, not just skills." },
              { vs: "VS. EXECUTIVE COACHING",    d: "More grounded and safer — a credible, science-backed approach." },
            ].map(c => (
              <Card key={c.vs}>
                <CardLabel color={T.amber}>{c.vs}</CardLabel>
                <p style={{ fontSize: "0.9rem", color: T.deep, lineHeight: 1.65 }}>{c.d}</p>
              </Card>
            ))}
          </div>
          <Card>
            <CardLabel>BRANDS OUR AUDIENCE ADMIRES</CardLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {["ESALEN INSTITUTE", "THE SCHOOL OF LIFE", "SINGULARITY UNIVERSITY", "HEADSPACE", "MINDVALLEY"].map(t => <MonoTag key={t}>{t}</MonoTag>)}
            </div>
          </Card>
        </section>

        <Rule />

        {/* 14 — CORE MESSAGE */}
        <section style={{ ...w, textAlign: "center", padding: "2rem 3rem 4rem" }}>
          <SectionLabel num="14" label="CORE MESSAGE" />
          <h2 style={{ ...serif, fontSize: "clamp(2rem, 5vw, 3.5rem)", color: T.deep, fontWeight: 400, marginBottom: "1rem", lineHeight: 1.15 }}>
            Real leadership starts within.
          </h2>
          <p style={{ ...mono, fontSize: "0.8rem", letterSpacing: "0.12em", color: T.sage }}>
            Depth · Connection · Responsibility
          </p>
        </section>

      </div>

      {/* FOOTER */}
      <div style={{ borderTop: `1px solid ${T.border}`, padding: "1.5rem 3rem", textAlign: "center" }}>
        <p style={{ ...mono, fontSize: "0.7rem", letterSpacing: "0.12em", color: T.sage }}>
          © {new Date().getFullYear()} LUMINAL JOURNEYS. BRAND KIT — CONFIDENTIAL.
        </p>
      </div>
    </div>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────
export default function BrandKitPage() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("lj_brand") === "true");
  const onAuth = () => { sessionStorage.setItem("lj_brand", "true"); setAuthed(true); };
  if (!authed) return <PasswordGate onAuth={onAuth} />;
  return <BrandKitContent />;
}