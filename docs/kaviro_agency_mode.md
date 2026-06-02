# Kaviro — Modo Agencia Pro

Plan de producto (PDF interno, junio 2026). Este documento enlaza el SQL y el código del repo.

## Resumen

Capa B2B encima del producto actual: la agencia gestiona viajes en `/agency`, el cliente ve el programa en `/client/{agency-slug}/{trip-slug}` con branding, sin reescribir plan/gastos/rutas.

## Bloques

| # | Bloque | Estado en repo |
|---|--------|----------------|
| 1 | BD: `agencies`, `agency_members`, `trips.agency_id`, portales | SQL: [`kaviro_agency_mode.sql`](./kaviro_agency_mode.sql) |
| 2 | Panel `/agency` | Pendiente |
| 3 | Plantillas (`agency_templates` + duplicar viaje) | Tabla en SQL; UI pendiente |
| 4 | Portal `/client/[agency]/[trip]` | Pendiente (base: `trip_shares`, `/share/[token]`) |
| 5 | Branding (logo, color) | Pendiente (`lib/brand.ts` + Storage) |
| 6 | Stripe Agencia Pro | Pendiente (`AGENCY_PRO_PRICE_ID`) |

## Semana 1 (bloqueantes)

1. Ejecutar `kaviro_agency_mode.sql` en Supabase.
2. Crear producto Stripe «Kaviro Agencia Pro» (29€ / 49€).
3. Seed manual agencia Stripes (comentarios al final del SQL).

## Lo que ya existe (~70 %)

- Roles `owner` / `editor` / `viewer` en viajes
- `trip_shares` + `/share/[token]` (recap / itinerario)
- Duplicar viaje: `/api/trips/[id]/duplicate`
- Import dossier IA (`agencyCalendarParse`)
- Premium por viaje / usuario (`lib/entitlements.ts`)

## Próximo código

- `lib/agency.ts` — helpers servidor
- `app/agency/page.tsx` — lista de viajes por `agency_id`
- `app/client/[agency]/[trip]/page.tsx` — portal con branding

## Precio orientativo

29 €/mes (hasta 3 miembros) · 49 €/mes (hasta 10 miembros).
