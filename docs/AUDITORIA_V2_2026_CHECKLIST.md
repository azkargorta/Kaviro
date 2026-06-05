# Auditoría técnica v2 — Kaviro (Junio 2026)

Fuente: `docs/analisis/Kaviro_Auditoria_v2_2026.docx`  
Valoración documento: **8,2 / 10**

**Aplazado por decisión de producto:** precio público Kaviro Trips, métricas funnel checkout y refinamiento de Agency Pro pricing.

## Estado rápido (código vs documento)

| Hallazgo auditoría v2 | Estado real en repo |
|----------------------|---------------------|
| CSP en `next.config.mjs` | ✅ `lib/security-headers.mjs` |
| Lazy loading Leaflet | ✅ `TripMapViewDynamic`, drawers |
| RSVP / reacciones en plan | ✅ `PlanActivityRow` + `ActivityReactions` |
| `logger.ts`, 0 `console.log` prod | ✅ |
| Panel `/ops/migrations` | ✅ |
| Límites upload API | ✅ `lib/upload-limits.ts` |
| Chat grupo UI | ✅ `TripGroupChat` — depende SQL `trip_messages` |
| Notificaciones campana | ✅ `UserNotificationsButton` — depende SQL |
| Presupuesto en resumen | ✅ widget en `TripOverviewClient` + `getBudgetProgress` |
| `console.*` en `app/api` | ✅ migrado a `lib/logger.ts` (17 rutas) |
| Tests API críticos | ✅ login, signup, contact/agency, trip-invites + gastos/rutas/docs |
| Rate limit auth + Upstash opcional | ✅ preset `auth`; Redis REST si hay env |
| Tipos Stripe billing | ✅ webhook `Stripe.Event` / `Checkout.Session`; portal sin `any` |
| Tests notificaciones + webhook | ✅ + `trip-shares`, `auth.signup` |
| Utilidades tipadas geo/OSM | ✅ `lib/geo/lat-lng`, `lib/osm/overpass-types`, `ApiHttpError` |

## Crítico — SQL en Supabase

Comprobar en [/ops/migrations](/ops/migrations). Ejecutar lo que salga en rojo:

**B2C**

- `kaviro_trip_messages.sql` — chat grupal
- `kaviro_user_notifications.sql` — campana
- `kaviro_user_trip_feed_reads.sql`
- `tripboard_activity_reactions.sql`
- `kaviro_trips_budget_target.sql` — presupuesto objetivo
- `kaviro_social_features.sql` — travel mates (UI parcial)

**B2B (sin pricing)**

- `kaviro_agency_logos_storage.sql` — logos
- `kaviro_agency_template_includes.sql` — plantillas (opcional)
- `kaviro_agency_announcements_participants.sql` — avisos viajeros (opcional)
- `kaviro_agency_branding_trip_read.sql` — branding RLS (opcional)

**Aplazado**

- `kaviro_agency_custom_pricing.sql` — solo si activáis cobro Stripe por agencia
- Página precios públicos `/empresa`
- Métricas conversión funnel B2B

## Alta prioridad — código pendiente

| Tarea | Prioridad | Notas |
|-------|-----------|-------|
| Travel mates UI | Alta | SQL `kaviro_social_features.sql` |
| Tests API (ampliar) | Media | 6 suites en `app/api/__tests__` (auth, leads, invites, gastos…) |
| Reducir `any` en APIs críticas | Media | geo/OSM/shares/analytics; quedan rutas IA grandes |
| Rate limit Redis/Upstash | ✅ opcional | `UPSTASH_REDIS_REST_URL` + `TOKEN` en Vercel |
| Refactor `TripAiChatView` / `TripMapView` | Baja | >2.700 líneas |

## Verificación manual post-SQL

1. `/trip/[id]/messages` — chat en tiempo real
2. Campana dashboard — notificación de prueba
3. Plan del viaje — RSVP en filas de actividad
4. Resumen del viaje — barra de presupuesto (si hay `budget_target`)
5. `/agency/branding` — subida de logo (bucket `agency-logos`)

## Ops

- `/ops` — integraciones Vercel (Stripe, Resend, admin emails)
- `/ops/migrations` — estado BD
- `docs/SQL_PRODUCCION_VERIFICACION.sql` — informe SQL puro
