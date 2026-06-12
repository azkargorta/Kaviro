# Auditoría de consumo Vercel — Kaviro

**Fecha:** junio 2026  
**Contexto:** aviso de Vercel al ~75% del límite gratuito de **Fluid Active CPU**.  
**Alcance:** análisis estático del repositorio (sin modificar código de producción).

---

## 1. Información general

| Aspecto | Estado en Kaviro |
|--------|-------------------|
| **Framework** | Next.js **14.2.33** (App Router) |
| **Router** | **App Router** (`app/`). No hay `pages/` legacy. |
| **Middleware** | Sí — `middleware.ts` en raíz |
| **API routes** | Sí — ~**180** handlers en `app/api/**/route.ts` |
| **Server Actions** | **No detectadas** (`"use server"` no aparece en el repo) |
| **Supabase server-side** | Sí — `@supabase/ssr`, `lib/supabase/server.ts`, middleware session refresh |
| **Stripe** | Sí — `stripe` en dependencias; rutas `app/api/billing/*`, `app/api/agencies/billing/*`, webhooks |
| **IA** | Sí — `@google/generative-ai`, módulo `lib/trip-ai/*`, rutas `app/api/trip-ai/*`, `app/api/trips/ai-*` |
| **Mapas / rutas externas** | Sí — Leaflet (cliente), OSRM (`app/api/osrm/route`), OSM POIs, geocoding |
| **Meteorología** | Sí — Open-Meteo + geocoding (`lib/trip-weather.ts`, `app/api/weather/forecast`, `app/api/trips/[id]/weather`) |
| **PDF / OCR / imágenes** | Sí — `pdf-parse`, `tesseract.js`, `@napi-rs/canvas`, `trip-recap-image`, análisis documentos/gastos |
| **Runtime** | Mayoría `export const runtime = "nodejs"` en APIs pesadas |

**Nota sobre Fluid Active CPU:** en Vercel Hobby, el cómputo serverless (SSR, middleware, route handlers, funciones con `maxDuration` elevado) suma al contador. El tráfico a rutas **dinámicas** y el **middleware global** suelen ser los mayores multiplicadores.

---

## 2. Middleware

### Ubicación

- `middleware.ts` (raíz)
- Lógica de sesión: `lib/supabase/middleware.ts` → `updateSession()`
- Rate limit: `lib/rate-limit-middleware.ts`

### Matcher actual

```ts
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons/|sw.js|offline.html|google[a-z0-9]+\\.html).*)",
  ],
};
```

### Qué hace en cada request (orden)

1. **Traveler preview** (`?asTraveler=1`, `?exitTravelerPreview=1`) en `/trip/*`
2. **Rate limiting** (Upstash o in-memory) en APIs con preset (`ai`, `ocr`, `geocode`, `auth`, `share`, `contact`)
3. **Refresh de sesión Supabase** → `supabase.auth.getUser()` en **casi todas las rutas**, salvo:
   - `POST /api/auth/login`
   - `POST /api/auth/signup`
4. **Auth extra** solo en `/ops/*`, `/agency/*` (panel) y APIs de agencia protegidas:
   - `isPlatformAdmin` + `getUser()` otra vez
   - `getAgencyForUser()` con consultas Supabase

### Rutas donde se ejecuta

| Tipo | ¿Pasa middleware? |
|------|-------------------|
| Páginas públicas (`/`, `/pricing`, landings SEO, `/help`, etc.) | **Sí** |
| `/dashboard`, `/trip/*`, `/account` | **Sí** |
| `app/api/*` | **Sí** |
| `/_next/static`, `/_next/image` | **No** (excluido) |
| `favicon.ico`, `manifest.webmanifest`, `icons/`, `sw.js`, `offline.html` | **No** |
| **`/sitemap.xml`**, **`/robots.txt`**, **`/llms.txt`** | **Sí** (no están excluidos) |
| Imágenes estáticas en `/public` (p. ej. `/brand/*`) | **Sí** (no excluidas por matcher) |

### Riesgo

