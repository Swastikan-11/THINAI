// THINAI Offline Service Worker (v1.0.0)
// Precaches application shell, TFLite vision models, and WebAssembly LiteRT binaries.
// Enables seamless offline cold-start and safe version invalidation.

const CACHE_NAME = "thinai-shell-v1";
const OFFLINE_URL = "/index.html";

const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/models/labels.json",
  "/models/thresholds.json",
  "/models/thinai_disease_model.tflite",
  "/litert/litert_wasm_internal.js",
  "/litert/litert_wasm_internal.wasm",
  "/litert/litert_wasm_compat_internal.js",
  "/litert/litert_wasm_compat_internal.wasm"
];

// 1. Install & Precache
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn("Service worker precache partial warning:", err);
      });
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate & Invalidate Stale Caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.info("Removing stale cache:", name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Strategy: Cache-first for models & WASM, Network-first with cache fallback for navigation
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests and external cloud APIs (Firebase Auth/Firestore, Open-Meteo, data.gov.in)
  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  // A. Static Models and LiteRT WASM: Cache-first with background update
  if (url.pathname.startsWith("/models/") || url.pathname.startsWith("/litert/")) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // B. HTML Navigations: Network-first falling back to precached index.html
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(OFFLINE_URL);
      })
    );
    return;
  }

  // C. Assets (JS, CSS): Cache-first with stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
        }
        return networkResponse;
      }).catch(() => null);

      return cached || fetchPromise;
    })
  );
});
