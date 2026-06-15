import { useState, useEffect, useMemo } from "react";
import MockupBanner from "../components/MockupBanner.jsx";
import EditableContent from "../components/EditableContent.jsx";
import { navigate } from "../App.jsx";
import { useSitePages } from "../hooks/useSitePages.js";

const B = {
  deep:   "#172f2d",
  teal:   "#224e4a",
  sage:   "#89a99e",
  sand:   "#e6ddd0",
  amber:  "#bf8a3e",
  paper:  "#F9F8F6",
  card:   "#F4F3F1",
  border: "#e5e7eb",
  rule:   "rgba(23,47,45,0.1)",
  muted:  "rgba(23,47,45,0.45)",
};

function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return mobile;
}

function Wordmark({ color = B.deep, size = "1rem" }) {
  return (
    <span style={{
      fontFamily: "'DM Sans', sans-serif",
      fontSize: size, fontWeight: 600,
      letterSpacing: "0.18em", textTransform: "uppercase",
      color, lineHeight: 1,
    }}>Luminal Journeys</span>
  );
}

function LogoMark({ size = 60 }) {
  return (
    <img
      src="/luminaljourneys-primary-logo-mark-gold.transparent.png"
      alt="Luminal Journeys"
      style={{ height: size, width: "auto", display: "block" }}
    />
  );
}

// ─── Static fallback copy — all client-editable strings live here ──────────────
const STATS = [
  { key: "stat-retention",   value: "94%", label: "Client Retention" },
  { key: "stat-years",       value: "12+", label: "Years of Practice" },
  { key: "stat-appointment", value: "48h", label: "First Appointment" },
  { key: "stat-care",        value: "1:1", label: "Personalized Care" },
];

const PRINCIPLES = [
  {
    key: "principle-I", num: "I",
    title: "You deserve to be heard.",
    body:  "Most healthcare treats symptoms. We treat people. Every care plan begins with understanding your full story — not just your lab results.",
  },
  {
    key: "principle-II", num: "II",
    title: "Evidence without compromise.",
    body:  "We hold ourselves to the highest standard of evidence-based integrative medicine. Rigorous science and whole-person care are not in conflict.",
  },
  {
    key: "principle-III", num: "III",
    title: "A practice built for the long term.",
    body:  "We measure success not by visit volume but by sustained outcomes. Your health trajectory is the only metric that matters.",
  },
];

const PROCESS = [
  { key: "process-01", step: "01", title: "Complete Intake",      detail: "A thorough 5-minute form that captures what matters most before we meet." },
  { key: "process-02", step: "02", title: "Initial Consultation", detail: "60 minutes. Full history. No rush. This is where your care plan begins." },
  { key: "process-03", step: "03", title: "Your Protocol",        detail: "A personalized, evidence-based plan built entirely around your biology and goals." },
  { key: "process-04", step: "04", title: "Ongoing Partnership",  detail: "Regular refinements, direct access, and accountability — for the long term." },
];

