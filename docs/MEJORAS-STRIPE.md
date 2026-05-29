# Mejoras futuras · Colaboración empresa (Stripe) y asistente personal

Documento de referencia para evolucionar Kaviro/TripBoard hacia viajes corporativos: la empresa crea plantillas por tipo de viaje, los participantes importan planes y alojamientos desde documentos adjuntos, y el asistente estructura el itinerario sin depender solo de pegar texto en el chat.

**Última actualización:** 2026-05-20

---

## Objetivo de producto

- **Stripe (u otra empresa)** define distintos **tipos de viaje** y sube **documentos** (PDF/Word) con itinerarios, hoteles y actividades.
- Los viajeros usan el **asistente personal** enlazado a esos documentos del viaje.
- La IA extrae **planes por día** y **alojamientos por lugar**, genera **tarjetas validables** y, tras validar, **actualiza la pantalla Plan** con todas las actividades.

---

## Documentos adjuntos vs pegar texto en el chat

| Pegar todo en el chat | Documento en Recursos + asistente |
|----------------------|-----------------------------------|
| Límite práctico del mensaje | Texto extraído una vez (PDF/OCR) y reutilizable |
| Se mezcla con historial del chat | Fuente estable para todo el grupo |
| Repegar si falla la importación | Reimportar sin repetir OCR |
| Depende de lo que el usuario copie | OCR del PDF conserva horas y bloques «Día N» |

**Conclusión:** Para agendas largas y viajes B2B, **adjuntar documento al viaje y alimentar la importación desde ahí** suele ser más fiable y escalable que pegar 30 páginas en el chat. Pegar texto sigue siendo útil para **ajustes rápidos** o fragmentos pequeños.

### Flujo objetivo (documentos)

1. La empresa sube plantillas por tipo de viaje en **Recursos** del viaje (PDF/imagen; OCR ya existe en la app).
2. El asistente recibe: resumen del viaje + **texto extraído del documento seleccionado** (no el binario del PDF en cada mensaje).
3. Acción dedicada: **«Importar plan desde documento»** → mismas tarjetas validables que hoy con texto pegado.
4. Opcional: plantillas por `trip_type` / `company_id` con prompts afinados por categoría de viaje.

### Estado actual en código (referencia)

| Área | Hoy | Falta |
|------|-----|--------|
| **Recursos** (`trip_resources`) | Subida, OCR, análisis reserva (hotel, vuelo…) | Enlazar con importación de itinerario en asistente |
| **Asistente** | `import-itinerary` desde texto; tramos por día/hora | Selector «documento del viaje» como fuente |
| **Contexto IA** | `buildTripContext` incluye recursos (metadatos); `buildTripSummaryForAi` no incluye texto OCR | Inyectar extracto OCR recortado en importación |
| **Ejecución** | `execute-plan` + geocodificación + rutas | Opción «añadir rápido» sin geocodizar (ver rendimiento) |

Archivos clave:

- `lib/trip-ai/importItineraryFromText.ts` — importación por tramos
- `app/api/trip-ai/import-itinerary/route.ts`
- `components/trip/ai/TripAiChatView.tsx` — tarjetas y validación
- `hooks/useTripResources.ts`, `app/api/document/analyze/route.ts` — OCR
- `lib/trip-plan-events.ts` — refresco de Plan tras añadir

---

## Roadmap propuesto

### Corto plazo

- [ ] **Botón en asistente / Plan:** «Generar tarjetas desde documento del viaje» (lista de `trip_resources` con texto extraído o re-OCR bajo demanda).
- [ ] Pasar el texto del documento a `importItineraryFromText` / `runImportItineraryCards` en lugar de solo pegado en chat.
- [ ] Mostrar en UI qué documento se usó como fuente (título + fecha de subida).

### Medio plazo

- [ ] Metadatos de viaje: `company_id`, `trip_template_id`, `trip_type` (incentivo, convención, team offsite…).
- [ ] Plantillas de prompt por tipo de viaje (énfasis en alojamientos vs actividades vs traslados).
- [ ] Caché del texto extraído por `resource_id` para no repetir OCR en cada importación.

