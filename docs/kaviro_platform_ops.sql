-- Kaviro Ops — CRM plataforma (leads + notas internas)
-- Ejecutar en Supabase → SQL Editor (tras tripboard_platform_admin.sql)
-- Solo acceso vía service role en APIs /api/ops/* (administradores de plataforma).

create table if not exists public.platform_agency_leads (
  id uuid primary key default gen_random_uuid(),
  contact_name text not null,
  agency_name text not null,
  email text not null,
  groups_per_year text null,
  message text null,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'qualified', 'converted', 'rejected')),
  agency_id uuid null references public.agencies (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists platform_agency_leads_status_idx
  on public.platform_agency_leads (status, created_at desc);

create index if not exists platform_agency_leads_email_idx
  on public.platform_agency_leads (email);

create table if not exists public.platform_crm_notes (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid null references public.agencies (id) on delete cascade,
  lead_id uuid null references public.platform_agency_leads (id) on delete cascade,
  author_user_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  check (
    (agency_id is not null and lead_id is null)
    or (agency_id is null and lead_id is not null)
  )
);

create index if not exists platform_crm_notes_agency_idx
  on public.platform_crm_notes (agency_id, created_at desc);

create index if not exists platform_crm_notes_lead_idx
  on public.platform_crm_notes (lead_id, created_at desc);

alter table public.platform_agency_leads enable row level security;
alter table public.platform_crm_notes enable row level security;

-- Sin políticas para authenticated: lectura/escritura solo service role en servidor.
