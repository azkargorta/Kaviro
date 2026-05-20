# Cambiar el precio de Premium (Stripe)

## Por qué Stripe no te deja “editar” el precio

En Stripe, un **Price** (`price_…`) es **inmutable**: no puedes cambiar el importe ni el intervalo si ya hay **suscripciones activas** usando ese Price. El Dashboard muestra un error del estilo *“This price cannot be edited because it is used by active subscriptions”*.

Eso es normal. La forma correcta es **crear precios nuevos** y apuntar la app (y, si quieres, los clientes actuales) a esos IDs.

## Nuevos clientes (checkout)

1. En [Stripe Dashboard](https://dashboard.stripe.com) → **Productos** → tu producto Premium.
2. **Añadir otro precio** (no editar el antiguo):
   - Mensual: importe nuevo, recurrente cada mes.
   - Anual: importe nuevo, recurrente cada año.
3. Copia los nuevos IDs (`price_…`).
4. En **Vercel** (o `.env.local`), actualiza:
   - `STRIPE_PRICE_ID_MONTHLY` → ID del precio mensual **nuevo**
   - `STRIPE_PRICE_ID_YEARLY` → ID del precio anual **nuevo**
5. En el código, actualiza los textos visibles en `lib/pricing-public.ts` (`PRICING_PRICES`) para que coincidan con lo que cobra Stripe.
6. Redeploy. Los **nuevos** checkouts usarán el precio nuevo.

Los Price viejos pueden quedarse archivados en Stripe; no hace falta borrarlos.

## Clientes que ya tienen suscripción activa

Tienen el **Price antiguo** ligado a su suscripción hasta que lo cambies.

| Estrategia | Qué pasa |
|----------|----------|
| **Solo precio nuevo para altas** | Quien ya paga sigue al precio antiguo; solo entran al nuevo precio quienes se suscriban después del cambio de env. |
| **Migrar todos al nuevo precio** | Actualizas cada `subscription` en Stripe al nuevo `price_…` (ver script más abajo). |
| **Migrar solo al renovar** | En Stripe puedes programar el cambio al final del período (`proration_behavior: none`). |

Quien ya es Premium **no pasa por checkout otra vez**; el cobro lo marca Stripe en la suscripción existente.

## Migración masiva (script opcional)

Con `STRIPE_SECRET_KEY` en el entorno:

```bash
# Simulación: lista qué suscripciones se actualizarían
node scripts/stripe-migrate-subscription-prices.mjs \
  --old-monthly=price_ANTIGUO_MENSUAL \
  --old-yearly=price_ANTIGUO_ANUAL \
  --new-monthly=price_NUEVO_MENSUAL \
  --new-yearly=price_NUEVO_ANUAL \
  --dry-run

# Aplicar (cambio en la próxima factura, sin prorrateo inmediato)
node scripts/stripe-migrate-subscription-prices.mjs \
  --old-monthly=price_ANTIGUO_MENSUAL \
  --old-yearly=price_ANTIGUO_ANUAL \
  --new-monthly=price_NUEVO_MENSUAL \
  --new-yearly=price_NUEVO_ANUAL

# Aplicar con prorrateo (cobro/abono proporcional ya)
node scripts/stripe-migrate-subscription-prices.mjs \
  ...mismos args... \
  --prorate
```

También puedes migrar una a una en Stripe → **Suscripciones** → abrir suscripción → **Actualizar suscripción** → cambiar el ítem al Price nuevo.

## Checklist rápido

- [ ] Crear **nuevos** Price en Stripe (mensual y anual).
- [ ] Actualizar `STRIPE_PRICE_ID_MONTHLY` y `STRIPE_PRICE_ID_YEARLY` en Vercel.
- [ ] Actualizar `PRICING_PRICES` en `lib/pricing-public.ts`.
- [ ] Redeploy.
- [ ] (Opcional) Migrar suscripciones activas al nuevo Price.
- [ ] Comprobar un checkout de prueba en modo test antes de producción.

## Relación UI ↔ Stripe

| Dónde | Qué controla |
|-------|----------------|
| `STRIPE_PRICE_ID_*` | Importe real del checkout y renovaciones **nuevas** |
| `lib/pricing-public.ts` | Texto en `/pricing`, cuenta, landing |
| Suscripción existente en Stripe | Importe de quien ya paga hasta que migres |
