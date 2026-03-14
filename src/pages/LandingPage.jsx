import { useState, useEffect } from "react";
import MockupBanner from "../components/MockupBanner.jsx";
import { navigate } from "../App.jsx";

// ─── Layout 1: Editorial ──────────────────────────────────────────────────────
// Dark hero, large serif, asymmetric, stats, scrolling marquee
function LayoutEditorial() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const stats = [
    { value: "94%", label: "Client Retention Rate" },
    { value: "12+", label: "Years of Practice" },
    { value: "1:1", label: "Personalized Care Model" },
    { value: "48h", label: "First Appointment Window" },
  ];

  const pillars = [
    { num: "01", title: "Holistic Assessment", body: "Deep intake process that maps your full health history, goals, and lifestyle to build a complete picture." },
    { num: "02", title: "Precision Planning", body: "Evidence-based protocols tailored specifically to your biology, schedule, and long-term objectives." },
    { num: "03", title: "Ongoing Partnership", body: "Regular check-ins, plan refinements, and direct access to your care team — always." },
  ];

  return (
    <div style={{ background: "var(--color-bg)", fontFamily: "var(--font-body)", minHeight: "100vh" }}>

      {/* NAV */}
      <nav style={{
        position: "fixed", top: 40, left: 0, right: 0, zIndex: 90,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "1.1rem 3rem",
        background: scrolled ? "rgba(10,16,12,0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        transition: "all 0.3s",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none"
      }}>
        <span style={{ fontFamily: "var(--font-heading)", fontSize: "1.3rem", color: "#fff", letterSpacing: "0.02em" }}>
          Luminal Journeys
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
          <a href="#about" style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.82rem", letterSpacing: "0.1em", textDecoration: "none", textTransform: "uppercase" }}>About</a>
          <a href="#services" style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.82rem", letterSpacing: "0.1em", textDecoration: "none", textTransform: "uppercase" }}>Services</a>
          <button onClick={() => navigate("/intake")} style={{
            background: "var(--color-accent)", color: "#fff", border: "none",
            padding: "0.6rem 1.6rem", borderRadius: "2rem", cursor: "pointer",
            fontSize: "0.82rem", letterSpacing: "0.08em", fontFamily: "var(--font-body)"
          }}>Begin Intake</button>
        </div>
      </nav>

      {/* HERO */}
      <div style={{
        minHeight: "100vh", background: "linear-gradient(160deg, #0A100C 0%, #0F2318 60%, #1A3D2A 100%)",
        display: "flex", flexDirection: "column", justifyContent: "flex-end",
        padding: "0 3rem 5rem", position: "relative", overflow: "hidden"
      }}>
        {/* Background grid */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.04, backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

        {/* Eyebrow */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "1.5rem" }}>
          <div style={{ width: 32, height: 1, background: "var(--color-accent)" }} />
          <span style={{ fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-accent)" }}>
            Integrative Health · Est. 2024
          </span>
        </div>

        <h1 style={{
          fontFamily: "var(--font-heading)", fontSize: "clamp(3rem, 8vw, 7rem)",
          fontWeight: 400, color: "#fff", lineHeight: 1.05, marginBottom: "2rem",
          maxWidth: 900
        }}>
          Where healing begins<br />
          <span style={{ color: "var(--color-accent)", fontStyle: "italic" }}>with being heard.</span>
        </h1>

        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
          <button onClick={() => navigate("/intake")} style={{
            background: "var(--color-accent)", color: "#fff", border: "none",
            padding: "1rem 2.8rem", borderRadius: "3rem", cursor: "pointer",
            fontSize: "1rem", fontFamily: "var(--font-body)", letterSpacing: "0.04em", fontWeight: 500
          }}>Start Your Intake →</button>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", fontStyle: "italic" }}>
            5-minute form · No commitment required
          </span>
        </div>
      </div>

      {/* MARQUEE */}
      <div style={{ background: "var(--color-primary)", padding: "1rem 0", overflow: "hidden", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", gap: "3rem", animation: "marquee 24s linear infinite", whiteSpace: "nowrap" }}>
          {Array(4).fill(["HOLISTIC CARE", "PRECISION MEDICINE", "PERSONALIZED PROTOCOLS", "EVIDENCE-BASED", "ROOT CAUSE ANALYSIS"]).flat().map((t, i) => (
            <span key={i} style={{ fontSize: "0.72rem", letterSpacing: "0.2em", color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>
              {t} <span style={{ color: "var(--color-accent)", margin: "0 0.5rem" }}>◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* STATS */}
      <div id="about" style={{ background: "var(--color-bg-soft)", padding: "4rem 3rem" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "2rem" }}>
          {stats.map(s => (
            <div key={s.value} style={{ borderLeft: "2px solid var(--color-accent)", paddingLeft: "1.5rem" }}>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: "3rem", color: "var(--color-primary)", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: "0.78rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-muted)", marginTop: "0.5rem" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* SERVICES */}
      <div id="services" style={{ padding: "6rem 3rem", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "3rem", flexWrap: "wrap", gap: "1rem" }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 400, color: "var(--color-primary)", maxWidth: 500 }}>
            Care built around <em>your</em> whole picture.
          </h2>
          <button onClick={() => navigate("/intake")} style={{
            background: "none", border: "1.5px solid var(--color-primary)", color: "var(--color-primary)",
            padding: "0.8rem 2rem", borderRadius: "2rem", cursor: "pointer",
            fontSize: "0.85rem", fontFamily: "var(--font-body)"
          }}>View All Services</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
          {pillars.map(p => (
            <div key={p.num} style={{
              border: "1px solid var(--color-border)", borderRadius: "1rem",
              padding: "2.5rem", background: "var(--color-bg)",
              transition: "all 0.25s", cursor: "default"
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--color-accent)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.transform = "none"; }}
            >
              <div style={{ fontSize: "0.65rem", letterSpacing: "0.2em", color: "var(--color-accent)", marginBottom: "1.2rem" }}>{p.num}</div>
              <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.4rem", fontWeight: 400, color: "var(--color-primary)", marginBottom: "1rem" }}>{p.title}</h3>
              <p style={{ fontSize: "0.9rem", color: "var(--color-text-soft)", lineHeight: 1.7 }}>{p.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA BAND */}
      <div style={{ background: "var(--color-primary)", padding: "5rem 3rem", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 400, color: "#fff", marginBottom: "1.5rem" }}>
            Ready to begin your journey?
          </h2>
          <button onClick={() => navigate("/intake")} style={{
            background: "var(--color-accent)", color: "#fff", border: "none",
            padding: "1.1rem 3rem", borderRadius: "3rem", cursor: "pointer",
            fontSize: "1rem", fontFamily: "var(--font-body)", letterSpacing: "0.04em"
          }}>Begin Intake Form</button>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ background: "#0A100C", padding: "2rem 3rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <span style={{ fontFamily: "var(--font-heading)", color: "rgba(255,255,255,0.5)", fontSize: "1rem" }}>Luminal Journeys</span>
        <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>© {new Date().getFullYear()} Luminal Journeys · All rights reserved</span>
        <button onClick={() => navigate("/admin")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.7rem", color: "rgba(255,255,255,0.15)", letterSpacing: "0.1em" }}>Admin</button>
      </footer>

      <style>{`@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
    </div>
  );
}

// ─── Layout 2: Command ────────────────────────────────────────────────────────
// All dark, bold, metric-forward, diagonal accent line
function LayoutCommand() {
  const metrics = [
    { value: "94%", label: "Retention" },
    { value: "12+", label: "Yrs Practice" },
    { value: "48h", label: "First Appt" },
    { value: "100%", label: "Personalized" },
  ];

  const services = [
    { title: "Root Cause Analysis", desc: "Comprehensive diagnostics that go beyond symptoms to address underlying drivers of disease." },
    { title: "Hormone & Metabolic", desc: "Precision testing and protocols for hormonal balance, thyroid, adrenal, and metabolic health." },
    { title: "Stress & Nervous System", desc: "Evidence-based interventions for chronic stress, anxiety, burnout, and HPA axis dysregulation." },
    { title: "Nutrition & Gut Health", desc: "Functional nutrition planning and microbiome optimization tailored to your unique biology." },
  ];

  return (
    <div style={{ background: "#EEEAE3", fontFamily: "var(--font-body)", minHeight: "100vh", color: "#0A1628" }}>

      {/* NAV */}
      <nav style={{
        position: "fixed", top: 40, left: 0, right: 0, zIndex: 90,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "1.2rem 3rem", background: "#EEEAE3",
        borderBottom: "1px solid rgba(10,22,40,0.08)"
      }}>
        <span style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", color: "#0A1628", letterSpacing: "0.04em", textTransform: "uppercase" }}>
          Luminal Journeys
        </span>
        <button onClick={() => navigate("/intake")} style={{
          background: "transparent", color: "#0A1628", border: "1.5px solid #0A1628",
          padding: "0.55rem 1.5rem", borderRadius: "0", cursor: "pointer",
          fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "var(--font-body)"
        }}>Begin Intake</button>
      </nav>

      {/* HERO */}
      <div style={{
        minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr",
        alignItems: "center", padding: "0 3rem", gap: "4rem",
        borderBottom: "1px solid rgba(255,255,255,0.06)", paddingTop: "6rem"
      }}>
        <div>
          <div style={{ fontSize: "0.65rem", letterSpacing: "0.25em", color: "var(--color-accent)", textTransform: "uppercase", marginBottom: "2rem" }}>
            ◆ Integrative Health Platform
          </div>
          <h1 style={{
            fontFamily: "var(--font-heading)", fontSize: "clamp(2.5rem, 6vw, 5.5rem)",
            fontWeight: 700, lineHeight: 1, marginBottom: "2rem", textTransform: "uppercase",
            letterSpacing: "-0.02em"
          }}>
            YOUR HEALTH.<br />
            <span style={{ color: "var(--color-accent)" }}>FULLY</span><br />
            HEARD.
          </h1>
          <p style={{ fontSize: "1rem", color: "rgba(10,22,40,0.55)", lineHeight: 1.7, marginBottom: "2.5rem", maxWidth: 400 }}>
            Corporate-grade integrative care for leaders who demand precision, privacy, and outcomes.
          </p>
          <div style={{ display: "flex", gap: "1rem" }}>
            <button onClick={() => navigate("/intake")} style={{
              background: "#0A1628", color: "#EEEAE3", border: "none",
              padding: "1rem 2.5rem", cursor: "pointer",
              fontSize: "0.85rem", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "var(--font-body)"
            }}>Start Now →</button>
            <button onClick={() => navigate("/intake")} style={{
              background: "transparent", color: "rgba(10,22,40,0.55)", border: "1px solid rgba(10,22,40,0.2)",
              padding: "1rem 2rem", cursor: "pointer",
              fontSize: "0.85rem", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "var(--font-body)"
            }}>Learn More</button>
          </div>
        </div>

        {/* METRIC GRID */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", background: "rgba(10,22,40,0.06)" }}>
          {metrics.map(m => (
            <div key={m.value} style={{ background: "#fff", padding: "3rem 2rem", textAlign: "center", boxShadow: "0 2px 12px rgba(10,22,40,0.06)" }}>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: "3.5rem", color: "#0A1628", lineHeight: 1, marginBottom: "0.5rem" }}>{m.value}</div>
              <div style={{ fontSize: "0.65rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(10,22,40,0.45)" }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* SERVICES */}
      <div style={{ padding: "6rem 3rem" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "2rem", marginBottom: "3rem" }}>
          <span style={{ fontSize: "0.65rem", letterSpacing: "0.2em", color: "rgba(10,22,40,0.35)", textTransform: "uppercase" }}>Services</span>
          <div style={{ flex: 1, height: 1, background: "rgba(10,22,40,0.1)" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1px", background: "rgba(10,22,40,0.06)" }}>
          {services.map((s, i) => (
            <div key={i} style={{
              background: "#fff", padding: "2.5rem 2rem",
              borderTop: "2px solid transparent", transition: "border 0.2s",
              boxShadow: "0 2px 16px rgba(10,22,40,0.06)"
            }}
              onMouseEnter={e => e.currentTarget.style.borderTopColor = "#0A1628"}
              onMouseLeave={e => e.currentTarget.style.borderTopColor = "transparent"}
            >
              <div style={{ fontSize: "0.65rem", color: "rgba(10,22,40,0.35)", letterSpacing: "0.15em", marginBottom: "1.2rem" }}>0{i + 1}</div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem", letterSpacing: "-0.01em", color: "#0A1628" }}>{s.title}</h3>
              <p style={{ fontSize: "0.85rem", color: "rgba(10,22,40,0.6)", lineHeight: 1.7 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: "5rem 3rem", borderTop: "1px solid rgba(10,22,40,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "2rem" }}>
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.8rem, 4vw, 3rem)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "-0.02em" }}>
          READY TO<br /><span style={{ color: "var(--color-accent)" }}>BEGIN?</span>
        </h2>
        <button onClick={() => navigate("/intake")} style={{
          background: "#0A1628", color: "#EEEAE3", border: "none",
          padding: "1.2rem 3.5rem", cursor: "pointer",
          fontSize: "0.9rem", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "var(--font-body)"
        }}>Begin Intake →</button>
      </div>

      {/* FOOTER */}
      <footer style={{ padding: "2rem 3rem", borderTop: "1px solid rgba(10,22,40,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <span style={{ fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>Luminal Journeys</span>
        <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.2)" }}>© {new Date().getFullYear()} All rights reserved</span>
        <button onClick={() => navigate("/admin")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.65rem", color: "rgba(255,255,255,0.1)", letterSpacing: "0.1em" }}>Admin</button>
      </footer>
    </div>
  );
}

// ─── Layout 3: Trust ──────────────────────────────────────────────────────────
// Light, medical, J&J/Philips feel — clean white, navy, trust signals
function LayoutTrust() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const trustSignals = ["Evidence-Based Protocols", "HIPAA Compliant", "Board-Certified Practitioners", "Confidential & Private"];

  const services = [
    { icon: "◎", title: "Comprehensive Assessment", desc: "Full-spectrum health evaluation covering labs, lifestyle, history, and functional markers." },
    { icon: "◈", title: "Personalized Treatment", desc: "Custom care plans grounded in the latest integrative medicine research and your unique biology." },
    { icon: "◉", title: "Ongoing Monitoring", desc: "Regular touchpoints, progress tracking, and protocol adjustments as your health evolves." },
  ];

  return (
    <div style={{ background: "#fff", fontFamily: "var(--font-body)", minHeight: "100vh", color: "var(--color-text)" }}>

      {/* NAV */}
      <nav style={{
        position: "fixed", top: 40, left: 0, right: 0, zIndex: 90,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "1rem 3rem",
        background: scrolled ? "#fff" : "rgba(255,255,255,0.95)",
        borderBottom: "1px solid rgba(0,48,135,0.08)",
        backdropFilter: "blur(12px)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
          <div style={{ width: 8, height: 8, background: "var(--color-primary)", borderRadius: "50%" }} />
          <span style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", color: "var(--color-primary)", fontWeight: 600 }}>
            Luminal Journeys
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "2.5rem" }}>
          <a href="#about" style={{ color: "var(--color-text-muted)", fontSize: "0.83rem", textDecoration: "none" }}>About</a>
          <a href="#services" style={{ color: "var(--color-text-muted)", fontSize: "0.83rem", textDecoration: "none" }}>Services</a>
          <button onClick={() => navigate("/intake")} style={{
            background: "var(--color-primary)", color: "#fff", border: "none",
            padding: "0.65rem 1.8rem", borderRadius: "0.3rem", cursor: "pointer",
            fontSize: "0.83rem", fontFamily: "var(--font-body)", fontWeight: 500, letterSpacing: "0.02em"
          }}>Get Started</button>
        </div>
      </nav>

      {/* TRUST BAR */}
      <div style={{ background: "var(--color-primary)", padding: "0.6rem 3rem", display: "flex", gap: "2.5rem", justifyContent: "center", flexWrap: "wrap", marginTop: 40 }}>
        {trustSignals.map(t => (
          <div key={t} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ color: "var(--color-accent)", fontSize: "0.7rem" }}>✓</span>
            <span style={{ fontSize: "0.72rem", letterSpacing: "0.08em", color: "rgba(255,255,255,0.75)", textTransform: "uppercase" }}>{t}</span>
          </div>
        ))}
      </div>

      {/* HERO */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "90vh",
        alignItems: "center", maxWidth: 1200, margin: "0 auto", padding: "5rem 3rem", gap: "5rem"
      }}>
        <div>
          <div style={{ display: "inline-block", background: "rgba(0,48,135,0.07)", padding: "0.35rem 1rem", borderRadius: "2rem", marginBottom: "2rem" }}>
            <span style={{ fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-primary)", fontWeight: 500 }}>
              Integrative Health · Private Practice
            </span>
          </div>
          <h1 style={{
            fontFamily: "var(--font-heading)", fontSize: "clamp(2.5rem, 5vw, 4rem)",
            fontWeight: 600, color: "var(--color-primary)", lineHeight: 1.15, marginBottom: "1.5rem"
          }}>
            Precision care.<br />
            Complete trust.<br />
            <span style={{ color: "var(--color-accent)" }}>Lasting results.</span>
          </h1>
          <p style={{ fontSize: "1.05rem", color: "var(--color-text-soft)", lineHeight: 1.8, marginBottom: "2.5rem", maxWidth: 420 }}>
            A private integrative health practice built for professionals who expect the same rigor from their healthcare provider as they demand from themselves.
          </p>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={() => navigate("/intake")} style={{
              background: "var(--color-primary)", color: "#fff", border: "none",
              padding: "1rem 2.5rem", borderRadius: "0.3rem", cursor: "pointer",
              fontSize: "0.95rem", fontFamily: "var(--font-body)", fontWeight: 500
            }}>Begin Your Intake</button>
            <button onClick={() => navigate("/intake")} style={{
              background: "transparent", color: "var(--color-primary)",
              border: "1.5px solid var(--color-primary)",
              padding: "1rem 2rem", borderRadius: "0.3rem", cursor: "pointer",
              fontSize: "0.95rem", fontFamily: "var(--font-body)"
            }}>Learn More</button>
          </div>
        </div>

        {/* RIGHT SIDE CARD */}
        <div style={{
          background: "var(--color-bg-soft)", borderRadius: "1rem",
          padding: "3rem", border: "1px solid var(--color-border)"
        }}>
          <div style={{ fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: "2rem" }}>
            Your Care at a Glance
          </div>
          {[
            { step: "01", label: "Complete Intake", detail: "5-min form, no commitment" },
            { step: "02", label: "Initial Consultation", detail: "60-min comprehensive review" },
            { step: "03", label: "Personalized Plan", detail: "Evidence-based protocol built for you" },
            { step: "04", label: "Ongoing Partnership", detail: "Regular check-ins & refinements" },
          ].map(s => (
            <div key={s.step} style={{ display: "flex", gap: "1.2rem", marginBottom: "1.5rem", alignItems: "flex-start" }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "var(--color-primary)", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.65rem", fontWeight: 600, flexShrink: 0
              }}>{s.step}</div>
              <div>
                <div style={{ fontSize: "0.92rem", fontWeight: 600, color: "var(--color-text)", marginBottom: "0.2rem" }}>{s.label}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{s.detail}</div>
              </div>
            </div>
          ))}
          <button onClick={() => navigate("/intake")} style={{
            width: "100%", background: "var(--color-accent)", color: "#fff", border: "none",
            padding: "0.9rem", borderRadius: "0.3rem", cursor: "pointer",
            fontSize: "0.9rem", fontFamily: "var(--font-body)", fontWeight: 500, marginTop: "0.5rem"
          }}>Start Your Intake →</button>
        </div>
      </div>

      {/* SERVICES */}
      <div id="services" style={{ background: "var(--color-primary)", padding: "5rem 3rem" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.8rem, 3vw, 2.5rem)", color: "#fff", fontWeight: 600, marginBottom: "3rem" }}>
            Our Approach
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
            {services.map(s => (
              <div key={s.title} style={{
                background: "rgba(255,255,255,0.06)", borderRadius: "0.75rem",
                padding: "2rem", border: "1px solid rgba(255,255,255,0.1)"
              }}>
                <div style={{ fontSize: "1.5rem", color: "var(--color-accent)", marginBottom: "1rem" }}>{s.icon}</div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#fff", marginBottom: "0.75rem" }}>{s.title}</h3>
                <p style={{ fontSize: "0.87rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ background: "var(--color-bg-soft)", padding: "2rem 3rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", borderTop: "1px solid var(--color-border)" }}>
        <span style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)", fontSize: "1rem", fontWeight: 600 }}>Luminal Journeys</span>
        <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>© {new Date().getFullYear()} Luminal Journeys · All rights reserved</span>
        <button onClick={() => navigate("/admin")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.7rem", color: "var(--color-text-muted)", opacity: 0.4, letterSpacing: "0.1em" }}>Admin</button>
      </footer>
    </div>
  );
}

// ─── Layout 4: Clarity ───────────────────────────────────────────────────────
// Baselane × B Corp — warm cream, editorial serif headline, feature cards,
// testimonial strip, purposeful movement language, generous whitespace
function LayoutClarity() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const features = [
    {
      tag: "Assessment",
      title: "Complete picture, from day one.",
      body: "Our intake process captures your full health history, lifestyle, goals, and lab work — so your first visit starts at depth, not from scratch.",
      stat: "60 min", statLabel: "Initial consultation"
    },
    {
      tag: "Planning",
      title: "A plan built around your biology.",
      body: "No templates. No guesswork. Your protocol is designed from your data and refined continuously as your results evolve.",
      stat: "100%", statLabel: "Personalized protocols"
    },
    {
      tag: "Partnership",
      title: "Care that travels with you.",
      body: "Direct access to your care team, ongoing monitoring, and quarterly reviews ensure your health strategy stays current.",
      stat: "48h", statLabel: "Avg. first appointment"
    },
  ];

  const testimonials = [
    { quote: "For the first time, I felt like my doctor actually listened. The intake process alone changed how I think about my health.", name: "M.K.", role: "Executive, Financial Services" },
    { quote: "I've seen dozens of specialists. Luminal Journeys was the first practice that treated me as a whole person, not a symptom.", name: "R.T.", role: "Founder & CEO" },
    { quote: "The level of personalization is unlike anything I've experienced. My protocol actually fits my life.", name: "A.N.", role: "VP Operations" },
  ];

  return (
    <div style={{ background: "#FAFAF7", fontFamily: "var(--font-body)", minHeight: "100vh", color: "#1A1A14" }}>

      {/* NAV */}
      <nav style={{
        position: "fixed", top: 40, left: 0, right: 0, zIndex: 90,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "1rem 4rem",
        background: scrolled ? "rgba(250,250,247,0.97)" : "rgba(250,250,247,0.85)",
        backdropFilter: "blur(16px)",
        borderBottom: scrolled ? "1px solid rgba(26,26,20,0.08)" : "none",
        transition: "all 0.3s"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-primary)" }} />
          <span style={{ fontFamily: "var(--font-heading)", fontSize: "1.15rem", color: "var(--color-primary)", fontWeight: 600, letterSpacing: "-0.01em" }}>
            Luminal Journeys
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "2.5rem" }}>
          {["About", "Services", "Process"].map(l => (
            <a key={l} href="#" style={{ color: "rgba(26,26,20,0.55)", fontSize: "0.85rem", textDecoration: "none", letterSpacing: "0.01em" }}>{l}</a>
          ))}
          <button onClick={() => navigate("/intake")} style={{
            background: "var(--color-primary)", color: "#fff", border: "none",
            padding: "0.65rem 1.6rem", borderRadius: "2rem", cursor: "pointer",
            fontSize: "0.83rem", fontFamily: "var(--font-body)", fontWeight: 500
          }}>Begin Intake</button>
        </div>
      </nav>

      {/* HERO */}
      <div style={{
        maxWidth: 1200, margin: "0 auto", padding: "12rem 4rem 7rem",
        display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "5rem", alignItems: "center"
      }}>
        <div>
          {/* Eyebrow tag */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(26,26,20,0.06)", padding: "0.35rem 1rem", borderRadius: "2rem", marginBottom: "2rem" }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--color-accent)" }} />
            <span style={{ fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(26,26,20,0.6)" }}>Integrative Health Practice</span>
          </div>

          <h1 style={{
            fontFamily: "var(--font-heading)", fontSize: "clamp(2.8rem, 5.5vw, 5rem)",
            fontWeight: 400, lineHeight: 1.08, color: "var(--color-primary)",
            marginBottom: "1.8rem", letterSpacing: "-0.02em"
          }}>
            Health care built<br />
            around <em style={{ color: "var(--color-accent)", fontStyle: "italic" }}>you.</em>
          </h1>

          <p style={{ fontSize: "1.1rem", color: "rgba(26,26,20,0.6)", lineHeight: 1.75, marginBottom: "2.5rem", maxWidth: 440 }}>
            A private integrative practice for people who want answers, not assumptions — and a care team that treats the whole person, not just the symptoms.
          </p>

          <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={() => navigate("/intake")} style={{
              background: "var(--color-primary)", color: "#fff", border: "none",
              padding: "1rem 2.6rem", borderRadius: "3rem", cursor: "pointer",
              fontSize: "0.95rem", fontFamily: "var(--font-body)", fontWeight: 500
            }}>Start Your Intake →</button>
            <span style={{ fontSize: "0.8rem", color: "rgba(26,26,20,0.4)" }}>5 minutes · No commitment</span>
          </div>

          {/* Social proof */}
          <div style={{ display: "flex", gap: "2rem", marginTop: "3rem", paddingTop: "2rem", borderTop: "1px solid rgba(26,26,20,0.08)" }}>
            {[{ v: "94%", l: "Client retention" }, { v: "12+", l: "Years experience" }, { v: "48h", l: "First appointment" }].map(s => (
              <div key={s.v}>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: "1.8rem", color: "var(--color-primary)", lineHeight: 1, fontWeight: 500 }}>{s.v}</div>
                <div style={{ fontSize: "0.72rem", color: "rgba(26,26,20,0.45)", marginTop: "0.3rem", letterSpacing: "0.04em" }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Stacked feature cards (Baselane-style) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {[
            { icon: "◎", label: "Comprehensive Intake", detail: "Full health history + goals" },
            { icon: "◈", label: "Personalized Protocol", detail: "Built from your biology" },
            { icon: "◉", label: "Ongoing Partnership", detail: "Regular refinements & access" },
            { icon: "✦", label: "Direct Care Team Access", detail: "No gatekeeping, ever" },
          ].map((c, i) => (
            <div key={i} style={{
              background: "#fff", borderRadius: "1rem", padding: "1.4rem 1.8rem",
              border: "1px solid rgba(26,26,20,0.07)",
              display: "flex", alignItems: "center", gap: "1.2rem",
              boxShadow: "0 2px 16px rgba(26,26,20,0.04)",
              transition: "all 0.2s"
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateX(4px)"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(26,26,20,0.09)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 16px rgba(26,26,20,0.04)"; }}
            >
              <div style={{ width: 40, height: 40, borderRadius: "0.6rem", background: "var(--color-bg-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", color: "var(--color-primary)", flexShrink: 0 }}>{c.icon}</div>
              <div>
                <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-primary)", marginBottom: "0.2rem" }}>{c.label}</div>
                <div style={{ fontSize: "0.78rem", color: "rgba(26,26,20,0.45)" }}>{c.detail}</div>
              </div>
              <div style={{ marginLeft: "auto", color: "rgba(26,26,20,0.2)", fontSize: "0.9rem" }}>→</div>
            </div>
          ))}
        </div>
      </div>

      {/* MARQUEE STRIP — B Corp style */}
      <div style={{ background: "var(--color-primary)", padding: "0.9rem 0", overflow: "hidden" }}>
        <div style={{ display: "flex", gap: "3rem", animation: "marquee 28s linear infinite", whiteSpace: "nowrap" }}>
          {Array(4).fill(["WHOLE PERSON CARE", "EVIDENCE-BASED", "PRIVATE PRACTICE", "PRECISION PROTOCOLS", "ROOT CAUSE FOCUS", "CONFIDENTIAL"]).flat().map((t, i) => (
            <span key={i} style={{ fontSize: "0.68rem", letterSpacing: "0.2em", color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>
              {t} <span style={{ color: "rgba(255,255,255,0.25)", margin: "0 0.5rem" }}>·</span>
            </span>
          ))}
        </div>
      </div>

      {/* FEATURE SECTIONS — Baselane alternating layout */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "7rem 4rem" }}>
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <div style={{ fontSize: "0.7rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: "1rem" }}>How It Works</div>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2rem, 4vw, 3rem)", color: "var(--color-primary)", fontWeight: 400, letterSpacing: "-0.02em" }}>
            Care that works as hard as you do.
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {features.map((f, i) => (
            <div key={i} style={{
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", alignItems: "center",
              background: "#fff", borderRadius: "1.2rem", padding: "3rem",
              border: "1px solid rgba(26,26,20,0.07)",
              boxShadow: "0 2px 20px rgba(26,26,20,0.04)"
            }}>
              <div style={{ order: i % 2 === 0 ? 0 : 1 }}>
                <div style={{ display: "inline-block", background: "var(--color-bg-soft)", padding: "0.25rem 0.8rem", borderRadius: "2rem", marginBottom: "1.2rem" }}>
                  <span style={{ fontSize: "0.65rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-text-muted)" }}>{f.tag}</span>
                </div>
                <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.6rem", fontWeight: 400, color: "var(--color-primary)", marginBottom: "1rem", letterSpacing: "-0.01em" }}>{f.title}</h3>
                <p style={{ fontSize: "0.95rem", color: "rgba(26,26,20,0.6)", lineHeight: 1.75 }}>{f.body}</p>
              </div>
              <div style={{ order: i % 2 === 0 ? 1 : 0, background: "var(--color-bg-soft)", borderRadius: "0.8rem", padding: "3rem", textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: "4rem", color: "var(--color-primary)", fontWeight: 400, lineHeight: 1 }}>{f.stat}</div>
                <div style={{ fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-muted)", marginTop: "0.6rem" }}>{f.statLabel}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TESTIMONIALS — B Corp community feel */}
      <div style={{ background: "var(--color-primary)", padding: "6rem 4rem" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ fontSize: "0.7rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "3rem" }}>From Our Clients</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
            {testimonials.map((t, i) => (
              <div key={i} style={{
                background: "rgba(255,255,255,0.05)", borderRadius: "1rem",
                padding: "2.5rem", border: "1px solid rgba(255,255,255,0.08)"
              }}>
                <div style={{ fontSize: "2rem", color: "var(--color-accent)", marginBottom: "1rem", lineHeight: 1 }}>"</div>
                <p style={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.75, marginBottom: "1.5rem", fontStyle: "italic" }}>{t.quote}</p>
                <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#fff" }}>{t.name}</div>
                <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", marginTop: "0.2rem" }}>{t.role}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA — Baselane-style bottom full bleed */}
      <div style={{ background: "#FAFAF7", padding: "7rem 4rem", textAlign: "center" }}>
        <div style={{ maxWidth: 620, margin: "0 auto" }}>
          <div style={{ fontSize: "0.7rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>Get Started</div>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2rem, 4vw, 3rem)", color: "var(--color-primary)", fontWeight: 400, marginBottom: "1.5rem", letterSpacing: "-0.02em" }}>
            Your health deserves<br />this level of care.
          </h2>
          <p style={{ fontSize: "1rem", color: "rgba(26,26,20,0.55)", marginBottom: "2.5rem", lineHeight: 1.7 }}>
            Complete a 5-minute intake form. No commitment required.
          </p>
          <button onClick={() => navigate("/intake")} style={{
            background: "var(--color-primary)", color: "#fff", border: "none",
            padding: "1.1rem 3rem", borderRadius: "3rem", cursor: "pointer",
            fontSize: "1rem", fontFamily: "var(--font-body)", fontWeight: 500
          }}>Begin Your Intake →</button>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ background: "#F0EFE9", padding: "2rem 4rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", borderTop: "1px solid rgba(26,26,20,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--color-primary)" }} />
          <span style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)", fontSize: "0.95rem", fontWeight: 600 }}>Luminal Journeys</span>
        </div>
        <span style={{ fontSize: "0.73rem", color: "rgba(26,26,20,0.4)" }}>© {new Date().getFullYear()} Luminal Journeys · All rights reserved</span>
        <button onClick={() => navigate("/admin")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.65rem", color: "rgba(26,26,20,0.2)", letterSpacing: "0.1em" }}>Admin</button>
      </footer>

      <style>{`@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
    </div>
  );
}

// ─── Layout 5: Movement ──────────────────────────────────────────────────────
// Pure B Corp aesthetic — cream #F5F0E8, near-black #1A1A2E, condensed serif
// headline at massive scale, horizontal ruled editorial sections, purpose-forward
function LayoutMovement() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const BC = {
    cream:   "#F5F0E8",
    ink:     "#1A1A2E",
    sage:    "#4A6741",
    rule:    "rgba(26,26,46,0.12)",
    muted:   "rgba(26,26,46,0.5)",
    soft:    "#EDE8DF",
  };

  const principles = [
    {
      num: "I",
      title: "You deserve to be heard.",
      body: "Most healthcare treats symptoms. We treat people. Every care plan begins with understanding your full story — not just your lab results."
    },
    {
      num: "II",
      title: "Evidence without compromise.",
      body: "We hold ourselves to the highest standard of evidence-based integrative medicine. Rigorous science and whole-person care are not in conflict."
    },
    {
      num: "III",
      title: "A practice built for the long term.",
      body: "We measure success not by visit volume but by sustained outcomes. Your health trajectory is the only metric that matters."
    },
  ];

  return (
    <div style={{ background: BC.cream, fontFamily: "var(--font-body)", minHeight: "100vh", color: BC.ink }}>

      {/* NAV — minimal, B Corp style */}
      <nav style={{
        position: "fixed", top: 40, left: 0, right: 0, zIndex: 90,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "1.2rem 4rem",
        background: scrolled ? BC.cream : "transparent",
        borderBottom: scrolled ? `1px solid ${BC.rule}` : "none",
        transition: "all 0.4s"
      }}>
        <span style={{ fontFamily: "var(--font-heading)", fontSize: "1.1rem", color: BC.ink, fontWeight: 600, letterSpacing: "-0.01em" }}>
          Luminal Journeys
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "3rem" }}>
          <a href="#principles" style={{ color: BC.muted, fontSize: "0.82rem", textDecoration: "none", letterSpacing: "0.02em" }}>Our Practice</a>
          <a href="#process" style={{ color: BC.muted, fontSize: "0.82rem", textDecoration: "none", letterSpacing: "0.02em" }}>Process</a>
          <button onClick={() => navigate("/intake")} style={{
            background: BC.ink, color: BC.cream, border: "none",
            padding: "0.65rem 1.8rem", borderRadius: "2rem", cursor: "pointer",
            fontSize: "0.82rem", fontFamily: "var(--font-body)", letterSpacing: "0.02em"
          }}>Begin Intake</button>
        </div>
      </nav>

      {/* HERO — full viewport, B Corp editorial scale */}
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0 4rem 5rem", paddingTop: "8rem", borderBottom: `1px solid ${BC.rule}` }}>

        {/* Top rule + label */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: "3rem" }}>
          <div style={{ height: 1, width: 48, background: BC.sage }} />
          <span style={{ fontSize: "0.68rem", letterSpacing: "0.2em", textTransform: "uppercase", color: BC.sage }}>
            Integrative Health · Private Practice
          </span>
        </div>

        {/* Massive headline — B Corp condensed style */}
        <h1 style={{
          fontFamily: "var(--font-heading)",
          fontSize: "clamp(4rem, 11vw, 10rem)",
          fontWeight: 400, lineHeight: 0.95,
          color: BC.ink, letterSpacing: "-0.03em",
          marginBottom: "4rem", maxWidth: "90%"
        }}>
          Care that begins<br />
          with <em style={{ color: BC.sage, fontStyle: "italic" }}>listening.</em>
        </h1>

        {/* Bottom row — description + CTA split */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "flex-end", paddingTop: "3rem", borderTop: `1px solid ${BC.rule}` }}>
          <p style={{ fontSize: "1.1rem", color: BC.muted, lineHeight: 1.8, maxWidth: 480 }}>
            A private integrative health practice for people who want a care team that treats the whole person — not just the presenting complaint.
          </p>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "1.5rem" }}>
            <button onClick={() => navigate("/intake")} style={{
              background: BC.ink, color: BC.cream, border: "none",
              padding: "1.1rem 3rem", borderRadius: "3rem", cursor: "pointer",
              fontSize: "1rem", fontFamily: "var(--font-body)", letterSpacing: "0.02em"
            }}>Begin Your Intake →</button>
            <span style={{ fontSize: "0.78rem", color: BC.muted }}>5 minutes · No commitment required</span>
          </div>
        </div>
      </div>

      {/* STATS ROW — B Corp impact numbers style */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", borderBottom: `1px solid ${BC.rule}` }}>
        {[
          { v: "94%", l: "Client Retention" },
          { v: "12+", l: "Years of Practice" },
          { v: "48h", l: "First Appointment" },
          { v: "1:1", l: "Personalized Care" },
        ].map((s, i) => (
          <div key={i} style={{
            padding: "3rem 4rem",
            borderRight: i < 3 ? `1px solid ${BC.rule}` : "none"
          }}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: "3.5rem", color: BC.ink, lineHeight: 1, letterSpacing: "-0.03em" }}>{s.v}</div>
            <div style={{ fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", color: BC.muted, marginTop: "0.6rem" }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* PRINCIPLES — B Corp editorial ruled sections */}
      <div id="principles">
        {principles.map((p, i) => (
          <div key={i} style={{
            display: "grid", gridTemplateColumns: "80px 1fr 1fr",
            gap: "4rem", alignItems: "start",
            padding: "4rem", borderBottom: `1px solid ${BC.rule}`,
            transition: "background 0.3s"
          }}
            onMouseEnter={e => e.currentTarget.style.background = BC.soft}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <div style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", color: BC.muted, fontStyle: "italic", paddingTop: "0.4rem" }}>{p.num}</div>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.5rem, 2.5vw, 2.2rem)", fontWeight: 400, color: BC.ink, letterSpacing: "-0.02em", lineHeight: 1.2 }}>{p.title}</h3>
            <p style={{ fontSize: "1rem", color: BC.muted, lineHeight: 1.8, paddingTop: "0.4rem" }}>{p.body}</p>
          </div>
        ))}
      </div>

      {/* PROCESS — B Corp full-width section */}
      <div id="process" style={{ padding: "6rem 4rem", borderBottom: `1px solid ${BC.rule}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: "4rem" }}>
          <span style={{ fontSize: "0.68rem", letterSpacing: "0.2em", textTransform: "uppercase", color: BC.muted }}>The Process</span>
          <div style={{ flex: 1, height: 1, background: BC.rule }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0" }}>
          {[
            { step: "01", title: "Complete Intake", detail: "A thorough 5-minute form that captures what matters most before we meet." },
            { step: "02", title: "Initial Consultation", detail: "60 minutes. Full history. No rush. This is where your care plan begins." },
            { step: "03", title: "Your Protocol", detail: "A personalized, evidence-based plan built entirely around your biology and goals." },
            { step: "04", title: "Ongoing Partnership", detail: "Regular refinements, direct access, and accountability — for the long term." },
          ].map((s, i) => (
            <div key={i} style={{
              padding: "3rem 2.5rem",
              borderRight: i < 3 ? `1px solid ${BC.rule}` : "none",
              borderLeft: i === 0 ? `1px solid ${BC.rule}` : "none"
            }}>
              <div style={{ fontSize: "0.65rem", letterSpacing: "0.2em", color: BC.muted, marginBottom: "1.5rem" }}>{s.step}</div>
              <h4 style={{ fontFamily: "var(--font-heading)", fontSize: "1.3rem", fontWeight: 400, color: BC.ink, marginBottom: "1rem", letterSpacing: "-0.01em" }}>{s.title}</h4>
              <p style={{ fontSize: "0.88rem", color: BC.muted, lineHeight: 1.75 }}>{s.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* MANIFESTO BAND — B Corp "We believe" style */}
      <div style={{ background: BC.ink, padding: "7rem 4rem" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <div style={{ height: 1, background: "rgba(255,255,255,0.1)", marginBottom: "4rem" }} />
          <p style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(1.6rem, 3.5vw, 2.8rem)",
            fontWeight: 400, color: BC.cream,
            lineHeight: 1.4, letterSpacing: "-0.02em", marginBottom: "3rem",
            fontStyle: "italic"
          }}>
            "Your health is not a problem to be solved.<br />
            It is a story to be understood."
          </p>
          <div style={{ height: 1, background: "rgba(255,255,255,0.1)", marginBottom: "3rem" }} />
          <button onClick={() => navigate("/intake")} style={{
            background: "transparent", color: BC.cream,
            border: `1px solid rgba(255,255,255,0.3)`,
            padding: "1rem 2.8rem", borderRadius: "3rem", cursor: "pointer",
            fontSize: "0.9rem", fontFamily: "var(--font-body)", letterSpacing: "0.04em",
            transition: "all 0.2s"
          }}
            onMouseEnter={e => { e.currentTarget.style.background = BC.cream; e.currentTarget.style.color = BC.ink; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = BC.cream; }}
          >Begin Your Intake →</button>
        </div>
      </div>

      {/* FOOTER — B Corp minimal */}
      <footer style={{ padding: "2.5rem 4rem", borderTop: `1px solid ${BC.rule}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <span style={{ fontFamily: "var(--font-heading)", color: BC.ink, fontSize: "1rem", letterSpacing: "-0.01em" }}>Luminal Journeys</span>
        <span style={{ fontSize: "0.73rem", color: BC.muted }}>© {new Date().getFullYear()} Luminal Journeys · All rights reserved</span>
        <button onClick={() => navigate("/admin")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.65rem", color: BC.muted, opacity: 0.4, letterSpacing: "0.1em" }}>Admin</button>
      </footer>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
const LAYOUTS = { 1: LayoutEditorial, 2: LayoutCommand, 3: LayoutTrust, 4: LayoutClarity, 5: LayoutMovement };

export default function LandingPage() {
  const [layout, setLayout] = useState(() => parseInt(localStorage.getItem("lj_layout") || "1"));

  useEffect(() => {
    const h = () => setLayout(parseInt(localStorage.getItem("lj_layout") || "1"));
    window.addEventListener("layoutchange", h);
    return () => window.removeEventListener("layoutchange", h);
  }, []);

  const Layout = LAYOUTS[layout];
  return (
    <>
      <Layout />
      <MockupBanner />
    </>
  );
}