-- Presupuesto objetivo del viaje (widget en Resumen y Gastos)
-- Ejecutar en Supabase → SQL Editor (una sola vez)

alter table public.trips
  add column if not exists budget_target numeric;

comment on column public.trips.budget_target is
  'Importe objetivo del viaje en moneda base (base_currency).';
