# Kaviro Ops — consola de administración de plataforma

Espacio para operar Kaviro **cross-tenant** (todas las agencias, leads, comunicaciones). **No** es el panel de una agencia (`/agency`).

## Acceso (obligatorio)

Solo cuentas con **perfil de administrador de plataforma**:

1. **Tabla** `platform_admins` — `user_id` = tu UUID en `auth.users`  
   SQL: `docs/tripboard_platform_admin.sql`
2. **O** variable de entorno `KAVIRO_ADMIN_EMAILS` (emails separados por coma) en Vercel / `.env.local`

Comprobación central: `lib/platform-admin.ts` → `isPlatformAdmin()`.

### Rutas protegidas

| Ruta | Uso |
|------|-----|
| `/dashboard/admin` | Admin actual (métricas producto) |
| `/api/admin/*` | APIs admin (excepto `/api/admin/me` para comprobar rol en UI) |
| `/ops/*` | Futuro: CRM plataforma, comunicaciones |
| `/api/ops/*` | APIs Ops |

**Capas de seguridad:**

- Middleware (`lib/platform-ops-paths.ts`) — bloquea antes de renderizar
- Páginas server — `isPlatformAdmin` + redirect
- APIs — `requirePlatformAdmin()` o comprobación equivalente

Un usuario **agencia** (aunque sea admin de su agencia) **no** entra en Ops salvo que esté en `platform_admins`.

### UI

El enlace «Admin» en el menú del dashboard solo aparece si `/api/admin/me` devuelve `admin: true`.

## Ops 1 — implementado (MVP)

| Ruta | Función |
|------|---------|
| `/ops` | Resumen: agencias, leads nuevos, viajes B2B |
| `/ops/agencies` | Listado de todas las agencias |
| `/ops/agencies/[id]` | Ficha, plan, viajes, notas internas |
| `/ops/leads` | Solicitudes de `/empresa` (estado CRM) |

SQL: `docs/kaviro_platform_ops.sql` (`platform_agency_leads`, `platform_crm_notes`).

Las nuevas solicitudes de `/api/contact/agency` se guardan en BD además del email.

## Roadmap Ops (siguiente)

1. ~~CRM plataforma~~ ✅ MVP Ops 1
2. Comunicaciones — bandeja unificada de `agency_email_log` + más
3. Salud operativa — alertas cobros, firmas, migraciones
4. Soporte — vista read-only cross-tenant (con auditoría)

Ver también `docs/kaviro_trips_agency_roadmap.md` (features por agencia).

---

*Junio 2026*
