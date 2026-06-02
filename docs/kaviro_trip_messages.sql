-- Chat de grupo por viaje (mensajes entre participantes).

create table if not exists public.trip_messages (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0 and char_length(body) <= 4000),
  created_at timestamptz not null default now()
);

create index if not exists trip_messages_trip_created_idx
  on public.trip_messages (trip_id, created_at desc);

alter table public.trip_messages enable row level security;

drop policy if exists "trip_messages_select_participant" on public.trip_messages;
create policy "trip_messages_select_participant"
  on public.trip_messages for select to authenticated
  using (
    trip_id in (
      select trip_id from public.trip_participants
      where user_id = auth.uid() and status != 'removed'
    )
  );

drop policy if exists "trip_messages_insert_participant" on public.trip_messages;
create policy "trip_messages_insert_participant"
  on public.trip_messages for insert to authenticated
  with check (
    user_id = auth.uid()
    and trip_id in (
      select trip_id from public.trip_participants
      where user_id = auth.uid() and status != 'removed'
    )
  );

-- Realtime
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'trip_messages'
  ) then
    alter publication supabase_realtime add table public.trip_messages;
  end if;
end $$;
