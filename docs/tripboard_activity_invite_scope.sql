-- Alcance de invitación por actividad del plan (quién ve / está invitado al plan)
-- Ejecutar en el SQL editor de Supabase.

alter table public.trip_activities
  add column if not exists invite_scope text not null default 'all';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'trip_activities_invite_scope_check'
  ) then
    alter table public.trip_activities
      add constraint trip_activities_invite_scope_check
      check (invite_scope in ('all', 'self', 'selected'));
  end if;
end $$;

create table if not exists public.trip_activity_invitees (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.trip_activities (id) on delete cascade,
  participant_id uuid not null references public.trip_participants (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (activity_id, participant_id)
);

create index if not exists idx_trip_activity_invitees_activity
  on public.trip_activity_invitees (activity_id);
