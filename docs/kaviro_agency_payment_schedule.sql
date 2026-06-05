-- Plan de cobro flexible por viajero (varias cuotas, importes y fechas personalizadas)
-- Ejecutar tras kaviro_agency_payment_receipts.sql

alter table public.agency_participant_payments
  add column if not exists payment_schedule jsonb null;

comment on column public.agency_participant_payments.payment_schedule is
  'Cuotas del viajero: [{ id, label, amount, dueAt, status, paidAt, paymentMethod, receiptPath, ... }]. '
  'Si es null, se derivan deposit_amount/final_amount (compatibilidad).';
