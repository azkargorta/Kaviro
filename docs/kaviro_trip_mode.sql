-- Modo de grupo: viaje completo vs solo gastos compartidos
alter table public.trips
  add column if not exists trip_mode text not null default 'travel';

alter table public.trips
  drop constraint if exists trips_trip_mode_check;

alter table public.trips
  add constraint trips_trip_mode_check check (trip_mode in ('travel', 'expenses'));

comment on column public.trips.trip_mode is
  'travel = viaje con plan/mapas; expenses = grupo de gastos (sin destino; fechas opcionales en start_date/end_date).';
