
  import { createRoot } from "react-dom/client";
  import App from "./app/App";
  import "./styles/index.css";
  import { db } from "./services/db";

  if (typeof window !== "undefined") {
    (window as any).__THINAI_DB__ = db;
  }

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

  // Expose benchmark utilities for automated performance verification (Phase O4)
  if (typeof window !== "undefined") {
    (window as any).__THINAI_BENCHMARK__ = {
      measureModelLoad: async () => {
        const { getOrInitLiteRtModel } = await import("./services/litertInferenceService");
        const start = performance.now();
        const model = await getOrInitLiteRtModel();
        const end = performance.now();
        return {
          durationMs: Math.round(end - start),
          isLoaded: model !== null
        };
      },
      measureInference: async () => {
        const { runNeuralDiseaseInference } = await import("./services/litertInferenceService");
        const canvas = document.createElement("canvas");
        canvas.width = 224;
        canvas.height = 224;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#2d7a29";
        ctx.fillRect(0, 0, 224, 224);
        ctx.fillStyle = "#e0c034";
        ctx.fillRect(60, 60, 40, 40);
        const imgData = ctx.getImageData(0, 0, 224, 224);

        const start = performance.now();
        const res = await runNeuralDiseaseInference(imgData, "Tomato");
        const end = performance.now();
        return {
          durationMs: Math.round(end - start),
          result: res
        };
      }
    };
  }

  createRoot(document.getElementById("root")!).render(<App />);
  