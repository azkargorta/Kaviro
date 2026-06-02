# Kaviro — Modo Agencia Pro

Plan de producto (PDF interno, junio 2026). Este documento enlaza el SQL y el código del repo.

## Resumen

Capa B2B encima del producto actual: la agencia gestiona viajes en `/agency`, el cliente ve el programa en `/client/{agency-slug}/{trip-slug}` con branding, sin reescribir plan/gastos/rutas.

## Bloques

| # | Bloque | Estado en repo |
|---|--------|----------------|
| 1 | BD: `agencies`, `agency_members`, `trips.agency_id`, portales | SQL: [`kaviro_agency_mode.sql`](./kaviro_agency_mode.sql) |
| 2 | Panel `/agency` | En repo |
| 3 | Plantillas (`agency_templates` + duplicar viaje) | En repo (`/agency/templates`) |
| 4 | Portal `/client/[agency]/[trip]` | En repo (`lib/load-agency-client-portal.ts`) |
| 5 | Branding (logo, color) | Pendiente (`lib/brand.ts` + Storage) |
| 6 | Stripe Agencia Pro | Pendiente (`AGENCY_PRO_PRICE_ID`) |

## Semana 1 (bloqueantes)

1. Ejecutar `kaviro_agency_mode.sql` en Supabase.
2. Crear producto Stripe «Kaviro Agencia Pro» (29€ / 49€).
3. Seed agencia de prueba: [`kaviro_agency_seed_tripboard.sql`](./kaviro_agency_seed_tripboard.sql) (`tripboardcomp@gmail.com`).

## Lo que ya existe (~70 %)

- Roles `owner` / `editor` / `viewer` en viajes
- `trip_shares` + `/share/[token]` (recap / itinerario)
- Duplicar viaje: `/api/trips/[id]/duplicate`
- Import dossier IA (`agencyCalendarParse`)
- Premium por viaje / usuario (`lib/entitlements.ts`)

## Entrada: modo personal vs modo empresa

| Acceso | URL | Destino tras login |
|--------|-----|-------------------|
| **Viajero (B2C)** | `kaviro.app/auth/login` | `/dashboard` |
| **Agencia (B2B)** | `kaviro.app/empresa` → contacto o login si ya tienes acceso | `/auth/login?mode=agency` → `/agency` solo con `agency_members` |

- **`/empresa`**: landing pública solo para agencias (sin mezclar con el home de viajeros).
- **`/agency/*`**: shell propio (sidebar azul marino, sin barra coral del dashboard).
- **Conmutador**: en el panel agencia → «Modo personal»; en el menú cuenta del dashboard → «Panel de agencia» (si eres miembro).
- **`localStorage` `kaviro_workspace_mode`**: recuerda el último contexto (`personal` | `agency`).

Misma cuenta Supabase para ambos modos; lo que cambia es la **ruta y el permiso** (`agency_members` + `trips.agency_id`).

## Código del Bloque 2 (en repo)

- `app/agency/` — panel (viajes, equipo, branding, plantillas stub)
- `app/empresa/` — landing de acceso
- `app/api/agencies/me` — ¿tengo agencia?
- `app/api/agencies/trips` — crear viaje con `agency_id`
- `lib/require-agency.ts`, `lib/workspace-mode.ts`

## Portal cliente (Bloque 4)

- URL: `/client/{slug-agencia}/{slug-viaje}` (ej. `/client/stripes/chicago-2026`)
- Requiere `trips.client_portal_slug` y fila activa en `agency_client_portals` (o solo slug en viaje)
- Enlace desde tarjeta del viaje en `/agency` → «Portal cliente»

## Próximo código

- Bloque 3: UI plantillas + duplicar desde plantilla
- Bloque 5: subir logo y color en `/agency/branding`
- Bloque 6: checkout Stripe Agencia Pro

## Precio orientativo

29 €/mes (hasta 3 miembros) · 49 €/mes (hasta 10 miembros).
