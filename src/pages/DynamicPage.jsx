/**
 * DynamicPage.jsx — Luminal Journeys
 * Renders a single page stored in Firestore (pages_staging / pages_production).
 * Content keys follow pattern: page.{pageId}.heading, page.{pageId}.subheading, page.{pageId}.body
 * so the client can edit them via the EditableContent system.
 */

import React from "react";
import { navigate } from "../App.jsx";
import { useSitePages } from "../hooks/useSitePages.js";
import EditableContent from "../components/EditableContent.jsx";
import MockupBanner from "../components/MockupBanner.jsx";

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function PageSkeleton() {
  return (
    <div style={{ maxWidth: 760, margin: "6rem auto", padding: "0 clamp(1rem, 4vw, 2rem)" }}>
      {[120, 60, 280, 280, 200].map((w, i) => (
        <div key={i} style={{
          height: i === 0 ? 48 : i < 2 ? 28 : 18,
          width: w, maxWidth: "100%",
          borderRadius: "0.5rem", background: "rgba(23,47,45,0.07)",
          marginBottom: i < 2 ? "1.2rem" : "0.8rem",
        }} />
      ))}
    </div>
  );
}

// ─── 404 state ────────────────────────────────────────────────────────────────
function PageNotFound() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "var(--color-bg)", fontFamily: "'DM Serif Display', Georgia, serif",
      textAlign: "center", padding: "2rem",
    }}>
      <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✦</div>
      <EditableContent
        contentKey="404.headline"
        fallback="Page not found"
        tag="h1"
        style={{ fontSize: "2.4rem", fontWeight: 400, color: "#172f2d", marginBottom: "0.8rem" }}
      />
      <EditableContent
        contentKey="404.body"
        fallback="This page doesn't exist yet — or it may have been removed."
        tag="p"
        style={{
          fontFamily: "'DM Sans', sans-serif", color: "#3a5450",
          fontSize: "0.95rem", marginBottom: "2rem", maxWidth: 380, lineHeight: 1.7,
        }}
      />
      <button onClick={() => navigate("/")} style={{
        color: "var(--color-primary)", fontFamily: "'DM Sans', sans-serif",
        fontSize: "0.9rem", background: "none", border: "none",
        cursor: "pointer", borderBottom: "1px solid rgba(155,94,82,0.4)", padding: 0,
      }}>
        <EditableContent contentKey="thankyou.backhome" fallback="← Back to home" tag="span" />
      </button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DynamicPage({ pageId }) {
  const { pages, loading } = useSitePages();

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
        <PageSkeleton />
      </div>
    );
  }

  const page = pages.find((p) => p.id === pageId);
  if (!page) return <PageNotFound />;

  const ck = (field) => `page.${pageId}.${field}`;

  return (
    <div style={{
      minHeight: "100vh", background: "var(--color-bg)",
      fontFamily: "'DM Serif Display', Georgia, serif",
    }}>

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
          <EditableContent contentKey="brand.wordmark" fallback="Luminal Journeys" tag="span" />
        </button>
        <button onClick={() => navigate("/")} style={{
          background: "none", border: "1.5px solid rgba(23,47,45,0.15)",
          color: "#89a99e", padding: "0.4rem 1.1rem", borderRadius: "2rem",
          cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: "0.78rem",
          letterSpacing: "0.04em",
        }}>
          <EditableContent contentKey="nav.backhome" fallback="← Home" tag="span" />
        </button>
      </div>

      {/* HERO */}
      <div style={{
        background: "linear-gradient(160deg, #1a3d38 0%, #224e4a 60%, #2a5e58 100%)",
        padding: "5rem clamp(1.5rem, 5vw, 3rem) 4rem",
        textAlign: "center",
      }}>
        <EditableContent
          contentKey={ck("heading")}
          fallback={page.heading || page.title}
          tag="h1"
          style={{
            fontSize: "clamp(2.2rem, 5vw, 3.5rem)", fontWeight: 400,
            color: "#F9F8F6", marginBottom: "1rem", marginTop: 0, lineHeight: 1.2,
          }}
        />
        {(page.subheading) && (
          <EditableContent
            contentKey={ck("subheading")}
            fallback={page.subheading}
            tag="p"
            style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: "1.1rem",
              color: "rgba(249,247,244,0.7)", maxWidth: 560,
              margin: "0 auto", lineHeight: 1.7, fontWeight: 300,
            }}
          />
        )}
      </div>

      {/* BODY */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "4rem clamp(1.5rem, 5vw, 2.5rem)" }}>
        {page.body ? (
          <EditableContent
            contentKey={ck("body")}
            fallback={page.body}
            tag="div"
            style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: "1.05rem",
              color: "#3a5450", lineHeight: 1.85, whiteSpace: "pre-wrap",
            }}
          />
        ) : (
          <EditableContent
            contentKey={ck("body")}
            fallback="Content coming soon."
            tag="p"
            style={{
              fontFamily: "'DM Sans', sans-serif", color: "#89a99e",
              fontStyle: "italic", textAlign: "center",
            }}
          />
        )}

        {/* CTA spacer */}
        <div style={{ height: 1, background: "var(--color-border)", margin: "3.5rem 0" }} />

        <div style={{ textAlign: "center" }}>
          <button onClick={() => navigate("/intake")} style={{
            background: "var(--color-primary)", color: "#F9F8F6",
            padding: "0.95rem 2.8rem", borderRadius: "2rem", border: "none",
            cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.95rem", fontWeight: 600, letterSpacing: "0.04em",
          }}>
            <EditableContent contentKey="page.cta.book" fallback="Book a Consultation" tag="span" />
          </button>
        </div>
      </div>

      <div style={{
        textAlign: "center", padding: "1.5rem",
        fontFamily: "var(--font-mono)", fontSize: "0.75rem",
        color: "#89a99e", borderTop: "1px solid var(--color-border)",
      }}>
        <EditableContent contentKey="footer.copyright" fallback={`© ${new Date().getFullYear()} Luminal Journeys · All rights reserved`} tag="span" />
      </div>
      <MockupBanner />
    </div>
  );
}
