-- Ciudades de alojamiento por tramo de fechas (previsión meteorológica en Resumen)
-- Ejecutar en Supabase → SQL Editor (una sola vez)

alter table public.trips
  add column if not exists weather_stays jsonb;

comment on column public.trips.weather_stays is
  'Array JSON: [{ "city": "Honfleur", "start_date": "2026-06-10", "end_date": "2026-06-12" }, ...]';
