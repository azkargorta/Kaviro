-- Reparto personalizado por persona (importes distintos por deudor/pagador)
alter table public.trip_expenses
  add column if not exists owed_amounts jsonb null,
  add column if not exists paid_amounts jsonb null;

comment on column public.trip_expenses.owed_amounts is
  'Mapa nombre → importe que debe cada persona. Si es null, reparto igual entre owed_by_names.';
comment on column public.trip_expenses.paid_amounts is
  'Mapa nombre → importe pagado por cada persona. Si es null, reparto igual entre paid_by_names.';