**Alto.** Cada visita a marketing, SEO, sitemap, robots, assets en `/public` y crawlers dispara `getUser()` contra Supabase aunque la página sea estática. Esto es probablemente una de las mayores fuentes de CPU evitable.

### Matcher optimizado (recomendación documentada, no aplicada)

Excluir explícitamente rutas sin necesidad de sesión:

```ts
matcher: [
  "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons/|sw.js|offline.html|google[a-z0-9]+\\.html|sitemap.xml|robots.txt|llms.txt|brand/|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?)$).*)",
],
```

Además, valorar **no** llamar `updateSession()` en rutas públicas de solo lectura (matcher negativo o early-return en middleware).

---

## 3. Rutas públicas

Leyenda de riesgo: **Bajo** = poco CPU server; **Medio** = SSR + auth check; **Alto** = muchas I/O o APIs externas en SSR.

| Ruta | Archivo | `cookies()` | `headers()` | `fetch` sin cache (SSR) | Supabase SSR | ¿Puede ser estática? | Riesgo |
|------|---------|-------------|-------------|-------------------------|--------------|----------------------|--------|
| `/` | `app/page.tsx` | No* | No | No en página | **Sí** (`getUser` + redirect si logueado) | Parcial (guest estático; user redirect) | **Medio** |
| `/pricing` | `app/pricing/page.tsx` | No | No | No | **Sí** (`getUser` para CTA premium) | Casi (CTA condicional) | **Medio** |
| `/help` | `app/help/page.tsx` | No | No | No | No | **Sí** | **Bajo**† |
| `/empresa` | `app/empresa/page.tsx` | No | No | No | **Sí** (`getUser` + `getAgencyForUser`) | No (personaliza UI) | **Medio** |
| `/organizador-viajes` | `app/organizador-viajes/page.tsx` | No | No | No | No | **Sí** | **Bajo**† |
| `/control-gastos-viaje` | `app/control-gastos-viaje/page.tsx` | No | No | No | No | **Sí** | **Bajo**† |
| `/itinerario-viaje` | `app/itinerario-viaje/page.tsx` | No | No | No | No | **Sí** | **Bajo**† |
| `/planificador-viajes-ia` | `app/planificador-viajes-ia/page.tsx` | No | No | No | No | **Sí** | **Bajo**† |
| `/que-es-kaviro` | `app/que-es-kaviro/page.tsx` | No | No | No | No | **Sí** | **Bajo**† |
| `/kaviro-info` | `app/kaviro-info/page.tsx` | No | No | No | No | **Sí** | **Bajo**† |
| `/privacy` | `app/privacy/page.tsx` | No | No | No | No | **Sí** | **Bajo**† |
| `/terms` | `app/terms/page.tsx` | No | No | No | No | **Sí** | **Bajo**† |

\* El middleware lee cookies de sesión aunque la página no use `cookies()`.  
† Riesgo **medio efectivo** por middleware +, en páginas con `PublicMarketingHeader`, fetch cliente a `/api/auth/me`.

### Detalle por patrones

**Landings SEO** (`SeoLandingPage` + datos en `lib/seo-landing-pages.ts`): componentes estáticos, sin Supabase en el Server Component. El coste real viene del **middleware** y del header de marketing.

**Home `/`:** siempre ejecuta `createClient()` + `getUser()`. Usuarios autenticados redirigen a `/dashboard` (SSR dinámico garantizado).

**`/pricing`:** SSR dinámico por `getUser()`; además `PricingViewTracker` (analytics cliente).

**Cliente en páginas públicas:** `PublicMarketingHeader` llama `fetch("/api/auth/me", { cache: "no-store" })` en cada montaje → **1 API + auth** por página pública visitada.

---

## 4. Rutas privadas

### `/dashboard`

| Aspecto | Detalle |
|---------|---------|
| **Archivo** | `app/dashboard/page.tsx` |
| **Render** | SSR dinámico (sin `force-static`) |
| **Supabase** | Múltiples consultas: profile, participations, trips, invites, announcements, demo trip, expense groups |
| **Consultas** | ~5–15+ según viajes del usuario; posible `ensureDemoTripForUser` (escritura) |
| **Polling** | Cliente: invitaciones (`/api/trip-member-invites`), header meta (`/api/dashboard/header-meta`), agencia (`/api/agencies/me`) |
| **Optimización** | Cachear listado de viajes; evitar demo provisioning en cada visita; reducir fan-out de consultas |

