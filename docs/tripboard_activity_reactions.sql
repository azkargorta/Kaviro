-- RSVP / reacciones en actividades del plan (¿Te apuntas? Sí / No / Quizás)
-- Ejecutar en el SQL Editor de Supabase.

create table if not exists public.trip_activity_reactions (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  activity_id uuid not null references public.trip_activities (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null default 'Anónimo',
  reaction text not null check (reaction in ('join', 'skip', 'maybe')),
  comment text,
  created_at timestamptz not null default now(),
  unique (activity_id, user_id)
);

create index if not exists trip_activity_reactions_activity_id_idx
  on public.trip_activity_reactions (activity_id);

create index if not exists trip_activity_reactions_trip_id_idx
  on public.trip_activity_reactions (trip_id);

alter table public.trip_activity_reactions enable row level security;

-- Participantes del viaje pueden ver reacciones
drop policy if exists "trip_activity_reactions_select" on public.trip_activity_reactions;
create policy "trip_activity_reactions_select" on public.trip_activity_reactions
  for select to authenticated
  using (
    trip_id in (
      select trip_id from public.trip_participants
      where user_id = auth.uid() and coalesce(status, 'active') != 'removed'
    )
  );

-- Cada usuario inserta/actualiza su propia reacción
drop policy if exists "trip_activity_reactions_upsert" on public.trip_activity_reactions;
create policy "trip_activity_reactions_insert" on public.trip_activity_reactions
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and trip_id in (
      select trip_id from public.trip_participants
      where user_id = auth.uid() and coalesce(status, 'active') != 'removed'
    )
  );

drop policy if exists "trip_activity_reactions_update" on public.trip_activity_reactions;
create policy "trip_activity_reactions_update" on public.trip_activity_reactions
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "trip_activity_reactions_delete" on public.trip_activity_reactions;
create policy "trip_activity_reactions_delete" on public.trip_activity_reactions
  for delete to authenticated
  using (user_id = auth.uid());
