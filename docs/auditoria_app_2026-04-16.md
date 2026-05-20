# Auditoría TripBoard / Kaviro (2026-04-16)

Este documento guarda la auditoría del producto y sirve como checklist de mejora continua.

## Artefactos de referencia

- Canvas (visual): `c:\Users\azkargorta.unai\.cursor\projects\c-Users-azkargorta-unai-TripBoard\canvases\tripboard-auditoria.canvas.tsx`

## Veredicto (resumen)

La app está por encima de un MVP: cubre el ciclo completo de un viaje en grupo (plan, mapa/rutas, gastos, documentos, participantes, compartir) con una base técnica potente (Next.js + Supabase + Stripe + IA/OCR + mapas abiertos).

Lo que más limita el crecimiento ahora mismo no es “más features”, sino:

- **Coherencia**: reglas y mensajes de free/premium dispersos o contradictorios.
- **Madurez operativa**: CI, lint/typecheck, tests de integración/E2E y observabilidad.
- **Permisos**: existen permisos finos por módulo (`can_manage_*`), pero no se aplican de forma homogénea en APIs y UI.

## Puntos fuertes (pros)

- **Propuesta de valor completa**: organizar un viaje de principio a fin dentro de la misma app.
- **Uso grupal bien resuelto**: participantes, roles, invitaciones, balances; premium “por viaje” puede reducir fricción.
- **Módulos diferenciales**:
  - `Mapa + rutas`: herramientas útiles (previsualización, foco, ordenación, filtros).
  - `Gastos`: splits, balances, export, historial; alto potencial de retención.
- **Integraciones bien elegidas**: Supabase y Stripe para acelerar, mapas abiertos para reducir coste, IA/OCR como “upgrade”.

## Debilidades (contras)

- **Free/premium inconsistente**: copy, navegación y algunos endpoints no cuentan una historia única.
- **Conversión “antes del login”**: falta landing/pricing pública potente (funnel empieza demasiado pronto en login).
- **Permisos finos a medio implementar**: endpoints que solo miran `role` (viewer/editor/owner) sin `can_manage_*`.
- **Calidad/Proceso**: falta CI visible, scripts estándar de lint/typecheck, más pruebas de integración/E2E, README canónico.
- **Branding/naming**: convivencia TripBoard/Kaviro puede generar incoherencia en UI/comunicación.

## Qué falta para subir de nivel

- **Unificar paywall y mensajes**: una sola fuente de verdad para “qué incluye gratis” vs “qué desbloquea premium”.
- **Landing/pricing pública**: explicar valor, beneficios y comparativa, sin forzar login.
- **Onboarding guiado persistente**: checklist por viaje con progreso (crear viaje → invitar → plan → mapa → gastos).
- **Centro de ayuda/feedback**: FAQ, soporte, reporte de errores; especialmente para IA/OCR.
- **Observabilidad + rate limiting**: en share público, IA/OCR y servicios públicos (Photon/OSRM).
- **Tests de flujos críticos**: auth, upgrade, compartir, rutas, OCR, IA, creación/edición.

## Prioridades recomendadas (orden)

### P0 (impacto alto, desbloquea lo demás)

1) **Unificar reglas y mensajes de free/premium**
- Objetivo: coherencia total en UI, navegación y endpoints.
- Resultado esperado: menos confusión, menos tickets, mejor conversión.

2) **Permisos por módulo homogéneos**
- Objetivo: aplicar `can_manage_*` en endpoints y UI donde corresponda.
- Resultado esperado: menos inconsistencias y menos riesgos de seguridad funcional.

### P1 (crecimiento + estabilidad)

3) **Landing/pricing pública**
4) **CI + lint/typecheck + tests de integración/E2E básicos**
5) **Centralizar auditoría y helpers de acceso/autorización**

## Checklist (vamos “una a una”)

- [x] P0: Unificar free/premium — `lib/tier.ts`, `lib/premium-copy.ts`, `tripCreationLimits`
- [x] P0: Permisos por módulo — `trip-access-api.ts`; ~35 rutas API migradas a `requireTripAccessApi`
- [x] P0 (parcial): Permisos `can_manage_*` en UI — plan, gastos, mapa/rutas, recursos; banner lectura; `GET /api/trip-access` ampliado; listas sin default permisivo
- [x] P0 (parcial): Copy free/premium en dashboard — `lib/premium-copy.ts`
- [x] P0: Gating Premium en módulos del viaje — `PremiumUpsell`, OCR/docs, gastos, rutas auto, asistente IA; nav IA visible con badge PRO
- [x] P1: Landing/pricing pública — `PublicLanding`, `/pricing`, `lib/pricing-public.ts`, shell marketing
- [x] P1 (parcial): Tests API permisos — mocks `requireTripAccessApi` en `app/api/__tests__/*`
- [x] P1 (parcial): CI — `.github/workflows/ci.yml` (typecheck + vitest en PR/push main)
- [x] P1 (parcial): E2E smoke — Playwright `e2e/public-pages.spec.ts` en CI
- [x] P1 (parcial): Centralización helpers (access) — `trip-access-api.ts` ampliado
- [x] Bloque calidad (parcial): `next/image` en recap/dashboard/summary; `TripMapView` sin `as any` en normalización de rutas
- [x] E2E auth (público): `e2e/auth.spec.ts` — redirect dashboard, formularios login/register
- [x] trip-ai (parcial): `parse-unknown`, `itineraryItemUtils`, `tripAutoConfig`/`tripCreationResolve` tipados
- [x] P1: Onboarding checklist por viaje — `TripOnboardingChecklist` en layout, progreso persistente hasta completar
- [x] P1: Centro de ayuda — `/help`, FAQ por módulos (IA/OCR), feedback mailto, enlaces en footer/dashboard/auth
- [x] P1 (parcial): Observabilidad + rate limiting — `lib/rate-limit.ts`, `lib/api-observability.ts`, middleware ampliado (IA, OCR, share GET, geocode/places/osm/osrm); tests `lib/__tests__/rate-limit.test.ts`
- [x] P1 (parcial): E2E flujos autenticados — `e2e/demo-tour.spec.ts`, `trip-create.spec.ts`, `rsvp.spec.ts` + helper `e2e/helpers/auth.ts` (opcional `E2E_USER_*` en CI)
- [x] P1 (parcial): Refresco checklist onboarding — `GET /api/trips/[id]/onboarding-counts`, evento `kaviro:trip-onboarding-refresh` tras crear actividad/gasto

