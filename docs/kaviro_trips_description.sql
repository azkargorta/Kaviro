-- Notas generales del viaje (texto libre para el grupo en Plan)
-- Ejecutar en Supabase → SQL Editor (una sola vez)

alter table public.trips
  add column if not exists description text;

alter table public.trips
  drop constraint if exists trips_description_length_chk;

alter table public.trips
  add constraint trips_description_length_chk
  check (description is null or char_length(description) <= 10000);

comment on column public.trips.description is
  'Notas del viaje visibles en Plan (texto libre, máx. 10 000 caracteres). Distinto de la descripción de cada actividad.';
