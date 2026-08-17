# Límites de gasto IA — implementación futura (borrador)

**Estado:** no aplicado en código. Referencia para cuando se decida blindar costes Gemini.

## Decisión de producto

Mantener **Gemini** como único LLM en producción. Controlar pérdidas con límites estrictos, sobre todo en **visión (PDF/imagen)**, **import** y **planificador**.

## Capa 1 — Plataforma (Google Cloud / AI Studio)

- Alertas de facturación (ej. aviso 10 €, tope duro 50–100 €/mes).
- Protección aunque falle la app.

## Capa 2 — Presupuesto por usuario (parcialmente existente)

| Variable | Valor actual | Propuesta |
|----------|--------------|-----------|
| `AI_USER_MONTHLY_BUDGET_EUR` | 2 € | Mantener 2 € o bajar a 1,50 € |

Ya implementado: `enforceAiMonthlyBudgetOrThrow`, `trackAiUsage`, HTTP 402 `AI_BUDGET_EXCEEDED`.

## Capa 3 — Topes por feature (pendiente)

| Operación | Límite propuesto | Rate limit propuesto |
|-----------|------------------|----------------------|
| Visión PDF/imagen | 5–10 / mes / usuario | 3 / min |
| Import documento completo | 3 / mes / usuario | 3 / min |
| Chat | 200 / mes / usuario | 12 / min (ya) |
| Modo búsqueda | 30 / mes / usuario | cuenta como chat |
| Planificador wizard | 2 generaciones / mes / usuario | preset `ai` |
| Organize-day | 10 / mes / usuario | preset `ai` |
| Brief / maleta / listas | 20 / mes o sin tope extra | preset `ai` |

## Huecos actuales a cerrar (código)

Rutas que llaman Gemini **sin** `enforceAiMonthlyBudgetOrThrow`:

- `POST /api/trips/ai-planner/generate`
- `GET /api/trips/ai-brief`
- `GET /api/trips/ai-packing-list`
- `POST /api/geocode/suggest-places` (fallback Gemini)

## Flujo OCR recomendado

1. OCR clásico (unpdf, regex) → sin LLM.
2. Visión Gemini solo si falla OCR o usuario elige «Mejor calidad».
3. Si supera cuota → mensaje + pegar texto manual.

## Estimación coste orientativa (Gemini 2.5 Flash)

| Acción | € aprox. |
|--------|----------|
| Chat normal | 0,001–0,01 |
| Modo búsqueda | 0,01–0,03 |
| Brief / maleta | 0,001–0,005 |
| PDF/imagen visión | 0,05–0,25 |
| Planificador completo | 0,10–0,40 |

## Orden de implementación sugerido

1. Cerrar budget en rutas sin protección.
2. Tabla Supabase `user_ai_feature_usage_monthly` (vision, import, planner).
3. Endurecer rate limit OCR (6 → 3 / min).
4. Visión Gemini opt-in o fallback tras OCR.
5. Alerta admin si usuario > 1 € / día.

---

*Documento de referencia. No modifica comportamiento de producción.*
