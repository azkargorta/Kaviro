-- Tarifa Agency Pro personalizada por agencia (acuerdo comercial inicial)
-- Ejecutar en Supabase → SQL Editor

alter table public.agencies
  add column if not exists billing_monthly_amount_cents int null,
  add column if not exists billing_currency text not null default 'eur',
  add column if not exists stripe_price_id_monthly text null,
  add column if not exists billing_quote_notes text null;

comment on column public.agencies.billing_monthly_amount_cents is
  'Importe mensual acordado (céntimos). Ops lo fija antes del checkout.';
comment on column public.agencies.stripe_price_id_monthly is
  'Price ID de Stripe mensual exclusivo de esta agencia.';
comment on column public.agencies.billing_quote_notes is
  'Notas internas del acuerdo (visible solo en Ops).';
