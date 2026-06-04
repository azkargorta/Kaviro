-- Kaviro Trips — cobros a viajeros (señal + pago final) vía Stripe Checkout
-- Ejecutar en Supabase → SQL Editor (tras kaviro_agency_nps.sql)
-- Requiere STRIPE_SECRET_KEY y STRIPE_WEBHOOK_SECRET en el servidor.

alter table public.trips
  add column if not exists agency_price_per_person numeric(12, 2) null,
  add column if not exists agency_deposit_percent numeric(5, 2) not null default 30,
  add column if not exists agency_deposit_due_date date null,
  add column if not exists agency_final_due_date date null,
  add column if not exists agency_payment_currency text not null default 'EUR';

alter table public.trips
  drop constraint if exists trips_agency_deposit_percent_check;

alter table public.trips
  add constraint trips_agency_deposit_percent_check
  check (agency_deposit_percent >= 0 and agency_deposit_percent <= 100);

-- ---------------------------------------------------------------------------
create table if not exists public.agency_participant_payments (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  participant_id uuid not null references public.trip_participants (id) on delete cascade,
  agency_id uuid not null references public.agencies (id) on delete cascade,
  price_per_person numeric(12, 2) not null,
  deposit_percent numeric(5, 2) not null default 30,
  deposit_amount numeric(12, 2) not null,
  final_amount numeric(12, 2) not null,
  deposit_status text not null default 'pending'
    check (deposit_status in ('pending', 'paid', 'cancelled')),
  final_status text not null default 'pending'
    check (final_status in ('pending', 'paid', 'cancelled')),
  deposit_paid_at timestamptz null,
  final_paid_at timestamptz null,
  deposit_due_at date null,
  final_due_at date null,
  deposit_stripe_session_id text null,
  final_stripe_session_id text null,
  pay_token_deposit text null unique,
  pay_token_final text null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (trip_id, participant_id)
);

create index if not exists agency_participant_payments_trip_idx
  on public.agency_participant_payments (trip_id);

alter table public.agency_participant_payments enable row level security;

drop policy if exists "agency_participant_payments_member" on public.agency_participant_payments;
create policy "agency_participant_payments_member" on public.agency_participant_payments
  for all to authenticated
  using (public.is_agency_member(agency_id))
  with check (public.is_agency_member(agency_id));
