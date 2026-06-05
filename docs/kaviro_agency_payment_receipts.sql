-- Kaviro Trips — justificantes de cobro y pagos manuales (transferencia, efectivo…)
-- Ejecutar en Supabase → SQL Editor (tras kaviro_agency_payments.sql)

alter table public.agency_participant_payments
  add column if not exists deposit_payment_method text null
    check (deposit_payment_method is null or deposit_payment_method in ('stripe', 'transfer', 'cash', 'bizum', 'other')),
  add column if not exists final_payment_method text null
    check (final_payment_method is null or final_payment_method in ('stripe', 'transfer', 'cash', 'bizum', 'other')),
  add column if not exists deposit_receipt_path text null,
  add column if not exists deposit_receipt_name text null,
  add column if not exists deposit_receipt_mime text null,
  add column if not exists final_receipt_path text null,
  add column if not exists final_receipt_name text null,
  add column if not exists final_receipt_mime text null,
  add column if not exists deposit_manual_notes text null,
  add column if not exists final_manual_notes text null,
  add column if not exists deposit_recorded_by uuid null references auth.users (id) on delete set null,
  add column if not exists final_recorded_by uuid null references auth.users (id) on delete set null;

comment on column public.agency_participant_payments.deposit_payment_method is
  'Origen del cobro de señal: stripe (checkout), transfer, cash, bizum, other.';
comment on column public.agency_participant_payments.final_payment_method is
  'Origen del cobro final.';

-- Bucket privado para justificantes (PDF, imágenes)
insert into storage.buckets (id, name, public)
values ('agency-payment-receipts', 'agency-payment-receipts', false)
on conflict (id) do nothing;

-- Lectura: miembros de la agencia del viaje
drop policy if exists "agency-payment-receipts: read" on storage.objects;
create policy "agency-payment-receipts: read"
on storage.objects for select
to authenticated
using (
  bucket_id = 'agency-payment-receipts'
  and exists (
    select 1
    from public.trips t
    inner join public.agency_members am on am.agency_id = t.agency_id
    where t.id = (split_part(name, '/', 1))::uuid
      and am.user_id = auth.uid()
  )
);

-- Subida: miembros de la agencia del viaje
drop policy if exists "agency-payment-receipts: upload" on storage.objects;
create policy "agency-payment-receipts: upload"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'agency-payment-receipts'
  and exists (
    select 1
    from public.trips t
    inner join public.agency_members am on am.agency_id = t.agency_id
    where t.id = (split_part(name, '/', 1))::uuid
      and am.user_id = auth.uid()
  )
);