**Riesgo consumo:** **Alto** (página pesada + APIs cliente al cargar).

### `/trip/*`

| Aspecto | Detalle |
|---------|---------|
| **Layout** | `app/trip/[id]/layout.tsx` — SSR en **todas** las subrutas |
| **Supabase layout** | `getCachedTripAccess`, trip meta, participants, premium, workspace (~5 queries paralelas) |
| **Cookies** | `cookies()` para traveler preview |
| **Páginas pesadas** | Ver tabla inferior |

| Subruta | Archivo principal | Consultas / I/O destacadas | Polling / refetch |
|---------|-------------------|----------------------------|-------------------|
| `/trip/[id]/summary` | `app/trip/[id]/summary/page.tsx` | **`force-dynamic`**; 10+ counts/queries; **Open-Meteo** vía `getTripWeatherBundle` | Onboarding counts API (cliente) |
| `/trip/[id]/plan` | `app/trip/[id]/plan/page.tsx` | Actividades, settings, permisos | Hooks de actividades; refresh eventos |
| `/trip/[id]/today` | `app/trip/[id]/today/page.tsx` | Actividades del día | Clima cliente `/api/weather`; reloj 60s (local) |
| `/trip/[id]/expenses` | `TripExpensesView` (cliente) | Carga vía hooks/API | Barra sticky; balances |
| `/trip/[id]/map` | `TripMapView` | Rutas OSRM, geocode, places | `fetch` rutas `no-store` |
| `/trip/[id]/resources` | `TripResourcesView` | Resources hook | — |
| `/trip/[id]/ai-chat` | `TripAiChatView` | Chat streaming API | — |

**Riesgo consumo:** **Alto** en summary (SSR + clima), map (APIs geoespaciales), ai-chat (IA).

### `/account`

| Aspecto | Detalle |
|---------|---------|
| **Archivo** | `app/account/page.tsx` |
| **Supabase** | `getUser`, profile (admin client), billing subscription, AI budget |
| **Polling** | Push preferences, settings forms → APIs puntuales |
| **Riesgo** | **Medio** |

### `/admin` y `/dashboard/admin`

| Ruta | Archivo | Detalle |
|------|---------|---------|
| `/dashboard/admin` | `app/dashboard/admin/page.tsx` | `getUser` + `isPlatformAdmin`; panel cliente |
| `/ops/*` | `app/ops/**` | Middleware doble auth; APIs ops con `cache: "no-store"` |

**Riesgo:** **Medio** (bajo tráfico relativo, pero consultas admin).

---

## 5. API routes

**Total inventariado:** ~180 archivos `route.ts` bajo `app/api/`.

### Resumen por categoría

| Categoría | Ejemplos | IA | Supabase | Stripe | Externas | Cache | Riesgo típico |
|-----------|----------|----|---------:|--------|----------|-------|---------------|
| **IA / planificación** | `trip-ai/chat`, `trip-ai/organize-day`, `trips/ai-planner/generate`, `document/analyze`, `expense/analyze` | **Sí** | Sí | No | Gemini/OpenAI vía providers | No | **Alto** (`maxDuration` 60–300s en chat) |
| **Geocoding / mapas** | `geocode`, `geocode/suggest-places`, `osrm/route`, `osm/restaurants`, `places/search` | A veces | Sí | No | OSRM, OSM, Nominatim-like | `no-store` | **Medio–Alto** |
| **Meteorología** | `weather/forecast`, `trips/[id]/weather` | No | Sí | No | Open-Meteo | `no-store` en lib | **Medio** |
| **Billing** | `billing/checkout`, `billing/webhook`, `billing/portal`, `agencies/billing/*` | No | Sí | **Sí** | Stripe API | No | **Medio** (picos en checkout) |
| **CRUD viaje** | `trip-activities`, `trip-expenses`, `trip-routes`, `trip-resources`, … | No | Sí | No | No | Raro | **Medio** (volumen de uso) |
| **Auth** | `auth/login`, `auth/signup`, `auth/me`, `auth/logout` | No | Sí | No | No | No | **Medio** (`/auth/me` muy frecuente) |
| **Agencia / ops** | `agencies/*`, `ops/*` | Parcial | Sí | Parcial | Email/export | No | **Medio** |
| **Público token** | `trip-shares/[token]`, `pay/[token]`, `quote/[token]`, `sign/[token]` | No | Sí | Parcial | No | No | **Medio** |
| **Utilidades** | `currency/convert` (revalidate 3600), `currency/latest`, `onboarding/demo` | No | Sí | No | APIs FX | Parcial | **Bajo–Medio** |
| **Analytics** | `analytics/pageview` | No | Sí (insert) | No | No | No | **Medio** (por sesión activa) |
| **PDF / imagen** | `trip-recap-image`, `trips/[id]/expenses/balance-report`, `extract-text` | No | Sí | No | Canvas/PDF libs | No | **Alto** (CPU + memoria) |
| **Push** | `push/subscribe`, `push/notify`, `push/send` | No | Sí | No | Web Push | No | **Medio** |

