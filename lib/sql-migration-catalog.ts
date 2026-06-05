export type SqlMigrationGroup = "b2c" | "b2b" | "ops" | "extra";

export type SqlMigrationCheck =
  | { kind: "table"; table: string }
  | { kind: "column"; table: string; column: string };

export type SqlMigrationDefinition = {
  id: string;
  file: string;
  label: string;
  group: SqlMigrationGroup;
  order: number;
  optional?: boolean;
  check: SqlMigrationCheck;
};

/** Catálogo alineado con docs/AUDITORIA_TECNICA_2026_CHECKLIST.md */
export const SQL_MIGRATION_CATALOG: SqlMigrationDefinition[] = [
  {
    id: "participants",
    file: "tripboard_participants_migration.sql",
    label: "Participantes de viaje (trip_participants)",
    group: "b2c",
    order: 2,
    check: { kind: "table", table: "trip_participants" },
  },
  {
    id: "activity_reactions",
    file: "tripboard_activity_reactions.sql",
    label: "RSVP / reacciones en actividades",
    group: "b2c",
    order: 3,
    check: { kind: "table", table: "trip_activity_reactions" },
  },
  {
    id: "user_notifications",
    file: "kaviro_user_notifications.sql",
    label: "Notificaciones in-app (campana)",
    group: "b2c",
    order: 4,
    check: { kind: "table", table: "user_notifications" },
  },
  {
    id: "trip_feed_reads",
    file: "kaviro_user_trip_feed_reads.sql",
    label: "Lecturas del feed del viaje",
    group: "b2c",
    order: 5,
    check: { kind: "table", table: "user_trip_feed_reads" },
  },
  {
    id: "trip_messages",
    file: "kaviro_trip_messages.sql",
    label: "Chat grupal del viaje",
    group: "b2c",
    order: 6,
    check: { kind: "table", table: "trip_messages" },
  },
  {
    id: "budget_target",
    file: "kaviro_trips_budget_target.sql",
    label: "Presupuesto objetivo del viaje",
    group: "b2c",
    order: 7,
    check: { kind: "column", table: "trips", column: "budget_target" },
  },
  {
    id: "social_features",
    file: "kaviro_social_features.sql",
    label: "Avatares sociales en perfiles",
    group: "b2c",
    order: 8,
    check: { kind: "column", table: "profiles", column: "avatar_kind" },
  },
  {
    id: "billing_stripe",
    file: "tripboard_billing_stripe.sql",
    label: "Stripe Premium (billing_customers)",
    group: "b2c",
    order: 9,
    check: { kind: "table", table: "billing_customers" },
  },
  {
    id: "agency_mode",
    file: "kaviro_agency_mode.sql",
    label: "Agencias y workspace B2B",
    group: "b2b",
    order: 11,
    check: { kind: "table", table: "agencies" },
  },
  {
    id: "agency_features",
    file: "kaviro_agency_features.sql",
    label: "CRM clientes de agencia",
    group: "b2b",
    order: 12,
    check: { kind: "table", table: "agency_clients" },
  },
  {
    id: "agency_payments",
    file: "kaviro_agency_payments.sql",
    label: "Cobros a viajeros (Stripe)",
    group: "b2b",
    order: 14,
    check: { kind: "table", table: "agency_participant_payments" },
  },
  {
    id: "agency_emails",
    file: "kaviro_agency_emails.sql",
    label: "Emails automatizados de agencia",
    group: "b2b",
    order: 15,
    check: { kind: "table", table: "agency_trip_email_automation" },
  },
  {
    id: "agency_signatures",
    file: "kaviro_agency_signatures.sql",
    label: "Firmas de documentos",
    group: "b2b",
    order: 16,
    check: { kind: "table", table: "agency_trip_signature_packs" },
  },
  {
    id: "platform_ops",
    file: "kaviro_platform_ops.sql",
    label: "Leads y CRM interno (Ops)",
    group: "ops",
    order: 17,
    check: { kind: "table", table: "platform_agency_leads" },
  },
  {
    id: "agency_branding_read",
    file: "kaviro_agency_branding_trip_read.sql",
    label: "RLS branding agencia para viajeros",
    group: "b2b",
    order: 18,
    optional: true,
    check: { kind: "column", table: "agencies", column: "brand_color" },
  },
  {
    id: "plan_ratings",
    file: "tripboard_plan_ratings_comments.sql",
    label: "Valoración y comentarios en actividades",
    group: "extra",
    order: 30,
    check: { kind: "column", table: "trip_activities", column: "rating" },
  },
  {
    id: "push_subscriptions",
    file: "kaviro_push_subscriptions.sql",
    label: "Notificaciones push (PWA)",
    group: "extra",
    order: 31,
    check: { kind: "table", table: "push_subscriptions" },
  },
];

export const SQL_MIGRATION_GROUP_LABELS: Record<SqlMigrationGroup, string> = {
  b2c: "B2C — viajes personales",
  b2b: "B2B — Kaviro Trips",
  ops: "Operaciones plataforma",
  extra: "Opcional / ampliaciones",
};
