-- Visibilidad de documentos en trip_resources
-- trip = todos los viajeros | private = solo quien sube | selected = lista de user_id

alter table public.trip_resources
  add column if not exists visibility text not null default 'trip';

alter table public.trip_resources
  drop constraint if exists trip_resources_visibility_check;

alter table public.trip_resources
  add constraint trip_resources_visibility_check
  check (visibility in ('trip', 'private', 'selected'));

alter table public.trip_resources
  add column if not exists visible_to_user_ids uuid[] not null default '{}'::uuid[];

create index if not exists trip_resources_visibility_idx
  on public.trip_resources (trip_id, visibility);
