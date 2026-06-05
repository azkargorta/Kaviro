-- Verificación de migraciones Kaviro en Supabase (producción)
-- Ejecutar en SQL Editor → devuelve una fila por comprobación (ok = true/false)
-- Orden de ejecución de scripts pendientes: docs/AUDITORIA_TECNICA_2026_CHECKLIST.md

with checks (orden, grupo, script, descripcion, ok) as (
  values
    (2,  'B2C', 'tripboard_participants_migration.sql', 'trip_participants', (
      select exists (
        select 1 from information_schema.tables
        where table_schema = 'public' and table_name = 'trip_participants'
      )
    )),
    (3,  'B2C', 'tripboard_activity_reactions.sql', 'trip_activity_reactions', (
      select exists (
        select 1 from information_schema.tables
        where table_schema = 'public' and table_name = 'trip_activity_reactions'
      )
    )),
    (4,  'B2C', 'kaviro_user_notifications.sql', 'user_notifications', (
      select exists (
        select 1 from information_schema.tables
        where table_schema = 'public' and table_name = 'user_notifications'
      )
    )),
    (5,  'B2C', 'kaviro_user_trip_feed_reads.sql', 'user_trip_feed_reads', (
      select exists (
        select 1 from information_schema.tables
        where table_schema = 'public' and table_name = 'user_trip_feed_reads'
      )
    )),
    (6,  'B2C', 'kaviro_trip_messages.sql', 'trip_messages', (
      select exists (
        select 1 from information_schema.tables
        where table_schema = 'public' and table_name = 'trip_messages'
      )
    )),
    (7,  'B2C', 'kaviro_trips_budget_target.sql', 'trips.budget_target', (
      select exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'trips' and column_name = 'budget_target'
      )
    )),
    (8,  'B2C', 'kaviro_social_features.sql', 'profiles.avatar_kind', (
      select exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'profiles' and column_name = 'avatar_kind'
      )
    )),
    (9,  'B2C', 'tripboard_billing_stripe.sql', 'billing_customers', (
      select exists (
        select 1 from information_schema.tables
        where table_schema = 'public' and table_name = 'billing_customers'
      )
    )),
    (11, 'B2B', 'kaviro_agency_mode.sql', 'agencies', (
      select exists (
        select 1 from information_schema.tables
        where table_schema = 'public' and table_name = 'agencies'
      )
    )),
    (12, 'B2B', 'kaviro_agency_features.sql', 'agency_clients', (
      select exists (
        select 1 from information_schema.tables
        where table_schema = 'public' and table_name = 'agency_clients'
      )
    )),
    (14, 'B2B', 'kaviro_agency_payments.sql', 'agency_participant_payments', (
      select exists (
        select 1 from information_schema.tables
        where table_schema = 'public' and table_name = 'agency_participant_payments'
      )
    )),
    (15, 'B2B', 'kaviro_agency_emails.sql', 'agency_trip_email_automation', (
      select exists (
        select 1 from information_schema.tables
        where table_schema = 'public' and table_name = 'agency_trip_email_automation'
      )
    )),
    (16, 'B2B', 'kaviro_agency_signatures.sql', 'agency_trip_signature_packs', (
      select exists (
        select 1 from information_schema.tables
        where table_schema = 'public' and table_name = 'agency_trip_signature_packs'
      )
    )),
    (17, 'Ops', 'kaviro_platform_ops.sql', 'platform_agency_leads', (
      select exists (
        select 1 from information_schema.tables
        where table_schema = 'public' and table_name = 'platform_agency_leads'
      )
    )),
    (30, 'Extra', 'tripboard_plan_ratings_comments.sql', 'trip_activities.rating', (
      select exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'trip_activities' and column_name = 'rating'
      )
    )),
    (31, 'Extra', 'kaviro_push_subscriptions.sql', 'push_subscriptions', (
      select exists (
        select 1 from information_schema.tables
        where table_schema = 'public' and table_name = 'push_subscriptions'
      )
    ))
)
select
  orden,
  grupo,
  script,
  descripcion,
  ok,
  case when ok then '✓ aplicado' else '✗ EJECUTAR docs/' || script end as accion
from checks
order by orden;

-- Resumen
select
  count(*) filter (where ok) as aplicadas,
  count(*) filter (where not ok) as pendientes
from checks;
