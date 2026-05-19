-- Favoritos de viajes por usuario (ejecutar en Supabase SQL Editor)

alter table public.trip_participants
  add column if not exists is_favorite boolean not null default false;

create index if not exists trip_participants_is_favorite_idx
  on public.trip_participants (user_id, is_favorite)
  where is_favorite = true;

comment on column public.trip_participants.is_favorite is 'El participante ha marcado este viaje como favorito personal.';
