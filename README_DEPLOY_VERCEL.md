# Kaviro - despliegue limpio en Vercel

## Qué se ha limpiado
- Se ha eliminado `node_modules/`
- Se ha eliminado `.next/`
- Se ha eliminado `.env.local`
- Se ha eliminado `middleware.ts` / `middleware.ts.bak`
- Se ha dejado `app/page.tsx` mínimo para validar la home
- `app/api/document/analyze/route.ts` ya usa `runtime = "nodejs"`
- `app/api/expense/analyze/route.ts` ya usa `runtime = "nodejs"`
- `package.json` está fijado a Next 14.2.33 / React 18.3.1

## Qué tienes que hacer ahora
1. Sustituye tu repo por este contenido.
2. Ejecuta `npm install`.
3. Sube a GitHub.
4. En Vercel crea un proyecto nuevo o redeploy limpio.
5. Añade estas variables en Vercel (Production y Preview):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `STRIPE_PRICE_ID_MONTHLY` / `STRIPE_PRICE_ID_YEARLY` (si cambias precio con suscripciones activas, crea Price nuevos en Stripe — ver `docs/STRIPE_CAMBIAR_PRECIOS.md`)
   - `OCR_SPACE_API_KEY`
   - `AI_PROVIDER` (opcional; por defecto `gemini`)
   - `GEMINI_API_KEY` (si usas el asistente con Gemini)
   - `GEMINI_MODEL` (opcional)
   - `AI_USER_MONTHLY_BUDGET_EUR` (opcional)
   - `AI_ENHANCE_ANALYSIS` (opcional)
   - `NEXT_PUBLIC_APP_URL` y `NEXT_PUBLIC_SITE_URL` (producción: `https://www.kaviro.app`)
   - `KAVIRO_ADMIN_EMAILS` (opcional; `TRIPBOARD_ADMIN_EMAILS` legado)
6. **Email (Resend):** los correos de Auth los envía **Resend** vía SMTP de Supabase. Guía paso a paso: [`docs/RESEND_EMAIL_SETUP.md`](docs/RESEND_EMAIL_SETUP.md). Remitente: `hola@kaviro.app`.
7. En Supabase > Authentication > URL Configuration:
   - Site URL: `https://www.kaviro.app` (o tu dominio canónico)
   - Redirect URLs:
     - `https://www.kaviro.app/auth/callback`
     - `https://www.kaviro.app/auth/recovery`
     - `https://www.kaviro.app/auth/reset-password`
     - `https://www.kaviro.app/auth/verify`
     - `http://localhost:3000/auth/callback`
     - `http://localhost:3000/auth/recovery`
     - `http://localhost:3000/auth/reset-password`
     - `http://localhost:3000/auth/verify`

8. **Recuperación de contraseña (importante):** en Supabase → **Authentication → Email templates** → **Reset password**, sustituye el enlace del botón por uno que use `token_hash` (no depende de PKCE ni del mismo navegador). Ejemplo:

   ```html
   <a href="{{ .SiteURL }}/auth/verify?token_hash={{ .TokenHash }}&type=recovery">Restablecer contraseña</a>
   ```

   Sin este cambio, el correo seguirá llevando el flujo antiguo (`?code=` + PKCE) y verás errores de verificador.

9. **Confirmar registro (crear cuenta):** en **Email templates** → **Confirm signup**, sustituye `{{ .ConfirmationURL }}` por un enlace con `token_hash` (evita quedarse en «Validando enlace…» en `/auth/callback`). Ejemplo:

   ```html
   <a href="{{ .SiteURL }}/auth/verify?token_hash={{ .TokenHash }}&type=signup">Confirmar cuenta</a>
   ```

## Middleware
- Hay `middleware.ts` en la raíz limitado a rutas `/auth/*` para refrescar cookies de Supabase (necesario tras `/auth/verify` y para que `updateUser` en reset no se quede colgado).

## Comprobaciones tras desplegar
1. `/` debe abrir la home simple.
2. `/auth/login` debe cargar.
3. `/dashboard` debe cargar o redirigir según la lógica interna.
4. Si todo va bien, el siguiente paso es restaurar `app/page.tsx` y luego el middleware.
