import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

/* Self-hosted so the type still works in the dead zones at Wolf Creek. */
import "@fontsource-variable/fraunces/opsz.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/600.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
