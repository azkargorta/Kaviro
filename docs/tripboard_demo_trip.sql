-- Viaje demo de onboarding (ejecutar en Supabase SQL Editor)

alter table public.trips
  add column if not exists is_demo boolean not null default false;

create index if not exists trips_is_demo_idx on public.trips (is_demo) where is_demo = true;

alter table public.profiles
  add column if not exists demo_trip_id uuid references public.trips (id) on delete set null,
  add column if not exists demo_onboarding_completed_at timestamptz,
  add column if not exists demo_onboarding_skipped_at timestamptz;

comment on column public.trips.is_demo is 'Viaje de práctica; no cuenta para límites del plan gratuito.';
comment on column public.profiles.demo_trip_id is 'Viaje demo asociado al usuario para el recorrido inicial.';
