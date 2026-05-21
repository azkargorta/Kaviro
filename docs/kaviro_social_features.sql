-- Kaviro: avatar personalizado, invitaciones in-app y compañeros de viaje
-- Ejecutar en Supabase → SQL Editor

-- ── Avatar en perfil ───────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists avatar_kind text default 'emoji',
  add column if not exists avatar_emoji text,
  add column if not exists avatar_illustration text;

comment on column public.profiles.avatar_kind is 'emoji | illustration';
comment on column public.profiles.avatar_emoji is 'Emoji de perfil (p. ej. 🧳)';
comment on column public.profiles.avatar_illustration is 'Slug ilustración: explorer, sunset, mountain, wave, city, camper';

-- ── Invitaciones directas a usuario (aceptar / rechazar en Mis viajes) ───────
create table if not exists public.trip_member_invites (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  inviter_user_id uuid not null references auth.users(id) on delete cascade,
  invitee_user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'viewer',
  status text not null default 'pending',
  display_name text,
  can_manage_trip boolean not null default false,
  can_manage_participants boolean not null default false,
  can_manage_expenses boolean not null default false,
  can_manage_plan boolean not null default false,
  can_manage_map boolean not null default false,
  can_manage_resources boolean not null default false,
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint trip_member_invites_status_check
    check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  constraint trip_member_invites_role_check
    check (role in ('owner', 'editor', 'viewer'))
);

create unique index if not exists idx_trip_member_invites_pending_unique
  on public.trip_member_invites (trip_id, invitee_user_id)
  where status = 'pending';

create index if not exists idx_trip_member_invites_invitee_pending
  on public.trip_member_invites (invitee_user_id, status)
  where status = 'pending';

-- ── Memoria de compañeros habituales ─────────────────────────────────────────
create table if not exists public.user_travel_mates (
  user_id uuid not null references auth.users(id) on delete cascade,
  mate_user_id uuid not null references auth.users(id) on delete cascade,
  shared_trips_count int not null default 1,
  last_shared_at timestamptz not null default now(),
  primary key (user_id, mate_user_id),
  constraint user_travel_mates_no_self check (user_id <> mate_user_id)
);

create index if not exists idx_user_travel_mates_user
  on public.user_travel_mates (user_id, last_shared_at desc);