### Rutas de mayor riesgo (detalle)

| Ruta | Archivo | Qué hace | Riesgo |
|------|---------|----------|--------|
| `POST /api/trip-ai/chat` | `app/api/trip-ai/chat/route.ts` | Chat IA viaje, contexto completo, `maxDuration = 300` | **Alto** |
| `POST /api/trip-ai/organize-day` | `app/api/trip-ai/organize-day/route.ts` | IA + búsquedas externas | **Alto** |
| `POST /api/trips/ai-planner/generate` | `app/api/trips/ai-planner/generate/route.ts` | Generación itinerario | **Alto** |
| `POST /api/document/analyze` | `app/api/document/analyze/route.ts` | OCR/PDF + IA | **Alto** |
| `POST /api/expense/analyze` | `app/api/expense/analyze/route.ts` | OCR ticket + IA | **Alto** |
| `GET /api/osrm/route` | `app/api/osrm/route/route.ts` | Proxy OSRM | **Medio–Alto** |
| `GET /api/trips/[id]/weather` | `app/api/trips/[id]/weather/route.ts` | Proxy Open-Meteo | **Medio** |
| `GET /api/auth/me` | `app/api/auth/me/route.ts` | Estado sesión (header público) | **Medio** (alto volumen) |
| `POST /api/analytics/pageview` | `app/api/analytics/pageview/route.ts` | Insert visitas | **Medio** |
| `GET /api/trip-shares/[token]` | `app/api/trip-shares/[token]/route.ts` | Share público | **Medio** |

### Inventario completo (por prefijo)

<details>
<summary>Ver listado de rutas API (~180)</summary>

Prefijos principales: `account/`, `admin/`, `agencies/`, `ai-budget/`, `analytics/`, `auth/`, `billing/`, `client/`, `contact/`, `currency/`, `dashboard/`, `document/`, `expense/`, `geocode/`, `legacy-routes/`, `notifications/`, `nps/`, `onboarding/`, `ops/`, `osm/`, `osrm/`, `pay/`, `places/`, `pretravel/`, `profile/`, `push/`, `quote/`, `referral/`, `sign/`, `trip-*` (múltiples), `trips/`, `weather/`.

</details>

---

## 6. Funciones pesadas

