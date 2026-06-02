-- Tipo de enlace público: itinerario (plan) o recap (estadísticas del viaje).
alter table public.trip_shares
  add column if not exists share_kind text not null default 'itinerary';

create index if not exists trip_shares_trip_kind_active_idx
  on public.trip_shares (trip_id, share_kind)
  where revoked_at is null;
