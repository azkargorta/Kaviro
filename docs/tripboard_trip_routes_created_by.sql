-- Opcional: columna de autor en rutas (el código ya funciona sin ella).
alter table public.trip_routes
  add column if not exists created_by_user_id uuid references auth.users (id) on delete set null;
