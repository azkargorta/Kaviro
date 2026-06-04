-- Kaviro Trips — cotizaciones y presupuestos
-- Ejecutar en Supabase → SQL Editor (tras kaviro_agency_pretravel_survey.sql)

alter table public.trips
  add column if not exists agency_sales_status text not null default 'draft';

alter table public.trips
  drop constraint if exists trips_agency_sales_status_check;

alter table public.trips
  add constraint trips_agency_sales_status_check
  check (agency_sales_status in ('draft', 'proposal', 'confirmed', 'cancelled'));

comment on column public.trips.agency_sales_status is
  'Estado comercial B2B: borrador, propuesta enviada, confirmado, cancelado.';

-- ---------------------------------------------------------------------------
create table if not exists public.agency_trip_quotes (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  agency_id uuid not null references public.agencies (id) on delete cascade,
  title text not null,
  client_label text null,
  currency text not null default 'EUR',
  price_per_person numeric(12, 2) null,
  total_price numeric(12, 2) null,
  travelers_count int null,
  valid_until date null,
  discount_percent numeric(5, 2) not null default 0,
  discount_label text null,
  notes text null,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  accept_token text null unique,
  accepted_at timestamptz null,
  accepted_by_name text null,
  accepted_by_email text null,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agency_trip_quotes_trip_idx
  on public.agency_trip_quotes (trip_id, created_at desc);

create table if not exists public.agency_quote_line_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.agency_trip_quotes (id) on delete cascade,
  category text not null default 'other'
    check (category in ('flight', 'hotel', 'transport', 'tickets', 'guide', 'insurance', 'management', 'other')),
  label text not null,
  description text null,
  unit_amount numeric(12, 2) not null default 0,
  quantity int not null default 1,
  sort_order int not null default 0
);

create index if not exists agency_quote_line_items_quote_idx
  on public.agency_quote_line_items (quote_id, sort_order);

alter table public.agency_trip_quotes enable row level security;
alter table public.agency_quote_line_items enable row level security;

drop policy if exists "agency_quotes_member" on public.agency_trip_quotes;
create policy "agency_quotes_member" on public.agency_trip_quotes
  for all to authenticated
  using (public.is_agency_member(agency_id))
  with check (public.is_agency_member(agency_id));

drop policy if exists "agency_quote_lines_member" on public.agency_quote_line_items;
create policy "agency_quote_lines_member" on public.agency_quote_line_items
  for all to authenticated
  using (
    exists (
      select 1 from public.agency_trip_quotes q
      where q.id = agency_quote_line_items.quote_id
        and public.is_agency_member(q.agency_id)
    )
  )
  with check (
    exists (
      select 1 from public.agency_trip_quotes q
      where q.id = agency_quote_line_items.quote_id
        and public.is_agency_member(q.agency_id)
    )
  );
