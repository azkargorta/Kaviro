-- Kaviro Trips — plazas, estados de reserva y lista de espera
-- Ejecutar en Supabase → SQL Editor (tras kaviro_agency_features.sql)

-- ---------------------------------------------------------------------------
-- Capacidad del viaje
-- ---------------------------------------------------------------------------
alter table public.trips
  add column if not exists max_capacity int null,
  add column if not exists agency_waitlist_enabled boolean not null default true;

alter table public.trips
  drop constraint if exists trips_max_capacity_check;

alter table public.trips
  add constraint trips_max_capacity_check
  check (max_capacity is null or max_capacity > 0);

comment on column public.trips.max_capacity is 'Plazas máximas de viajeros (null = sin límite).';
comment on column public.trips.agency_waitlist_enabled is 'Si true, nuevas altas pueden ir a lista de espera cuando el viaje está lleno.';

-- ---------------------------------------------------------------------------
-- Estado comercial del viajero (independiente de status = active/pending/removed)
-- ---------------------------------------------------------------------------
alter table public.trip_participants
  add column if not exists booking_status text null;

alter table public.trip_participants
  drop constraint if exists trip_participants_booking_status_check;

alter table public.trip_participants
  add constraint trip_participants_booking_status_check
  check (
    booking_status is null
    or booking_status in (
      'interested',
      'reserved',
      'deposit_paid',
      'confirmed',
      'waitlist',
      'cancelled'
    )
  );

comment on column public.trip_participants.booking_status is
  'Estado de plaza del viajero (agencia). null = miembro del equipo, no cuenta en capacidad.';

create index if not exists trip_participants_booking_idx
  on public.trip_participants (trip_id, booking_status)
  where status <> 'removed';

-- ---------------------------------------------------------------------------
-- Historial de cambios de estado (auditoría operativa)
-- ---------------------------------------------------------------------------
create table if not exists public.agency_trip_booking_events (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies (id) on delete cascade,
  trip_id uuid not null references public.trips (id) on delete cascade,
  participant_id uuid not null references public.trip_participants (id) on delete cascade,
  from_status text null,
  to_status text not null,
  note text null,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists agency_trip_booking_events_trip_idx
  on public.agency_trip_booking_events (trip_id, created_at desc);

alter table public.agency_trip_booking_events enable row level security;

drop policy if exists "agency_booking_events_member" on public.agency_trip_booking_events;
create policy "agency_booking_events_member" on public.agency_trip_booking_events
  for all to authenticated
  using (public.is_agency_member(agency_id))
  with check (public.is_agency_member(agency_id));