| Fuente | Ubicación | Descripción | Frecuencia potencial |
|--------|-----------|-------------|----------------------|
| **IA (Gemini)** | `lib/trip-ai/providers`, APIs `trip-ai/*`, `trips/ai-*` | Prompts largos, JSON, hasta 300s | Por acción usuario Premium |
| **OCR / PDF** | `document/analyze`, `expense/analyze`, `trip-resources/.../extract-text` | `pdf-parse`, `tesseract.js` | Por subida |
| **Generación imagen recap** | `app/api/trip-recap-image/route.ts` | `@napi-rs/canvas` | Compartir recap |
| **Balance report PDF** | `trips/[id]/expenses/balance-report` | Generación informe | Baja |
| **OSRM / rutas** | `app/api/osrm/route`, `TripMapView` | Cálculo rutas | Cada edición mapa |
| **Open-Meteo** | `lib/trip-weather.ts`, summary SSR, APIs weather | 2 fetches por destino (`no-store`) | Cada visita resumen + mapa |
| **Geocoding** | `geocode`, `suggest-places`, `places/search` | Autocompletado | Cada búsqueda lugar |
| **Import itinerario IA** | `trip-ai/import-document`, `import-itinerary` | PDF + parsing + IA | Importaciones |
| **Bulk actividades** | `trip-activities/bulk` | Procesamiento lote | Import masivo |
| **Loops grandes** | Importadores IA, organize-day | Procesamiento multi-día | Picos puntuales |

### Endpoints llamados con alta frecuencia (no necesariamente pesados cada uno)

- `/api/auth/me` — header marketing y barras
- `/api/dashboard/header-meta` — dashboard
- `/api/notifications` — polling **30s** (`UserNotificationsButton`)
- `/api/trip-member-invites` — dashboard
- `/api/trips/[id]/onboarding-counts` — resumen viaje
- `/api/trip-routes?tripId=` — mapa
- `/api/trip-expenses?tripId=` — plan footer

---

## 7. Caché y dinamismo

### `export const dynamic`

| Archivo | Valor |
|---------|-------|
| `app/trip/[id]/summary/page.tsx` | `force-dynamic` |
| `app/llms.txt/route.ts` | `force-dynamic` |
| `app/api/referral/status/route.ts` | `force-dynamic` |

### `export const revalidate`

- Casi **no usado** en páginas.
- Excepción: `app/api/currency/convert/route.ts` → `revalidate: 3600` en fetch.

### Patrones `fetch` sin cache

| Ámbito | Uso |
|--------|-----|
| **SSR clima** | `lib/trip-weather.ts` → `cache: "no-store"` a Open-Meteo |
| **Cliente** | Amplio uso de `cache: "no-store"` en hooks y componentes (mapa, gastos, agencia, ops, notificaciones) |
| **Share pages** | `app/share/[token]/page.tsx` fetch interno a API sin cache |

### Efecto

- Cualquier página que use `cookies()` / `createClient()` de `@supabase/ssr` → **dinámica** en build.
- `force-dynamic` en summary fuerza SSR en cada request.
- `llms.txt` con `force-dynamic` es **innecesario** (contenido estático en constante).

### Headers Cache-Control

- No hay estrategia global documentada en páginas.
- Rate limit middleware añade `X-RateLimit-*` en APIs limitadas.

---

## 8. Sitemap, robots y llms.txt

| Recurso | Implementación | Lógica pesada | Middleware | Riesgo |
|---------|----------------|---------------|------------|--------|
| `/sitemap.xml` | `app/sitemap.ts` | Solo array estático + `new Date()` | **Sí** pasa middleware | **Medio** (innecesario) |
| `/robots.txt` | `app/robots.ts` | Objeto estático | **Sí** | **Medio** |
| `/llms.txt` | `app/llms.txt/route.ts` | String constante | **Sí** + **`force-dynamic`** | **Medio–Alto** (dinámico sin motivo) |

**Recomendación:** servir los tres sin middleware y sin `force-dynamic` en `llms.txt`.

---

## 9. Recomendaciones priorizadas

