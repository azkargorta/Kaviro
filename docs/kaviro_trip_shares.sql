-- Enlaces públicos (solo lectura) para itinerarios.
-- Tabla mínima para generar /share/<token>.

create table if not exists public.trip_shares (
  id bigserial primary key,
  token text not null unique,
  trip_id uuid not null references public.trips (id) on delete cascade,
  created_by_user_id uuid null references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz null,
  expires_at timestamptz null
);

create index if not exists trip_shares_trip_id_idx on public.trip_shares (trip_id);
create index if not exists trip_shares_active_idx on public.trip_shares (trip_id) where revoked_at is null;

-- RLS: la API usa service_role para todas las operaciones,
-- por lo que las políticas sólo son necesarias como capa extra de seguridad.
alter table public.trip_shares enable row level security;

-- Participantes del viaje pueden ver sus enlaces
create policy "trip_shares_select_participant" on public.trip_shares
  for select to authenticated
  using (
    trip_id in (
      select trip_id from public.trip_participants
      where user_id = auth.uid() and status != 'removed'
    )
  );

-- Cualquiera puede leer un enlace activo por token (para la página pública)
create policy "trip_shares_select_anon" on public.trip_shares
  for select to anon
  using (revoked_at is null);

