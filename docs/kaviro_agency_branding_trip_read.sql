-- Viajeros invitados pueden leer nombre/logo/color de la agencia del viaje (opcional si la app usa service role).
-- Ejecutar en Supabase → SQL Editor si prefieres RLS en lugar de lectura vía API.

drop policy if exists "agencies_select_trip_participant" on public.agencies;
create policy "agencies_select_trip_participant" on public.agencies
  for select to authenticated
  using (
    exists (
      select 1
      from public.trips t
      inner join public.trip_participants tp on tp.trip_id = t.id
      where t.agency_id = agencies.id
        and tp.user_id = auth.uid()
        and coalesce(tp.status, 'active') <> 'removed'
    )
  );
