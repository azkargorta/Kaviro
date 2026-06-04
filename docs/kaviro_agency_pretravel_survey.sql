-- Kaviro Trips — encuesta pre-viaje
-- Ejecutar en Supabase → SQL Editor (tras kaviro_agency_checklist.sql)

create table if not exists public.agency_trip_pretravel_surveys (
  trip_id uuid primary key references public.trips (id) on delete cascade,
  agency_id uuid not null references public.agencies (id) on delete cascade,
  is_active boolean not null default true,
  send_days_before int null default 14,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agency_pretravel_survey_fields (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  field_key text not null,
  label text not null,
  field_type text not null default 'text'
    check (field_type in ('text', 'textarea', 'email', 'phone', 'date', 'select')),
  required boolean not null default false,
  options jsonb null,
  sort_order int not null default 0,
  is_enabled boolean not null default true,
  unique (trip_id, field_key)
);

create index if not exists agency_pretravel_fields_trip_idx
  on public.agency_pretravel_survey_fields (trip_id, sort_order);

create table if not exists public.agency_pretravel_responses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  participant_id uuid not null references public.trip_participants (id) on delete cascade,
  token text not null unique,
  answers jsonb not null default '{}'::jsonb,
  submitted_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (trip_id, participant_id)
);

create index if not exists agency_pretravel_responses_trip_idx
  on public.agency_pretravel_responses (trip_id, submitted_at);

alter table public.agency_trip_pretravel_surveys enable row level security;
alter table public.agency_pretravel_survey_fields enable row level security;
alter table public.agency_pretravel_responses enable row level security;

drop policy if exists "agency_pretravel_surveys_member" on public.agency_trip_pretravel_surveys;
create policy "agency_pretravel_surveys_member" on public.agency_trip_pretravel_surveys
  for all to authenticated
  using (public.is_agency_member(agency_id))
  with check (public.is_agency_member(agency_id));

drop policy if exists "agency_pretravel_fields_member" on public.agency_pretravel_survey_fields;
create policy "agency_pretravel_fields_member" on public.agency_pretravel_survey_fields
  for all to authenticated
  using (
    exists (
      select 1 from public.trips t
      where t.id = agency_pretravel_survey_fields.trip_id
        and public.is_agency_member(t.agency_id)
    )
  )
  with check (
    exists (
      select 1 from public.trips t
      where t.id = agency_pretravel_survey_fields.trip_id
        and public.is_agency_member(t.agency_id)
    )
  );

drop policy if exists "agency_pretravel_responses_member" on public.agency_pretravel_responses;
create policy "agency_pretravel_responses_member" on public.agency_pretravel_responses
  for all to authenticated
  using (
    exists (
      select 1 from public.trips t
      where t.id = agency_pretravel_responses.trip_id
        and public.is_agency_member(t.agency_id)
    )
  )
  with check (
    exists (
      select 1 from public.trips t
      where t.id = agency_pretravel_responses.trip_id
        and public.is_agency_member(t.agency_id)
    )
  );

-- El formulario público se sirve vía API Next.js (service role + validación de token).
