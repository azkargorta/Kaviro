# Kaviro Trips

Producto B2B de Kaviro para agencias y organizadores (PDF interno, junio 2026). Constante en código: `KAVIRO_TRIPS_PRODUCT_NAME` en `lib/brand.ts`.

## Resumen

Capa B2B encima de Kaviro (B2C): la agencia gestiona viajes en `/agency`, el cliente ve el programa en `/client/{agency-slug}/{trip-slug}` con branding, sin reescribir plan/gastos/rutas.

## Bloques

| # | Bloque | Estado en repo |
|---|--------|----------------|
| 1 | BD: `agencies`, `agency_members`, `trips.agency_id`, portales | SQL: [`kaviro_agency_mode.sql`](./kaviro_agency_mode.sql) |
| 2 | Panel `/agency` | En repo |
| 3 | Plantillas (`agency_templates` + duplicar viaje) | En repo (`/agency/templates`) |
| 4 | Portal `/client/[agency]/[trip]` | En repo (`lib/load-agency-client-portal.ts`) |
| 5 | Branding (logo, color) | En repo (`/agency/branding` + `kaviro_agency_logos_storage.sql`) |
| 6 | Comercial (precio / cupo perfiles) | **Manual** — sin checkout público |
| 7 | Funciones operativas B2B | SQL: [`kaviro_agency_features.sql`](./kaviro_agency_features.sql) |

## Semana 1 (bloqueantes)

1. Ejecutar `kaviro_agency_mode.sql` en Supabase.
2. Ejecutar `kaviro_agency_features.sql` (invitaciones, métricas, avisos, docs en portal).
3. Seed agencia de prueba: [`kaviro_agency_seed_tripboard.sql`](./kaviro_agency_seed_tripboard.sql) (`tripboardcomp@gmail.com`).

## Lo que ya existe (~70 %)

- Roles `owner` / `editor` / `viewer` en viajes
- `trip_shares` + `/share/[token]` (recap / itinerario)
- Duplicar viaje: `/api/trips/[id]/duplicate`
- Import dossier IA (`agencyCalendarParse`)
- Premium por viaje / usuario (`lib/entitlements.ts`)

## Entrada: Kaviro (personal) vs Kaviro Trips

| Acceso | URL | Destino tras login |
|--------|-----|-------------------|
| **Kaviro (B2C)** | `kaviro.app/auth/login` | `/dashboard` |
| **Kaviro Trips (B2B)** | `kaviro.app/empresa` → contacto o login si ya tienes acceso | `/auth/login?mode=agency` → `/agency` solo con `agency_members` |

- **`/empresa`**: landing pública de Kaviro Trips (sin mezclar con el home de viajeros).
- **`/agency/*`**: panel Kaviro Trips (clase CSS `kaviro-trips-workspace`: tokens navy en botones y acentos).
- **Login B2B**: `/auth/login?mode=agency` — panel izquierdo navy (no coral).
- **Conmutador**: en el panel → «Modo personal»; en el dashboard → «Kaviro Trips» (si eres miembro).
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

## Experiencia dentro del viaje (Kaviro Trips)

Si `trips.agency_id` está definido:

- **Menú:** Plan · Rutas · Docs · Equipo · Herramientas IA · Ajustes (sin Resumen, Gastos, Mensajes).
- **Entrada por defecto:** `/trip/{id}/plan` (el Resumen redirige).
- **Oculto:** clima, RSVP/reacciones, onboarding, viaje demo, botón flotante IA (usar pestaña).
- **Cabecera:** azul marino corporativo + enlace al panel y portal cliente.

Código: `lib/kaviro-trips-trip-nav.ts`, `TripWorkspaceContext`, `TripAgencyRouteGuard`.

## Branding (Bloque 5)

1. Ejecutar `kaviro_agency_logos_storage.sql` en Supabase.
2. Panel → **Branding**: nombre, logo, color, email de contacto (solo admin).

## Comercial (sin precio fijo en producto)

- Precio y **número de perfiles** se negocian caso a caso (`agencies.max_members` en BD).
- No hay pantalla de checkout Stripe para agencias en esta fase.
- Alta de agencia: contacto en `/empresa` → acuerdo → fila en `agencies` + `agency_members`.

## Funciones B2B en repo (`kaviro_agency_features.sql`)

- **Invitaciones de equipo** — email automático + enlace `/agency/join?token=…` (requiere `RESEND_API_KEY` en Vercel).
- **Clientes** — `/agency/clients` (CRM ligero, vinculable al crear viaje).
- **Publicar / ocultar portal** — borrador hasta «Publicar» (`agency_client_portals.is_active`).
- **PDF del programa** — `/client/{agencia}/{viaje}/pdf`.
- **Avisos al grupo** — visibles en portal (Ajustes del viaje o panel).
- **Documentos en portal** — marcar en Docs → «Visible en portal cliente».
- **Métricas** — vistas del portal (30 días) en el panel `/agency`.
## Próximo código (opcional)

- Dominio propio del portal (`custom_domain`).
- Roles solo-lectura en viaje y auditoría ampliada.
