-- Logos de agencia (portal cliente / branding)
-- Bucket público: las URLs se guardan en agencies.logo_url

insert into storage.buckets (id, name, public)
values ('agency-logos', 'agency-logos', true)
on conflict (id) do update set public = true;

-- Path: "{agency_id}/logo.{ext}"

drop policy if exists "agency-logos: upload admin" on storage.objects;
create policy "agency-logos: upload admin"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'agency-logos'
  and public.is_agency_admin(split_part(name, '/', 1)::uuid)
);

drop policy if exists "agency-logos: update admin" on storage.objects;
create policy "agency-logos: update admin"
on storage.objects for update
to authenticated
using (
  bucket_id = 'agency-logos'
  and public.is_agency_admin(split_part(name, '/', 1)::uuid)
)
with check (
  bucket_id = 'agency-logos'
  and public.is_agency_admin(split_part(name, '/', 1)::uuid)
);

drop policy if exists "agency-logos: delete admin" on storage.objects;
create policy "agency-logos: delete admin"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'agency-logos'
  and public.is_agency_admin(split_part(name, '/', 1)::uuid)
);

-- Lectura pública (portal cliente y URLs en agencies.logo_url)
drop policy if exists "agency-logos: public read" on storage.objects;
create policy "agency-logos: public read"
on storage.objects for select
to public
using (bucket_id = 'agency-logos');