// ─── LandingPage ──────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const mobile = useIsMobile();
  const { pages } = useSitePages();

  // Pages the client marked "show in nav", sorted by order
  const navPages = useMemo(
    () => pages.filter(p => p.showInNav).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [pages]
  );

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const padV = mobile ? "5rem 1.5rem 3rem" : "0 4rem 5rem";

  return (
    <div style={{ background: B.paper, fontFamily: "var(--font-body)", minHeight: "100vh", color: B.deep }}>

      {/* NAV */}
      <nav data-testid="nav" style={{
        position: "fixed", top: "var(--banner-height, 0px)", left: 0, right: 0, zIndex: 90,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: mobile ? "1rem 1.5rem" : "1.1rem 4rem",
        background: scrolled ? "rgba(249,248,246,0.97)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? `1px solid ${B.rule}` : "none",
        transition: "all 0.3s"
      }}>
        <div data-testid="nav-logo" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <LogoMark size={60} />
          <div style={{ width: 1, height: 32, background: B.rule }} />
          <Wordmark color={B.deep} size={mobile ? "0.72rem" : "0.85rem"} />
        </div>
        {!mobile && (
          <div style={{ display: "flex", alignItems: "center", gap: "3rem" }}>
            <a href="#principles" style={{ color: B.muted, fontSize: "0.82rem", textDecoration: "none", letterSpacing: "0.02em", fontFamily: "var(--font-mono)" }}>Our Practice</a>
            <a href="#process"    style={{ color: B.muted, fontSize: "0.82rem", textDecoration: "none", letterSpacing: "0.02em", fontFamily: "var(--font-mono)" }}>Process</a>
            {/* Dynamic pages — added by client via Admin → Pages */}
            {navPages.map(page => (
              <button key={page.id} onClick={() => navigate("/" + page.id)} style={{
                background: "none", border: "none", cursor: "pointer",
                color: B.muted, fontSize: "0.82rem", textDecoration: "none",
                letterSpacing: "0.02em", fontFamily: "var(--font-mono)", padding: 0,
              }}>{page.title}</button>
            ))}
            <button data-testid="nav-cta" onClick={() => navigate("/intake")} style={{
              background: B.deep, color: B.paper, border: "none",
              padding: "0.65rem 1.8rem", borderRadius: "2rem", cursor: "pointer",
              fontSize: "0.82rem", fontFamily: "var(--font-body)", letterSpacing: "0.04em", fontWeight: 500
            }}>
              <EditableContent contentKey="nav.cta" fallback="Discover Your Journey" tag="span" />
            </button>
          </div>
        )}
        {mobile && (
          <button data-testid="nav-cta" onClick={() => navigate("/intake")} style={{
            background: B.deep, color: B.paper, border: "none",
            padding: "0.5rem 1.2rem", borderRadius: "2rem", cursor: "pointer",
            fontSize: "0.75rem", fontFamily: "var(--font-body)", fontWeight: 500
          }}>
            <EditableContent contentKey="nav.cta" fallback="Discover Your Journey" tag="span" />
          </button>
        )}
      </nav>

      {/* HERO */}
      <div data-testid="hero-section" style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        justifyContent: "flex-end", padding: padV,
        paddingTop: mobile ? "6rem" : "8rem",
        borderBottom: `1px solid ${B.rule}`
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: mobile ? "2rem" : "3rem" }}>
          <div style={{ height: 1, width: 48, background: B.amber }} />
          <EditableContent
            contentKey="hero.tagline"
            fallback="Integrative Health · Private Practice"
            tag="span"
            style={{ fontSize: "0.68rem", letterSpacing: "0.2em", textTransform: "uppercase", color: B.amber, fontFamily: "var(--font-mono)" }}
          />
        </div>

        <h1 style={{
          fontFamily: "var(--font-heading)",
          fontSize: mobile ? "clamp(3rem, 15vw, 5rem)" : "clamp(4rem, 11vw, 10rem)",
          fontWeight: 400, lineHeight: 0.95,
          color: B.deep, letterSpacing: "-0.03em",
          marginBottom: mobile ? "2.5rem" : "4rem", maxWidth: "100%"
        }}>
          <EditableContent contentKey="hero.headline.pre" fallback="Care that begins" tag="span" />
          <br />
          with{" "}
          <em style={{ color: B.teal, fontStyle: "italic" }}>
            <EditableContent contentKey="hero.headline.em" fallback="listening." tag="span" />
          </em>
        </h1>

        <div style={{
          display: "grid",
          gridTemplateColumns: mobile ? "1fr" : "1fr 1fr",
          gap: mobile ? "2rem" : "4rem",
          alignItems: "flex-end",
          paddingTop: mobile ? "2rem" : "3rem",
          borderTop: `1px solid ${B.rule}`
        }}>
          <EditableContent
            contentKey="hero.paragraph"
            fallback="A private integrative health practice for people who want a care team that treats the whole person — not just the presenting complaint."
            tag="p"
            style={{ fontSize: mobile ? "1rem" : "1.1rem", color: B.muted, lineHeight: 1.8 }}
          />
          <div style={{ display: "flex", flexDirection: "column", alignItems: mobile ? "flex-start" : "flex-end", gap: "1rem" }}>
            <button data-testid="hero-cta" onClick={() => navigate("/intake")} style={{
              background: B.deep, color: B.paper, border: "none",
              padding: "1rem 2.5rem", borderRadius: "3rem", cursor: "pointer",
              fontSize: "0.95rem", fontFamily: "var(--font-body)", fontWeight: 500
            }}>
              <EditableContent contentKey="hero.cta.label" fallback="Discover Your Journey →" tag="span" />
            </button>
            <EditableContent
              contentKey="hero.cta.sub"
              fallback="5 minutes · No commitment required"
              tag="span"
              style={{ fontSize: "0.78rem", color: B.muted, fontFamily: "var(--font-mono)" }}
            />
          </div>
        </div>
      </div>

      {/* STATS */}
      <div style={{
        display: "grid",
        gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(4, 1fr)",
        borderBottom: `1px solid ${B.rule}`
      }}>
        {STATS.map((s, i) => (
          <div key={s.key} style={{
            padding: mobile ? "2rem 1.5rem" : "3rem 4rem",
            borderRight: mobile ? (i % 2 === 0 ? `1px solid ${B.rule}` : "none") : (i < 3 ? `1px solid ${B.rule}` : "none"),
            borderBottom: mobile && i < 2 ? `1px solid ${B.rule}` : "none"
          }}>
            <EditableContent
              contentKey={`${s.key}.value`}
              fallback={s.value}
              tag="div"
              style={{ fontFamily: "var(--font-heading)", fontSize: mobile ? "2.5rem" : "3.5rem", color: B.deep, lineHeight: 1, letterSpacing: "-0.03em" }}
            />
            <EditableContent
              contentKey={`${s.key}.label`}
              fallback={s.label}
              tag="div"
              style={{ fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", color: B.muted, marginTop: "0.5rem", fontFamily: "var(--font-mono)" }}
            />
          </div>
        ))}
      </div>

      {/* PRINCIPLES */}
      <div id="principles">
        {PRINCIPLES.map((p) => (
          <div key={p.key} style={{
            display: "grid",
            gridTemplateColumns: mobile ? "1fr" : "80px 1fr 1fr",
            gap: mobile ? "1rem" : "4rem",
            padding: mobile ? "2.5rem 1.5rem" : "4rem",
            borderBottom: `1px solid ${B.rule}`,
            transition: "background 0.3s"
          }}
            onMouseEnter={e => e.currentTarget.style.background = B.sand}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            {!mobile && (
              <div style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", color: B.muted, fontStyle: "italic" }}>
                {p.num}
              </div>
            )}
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: mobile ? "1.4rem" : "clamp(1.5rem, 2.5vw, 2.2rem)", fontWeight: 400, color: B.deep, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
              {mobile && <span style={{ color: B.muted, fontStyle: "italic", marginRight: "0.5rem", fontSize: "1rem" }}>{p.num}.</span>}
              <EditableContent contentKey={`${p.key}.title`} fallback={p.title} tag="span" />
            </h3>
            <EditableContent
              contentKey={`${p.key}.body`}
              fallback={p.body}
              tag="p"
              style={{ fontSize: mobile ? "0.9rem" : "1rem", color: B.muted, lineHeight: 1.8 }}
            />
          </div>
        ))}
      </div>

      {/* PROCESS */}
      <div id="process" style={{ padding: mobile ? "3rem 1.5rem" : "6rem 4rem", borderBottom: `1px solid ${B.rule}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: mobile ? "2.5rem" : "4rem" }}>
          <span style={{ fontSize: "0.68rem", letterSpacing: "0.2em", textTransform: "uppercase", color: B.muted, fontFamily: "var(--font-mono)" }}>The Process</span>
          <div style={{ flex: 1, height: 1, background: B.rule }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(4, 1fr)" }}>
          {PROCESS.map((s, i) => (
            <div key={s.key} style={{
              padding: mobile ? "1.8rem 0" : "3rem 2.5rem",
              borderRight: !mobile && i < 3 ? `1px solid ${B.rule}` : "none",
              borderLeft:  !mobile && i === 0 ? `1px solid ${B.rule}` : "none",
              borderBottom: mobile && i < 3 ? `1px solid ${B.rule}` : "none",
            }}>
              <div style={{ fontSize: "0.65rem", letterSpacing: "0.2em", color: B.amber, marginBottom: "1rem", fontFamily: "var(--font-mono)" }}>{s.step}</div>
              <EditableContent
                contentKey={`${s.key}.title`}
                fallback={s.title}
                tag="h4"
                style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", fontWeight: 400, color: B.deep, marginBottom: "0.8rem" }}
              />
              <EditableContent
                contentKey={`${s.key}.detail`}
                fallback={s.detail}
                tag="p"
                style={{ fontSize: "0.88rem", color: B.muted, lineHeight: 1.75 }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* MANIFESTO */}
      <div style={{ background: B.deep, padding: mobile ? "4rem 1.5rem" : "7rem 4rem" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <div style={{ height: 1, background: "rgba(255,255,255,0.1)", marginBottom: mobile ? "2.5rem" : "4rem" }} />
          <EditableContent
            contentKey="manifesto.quote"
            fallback='"Real leadership starts within."'
            tag="p"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: mobile ? "1.6rem" : "clamp(1.6rem, 3.5vw, 2.8rem)",
              fontWeight: 400, color: B.paper,
              lineHeight: 1.4, letterSpacing: "-0.02em",
              marginBottom: mobile ? "2rem" : "3rem", fontStyle: "italic"
            }}
          />
          <div style={{ height: 1, background: "rgba(255,255,255,0.1)", marginBottom: mobile ? "2rem" : "3rem" }} />
          <button data-testid="manifesto-cta" onClick={() => navigate("/intake")} style={{
            background: "transparent", color: B.paper,
            border: "1px solid rgba(255,255,255,0.3)",
            padding: "1rem 2.5rem", borderRadius: "3rem", cursor: "pointer",
            fontSize: "0.9rem", fontFamily: "var(--font-body)", letterSpacing: "0.04em",
            transition: "all 0.2s"
          }}
            onMouseEnter={e => { e.currentTarget.style.background = B.paper; e.currentTarget.style.color = B.deep; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = B.paper; }}
          >
            <EditableContent contentKey="manifesto.cta" fallback="Discover Your Journey →" tag="span" />
          </button>
        </div>
      </div>

      {/* FOOTER */}
      <footer data-testid="footer" style={{
        padding: mobile ? "2rem 1.5rem" : "2.5rem 4rem",
        borderTop: `1px solid ${B.rule}`,
        display: "flex", flexDirection: mobile ? "column" : "row",
        justifyContent: "space-between", alignItems: mobile ? "flex-start" : "center",
        gap: "1rem", flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
          <LogoMark size={48} />
          <div style={{ width: 1, height: 28, background: B.rule }} />
          <Wordmark color={B.deep} size="0.75rem" />
        </div>

        {/* Dynamic page links in footer */}
        {navPages.length > 0 && (
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            {navPages.map(page => (
              <button key={page.id} onClick={() => navigate("/" + page.id)} style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: "0.72rem", color: B.muted, fontFamily: "var(--font-mono)",
                letterSpacing: "0.06em", padding: 0,
              }}>{page.title}</button>
            ))}
          </div>
        )}

        <span style={{ fontSize: "0.72rem", color: B.muted, fontFamily: "var(--font-mono)" }}>
          © {new Date().getFullYear()} Luminal Journeys · All rights reserved
        </span>
        <button data-testid="admin-link" onClick={() => navigate("/admin")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.65rem", color: B.muted, opacity: 0.4, letterSpacing: "0.1em", fontFamily: "var(--font-mono)" }}>Admin</button>
      </footer>

      <MockupBanner />
    </div>
  );
}
