# Kaviro

**Kaviro** es la web app para **organizar viajes en grupo** (el repositorio se llama TripBoard por legado interno): plan/itinerario, rutas sobre mapa, gastos + balances, documentos/recursos, participantes y (en Premium) **asistente personal** + análisis de documentos.

## Stack

- **Next.js 14** (App Router) + **React 18** + **TypeScript**
- **Supabase** (Auth + DB + Storage)
- **Stripe** (suscripciones Premium)
- **Mapas**: OpenStreetMap + Leaflet + OSRM + Photon (Komoot)
- **Asistente / modelo**: Gemini (y opción local con Ollama)
- **OCR**: OCR.Space (opcional)

## Rutas importantes

- Landing pública: `/`
- Precios: `/pricing`
- Acceso: `/auth/login`, `/auth/register`
- Dashboard: `/dashboard`
- Cuenta/Premium: `/account`

## Local: cómo arrancar

1) Instala dependencias

```bash
npm install
```

2) Crea tu `.env.local` (usa `.env.example` como base)

3) Arranca dev server

```bash
npm run dev
```

## Scripts

- `npm run dev`: desarrollo
- `npm run build`: build
- `npm run start`: producción local
- `npm run typecheck`: TypeScript sin emitir
- `npm run lint`: ESLint (Next.js); falla solo con errores, no con warnings
- `npm test`: tests unitarios (vitest)
- `npm run test:e2e`: Playwright (smoke público; con `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` también flujos autenticados)

## Variables de entorno

Consulta `.env.example`. Mínimo para que la app funcione:

- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- (Opcional) Stripe/Premium: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_MONTHLY`, `STRIPE_PRICE_ID_YEARLY`
- (Opcional) Asistente: `AI_PROVIDER`, `GEMINI_API_KEY`
- (Opcional) OCR: `OCR_SPACE_API_KEY`

## Precios mostrados en la UI

- Premium mensual: **3,99€ / mes**
- Premium anual: **39,99€ / año**

Nota: el cobro real lo determina Stripe (Price IDs).

## CI

Workflow en `.github/workflows/ci.yml` (push/PR a `main` o `master`):

1. `npm run typecheck`
2. `npm run lint`
3. `npm test` (Vitest)
4. `npm run test:e2e` (Playwright; secrets `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` opcionales en el repo)

## Marca

La app se llama **Kaviro** en toda la UI. Convenciones y legado interno: `docs/BRANDING.md`.

## Despliegue (Vercel)

Revisa `README_DEPLOY_VERCEL.md` para configuración de Supabase (URLs de redirect) y variables.

