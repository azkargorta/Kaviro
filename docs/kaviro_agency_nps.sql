-- Kaviro Trips — encuesta NPS post-viaje
-- Ejecutar en Supabase → SQL Editor (tras kaviro_agency_quotes.sql)

create table if not exists public.agency_trip_nps (
  trip_id uuid primary key references public.trips (id) on delete cascade,
  agency_id uuid not null references public.agencies (id) on delete cascade,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.agency_nps_responses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  participant_id uuid null references public.trip_participants (id) on delete set null,
  traveler_label text null,
  token text not null unique,
  nps_score int null check (nps_score is null or (nps_score >= 0 and nps_score <= 10)),
  rating_hotel int null check (rating_hotel is null or (rating_hotel >= 1 and rating_hotel <= 5)),
  rating_transport int null,
  rating_activities int null,
  rating_organization int null,
  rating_value int null,
  comment text null,
  allow_testimonial boolean not null default false,
  submitted_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists agency_nps_responses_trip_idx
  on public.agency_nps_responses (trip_id, submitted_at);

alter table public.agency_trip_nps enable row level security;
alter table public.agency_nps_responses enable row level security;

drop policy if exists "agency_trip_nps_member" on public.agency_trip_nps;
create policy "agency_trip_nps_member" on public.agency_trip_nps
  for all to authenticated
  using (public.is_agency_member(agency_id))
  with check (public.is_agency_member(agency_id));

drop policy if exists "agency_nps_responses_member" on public.agency_nps_responses;
create policy "agency_nps_responses_member" on public.agency_nps_responses
  for all to authenticated
  using (
    exists (
      select 1 from public.trips t
      where t.id = agency_nps_responses.trip_id
        and public.is_agency_member(t.agency_id)
    )
  )
  with check (
    exists (
      select 1 from public.trips t
      where t.id = agency_nps_responses.trip_id
        and public.is_agency_member(t.agency_id)
    )
  );
