-- Viaje con Stripes: referencia en perfil (opcional, con fallback por nombre del viaje)
alter table public.profiles
  add column if not exists stripes_trip_id uuid references public.trips (id) on delete set null;

create index if not exists profiles_stripes_trip_id_idx
  on public.profiles (stripes_trip_id)
  where stripes_trip_id is not null;

comment on column public.profiles.stripes_trip_id is 'Viaje plantilla Stripes Sports Trips del usuario (Chicago + Lambeau).';
