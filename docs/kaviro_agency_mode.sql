-- Kaviro Modo Agencia (Bloque 1)
-- Ejecutar en Supabase SQL Editor antes de /agency y portal cliente.
-- Ver docs/kaviro_agency_mode.md para el plan completo.

-- ---------------------------------------------------------------------------
-- Agencias (workspace B2B)
-- ---------------------------------------------------------------------------
create table if not exists public.agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text null,
  brand_color text null default '#1e3a5f',
  contact_email text null,
  owner_id uuid not null references auth.users (id) on delete restrict,
  plan text not null default 'free' check (plan in ('free', 'agency_pro', 'trial')),
  stripe_customer_id text null,
  stripe_subscription_id text null,
  plan_active_until timestamptz null,
  max_members int not null default 3,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agencies_owner_id_idx on public.agencies (owner_id);
create index if not exists agencies_slug_idx on public.agencies (slug);

comment on table public.agencies is 'Workspace de agencia (Modo Agencia Pro).';
comment on column public.agencies.slug is 'URL: /client/{slug}/… y /agency contexto.';

-- ---------------------------------------------------------------------------
-- Miembros del equipo (admin = facturación + equipo; editor = viajes)
-- ---------------------------------------------------------------------------
create table if not exists public.agency_members (
  agency_id uuid not null references public.agencies (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'editor' check (role in ('admin', 'editor')),
  created_at timestamptz not null default now(),
  primary key (agency_id, user_id)
);

create index if not exists agency_members_user_id_idx on public.agency_members (user_id);

-- ---------------------------------------------------------------------------
-- Viajes vinculados a una agencia (null = viaje personal B2C)
-- ---------------------------------------------------------------------------
alter table public.trips
  add column if not exists agency_id uuid null references public.agencies (id) on delete set null;

create index if not exists trips_agency_id_idx on public.trips (agency_id) where agency_id is not null;

comment on column public.trips.agency_id is 'Si no es null, el viaje pertenece al workspace de la agencia.';

-- Slug público del viaje dentro de la agencia (portal cliente)
alter table public.trips
  add column if not exists client_portal_slug text null;

create unique index if not exists trips_agency_client_slug_uidx
  on public.trips (agency_id, client_portal_slug)
  where agency_id is not null and client_portal_slug is not null;

-- ---------------------------------------------------------------------------
-- Portales cliente (metadatos; contenido = trip + trip_shares)
-- ---------------------------------------------------------------------------
create table if not exists public.agency_client_portals (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null unique references public.trips (id) on delete cascade,
  agency_id uuid not null references public.agencies (id) on delete cascade,
  slug text not null,
  access_code text null,
  custom_domain text null,
  is_active boolean not null default true,
  last_published_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (agency_id, slug)
);

create index if not exists agency_client_portals_agency_idx
  on public.agency_client_portals (agency_id);

-- ---------------------------------------------------------------------------
-- Plantillas (Bloque 3 — opcional en la misma migración)
-- ---------------------------------------------------------------------------
create table if not exists public.agency_templates (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies (id) on delete cascade,
  source_trip_id uuid not null references public.trips (id) on delete cascade,
  name text not null,
  description text null,
  category text null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agency_templates_agency_idx on public.agency_templates (agency_id);

-- ---------------------------------------------------------------------------
-- Helpers RLS
-- ---------------------------------------------------------------------------
create or replace function public.is_agency_member(p_agency_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.agency_members am
    where am.agency_id = p_agency_id
      and am.user_id = auth.uid()
  );
$$;

create or replace function public.is_agency_admin(p_agency_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.agency_members am
    where am.agency_id = p_agency_id
      and am.user_id = auth.uid()
      and am.role = 'admin'
  )
  or exists (
    select 1 from public.agencies a
    where a.id = p_agency_id and a.owner_id = auth.uid()
  );
$$;

revoke all on function public.is_agency_member(uuid) from public;
revoke all on function public.is_agency_admin(uuid) from public;
grant execute on function public.is_agency_member(uuid) to authenticated;
grant execute on function public.is_agency_admin(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS: agencies
-- ---------------------------------------------------------------------------
alter table public.agencies enable row level security;

drop policy if exists "agencies_select_member" on public.agencies;
create policy "agencies_select_member" on public.agencies
  for select to authenticated
  using (public.is_agency_member(id) or owner_id = auth.uid());

drop policy if exists "agencies_update_admin" on public.agencies;
create policy "agencies_update_admin" on public.agencies
  for update to authenticated
  using (public.is_agency_admin(id))
  with check (public.is_agency_admin(id));

-- Insert: cualquier usuario autenticado puede crear su agencia (será owner)
drop policy if exists "agencies_insert_authenticated" on public.agencies;
create policy "agencies_insert_authenticated" on public.agencies
  for insert to authenticated
  with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- RLS: agency_members
-- ---------------------------------------------------------------------------
alter table public.agency_members enable row level security;

drop policy if exists "agency_members_select" on public.agency_members;
create policy "agency_members_select" on public.agency_members
  for select to authenticated
  using (public.is_agency_member(agency_id));

drop policy if exists "agency_members_admin_write" on public.agency_members;
create policy "agency_members_admin_write" on public.agency_members
  for all to authenticated
  using (public.is_agency_admin(agency_id))
  with check (public.is_agency_admin(agency_id));

-- ---------------------------------------------------------------------------
-- RLS: trips — lectura/escritura para miembros de la agencia dueña del viaje
-- (Complementa políticas existentes por trip_participants.)
-- ---------------------------------------------------------------------------
drop policy if exists "trips_select_agency_member" on public.trips;
create policy "trips_select_agency_member" on public.trips
  for select to authenticated
  using (
    agency_id is not null
    and public.is_agency_member(agency_id)
  );

drop policy if exists "trips_update_agency_editor" on public.trips;
create policy "trips_update_agency_editor" on public.trips
  for update to authenticated
  using (
    agency_id is not null
    and public.is_agency_member(agency_id)
  )
  with check (
    agency_id is not null
    and public.is_agency_member(agency_id)
  );

drop policy if exists "trips_insert_agency_member" on public.trips;
create policy "trips_insert_agency_member" on public.trips
  for insert to authenticated
  with check (
    agency_id is null
    or public.is_agency_member(agency_id)
  );

-- ---------------------------------------------------------------------------
-- RLS: agency_client_portals (staff) + lectura anónima si activo
-- ---------------------------------------------------------------------------
alter table public.agency_client_portals enable row level security;

drop policy if exists "agency_portals_select_member" on public.agency_client_portals;
create policy "agency_portals_select_member" on public.agency_client_portals
  for select to authenticated
  using (public.is_agency_member(agency_id));

drop policy if exists "agency_portals_write_member" on public.agency_client_portals;
create policy "agency_portals_write_member" on public.agency_client_portals
  for all to authenticated
  using (public.is_agency_member(agency_id))
  with check (public.is_agency_member(agency_id));

drop policy if exists "agency_portals_select_anon_active" on public.agency_client_portals;
create policy "agency_portals_select_anon_active" on public.agency_client_portals
  for select to anon
  using (is_active = true);

-- ---------------------------------------------------------------------------
-- RLS: agency_templates
-- ---------------------------------------------------------------------------
alter table public.agency_templates enable row level security;

drop policy if exists "agency_templates_member" on public.agency_templates;
create policy "agency_templates_member" on public.agency_templates
  for all to authenticated
  using (public.is_agency_member(agency_id))
  with check (public.is_agency_member(agency_id));

-- ---------------------------------------------------------------------------
-- Seed manual (ejemplo Stripes) — descomentar y sustituir UUIDs tras crear usuarios
-- ---------------------------------------------------------------------------
-- insert into public.agencies (name, slug, owner_id, plan, brand_color, contact_email)
-- values ('Stripes Sports Trips', 'stripes', '<OWNER_USER_UUID>', 'trial', '#1e3a5f', 'hola@stripes.es');
-- insert into public.agency_members (agency_id, user_id, role)
-- select id, owner_id, 'admin' from public.agencies where slug = 'stripes';
-- update public.trips set agency_id = (select id from public.agencies where slug = 'stripes')
--   where id = '<CHICAGO_TRIP_UUID>';
