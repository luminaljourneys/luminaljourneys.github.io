import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { EditModeProvider } from "./context/EditModeContext.jsx";
import "./index.css";

const params = new URLSearchParams(window.location.search);
const r = params.get("r");
if (r && r !== "/") {
  window.history.replaceState(null, "", r);
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <EditModeProvider>
      <App />
    </EditModeProvider>
  </StrictMode>
);