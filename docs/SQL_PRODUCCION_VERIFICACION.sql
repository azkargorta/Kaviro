-- Verificación de migraciones Kaviro en Supabase (producción)
-- Una sola consulta (compatible con SQL Editor de Supabase)
-- Orden de ejecución de pendientes: docs/AUDITORIA_TECNICA_2026_CHECKLIST.md

WITH checks (orden, grupo, script, descripcion, ok) AS (
  VALUES
    (2, 'B2C', 'tripboard_participants_migration.sql', 'trip_participants',
      EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'trip_participants')),
    (3, 'B2C', 'tripboard_activity_reactions.sql', 'trip_activity_reactions',
      EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'trip_activity_reactions')),
    (4, 'B2C', 'kaviro_user_notifications.sql', 'user_notifications',
      EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_notifications')),
    (5, 'B2C', 'kaviro_user_trip_feed_reads.sql', 'user_trip_feed_reads',
      EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_trip_feed_reads')),
    (6, 'B2C', 'kaviro_trip_messages.sql', 'trip_messages',
      EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'trip_messages')),
    (7, 'B2C', 'kaviro_trips_budget_target.sql', 'trips.budget_target',
      EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'trips' AND column_name = 'budget_target')),
    (8, 'B2C', 'kaviro_social_features.sql', 'profiles.avatar_kind',
      EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'avatar_kind')),
    (9, 'B2C', 'tripboard_billing_stripe.sql', 'billing_customers',
      EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'billing_customers')),
    (11, 'B2B', 'kaviro_agency_mode.sql', 'agencies',
      EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agencies')),
    (12, 'B2B', 'kaviro_agency_features.sql', 'agency_clients',
      EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agency_clients')),
    (13, 'B2B', 'kaviro_agency_logos_storage.sql', 'storage bucket agency-logos',
      EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'agency-logos')),
    (14, 'B2B', 'kaviro_agency_payments.sql', 'agency_participant_payments',
      EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agency_participant_payments')),
    (15, 'B2B', 'kaviro_agency_emails.sql', 'agency_trip_email_automation',
      EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agency_trip_email_automation')),
    (16, 'B2B', 'kaviro_agency_signatures.sql', 'agency_trip_signature_packs',
      EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agency_trip_signature_packs')),
    (17, 'Ops', 'kaviro_platform_ops.sql', 'platform_agency_leads',
      EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'platform_agency_leads')),
    (18, 'B2B', 'kaviro_agency_custom_pricing.sql', 'agencies.stripe_price_id_monthly',
      EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agencies' AND column_name = 'stripe_price_id_monthly')),
    (30, 'Extra', 'tripboard_plan_ratings_comments.sql', 'trip_activities.rating',
      EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'trip_activities' AND column_name = 'rating')),
    (31, 'Extra', 'kaviro_push_subscriptions.sql', 'push_subscriptions',
      EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'push_subscriptions'))
),
detail AS (
  SELECT
    orden,
    grupo,
    script,
    descripcion,
    ok,
    CASE WHEN ok THEN '✓ aplicado' ELSE '✗ EJECUTAR docs/' || script END AS accion
  FROM checks
),
summary AS (
  SELECT
    9999 AS orden,
    'RESUMEN' AS grupo,
    '—' AS script,
    (count(*) FILTER (WHERE ok))::text || ' aplicadas, ' || (count(*) FILTER (WHERE NOT ok))::text || ' pendientes' AS descripcion,
    (count(*) FILTER (WHERE NOT ok) = 0) AS ok,
    CASE
      WHEN count(*) FILTER (WHERE NOT ok) = 0 THEN '✓ Todo aplicado'
      ELSE '✗ Revisar filas pendientes arriba'
    END AS accion
  FROM checks
)
SELECT orden, grupo, script, descripcion, ok, accion FROM detail
UNION ALL
SELECT orden, grupo, script, descripcion, ok, accion FROM summary
ORDER BY orden;
