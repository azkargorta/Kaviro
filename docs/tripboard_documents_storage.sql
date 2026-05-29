-- Bucket + políticas para documentos del viaje (Supabase Storage)
-- Path: trip-documents/<tripId>/<filename>
-- Ejecutar en el SQL Editor de Supabase si la subida desde Docs falla por RLS.

insert into storage.buckets (id, name, public)
values ('trip-documents', 'trip-documents', false)
on conflict (id) do update set public = false;

drop policy if exists "trip-documents: read if participant" on storage.objects;
create policy "trip-documents: read if participant"
on storage.objects for select
to authenticated
using (
  bucket_id = 'trip-documents'
  and exists (
    select 1
    from public.trip_participants tp
    where tp.trip_id = split_part(name, '/', 1)::uuid
      and tp.user_id = auth.uid()
      and tp.status <> 'removed'
  )
);

drop policy if exists "trip-documents: upload if participant" on storage.objects;
create policy "trip-documents: upload if participant"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'trip-documents'
  and exists (
    select 1
    from public.trip_participants tp
    where tp.trip_id = split_part(name, '/', 1)::uuid
      and tp.user_id = auth.uid()
      and tp.status <> 'removed'
  )
);

drop policy if exists "trip-documents: delete if resource manager" on storage.objects;
create policy "trip-documents: delete if resource manager"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'trip-documents'
  and exists (
    select 1
    from public.trip_participants tp
    where tp.trip_id = split_part(name, '/', 1)::uuid
      and tp.user_id = auth.uid()
      and tp.status <> 'removed'
      and (tp.role = 'owner' or tp.can_manage_resources = true)
  )
);
