# Auditoría técnica Kaviro 2026 — checklist

Ejecutar en **Supabase → SQL Editor** en el orden indicado (solo los que aún no estén aplicados en producción).

**Comprobar estado:**

- Panel **Kaviro Ops** → [/ops/migrations](/ops/migrations) (admin plataforma)
- SQL puro: `docs/SQL_PRODUCCION_VERIFICACION.sql`

## B2C / viajes personales

1. `docs/tripboard_profiles_trigger.sql`
2. `docs/tripboard_participants_migration.sql`
3. `docs/tripboard_activity_reactions.sql`
4. `docs/kaviro_user_notifications.sql`
5. `docs/kaviro_user_trip_feed_reads.sql` (incluye políticas de notificaciones)
6. `docs/kaviro_trip_messages.sql`
7. `docs/kaviro_trips_budget_target.sql`
8. `docs/kaviro_social_features.sql`
9. `docs/tripboard_billing_stripe.sql`
10. `docs/tripboard_premium_plan.sql`

## B2B / Kaviro Trips (agencias)

11. `docs/kaviro_agency_mode.sql`
12. `docs/kaviro_agency_features.sql`
13. `docs/kaviro_agency_logos_storage.sql` — bucket `agency-logos` (subida logo en `/agency/branding`)
14. `docs/kaviro_agency_payments.sql`
15. `docs/kaviro_agency_emails.sql`
16. `docs/kaviro_agency_signatures.sql`
17. `docs/kaviro_platform_ops.sql`
18. `docs/kaviro_agency_branding_trip_read.sql` (opcional: lectura branding en viajeros vía RLS)
19. `docs/kaviro_agency_custom_pricing.sql` — tarifa Agency Pro personalizada por agencia

## Verificación rápida post-SQL

- Chat grupal: `/trip/[id]/messages` — tabla `trip_messages`
- Reacciones / RSVP: plan del viaje (lista y detalle)
- Campana: tabla `user_notifications`
- Pagos agencia: `agency_trip_participant_payments`

## Pendiente de producto (no solo código)

| Ítem | Estado |
|------|--------|
| Stripe **Agency Pro** (checkout B2B autónomo) | Hecho: checkout + webhook; configurar `STRIPE_AGENCY_PRODUCT_ID` en Vercel |
| Tarifa personalizada por agencia | Hecho: Ops fija precio → Price Stripe → checkout en `/agency/plan` |
| Registro self-service de agencia | Hecho: `/agency/setup` + trial 14 días; auto-vincula leads `/empresa` por email |
| Panel `AgencyDashboardHome` ampliado | Hecho: métricas, checklist, cobros, invitaciones |
| Ops leads ↔ agencias | Hecho: badges tarifa; backfill histórico en `/ops/leads` |
| Alertas registro / tarifa | Hecho: email+ campana Ops al registrar; campana agencia al asignar tarifa |
| Campana en Ops y agencia | Hecho: `OpsShell` + `AgencyShell`; badge en nav Agencias si faltan tarifas |

## Cambios de código aplicados (esta ronda)

- Reacciones RSVP en filas del plan (`PlanActivityRow`)
- CSP y cabeceras de seguridad en `next.config.mjs`
- Límites de tamaño en análisis de documentos / tickets y metadatos `trip-uploads`
- Carga diferida de Leaflet (`TripMapViewDynamic`, `TripPlanExploreDrawer`)
- `lib/logger.ts` para nuevos logs (migrar `console.log` gradualmente)
- Bloqueo de panel si trial/plan inactivo → `/agency/plan`
- Portal Stripe agencia: `POST /api/agencies/billing/portal`
- Precio Agency Pro por agencia: `lib/server/agency-custom-pricing.ts` + Ops
- Vinculación leads `/empresa`: `lib/server/link-agency-lead.ts`
- Catálogo migraciones ampliado: logos storage + custom pricing en `/ops/migrations`
- Dashboard agencia: alertas de plan/tarifa y checklist Agency Pro
- Branding viajeros: lectura RLS primero, fallback service role (`load-trip-workspace.ts`)
- Ops ficha agencia: leads `/empresa` vinculados por email
