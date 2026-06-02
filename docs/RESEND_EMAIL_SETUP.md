# Email transaccional con Resend (Kaviro)

**Decisión de proyecto:** los correos de autenticación de Kaviro (confirmar registro, recuperar contraseña, magic links que envíe Supabase Auth) se envían mediante **Resend** como proveedor SMTP, no el SMTP integrado del plan gratuito de Supabase.

| Qué | Dónde se configura |
|-----|-------------------|
| Dominio y reputación (`hola@kaviro.app`) | Resend + DNS en Cloudflare |
| Envío real de Auth emails | Supabase → Authentication → SMTP (apunta a Resend) |
| Plantillas y enlaces | Supabase → Authentication → Email templates |

No hace falta `RESEND_API_KEY` en Vercel para el flujo estándar de login/registro: la API key solo va en **Supabase SMTP**.

---

## 1. Crear cuenta y API key

1. [resend.com](https://resend.com) → registro.
2. **API Keys** → **Create API Key** → nombre p. ej. `kaviro-supabase-smtp`.
3. Permisos: **Sending access** (suficiente para SMTP).
4. **Copia la key** (`re_...`) y guárdala en un gestor de contraseñas; no se vuelve a mostrar entera.

---

## 2. Verificar el dominio en Resend

1. Resend → **Domains** → **Add Domain**.
2. Dominio: `kaviro.app` (raíz; sirve para `hola@kaviro.app` y subdominios que Resend permita).
3. Resend muestra registros DNS (SPF, DKIM, a veces MX o CNAME).

### En Cloudflare (DNS de kaviro.app)

Por cada registro que pida Resend:

| Campo en Resend | En Cloudflare |
|-----------------|---------------|
| Type (TXT / CNAME / MX) | Mismo type |
| Name / Host | Igual (a veces `send`, `resend._domainkey`, etc.) |
| Value / Target | Copiar exacto |

**Importante:** registros de email suelen ir en **DNS only** (nube **gris**, proxy desactivado), salvo que Resend indique lo contrario.

4. En Resend, **Verify** / esperar hasta estado **Verified** (minutos u horas).

---

## 3. Configurar SMTP en Supabase

Supabase → tu proyecto → **Project Settings** → **Authentication** (o **Authentication** → **SMTP Settings** según la UI).

Activa **Enable Custom SMTP** y rellena:

| Campo | Valor |
|--------|--------|
| **Host** | `smtp.resend.com` |
| **Port** | `465` (SSL) — alternativa: `587` (TLS) si 465 falla |
| **Username** | `resend` |
| **Password** | API key de Resend (`re_...`) |
| **Sender email** | `hola@kaviro.app` |
| **Sender name** | `Kaviro` |

Guarda. Opcional: botón de prueba de email si la consola lo ofrece.

**Site URL** (misma sección o URL Configuration):

```
https://www.kaviro.app
```

---

## 4. Plantillas de email en Supabase (obligatorio para Kaviro)

Sin esto, los enlaces del correo pueden fallar en móvil u otro navegador.

### Confirm signup

**Authentication** → **Email Templates** → **Confirm signup** → edita el cuerpo y sustituye el botón/enlace por:

```html
<a href="{{ .SiteURL }}/auth/verify?token_hash={{ .TokenHash }}&type=signup">Confirmar cuenta</a>
```

No uses solo `{{ .ConfirmationURL }}` (flujo PKCE frágil).

### Reset password

**Reset password**:

```html
<a href="{{ .SiteURL }}/auth/verify?token_hash={{ .TokenHash }}&type=recovery">Restablecer contraseña</a>
```

Guarda ambas plantillas.

---

## 5. Redirect URLs (recordatorio)

Deben incluir `https://www.kaviro.app/auth/verify` (y callback, recovery, reset-password). Ver `README_DEPLOY_VERCEL.md`.

---

## 6. Prueba en producción

1. Registro con un email real que no uses en prod (o alias `+test`).
2. Debe llegar correo **From:** `Kaviro <hola@kaviro.app>` (o similar).
3. Pulsar el enlace → `https://www.kaviro.app/auth/verify?...` → sesión / login OK.
4. Probar **Forgot password** con el mismo flujo.

### Si no llega el correo

- Resend → **Logs** → ver bounces o errores.
- Dominio en Resend: **Verified**.
- Supabase SMTP: sender exactamente `hola@kaviro.app` (dominio verificado).
- Carpeta spam; en beta, calienta el dominio con pocos envíos al día.

---

## 7. Límites y coste (orientativo)

- Resend free tier: ~3.000 emails/mes (revisar plan actual en resend.com).
- Supabase deja de usar el límite de ~3 emails/hora del SMTP por defecto.

---

## 8. Emails de aplicación (Kaviro Trips — invitaciones de equipo)

Además del SMTP de Supabase Auth, el servidor Next.js puede enviar correos con la **API HTTP de Resend**:

| Variable (Vercel / `.env.local`) | Uso |
|-----------------------------------|-----|
| `RESEND_API_KEY` | Obligatoria para invitaciones automáticas en `/agency/team` |
| `RESEND_FROM_EMAIL` | Opcional; por defecto `Kaviro <hola@kaviro.app>` |

Si `RESEND_API_KEY` no está definida, la invitación se crea igual y el admin puede **copiar el enlace** manualmente.

---

## Checklist rápido

- [ ] Cuenta Resend + API key
- [ ] Dominio `kaviro.app` Verified en Resend
- [ ] Registros DNS email en Cloudflare (gris)
- [ ] Supabase Custom SMTP → `smtp.resend.com`
- [ ] Sender `hola@kaviro.app`
- [ ] Plantillas signup + reset con `token_hash` + `/auth/verify`
- [ ] Site URL `https://www.kaviro.app`
- [ ] Prueba registro + reset password
- [ ] `RESEND_API_KEY` en Vercel (invitaciones Kaviro Trips)

---

*Última actualización: mayo 2026 — proveedor de email: **Resend**.*
