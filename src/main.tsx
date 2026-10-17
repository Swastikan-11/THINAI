
  import { createRoot } from "react-dom/client";
  import App from "./app/App";
  import "./styles/index.css";

  // Register Service Worker for offline shell and model caching in browser environments
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").then(
        (reg) => {
          console.info("THINAI ServiceWorker registered with scope:", reg.scope);
        },
        (err) => {
          console.warn("THINAI ServiceWorker registration skipped/failed:", err);
        }
      );
    });
  }

  createRoot(document.getElementById("root")!).render(<App />);
  