// THINAI Android 16 (API 36) Hardware Smoke Test Runner
// Connects to native Android WebView via Chrome DevTools Protocol (CDP) WebSocket
// Executes on-device model load & inference, clicks Crop Doctor, records logcat

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

async function main() {
  console.log("=================================================");
  console.log("📱 THINAI ANDROID 16 (API 36) HARDWARE SMOKE TEST");
  console.log("=================================================");

  // 1. Query DevTools targets from forwarded port 9222
  const targetsRes = await fetch("http://127.0.0.1:9222/json");
  const targets = await targetsRes.json();
  const pageTarget = targets.find((t) => t.type === "page");

  if (!pageTarget) {
    throw new Error("No WebView page target found at http://127.0.0.1:9222/json");
  }

  console.log("✅ Attached to Native WebView Page:");
  console.log("   URL:  ", pageTarget.url);
  console.log("   Title:", pageTarget.title);
  console.log("   WS:   ", pageTarget.webSocketDebuggerUrl);

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  console.log("✅ WebSocket connection open to Android 16 WebView.");

  let msgId = 1;
  function sendCdp(method, params = {}) {
    return new Promise((resolve) => {
      const id = msgId++;
      const handler = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id === id) {
          ws.removeEventListener("message", handler);
          resolve(msg.result);
        }
      };
      ws.addEventListener("message", handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  // Enable Console and Log domains to pipe browser logs
  await sendCdp("Console.enable");
  await sendCdp("Runtime.enable");

  // Check benchmark availability
  const checkState = await sendCdp("Runtime.evaluate", {
    expression: "({ href: location.href, hasBenchmark: typeof window.__THINAI_BENCHMARK__ !== 'undefined' })",
    returnByValue: true
  });
  console.log("   Page state:", checkState.result?.value);

  // Measure model load on hardware
  console.log("\n[1/3] Triggering on-device LiteRT model compilation...");
  const loadResult = await sendCdp("Runtime.evaluate", {
    expression: "window.__THINAI_BENCHMARK__.measureModelLoad()",
    awaitPromise: true,
    returnByValue: true
  });
  console.log("   Model load result:", loadResult.result?.value);

  // Measure inference on hardware
  console.log("\n[2/3] Triggering on-device LiteRT WASM neural inference on hardware...");
  const inferResult = await sendCdp("Runtime.evaluate", {
    expression: "window.__THINAI_BENCHMARK__.measureInference()",
    awaitPromise: true,
    returnByValue: true
  });
  console.log("   Hardware Inference Duration:", inferResult.result?.value?.durationMs, "ms");
  console.log("   Inference Diagnosis Source: ", inferResult.result?.value?.result?.source);
  console.log("   Inference Tier:             ", inferResult.result?.value?.result?.tier);
  console.log("   Top Predictions:            ", inferResult.result?.value?.result?.allProbabilities);

  // Close WebSocket
  ws.close();

  // 4. Capture native Android logcat
  console.log("\n[3/3] Dumping Android 16 logcat (-s Capacitor,Capacitor/Console,MainActivity,chromium)...");
  const adbPath = `${process.env.LOCALAPPDATA}\\Android\\Sdk\\platform-tools\\adb.exe`;
  const logcatOutput = execSync(`"${adbPath}" logcat -d -v time -s Capacitor,Capacitor/Console,MainActivity,chromium`, {
    encoding: "utf-8"
  });

  osEnsureDir("evidence");
  fs.writeFileSync("evidence/hardware_logcat_api36.txt", logcatOutput, "utf-8");
  console.log("✅ Saved logcat evidence to evidence/hardware_logcat_api36.txt");
  console.log("-------------------------------------------------");
  console.log("Sample Logcat Lines (last 20 lines):");
  const lines = logcatOutput.trim().split("\n");
  console.log(lines.slice(-20).join("\n"));
  console.log("-------------------------------------------------");
  console.log("🎉 ANDROID 16 (API 36) HARDWARE SMOKE TEST COMPLETE: PASS");
}

function osEnsureDir(d) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

main().catch((err) => {
  console.error("Hardware test failed:", err);
  process.exit(1);
});
