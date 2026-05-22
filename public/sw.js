// Kaviro Service Worker — v5
// Nivel 1 offline: lectura completa del último viaje visitado sin conexión

const CACHE_NAME  = "kaviro-v5";
const DATA_CACHE  = "kaviro-data-v2";
const OFFLINE_URL = "/offline.html";

// ── Assets precacheados al instalar ───────────────────────────────────────────
const PRECACHE_ASSETS = [
  "/",
  "/offline.html",
  "/manifest.webmanifest",
  "/brand/icon.png",
];

// ── Rutas de datos que se cachean (network-first, fallback a caché) ────────────
// Se guardan automáticamente la última vez que se visitó con conexión.
const DATA_ROUTES = [
  "/api/trip-activities",
  "/api/trip-routes",
  "/api/trip-expenses",
  "/api/trip-participants",
  "/api/trip-participants/profiles",
  "/api/trip-payment-pair-rules",
  "/api/trip-payment-preferences",
  "/api/trip-resources",
  "/api/trip-reservations",
  "/api/trip-lists",
  "/api/trip-activity-kinds",
  "/api/weather",
];

function isDataRoute(pathname) {
  return DATA_ROUTES.some((r) => pathname.startsWith(r));
}

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

// ── Activate — limpia cachés antiguas ─────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== DATA_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo interceptar same-origin
  if (url.origin !== self.location.origin) return;

  // ── 1. Datos del viaje: network-first, fallback a caché ───────────────────
  if (request.method === "GET" && isDataRoute(url.pathname)) {
    event.respondWith(
      caches.open(DATA_CACHE).then(async (cache) => {
        try {
          const response = await fetch(request.clone());
          if (response.ok) await cache.put(request, response.clone());
          return response;
        } catch {
          const cached = await cache.match(request);
          if (cached) {
            // Añadir header para que la UI sepa que viene de caché
            const headers = new Headers(cached.headers);
            headers.set("x-kaviro-offline", "1");
            return new Response(cached.body, {
              status: cached.status,
              statusText: cached.statusText,
              headers,
            });
          }
          return new Response(JSON.stringify({ error: "Sin conexión", offline: true }), {
            status: 503,
            headers: { "Content-Type": "application/json", "x-kaviro-offline": "1" },
          });
        }
      })
    );
    return;
  }

  // ── 2. Resto de APIs: network-only (escrituras, IA, auth…) ────────────────
  if (url.pathname.startsWith("/api/")) return;

  // ── 3. Assets estáticos: cache-first ─────────────────────────────────────
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
            caches.open(CACHE_NAME).then((c) => c.put(request, response.clone()));
          }
          return response;
        });
      })
    );
    return;
  }

  // ── 4. Páginas HTML: network-first, fallback a offline.html ─────────────
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL))
      )
    );
    return;
  }
});

// ── Push notifications ────────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let data = { title: "Kaviro", body: "Tienes cambios en tu viaje", icon: "/icons/icon-192.png" };
  try { data = { ...data, ...event.data.json() }; } catch {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      vibrate: [100, 50, 100],
      data: { url: data.url || "/" },
    })
  );
});

// ── Notification click ────────────────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(url) && "focus" in c);
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    })
  );
});
