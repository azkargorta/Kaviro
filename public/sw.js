// Kaviro Service Worker — v7
// Lectura offline del viaje: APIs + páginas/RSC de pestañas visitadas o precargadas

const CACHE_NAME = "kaviro-v6";
const DATA_CACHE = "kaviro-data-v3";
const PAGE_CACHE = "kaviro-pages-v1";
const OFFLINE_URL = "/offline.html";

const PRECACHE_ASSETS = [
  "/",
  "/offline.html",
  "/manifest.webmanifest",
  "/brand/icon.png",
];

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
  "/api/trip-access",
  "/api/weather",
];

const TRIP_TAB_SEGMENTS =
  "summary|plan|expenses|map|participants|resources|settings|ai-chat";

function isDataRoute(pathname) {
  return DATA_ROUTES.some((r) => pathname.startsWith(r));
}

/** Rutas de pestañas del viaje (navegación Next / RSC). */
function isTripAppRoute(pathname) {
  return new RegExp(`^/trip/[^/]+/(?:${TRIP_TAB_SEGMENTS})/?$`).test(pathname);
}

function pageCacheKey(url) {
  return url.origin + url.pathname;
}

function isNextDataRequest(request) {
  return (
    request.headers.get("RSC") === "1" ||
    request.headers.get("Next-Router-Prefetch") === "1" ||
    request.headers.get("Next-Url") != null
  );
}

async function putPage(cache, request, response) {
  if (!response.ok) return;
  const key = pageCacheKey(new URL(request.url));
  await cache.put(key, response.clone());
}

async function matchPage(cache, request) {
  const key = pageCacheKey(new URL(request.url));
  return cache.match(key);
}

async function networkFirstPage(request) {
  const cache = await caches.open(PAGE_CACHE);
  try {
    const response = await fetch(request);
    await putPage(cache, request, response);
    return response;
  } catch {
    const cached = await matchPage(cache, request);
    if (cached) return cached;
    if (request.mode === "navigate") {
      const offline = await caches.match(OFFLINE_URL);
      if (offline) return offline;
    }
    return new Response("Sin conexión", { status: 503, statusText: "Offline" });
  }
}

async function networkFirstData(request) {
  const cache = await caches.open(DATA_CACHE);
  try {
    const response = await fetch(request.clone());
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) {
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
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== DATA_CACHE && k !== PAGE_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  if (request.method === "GET" && isDataRoute(url.pathname)) {
    event.respondWith(networkFirstData(request));
    return;
  }

  if (url.pathname.startsWith("/api/")) return;

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

  // Páginas del viaje: HTML, RSC y prefetch de Next.js
  if (
    request.method === "GET" &&
    (request.mode === "navigate" || isNextDataRequest(request) || isTripAppRoute(url.pathname))
  ) {
    if (isTripAppRoute(url.pathname) || (request.mode === "navigate" && url.pathname.startsWith("/trip/"))) {
      event.respondWith(networkFirstPage(request));
      return;
    }
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          if (response.ok) {
            const cache = await caches.open(PAGE_CACHE);
            await putPage(cache, request, response);
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(PAGE_CACHE);
          const cached = await matchPage(cache, request);
          return cached || (await caches.match(OFFLINE_URL));
        })
    );
  }
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let data = { title: "Kaviro", body: "Tienes cambios en tu viaje", icon: "/icons/icon-192.png" };
  try {
    data = { ...data, ...event.data.json() };
  } catch {}

  const url = data.url || data.data?.url || "/";
  const tag = data.tag || data.data?.tag || url;

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag,
      renotify: false,
      vibrate: [100, 50, 100],
      data: { url, tag },
    })
  );
});

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
