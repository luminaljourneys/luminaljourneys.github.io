/**
 * App.jsx — Luminal Journeys
 * Layout: Movement (Layout 5)
 * Theme: Luminal / Theme A
 * Locked: March 25, 2026
 */

import { useState, useEffect } from "react";
import LandingPage from "./pages/LandingPage";
import IntakePage from "./pages/IntakePage";
import AdminPage from "./pages/AdminPage";
import BrandKitPage from "./brand/BrandKitPage";
import DynamicPage from "./pages/DynamicPage.jsx";
import StagingBanner from "./components/StagingBanner.jsx";
import EditModeToggle from "./components/EditModeToggle.jsx";
import { IS_STAGING } from "./lib/collections.js";

// ─── Navigation ───────────────────────────────────────────────────────────────
export function navigate(to) {
  window.history.pushState({}, "", to);
  window.dispatchEvent(new Event("routechange"));
}

// ─── Router ───────────────────────────────────────────────────────────────────
function useRoute() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const handler = () => setPath(window.location.pathname);
    window.addEventListener("popstate", handler);
    window.addEventListener("routechange", handler);
    return () => {
      window.removeEventListener("popstate", handler);
      window.removeEventListener("routechange", handler);
    };
  }, []);

  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return path.replace(base, "").replace(/\/$/, "").toLowerCase() || "/";
}

// admin.luminaljourneys.com always serves the admin panel — no /admin path needed.
const IS_ADMIN_DOMAIN = window.location.hostname === 'admin.luminaljourneys.com';

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const route = useRoute();

  // Lock to Theme A — set once on mount, no switcher needed
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "A");
  }, []);

  // admin.luminaljourneys.com root → AdminPage directly, no /admin path needed.
  // /admin on admin domain also works but clean URL is just admin.luminaljourneys.com
  if (IS_ADMIN_DOMAIN && (route === "/" || route === "/admin")) {
    return <AdminPage />;
  }

  if (route === "/intake") return (
    <>
      <StagingBanner />
      <IntakePage />
      <EditModeToggle />
    </>
  );

  if (route === "/admin") {
    // On production (luminaljourneys.com): redirect to the admin domain.
    // luminaljourneys.com/admin → admin.luminaljourneys.com
    if (!IS_STAGING) {
      window.location.replace("https://admin.luminaljourneys.com");
      return null;
    }
    return <AdminPage />;
  }

  if (route === "/brand") return <BrandKitPage />;

  // Dynamic pages — any /slug that doesn't match a code route
  if (route !== "/" && route.startsWith("/") && !route.includes(".")) {
    const pageId = route.slice(1); // strip leading "/"
    return (
      <>
        <StagingBanner />
        <DynamicPage pageId={pageId} />
        <EditModeToggle />
      </>
    );
  }

  return (
    <>
      <StagingBanner />
      <LandingPage />
      <EditModeToggle />
    </>
  );
}