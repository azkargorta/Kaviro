-- Kaviro Trips — checklist de confirmaciones pre-salida
-- Ejecutar en Supabase → SQL Editor (tras kaviro_agency_capacity.sql)

create table if not exists public.agency_trip_checklist_items (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies (id) on delete cascade,
  trip_id uuid not null references public.trips (id) on delete cascade,
  label text not null,
  sort_order int not null default 0,
  is_checked boolean not null default false,
  checked_at timestamptz null,
  checked_by uuid null references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists agency_trip_checklist_trip_idx
  on public.agency_trip_checklist_items (trip_id, sort_order);

alter table public.agency_trip_checklist_items enable row level security;

drop policy if exists "agency_checklist_member" on public.agency_trip_checklist_items;
create policy "agency_checklist_member" on public.agency_trip_checklist_items
  for all to authenticated
  using (public.is_agency_member(agency_id))
  with check (public.is_agency_member(agency_id));
