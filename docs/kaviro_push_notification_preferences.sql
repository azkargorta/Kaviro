-- Preferencias de notificaciones push por usuario
-- Ejecutar en Supabase → SQL Editor (después de kaviro_push_subscriptions.sql)

create table if not exists public.push_notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default true,
  activity_added boolean not null default true,
  activity_edited boolean not null default true,
  expense_added boolean not null default true,
  participant_joined boolean not null default true,
  trip_starts_tomorrow boolean not null default true,
  trip_invite boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.push_notification_preferences enable row level security;

drop policy if exists "push_notification_preferences_select_own" on public.push_notification_preferences;
create policy "push_notification_preferences_select_own"
  on public.push_notification_preferences
  for select using (auth.uid() = user_id);

drop policy if exists "push_notification_preferences_insert_own" on public.push_notification_preferences;
create policy "push_notification_preferences_insert_own"
  on public.push_notification_preferences
  for insert with check (auth.uid() = user_id);

drop policy if exists "push_notification_preferences_update_own" on public.push_notification_preferences;
create policy "push_notification_preferences_update_own"
  on public.push_notification_preferences
  for update using (auth.uid() = user_id);
