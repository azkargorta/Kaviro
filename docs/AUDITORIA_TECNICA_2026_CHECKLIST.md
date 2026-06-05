# Auditoría técnica Kaviro 2026 — checklist

Ejecutar en **Supabase → SQL Editor** en el orden indicado (solo los que aún no estén aplicados en producción).

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
13. `docs/kaviro_agency_logos_storage.sql`
14. `docs/kaviro_agency_payments.sql`
15. `docs/kaviro_agency_emails.sql`
16. `docs/kaviro_agency_signatures.sql`
17. `docs/kaviro_platform_ops.sql`
18. `docs/kaviro_agency_branding_trip_read.sql` (opcional: lectura branding en viajeros)

## Verificación rápida post-SQL

- Chat grupal: `/trip/[id]/messages` — tabla `trip_messages`
- Reacciones / RSVP: plan del viaje (lista y detalle)
- Campana: tabla `user_notifications`
- Pagos agencia: `agency_trip_participant_payments`

## Pendiente de producto (no solo código)

| Ítem | Estado |
|------|--------|
| Stripe **Agency Pro** (checkout B2B autónomo) | Hecho: `/api/agencies/billing/checkout` + webhook; configurar `STRIPE_AGENCY_PRICE_ID_MONTHLY` |
| Registro self-service de agencia | Hecho: `/agency/setup` + `POST /api/agencies/register` (trial 14 días) |
| Panel `AgencyDashboardHome` ampliado | Hecho: métricas, checklist, cobros, invitaciones |

## Cambios de código aplicados (esta ronda)

- Reacciones RSVP en filas del plan (`PlanActivityRow`)
- CSP y cabeceras de seguridad en `next.config.mjs`
- Límites de tamaño en análisis de documentos / tickets y metadatos `trip-uploads`
- Carga diferida de Leaflet (`TripMapViewDynamic`, `TripPlanExploreDrawer`)
- `lib/logger.ts` para nuevos logs (migrar `console.log` gradualmente)
