# Agency Pro — prueba end-to-end (Stripe)

Guía para activar y verificar el flujo B2B: **registro agencia → Ops asigna tarifa → pago → plan `agency_pro`**.

## 1. Supabase (SQL)

Ejecutar si aún no están aplicados (comprobar en [/ops/migrations](/ops/migrations) o `docs/SQL_PRODUCCION_VERIFICACION.sql`):

| Script | Obligatorio |
|--------|-------------|
| `docs/kaviro_agency_mode.sql` | Sí |
| `docs/kaviro_platform_ops.sql` | Sí (Ops + leads) |
| `docs/kaviro_agency_custom_pricing.sql` | Sí (columnas tarifa por agencia) |

## 2. Stripe Dashboard

### Producto Agency Pro

1. **Productos** → Crear producto, p. ej. `Kaviro Agency Pro` (recurrente mensual).
2. Copiar el **Product ID** (`prod_…`) → variable `STRIPE_AGENCY_PRODUCT_ID`.

No hace falta crear un precio fijo global: Ops crea un **Price por agencia** al guardar la tarifa.

### Webhook

En **Developers → Webhooks** (mismo modo test/live que las claves):

- **URL:** `https://TU_DOMINIO/api/billing/webhook`
- **Eventos mínimos:**
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`

Copiar el **Signing secret** → `STRIPE_WEBHOOK_SECRET`.

### Portal de facturación (opcional)

**Settings → Billing → Customer portal** — habilitar gestión de suscripción y facturas (para «Gestionar suscripción» en `/agency/plan`).

## 3. Variables en Vercel

| Variable | Uso |
|----------|-----|
| `STRIPE_SECRET_KEY` | API Stripe (test o live) |
| `STRIPE_WEBHOOK_SECRET` | Firma del webhook |
| `STRIPE_AGENCY_PRODUCT_ID` | Producto `prod_…` para precios por agencia |
| `STRIPE_AGENCY_PRICE_ID_MONTHLY` | Opcional (legacy: precio único si no hay tarifa por agencia) |
| `NEXT_PUBLIC_APP_URL` | `https://kaviro.app` (URLs de checkout/portal) |
| `RESEND_API_KEY` | Emails Ops al registrar agencia |
| `KAVIRO_ADMIN_EMAILS` | Destinatarios alertas Ops |

Redeploy tras cambiar variables.

## 4. Flujo de prueba (modo test)

### A — Registro agencia

1. Usuario nuevo → `/agency/setup` (o `/empresa` → crear agencia).
2. Completar formulario → trial 14 días.
3. **Ops:** campana + email «Nueva agencia en prueba» (si `RESEND_API_KEY` está configurada).

### B — Asignar tarifa (Ops)

1. `/ops/agencies` → abrir la agencia.
2. Sección **Tarifa Agency Pro** → importe, p. ej. `89` €/mes → **Guardar tarifa y crear en Stripe**.
3. Debe aparecer `Price: price_…` en la ficha.
4. **Agencia:** el owner recibe notificación «Tu tarifa Agency Pro está lista».

Si falla al guardar:

- `Falta STRIPE_AGENCY_PRODUCT_ID` → configurar en Vercel y redeploy.
- Error Stripe → revisar claves test/live y que el producto exista.

### C — Checkout agencia

1. Iniciar sesión como **owner** de la agencia.
2. Ir a `/agency/plan` → debe verse la tarifa y el botón **Activar Agency Pro**.
3. Pagar con tarjeta test: `4242 4242 4242 4242`, fecha futura, CVC cualquiera.
4. Vuelta a `/agency/plan?billing=success`.

### D — Webhook y plan activo

En unos segundos el webhook debe:

- Poner `agencies.plan = 'agency_pro'`
- Rellenar `stripe_customer_id`, `stripe_subscription_id`, `plan_active_until`
- Subir `max_members` al límite Agency Pro

**Comprobar:**

- `/agency` accesible sin redirección a `/agency/plan?reason=plan-inactive`
- `/agency/plan` → plan Agency Pro activo
- «Gestionar suscripción» abre el portal Stripe (si hay `stripe_customer_id`)

### E — Portal Stripe

En `/agency/plan` → **Gestionar suscripción** → cambiar método de pago o ver facturas.

## 5. Verificación en Supabase

```sql
select id, name, plan, plan_active_until, max_members,
       billing_monthly_amount_cents, stripe_price_id_monthly,
       stripe_customer_id, stripe_subscription_id
from public.agencies
where slug = 'TU_SLUG';
```

Esperado tras pago: `plan = agency_pro`, IDs Stripe rellenos, `plan_active_until` en el futuro.

## 6. Troubleshooting

| Síntoma | Causa habitual |
|---------|----------------|
| Botón checkout deshabilitado / sin tarifa | Ops no guardó tarifa o falta `STRIPE_AGENCY_PRODUCT_ID` |
| Pago OK pero plan sigue `trial` | Webhook no llega: URL, secret, o eventos no suscritos |
| Error al guardar tarifa en Ops | `STRIPE_AGENCY_PRODUCT_ID` ausente o producto en otro modo test/live |
| Panel bloqueado tras trial | Normal sin pago; activar Agency Pro o plan `partnership` manual en Ops |
| Webhook 400 firma inválida | `STRIPE_WEBHOOK_SECRET` incorrecto o endpoint duplicado |

**Logs:** Vercel → Functions → `/api/billing/webhook`  
**Stripe:** Developers → Webhooks → intentos recientes.

## 7. Producción (live)

1. Claves **live** en Vercel (`sk_live_…`, webhook live).
2. Producto live y `STRIPE_AGENCY_PRODUCT_ID` del entorno live.
3. Repetir flujo con tarjeta real o un importe simbólico acordado con la primera agencia piloto.

## 8. Alternativa sin Stripe

En Ops, cambiar plan manualmente a **`partnership`** — acceso completo sin checkout (acuerdo comercial).