### Largo plazo

- [ ] **API B2B:** la empresa crea el viaje + sube PDF; los participantes solo validan tarjetas.
- [ ] Biblioteca de plantillas por empresa reutilizables en N viajes.
- [ ] Webhook o integración cuando Stripe (u otro) publique un nuevo dossier de viaje.

---

## Rendimiento (generar tarjetas y añadir al plan)

Objetivo: **menos tiempo sin perder calidad** ni aumentar errores de timeout.

### Ya implementado (2026-05-20)

- Importación por tramos en **paralelo (2)** en cliente (`TripAiChatView`).
- Tramos horarios más grandes (**8** slots por chunk en servidor).
- **Early exit** si `isItineraryImportSufficient` — no segunda pasada JSON + marcadores si los tramos ya cubren el texto.
- Servidor: salida anticipada tras import por chunks si el resultado es suficiente.
- Ejecución al plan **día a día** (`execute-plan` por día) para evitar timeout en viajes largos.
- Refresco de Plan tras añadir: evento `kaviro:trip-plan-refresh` + cierre del drawer del asistente.

Utilidades: `isItineraryImportSufficient`, `mapWithConcurrency` en `lib/trip-ai/itineraryDraftUtils.ts`.

### Mejoras pendientes (sin comprometer calidad)

- [ ] **Añadir al plan — modo rápido:** opción «Añadir sin geocodificar ahora» (coordenadas después desde Plan/mapa).
- [ ] **Añadir al plan — paralelo controlado:** 2 días en paralelo con límite de geocodificación global (cuidado con rate limits).
- [ ] **Precalentar OCR** al subir documento en Recursos (guardar `extracted_text` en `detected_data` / columna dedicada).
- [ ] **Progreso más claro:** % estimado y ETA en UI durante importación y ejecución.
- [ ] **Reintentos inteligentes:** solo reintentar tramos fallidos, no todo el itinerario.
- [ ] Evaluar modelo más rápido solo para chunks pequeños (A/B calidad vs latencia).

### Cuellos de botella conocidos

1. **N llamadas IA** — una por tramo de día/hora (mitigado con paralelo 2 y chunks más grandes).
2. **Geocodificación** en `executePlanOnTrip` — hasta 120 llamadas de red por ejecución.
3. **Rutas OSRM** — opcional por día; suma latencia si `generateRoutes: true`.

---

## Experiencia de usuario (checklist)

- [ ] Desde pestaña **Plan → Asistencia**, desplegar actividad y elegir Sí / No / Quizás (hecho).
- [ ] Tras **Añadir todo**, Plan actualizado sin recargar manual (hecho vía `dispatchTripPlanRefresh`).
- [ ] Itinerario en asistente a **pantalla completa** al validar tarjetas (hecho en drawer).
- [ ] Documento Stripe como fuente única visible en historial del viaje (pendiente).

---

## Criterios de éxito (Stripe / B2B)

1. Un PDF de 15–30 días genera **≥90% de las paradas** esperadas en tarjetas (métrica: `isItineraryImportIncomplete` / revisión manual).
2. Tiempo **generar tarjetas** &lt; 50% del actual en itinerarios de 20+ actividades (paralelo + early exit).
3. Tiempo **validar → ver en Plan** &lt; 2 min para 35 actividades (geocodificación acotada o diferida).
4. Mismo documento reutilizable en reimportación sin volver a pegar texto.

---

## Notas

- No confundir con **Stripe pagos** (`docs/STRIPE_CAMBIAR_PRECIOS.md`) — este documento es **colaboración empresa / viajes corporativos**.
- Marcadores IA canónicos: `KAVIRO_*` (`lib/trip-ai/kaviroJsonMarkers.ts`).
- Script BD reacciones asistencia: `docs/tripboard_activity_reactions.sql`.

---

## Referencias de conversación

- Importación Chicago / tarjetas validables, marcadores Kaviro, refresco Plan, UI asistencia, optimización tiempos y visión documentos B2B (chat producto, 2026-05).
