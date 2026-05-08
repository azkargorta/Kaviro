/* Offline lite service worker (Kaviro/TripBoard)
 * - Cache static assets (icons/images/css/js)
 * - Cache navigations under /trip/* (network-first, fallback to cache)
 * - Never cache /api/*
 */

const CACHE_NAME = "tripboard-offline-lite-v1";

const PRECACHE_URLS = [
  "/",
  "/manifest.webmanifest",
  "/brand/icon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(PRECACHE_URLS);
      self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
      self.clients.claim();
    })()
  );
});

function isCacheableAsset(request) {
  const dest = request.destination;
  return dest === "style" || dest === "script" || dest === "image" || dest === "font";
}

function isTripNavigation(url) {
  return url.origin === self.location.origin && url.pathname.startsWith("/trip/");
}

function isApi(url) {
  return url.origin === self.location.origin && url.pathname.startsWith("/api/");
}

function offlineHtml() {
  return new Response(
    `<!doctype html>
<html lang="es">
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Sin conexión · Kaviro</title>
<style>
  body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Inter,sans-serif;margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#080C14;color:#F1F5F9}
  .card{max-width:520px;padding:20px 18px;border:1px solid rgba(248,113,113,0.30);border-radius:18px;background:#0F1623}
  h1{font-size:18px;margin:0 0 8px}
  p{margin:0 0 14px;color:#94A3B8;font-size:14px;line-height:1.5}
  a{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 14px;border-radius:999px;background:#F87171;color:#fff;text-decoration:none;font-weight:800;font-size:13px}
  a:hover{background:#EF4444}
  .hint{margin-top:10px;font-size:12px;color:#64748B}
  code{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace}
<\/style>
<body>
  <div class="card">
    <h1>Estás sin conexión</h1>
    <p>Si ya abriste este viaje antes, Kaviro intentará mostrar la última versión disponible. Cuando vuelva internet, se actualizará.</p>
    <a href="/">Ir al inicio</a>
    <div class="hint">Consejo: vuelve a entrar por <code>/trip/…</code> si lo tenías abierto.</div>
  </div>
<\/body>
<\/html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (isApi(url)) return; // never cache API

  // 1) Cache-first for static assets
  if (isCacheableAsset(request)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const resp = await fetch(request);
          if (resp && resp.ok) cache.put(request, resp.clone());
          return resp;
        } catch {
          return cached || new Response("", { status: 503 });
        }
      })()
    );
    return;
  }

  // 2) Network-first for trip navigations, fallback to cache/offline page
  if (request.mode === "navigate" && isTripNavigation(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        try {
          const resp = await fetch(request);
          if (resp && resp.ok) cache.put(request, resp.clone());
          return resp;
        } catch {
          const cached = await cache.match(request);
          return cached || offlineHtml();
        }
      })()
    );
    return;
  }
});

