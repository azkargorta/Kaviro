-- Seed: agencia de prueba para tripboardcomp@gmail.com
-- Ejecutar DESPUÉS de kaviro_agency_mode.sql
-- Requiere que el usuario ya exista en auth.users (registro previo en Kaviro).

insert into public.agencies (name, slug, owner_id, plan, brand_color, contact_email, max_members)
select
  'TripBoard',
  'tripboard',
  u.id,
  'partnership',
  '#1e3a5f',
  'tripboardcomp@gmail.com',
  10
from auth.users u
where lower(u.email) = lower('tripboardcomp@gmail.com')
on conflict (slug) do update
set
  owner_id = excluded.owner_id,
  contact_email = excluded.contact_email,
  plan = excluded.plan,
  updated_at = now();

insert into public.agency_members (agency_id, user_id, role)
select a.id, a.owner_id, 'admin'
from public.agencies a
where a.slug = 'tripboard'
on conflict (agency_id, user_id) do update set role = 'admin';

-- Comprobar (debe devolver 1 fila):
-- select a.name, a.slug, u.email
-- from public.agencies a
-- join auth.users u on u.id = a.owner_id
-- where a.slug = 'tripboard';
