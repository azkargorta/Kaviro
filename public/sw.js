// Kaviro Service Worker — v1
// Estrategia: cache-first para assets estáticos, network-first para páginas

const CACHE_NAME = "kaviro-v1";
const OFFLINE_URL = "/offline.html";

// Assets que se cachean en la instalación
const PRECACHE_ASSETS = [
  "/",
  "/offline.html",
  "/manifest.webmanifest",
  "/brand/icon.png",
];

// ── Install ────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

// ── Activate ───────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch ──────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo interceptar same-origin
  if (url.origin !== self.location.origin) return;

  // API calls — siempre network, sin cache
  if (url.pathname.startsWith("/api/")) return;

  // Imágenes y assets estáticos — cache-first
  if (
    request.destination === "image" ||
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/brand/") ||
    url.pathname.startsWith("/icons/")
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Páginas HTML — network-first, fallback offline
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL))
      )
    );
    return;
  }
});
