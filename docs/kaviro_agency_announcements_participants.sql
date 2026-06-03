-- Los participantes del viaje pueden leer avisos del organizador (app Kaviro)
-- Ejecutar en Supabase tras kaviro_agency_features.sql

drop policy if exists "agency_announcements_participant_select" on public.agency_trip_announcements;
create policy "agency_announcements_participant_select" on public.agency_trip_announcements
  for select to authenticated
  using (
    exists (
      select 1
      from public.trip_participants tp
      where tp.trip_id = agency_trip_announcements.trip_id
        and tp.user_id = auth.uid()
        and coalesce(tp.status, 'active') <> 'removed'
    )
  );
