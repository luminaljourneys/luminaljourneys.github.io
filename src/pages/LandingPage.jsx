import { navigate } from "../App.jsx";
import MockupBanner from "../components/MockupBanner.jsx";
import { useEffect, useRef, useState } from "react";

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", background: "var(--color-bg)", color: "var(--color-text)", minHeight: "100vh" }}>

      {/* NAV */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "1.2rem 2.5rem",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: scrolled ? "rgba(250,247,242,0.96)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(180,150,100,0.15)" : "none",
        transition: "all 0.4s ease"
      }}>
        <span style={{ fontSize: "1.5rem", fontWeight: 600, letterSpacing: "0.04em", color: "var(--color-primary)" }}>
          Luminal Journey
        </span>
        <button onClick={() => navigate("/intake")} style={{
          background: "var(--color-accent)", color: "#fff",
          padding: "0.6rem 1.6rem", borderRadius: "2rem",
          border: "none", cursor: "pointer",
          textDecoration: "none", fontSize: "0.85rem",
          letterSpacing: "0.08em", fontFamily: "'DM Sans', sans-serif",
          transition: "background 0.2s"
        }}
          onMouseEnter={e => e.target.style.background = "var(--color-primary-dark)"}
          onMouseLeave={e => e.target.style.background = "var(--color-primary)"}
        >
          Begin Intake
        </button>
      </nav>

      {/* HERO */}
      <section style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "center", textAlign: "center",
        padding: "8rem 2rem 4rem",
        background: "radial-gradient(ellipse at 60% 40%, #EDE0CC 0%, var(--color-bg) 60%)",
        position: "relative", overflow: "hidden"
      }}>
        {/* Decorative circles */}
        <div style={{
          position: "absolute", top: "10%", right: "8%",
          width: 320, height: 320, borderRadius: "50%",
          background: "rgba(95,158,160,0.08)", pointerEvents: "none"
        }} />
        <div style={{
          position: "absolute", bottom: "12%", left: "5%",
          width: 200, height: 200, borderRadius: "50%",
          background: "rgba(95,158,160,0.06)", pointerEvents: "none"
        }} />

        <p style={{
          fontSize: "0.8rem", letterSpacing: "0.22em", color: "var(--color-accent)",
          fontFamily: "'DM Sans', sans-serif", marginBottom: "1.4rem",
          textTransform: "uppercase"
        }}>
          Integrative Wellness • Whole-Person Care
        </p>

        <h1 style={{
          fontSize: "clamp(2.8rem, 7vw, 5.5rem)",
          fontWeight: 400, lineHeight: 1.1,
          maxWidth: 780, margin: "0 auto 1.6rem",
          color: "var(--color-text)"
        }}>
          Where healing begins<br />
          <em style={{ color: "var(--color-primary)", fontStyle: "italic" }}>with being heard</em>
        </h1>

        <p style={{
          fontSize: "1.2rem", lineHeight: 1.7, maxWidth: 520,
          color: "var(--color-text-soft)", margin: "0 auto 3rem",
          fontWeight: 300, fontFamily: "'DM Sans', sans-serif"
        }}>
          A personalized, integrative approach to your health — blending
          evidence-based care with the wisdom of whole-body wellness.
        </p>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
          <button onClick={() => navigate("/intake")} style={{
            background: "var(--color-accent)", color: "#fff",
            padding: "1rem 2.6rem", borderRadius: "3rem",
            textDecoration: "none", fontSize: "1rem", border: "none",
            fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.04em",
            boxShadow: "none",
            border: "none", cursor: "pointer",
            transition: "all 0.25s"
          }}
            onMouseEnter={e => { e.target.style.background = "var(--color-primary-dark)"; e.target.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.target.style.background = "var(--color-primary)"; e.target.style.transform = "translateY(0)"; }}
          >
            Start Your Intake →
          </button>
          <a href="#about" style={{
            border: "none", cursor: "pointer", color: "var(--color-primary)",
            padding: "1rem 2.2rem", borderRadius: "3rem",
            textDecoration: "none", fontSize: "1rem",
            fontFamily: "'DM Sans', sans-serif",
            transition: "all 0.25s"
          }}
            onMouseEnter={e => { e.target.style.background = "rgba(155,94,82,0.06)"; }}
            onMouseLeave={e => { e.target.style.background = "transparent"; }}
          >
            Learn More
          </a>
        </div>
      </section>

      {/* PILLARS */}
      <section id="about" style={{ padding: "6rem 2rem", maxWidth: 1100, margin: "0 auto" }}>
        <p style={{
          textAlign: "center", fontSize: "0.75rem", letterSpacing: "0.2em",
          color: "var(--color-accent)", fontFamily: "'DM Sans', sans-serif",
          textTransform: "uppercase", marginBottom: "0.8rem"
        }}>Our Approach</p>
        <h2 style={{
          textAlign: "center", fontSize: "clamp(2rem, 4vw, 3rem)",
          fontWeight: 400, marginBottom: "3.5rem", color: "var(--color-text)"
        }}>
          Care built around <em style={{ color: "var(--color-primary)" }}>you</em>
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem" }}>
          {[
            { icon: "✦", title: "Holistic Assessment", body: "We listen first. Your intake helps us understand your full picture — body, mind, and lifestyle — before we ever suggest a path forward." },
            { icon: "◈", title: "Personalized Plans", body: "No two people are alike. Your wellness plan is built specifically for your needs, goals, and pace — never a one-size-fits-all protocol." },
            { icon: "❧", title: "Ongoing Partnership", body: "Healing is a journey. Your care team walks alongside you, adjusting and supporting as your health evolves over time." },
          ].map((card, i) => (
            <div key={i} style={{
              background: "var(--color-bg-soft)", border: "1px solid rgba(95,158,160,0.18)",
              borderRadius: "1.2rem", padding: "2.5rem 2rem",
              transition: "transform 0.2s, box-shadow 0.2s"
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(17,76,92,0.10)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div style={{ fontSize: "1.8rem", color: "var(--color-accent)", marginBottom: "1rem" }}>{card.icon}</div>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 500, marginBottom: "0.8rem" }}>{card.title}</h3>
              <p style={{ fontSize: "0.95rem", lineHeight: 1.7, color: "var(--color-text-soft)", fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}>{card.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PROCESS */}
      <section style={{ background: "var(--color-bg-soft)", padding: "6rem 2rem" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <p style={{
            fontSize: "0.75rem", letterSpacing: "0.2em", color: "var(--color-accent)",
            fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", marginBottom: "0.8rem"
          }}>Getting Started</p>
          <h2 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", fontWeight: 400, marginBottom: "3rem" }}>
            Three simple steps
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem", textAlign: "left" }}>
            {[
              { n: "01", title: "Complete Your Intake", body: "Fill out our brief intake form — it takes about 5 minutes and helps us prepare for your first visit." },
              { n: "02", title: "Meet Your Care Team", body: "We'll review your intake and match you with the right practitioner for your goals." },
              { n: "03", title: "Begin Your Journey", body: "Your first appointment is a conversation. We get to know you and co-create your wellness path." },
            ].map((step, i) => (
              <div key={i} style={{
                display: "flex", gap: "2rem", alignItems: "flex-start",
                background: "var(--color-bg)", borderRadius: "1rem", padding: "1.8rem 2rem",
                border: "1px solid rgba(95,158,160,0.15)"
              }}>
                <span style={{ fontSize: "2.5rem", color: "rgba(95,158,160,0.3)", fontWeight: 600, minWidth: 60 }}>{step.n}</span>
                <div>
                  <h4 style={{ fontSize: "1.2rem", fontWeight: 500, marginBottom: "0.4rem" }}>{step.title}</h4>
                  <p style={{ fontSize: "0.95rem", color: "var(--color-text-soft)", fontFamily: "'DM Sans', sans-serif", fontWeight: 300, lineHeight: 1.6, margin: 0 }}>{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section style={{
        background: "var(--color-accent)", color: "#fff",
        padding: "5rem 2rem", textAlign: "center"
      }}>
        <h2 style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", fontWeight: 400, marginBottom: "1rem" }}>
          Ready to begin?
        </h2>
        <p style={{
          fontSize: "1.1rem", fontFamily: "'DM Sans', sans-serif", fontWeight: 300,
          marginBottom: "2.5rem", opacity: 0.85, maxWidth: 460, margin: "0 auto 2.5rem"
        }}>
          Your intake form takes 5 minutes and helps us show up fully prepared for you.
        </p>
        <button onClick={() => navigate("/intake")} style={{
          background: "var(--color-bg)", color: "var(--color-primary)",
          padding: "1rem 2.8rem", borderRadius: "3rem", border: "none", cursor: "pointer",
          textDecoration: "none", fontSize: "1rem",
          fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
          letterSpacing: "0.04em", transition: "all 0.25s",
          display: "inline-block"
        }}
          onMouseEnter={e => { e.target.style.background = "#EDE0CC"; e.target.style.transform = "translateY(-2px)"; }}
          onMouseLeave={e => { e.target.style.background = "var(--color-bg)"; e.target.style.transform = "translateY(0)"; }}
        >
          Start Your Intake →
        </button>
      </section>

      {/* FOOTER */}
      <footer style={{
        padding: "2.5rem 2rem", textAlign: "center",
        borderTop: "1px solid rgba(95,158,160,0.15)",
        fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", color: "var(--color-text-muted)"
      }}>
        © {new Date().getFullYear()} Luminal Journey · Built with care
        <span style={{ margin: "0 0.6rem", opacity: 0.3 }}>·</span>
        <a
          href="/admin"
          onClick={e => { e.preventDefault(); navigate("/admin"); }}
          style={{ color: "var(--color-text-muted)", textDecoration: "none", opacity: 0.4, fontSize: "0.75rem", letterSpacing: "0.06em" }}
          onMouseEnter={e => e.target.style.opacity = 1}
          onMouseLeave={e => e.target.style.opacity = 0.4}
        >
          Admin
        </a>
      </footer>
    <MockupBanner />
    </div>
  );
}