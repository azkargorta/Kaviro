-- Kaviro Trips — comunicación automatizada (Resend) por viaje
-- Ejecutar en Supabase → SQL Editor (tras kaviro_agency_payments.sql)
-- Requiere RESEND_API_KEY en el servidor (ver docs/RESEND_EMAIL_SETUP.md).

create table if not exists public.agency_trip_email_automation (
  trip_id uuid primary key references public.trips (id) on delete cascade,
  agency_id uuid not null references public.agencies (id) on delete cascade,
  remind_deposit boolean not null default true,
  remind_final boolean not null default true,
  pretravel_invite boolean not null default true,
  nps_invite boolean not null default false,
  signature_invite boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.agency_email_log (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  agency_id uuid not null references public.agencies (id) on delete cascade,
  participant_id uuid null references public.trip_participants (id) on delete set null,
  event_type text not null,
  recipient_email text not null,
  status text not null check (status in ('sent', 'failed', 'skipped')),
  error_message text null,
  created_at timestamptz not null default now()
);

create index if not exists agency_email_log_trip_idx on public.agency_email_log (trip_id, created_at desc);

alter table public.agency_trip_email_automation enable row level security;
alter table public.agency_email_log enable row level security;

drop policy if exists "agency_trip_email_automation_member" on public.agency_trip_email_automation;
create policy "agency_trip_email_automation_member" on public.agency_trip_email_automation
  for all to authenticated
  using (public.is_agency_member(agency_id))
  with check (public.is_agency_member(agency_id));

drop policy if exists "agency_email_log_member" on public.agency_email_log;
create policy "agency_email_log_member" on public.agency_email_log
  for all to authenticated
  using (public.is_agency_member(agency_id))
  with check (public.is_agency_member(agency_id));
