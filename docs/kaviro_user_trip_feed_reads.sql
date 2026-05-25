-- Lecturas de novedades del viaje (feed de auditoría) por usuario
-- Persiste entre dispositivos y despliegues (a diferencia de localStorage)
-- Ejecutar en Supabase → SQL Editor

create table if not exists public.user_trip_feed_reads (
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid not null references public.trips(id) on delete cascade,
  audit_log_id uuid not null,
  read_at timestamptz not null default now(),
  primary key (user_id, trip_id, audit_log_id)
);

create index if not exists idx_user_trip_feed_reads_user_trip
  on public.user_trip_feed_reads (user_id, trip_id);

alter table public.user_trip_feed_reads enable row level security;

drop policy if exists "user_trip_feed_reads_select_own" on public.user_trip_feed_reads;
create policy "user_trip_feed_reads_select_own"
  on public.user_trip_feed_reads for select using (auth.uid() = user_id);

drop policy if exists "user_trip_feed_reads_insert_own" on public.user_trip_feed_reads;
create policy "user_trip_feed_reads_insert_own"
  on public.user_trip_feed_reads for insert with check (auth.uid() = user_id);

-- Refuerzo política update notificaciones (persistencia read_at)
drop policy if exists "user_notifications_update_own" on public.user_notifications;
create policy "user_notifications_update_own"
  on public.user_notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
