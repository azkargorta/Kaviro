-- Kaviro Trips — firma digital de documentos (viajeros)
-- Ejecutar en Supabase → SQL Editor (tras kaviro_agency_emails.sql)

create table if not exists public.agency_trip_signature_packs (
  trip_id uuid primary key references public.trips (id) on delete cascade,
  agency_id uuid not null references public.agencies (id) on delete cascade,
  title text not null default 'Contrato de viaje',
  document_type text not null default 'contract'
    check (document_type in ('contract', 'waiver', 'custom')),
  body_text text not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agency_signature_requests (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  participant_id uuid null references public.trip_participants (id) on delete set null,
  agency_id uuid not null references public.agencies (id) on delete cascade,
  traveler_label text null,
  token text not null unique,
  signer_name text null,
  signer_email text null,
  signature_data_url text null,
  consent_accepted boolean not null default false,
  signed_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists agency_signature_requests_trip_idx
  on public.agency_signature_requests (trip_id, signed_at);

alter table public.agency_trip_signature_packs enable row level security;
alter table public.agency_signature_requests enable row level security;

drop policy if exists "agency_trip_signature_packs_member" on public.agency_trip_signature_packs;
create policy "agency_trip_signature_packs_member" on public.agency_trip_signature_packs
  for all to authenticated
  using (public.is_agency_member(agency_id))
  with check (public.is_agency_member(agency_id));

drop policy if exists "agency_signature_requests_member" on public.agency_signature_requests;
create policy "agency_signature_requests_member" on public.agency_signature_requests
  for all to authenticated
  using (public.is_agency_member(agency_id))
  with check (public.is_agency_member(agency_id));

alter table public.agency_trip_email_automation
  add column if not exists signature_invite boolean not null default true;