| Prioridad | Problema | Archivo / ruta | Impacto estimado | Dificultad | Solución propuesta |
|:---------:|----------|----------------|------------------|:----------:|-------------------|
| **P0** | Middleware ejecuta `getUser()` en casi todo el tráfico | `middleware.ts`, `lib/supabase/middleware.ts` | **Muy alto** | Media | Excluir sitemap, robots, llms, assets estáticos; saltar session refresh en rutas públicas |
| **P0** | Resumen de viaje SSR pesado + clima externo | `app/trip/[id]/summary/page.tsx`, `lib/trip-weather.ts` | **Alto** | Media | Mover clima a cliente o API con cache TTL; reducir queries SSR; quitar `force-dynamic` si es posible |
| **P1** | `llms.txt` marcado `force-dynamic` | `app/llms.txt/route.ts` | Medio | Baja | Contenido estático; eliminar `force-dynamic` o mover a `public/llms.txt` |
| **P1** | Home y pricing siempre dinámicos por `getUser()` | `app/page.tsx`, `app/pricing/page.tsx` | Medio–Alto | Media | Middleware-only redirect para usuarios logueados; páginas estáticas para guests |
| **P1** | `/api/auth/me` en cada página pública | `PublicMarketingHeader.tsx` | Medio | Baja | Usar señal de middleware/cookie o estático + hidratar solo si hace falta |
| **P2** | Layout `/trip/[id]` consulta Supabase en todas las tabs | `app/trip/[id]/layout.tsx` | Alto (volumen) | Media–Alta | Cache React `cache()` ya en access; reducir selects; parallelizar menos en layout |
| **P2** | Dashboard con muchas consultas y demo provisioning | `app/dashboard/page.tsx` | Alto | Media | Lazy demo; consolidar queries; edge cache parcial |
| **P2** | APIs IA con `maxDuration` 300s | `trip-ai/chat/route.ts` | Alto (picos) | Baja (coste) | Presupuesto IA ya existe; monitorizar; colas para hobby |
| **P3** | Open-Meteo `no-store` sin TTL | `lib/trip-weather.ts` | Medio | Baja | `revalidate: 3600` o cache KV |
| **P3** | Polling notificaciones 30s | `UserNotificationsButton.tsx` | Medio | Baja | Aumentar intervalo; SSE o push only |
| **P3** | Mapa refetch rutas agresivo | `TripMapView.tsx` | Medio | Media | Debounce + SWR con staleTime |

---

## 10. Resumen ejecutivo

### 5 causas más probables del consumo de Fluid Active CPU

1. **Middleware global** con `supabase.auth.getUser()` en rutas públicas, SEO, sitemap, robots, assets y APIs de bajo valor.
2. **SSR denso en `/trip/[id]/summary`** (`force-dynamic`) con muchas consultas Supabase + **fetch Open-Meteo** en servidor.
3. **Layout y páginas de viaje** que repiten acceso Supabase en cada navegación entre pestañas.
4. **APIs de IA, OCR y PDF** con runtime Node y duraciones largas (picos de CPU cuando se usan).
5. **Patrón `cache: "no-store"`** extendido en cliente y servidor, impidiendo reutilización y amplificando invocaciones.

### 5 acciones recomendadas para reducirlo

1. **Optimizar matcher y lógica del middleware** (excluir estáticos/SEO; no refrescar sesión en marketing).
2. **Aligerar `/trip/[id]/summary`**: menos queries en SSR; clima en cliente con cache; revisar necesidad de `force-dynamic`.
3. **Hacer estáticas las landings SEO, help, privacy, terms** y evitar `getUser()` en servidor para guests.
4. **Reducir llamadas periféricas**: `/api/auth/me`, polling de notificaciones, onboarding-counts en cada vista.
5. **Cachear respuestas externas** (clima, geocode, OSRM) con TTL razonable en route handlers.

### Qué cambiar primero

1. `middleware.ts` — impacto inmediato en **todo** el tráfico.  
2. `app/llms.txt/route.ts` — quick win (quitar `force-dynamic`).  
3. `app/trip/[id]/summary/page.tsx` + `lib/trip-weather.ts` — mayor página privada con uso en viaje activo.  
4. `PublicMarketingHeader.tsx` — reducir APIs en funnels públicos.  
5. Revisar métricas Vercel (Functions, Middleware, ISR) tras desplegar 1–3 para validar hipótesis.

---

## Anexo: comandos útiles para seguimiento

- Vercel Dashboard → Project → **Usage** → Fluid Active CPU / Middleware / Serverless Function Execution.
- Filtrar por ruta en logs: `/trip/`, `/api/trip-ai/`, `/api/auth/me`, `middleware`.
- Correlacionar picos con despliegues y campañas SEO (crawlers + middleware).

---

*Documento generado por auditoría estática del repositorio Kaviro. No incluye secretos ni variables de entorno.*
