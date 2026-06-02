-- Kaviro Trips — funcionalidades B2B (sin Stripe self-serve)
-- Ejecutar tras kaviro_agency_mode.sql

-- ---------------------------------------------------------------------------
-- Invitaciones de equipo (enlace; aceptación tras login)
-- ---------------------------------------------------------------------------
create table if not exists public.agency_invites (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies (id) on delete cascade,
  email text not null,
  role text not null default 'editor' check (role in ('admin', 'editor')),
  token text not null unique,
  invited_by uuid not null references auth.users (id) on delete cascade,
  accepted_at timestamptz null,
  accepted_by uuid null references auth.users (id) on delete set null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists agency_invites_agency_idx on public.agency_invites (agency_id);
create index if not exists agency_invites_email_idx on public.agency_invites (agency_id, lower(email));

-- ---------------------------------------------------------------------------
-- Métricas portal (vistas públicas)
-- ---------------------------------------------------------------------------
create table if not exists public.agency_portal_views (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies (id) on delete cascade,
  trip_id uuid not null references public.trips (id) on delete cascade,
  viewed_at timestamptz not null default now(),
  viewer_hash text null
);

create index if not exists agency_portal_views_trip_idx on public.agency_portal_views (trip_id, viewed_at desc);

-- ---------------------------------------------------------------------------
-- Avisos al grupo (portal cliente)
-- ---------------------------------------------------------------------------
create table if not exists public.agency_trip_announcements (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  agency_id uuid not null references public.agencies (id) on delete cascade,
  title text not null,
  body text not null,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists agency_trip_announcements_trip_idx
  on public.agency_trip_announcements (trip_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Clientes / grupos (CRM ligero)
-- ---------------------------------------------------------------------------
create table if not exists public.agency_clients (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies (id) on delete cascade,
  name text not null,
  contact_email text null,
  contact_phone text null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agency_clients_agency_idx on public.agency_clients (agency_id);

alter table public.trips
  add column if not exists agency_client_id uuid null references public.agency_clients (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Documentos visibles en portal cliente
-- ---------------------------------------------------------------------------
alter table public.trip_resources
  add column if not exists show_on_client_portal boolean not null default false;

create index if not exists trip_resources_client_portal_idx
  on public.trip_resources (trip_id)
  where show_on_client_portal = true;

-- Plan comercial manual (sin precio público fijo)
alter table public.agencies drop constraint if exists agencies_plan_check;
alter table public.agencies
  add constraint agencies_plan_check
  check (plan in ('free', 'agency_pro', 'trial', 'partnership', 'suspended'));

comment on column public.agencies.max_members is 'Límite acordado comercialmente con Kaviro (no self-serve).';
comment on column public.agencies.plan is 'partnership = acuerdo manual; suspended = bloqueo.';

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.agency_invites enable row level security;
alter table public.agency_portal_views enable row level security;
alter table public.agency_trip_announcements enable row level security;
alter table public.agency_clients enable row level security;

drop policy if exists "agency_invites_member_select" on public.agency_invites;
create policy "agency_invites_member_select" on public.agency_invites
  for select to authenticated
  using (public.is_agency_member(agency_id));

drop policy if exists "agency_invites_admin_write" on public.agency_invites;
create policy "agency_invites_admin_write" on public.agency_invites
  for all to authenticated
  using (public.is_agency_admin(agency_id))
  with check (public.is_agency_admin(agency_id));

drop policy if exists "agency_portal_views_member_select" on public.agency_portal_views;
create policy "agency_portal_views_member_select" on public.agency_portal_views
  for select to authenticated
  using (public.is_agency_member(agency_id));

drop policy if exists "agency_announcements_member" on public.agency_trip_announcements;
create policy "agency_announcements_member" on public.agency_trip_announcements
  for all to authenticated
  using (public.is_agency_member(agency_id))
  with check (public.is_agency_member(agency_id));

drop policy if exists "agency_announcements_anon_select" on public.agency_trip_announcements;
create policy "agency_announcements_anon_select" on public.agency_trip_announcements
  for select to anon
  using (
    exists (
      select 1
      from public.agency_client_portals p
      where p.trip_id = agency_trip_announcements.trip_id
        and p.is_active = true
    )
  );

drop policy if exists "agency_clients_member" on public.agency_clients;
create policy "agency_clients_member" on public.agency_clients
  for all to authenticated
  using (public.is_agency_member(agency_id))
  with check (public.is_agency_member(agency_id));
