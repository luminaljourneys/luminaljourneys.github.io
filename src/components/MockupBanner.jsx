import { useState } from "react";
import { useEditMode } from "../context/EditModeContext";

export default function MockupBanner() {
  const [open, setOpen] = useState(false);
  const { isEditMode } = useEditMode();

  // Only visible to logged-in authorized editors
  if (!isEditMode) return null;

  const goToBrandKit = () => {
    setOpen(false);
    window.history.pushState({}, "", "/brand");
    window.dispatchEvent(new Event("routechange"));
  };

  const items = [
    { text: "Waiting on real intake form field inputs", done: false },
    { text: "Firestore database connection", done: true },
    { text: "Capture intake form submitter email address", done: false },
    { text: "Post-form email: next steps + booking link", done: false },
    { text: "Appointment scheduling — client books intro call", done: false },
  ];

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        style={{
          position: "fixed", bottom: "1.2rem", right: "1.2rem", zIndex: 998,
          background: "#172f2d", color: "#fff",
          padding: "0.5rem 1.1rem", borderRadius: "2rem",
          fontSize: "0.75rem", fontFamily: "'DM Sans', sans-serif",
          letterSpacing: "0.08em", textTransform: "uppercase",
          cursor: "pointer", fontWeight: 500,
          boxShadow: "0 4px 16px rgba(44,95,74,0.3)",
          display: "flex", alignItems: "center", gap: "0.4rem",
          transition: "transform 0.2s"
        }}
        onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
        onMouseLeave={e => e.currentTarget.style.transform = "none"}
      >
        <span style={{ fontSize: "0.65rem" }}>⚠</span>
        Mockup Prototype
      </div>

      {open && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(23,47,45,0.6)",
          fontFamily: "'DM Sans', sans-serif"
        }}
          onClick={() => setOpen(false)}
        >
          <div style={{
            background: "#F9F8F6", borderRadius: "1.2rem",
            padding: "2.5rem", maxWidth: 420, width: "100%", margin: "1rem",
            border: "1px solid var(--color-border)",
            boxShadow: "0 24px 80px rgba(23,47,45,0.18)"
          }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.2rem" }}>
              <div>
                <div style={{ fontSize: "0.68rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#bf8a3e", marginBottom: "0.3rem" }}>
                  ⚠ Prototype Notice
                </div>
                <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "1.5rem", fontWeight: 400, color: "#172f2d", margin: 0 }}>
                  Mockup Prototype
                </h2>
              </div>
              <button onClick={() => setOpen(false)} style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#89a99e", fontSize: "1.3rem", lineHeight: 1, padding: "0.2rem"
              }}>×</button>
            </div>

            <div style={{ height: 1, background: "#e5e7eb", marginBottom: "1.2rem" }} />

            <p style={{ fontSize: "0.9rem", lineHeight: 1.7, color: "#3a5450", marginBottom: "1rem" }}>
              This is a <strong style={{ color: "#172f2d" }}>design prototype</strong> for the Luminal Journeys platform. All data shown is simulated.
            </p>

            <div style={{ background: "#e6ddd0", borderRadius: "0.6rem", padding: "1rem 1.2rem", marginBottom: "1.4rem" }}>
              <div style={{ fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#89a99e", marginBottom: "0.6rem" }}>
                Pending before launch
              </div>
              {items.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", marginBottom: "0.4rem", fontSize: "0.85rem" }}>
                  <span style={{ color: item.done ? "#2C5F4A" : "#bf8a3e", marginTop: "0.1rem", flexShrink: 0 }}>
                    {item.done ? "✓" : "○"}
                  </span>
                  <span style={{
                    color: item.done ? "#89a99e" : "#172f2d",
                    textDecoration: item.done ? "line-through" : "none",
                  }}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>

            {/* View Brand Kit — only for authorized editors (already gated by parent) */}
            <button onClick={goToBrandKit} style={{
              width: "100%", background: "#e6ddd0", color: "#172f2d",
              border: "1.5px solid var(--color-border)", borderRadius: "0.6rem", padding: "0.8rem",
              fontSize: "0.88rem", cursor: "pointer", letterSpacing: "0.04em", marginBottom: "0.75rem",
              fontFamily: "'DM Sans', sans-serif", fontWeight: 500
            }}
              onMouseEnter={e => e.currentTarget.style.background = "#d8cfc4"}
              onMouseLeave={e => e.currentTarget.style.background = "#e6ddd0"}
            >
              View Brand Kit →
            </button>

            <button onClick={() => setOpen(false)} style={{
              width: "100%", background: "#172f2d", color: "#fff",
              border: "none", borderRadius: "0.6rem", padding: "0.8rem",
              fontSize: "0.88rem", cursor: "pointer", letterSpacing: "0.04em",
              fontFamily: "'DM Sans', sans-serif"
            }}
              onMouseEnter={e => e.currentTarget.style.background = "#0f1e1d"}
              onMouseLeave={e => e.currentTarget.style.background = "#172f2d"}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
