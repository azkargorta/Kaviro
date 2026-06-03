-- Plantillas: qué bloques del viaje se copian al instanciar (plan, rutas, docs…)
-- Ejecutar en Supabase SQL Editor tras kaviro_agency_mode.sql

alter table public.agency_templates
  add column if not exists includes jsonb not null default '{
    "plan": true,
    "routes": true,
    "docs": true,
    "lists": true,
    "notes": true,
    "activityKinds": true,
    "announcements": false
  }'::jsonb;

comment on column public.agency_templates.includes is
  'Bloques a copiar al crear viaje desde plantilla: plan, routes, docs, lists, notes, activityKinds, announcements';
